"""BlogNexa AI - Tenant-Isolated Job Management Endpoints."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from backend.app.core.hmac_auth import verify_hmac_request
from backend.app.core.tenant_context import TenantContext
from backend.app.core.rate_limiter import rate_limiter
from backend.app.models.job import job_store, JobRecord
from backend.app.core.audit_logger import audit_store


router = APIRouter()


class JobCreateRequest(BaseModel):
    title: str
    prompt: str
    target_words: int = 1000
    # Any client-supplied tenant_id is explicitly ignored and overridden by server-derived ctx.tenant_id
    client_supplied_tenant_id: Optional[str] = None


@router.post("")
def create_job(req: JobCreateRequest, ctx: TenantContext = Depends(verify_hmac_request)):
    """Create job bounded strictly to the authenticated tenant."""
    # Apply job class rate limiting
    allowed, retry_after = rate_limiter.check_rate_limit(ctx.credential_id, "job")
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Job creation rate limit exceeded. Retry after {retry_after} seconds."
        )

    # Server-derived tenant context ALWAYS overrides client parameter
    record = job_store.create_job(
        tenant_id=ctx.tenant_id,
        site_id=ctx.site_id,
        title=req.title,
        prompt=req.prompt,
        target_words=req.target_words
    )

    audit_store.log(
        "JOB_CREATED",
        tenant_id=ctx.tenant_id,
        site_id=ctx.site_id,
        object_type="job",
        object_id=record.id,
        details={"title": record.title}
    )

    return record


@router.get("")
def list_jobs(ctx: TenantContext = Depends(verify_hmac_request)):
    """List jobs belonging exclusively to the authenticated tenant."""
    records = job_store.list_jobs(tenant_id=ctx.tenant_id, site_id=ctx.site_id)
    return {"jobs": records, "total": len(records), "tenant_id": ctx.tenant_id}


@router.get("/{job_id}")
def get_job(job_id: str, ctx: TenantContext = Depends(verify_hmac_request)):
    """Get single job with strict tenant isolation check."""
    record = job_store.get_job(job_id=job_id, tenant_id=ctx.tenant_id)
    if not record:
        # Cross-tenant data isolation: return 404 to avoid leaking existence
        audit_store.log(
            "JOB_ACCESS_DENIED_CROSS_TENANT",
            tenant_id=ctx.tenant_id,
            object_type="job",
            object_id=job_id
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found or access forbidden"
        )

    return record
