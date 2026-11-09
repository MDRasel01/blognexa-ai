"""BlogNexa AI - Crawler API Endpoints with Step 04 HMAC & Tenant Isolation."""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from backend.app.core.hmac_auth import verify_hmac_request
from backend.app.core.tenant_context import TenantContext
from backend.app.modules.crawler.models.entities import crawler_repo
from backend.app.modules.crawler.services.crawl_orchestrator import crawl_orchestrator


router = APIRouter()


class StartCrawlRequest(BaseModel):
    registered_origin: str
    mode: str = "incremental"  # full, incremental, targeted
    configuration: Dict[str, Any] = Field(default_factory=dict)


def verify_site_ownership(site_id: str, ctx: TenantContext) -> None:
    """Enforce that authenticated caller owns the site requested."""
    if ctx.site_id != site_id and "admin:all" not in ctx.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Authenticated credential does not match requested site_id"
        )


@router.post("/sites/{site_id}/crawl-jobs")
async def start_website_crawl(
    site_id: str,
    req: StartCrawlRequest,
    ctx: TenantContext = Depends(verify_hmac_request)
):
    """Start an asynchronous crawl job bounded to authenticated tenant & site."""
    verify_site_ownership(site_id, ctx)

    job = crawl_orchestrator.create_and_start_job(
        tenant_id=ctx.tenant_id,
        site_id=site_id,
        registered_origin=req.registered_origin,
        crawl_mode=req.mode,
        configuration=req.configuration
    )

    return {
        "job_id": job.id,
        "tenant_id": ctx.tenant_id,
        "site_id": site_id,
        "status": job.status,
        "mode": job.crawl_mode,
        "created_at": job.created_at
    }


@router.get("/sites/{site_id}/crawl-jobs/{job_id}")
def get_crawl_job(
    site_id: str,
    job_id: str,
    ctx: TenantContext = Depends(verify_hmac_request)
):
    """Get status, progress, and metrics of a crawl job."""
    verify_site_ownership(site_id, ctx)

    job = crawler_repo.get_job(job_id, ctx.tenant_id, site_id)
    if not job:
        raise HTTPException(status_code=404, detail="Crawl job not found or forbidden")

    return job


@router.get("/sites/{site_id}/crawl-jobs")
def list_crawl_jobs(
    site_id: str,
    ctx: TenantContext = Depends(verify_hmac_request)
):
    """List crawl jobs for the site."""
    verify_site_ownership(site_id, ctx)
    jobs = crawler_repo.list_jobs(ctx.tenant_id, site_id)
    return {"jobs": jobs, "total": len(jobs)}


@router.post("/sites/{site_id}/crawl-jobs/{job_id}/cancel")
def cancel_crawl_job(
    site_id: str,
    job_id: str,
    ctx: TenantContext = Depends(verify_hmac_request)
):
    """Cancel an active crawl job."""
    verify_site_ownership(site_id, ctx)

    success = crawl_orchestrator.cancel_job(job_id, ctx.tenant_id, site_id)
    if not success:
        raise HTTPException(status_code=400, detail="Job could not be cancelled (already completed or not found)")

    return {"status": "cancelled", "job_id": job_id}


@router.get("/sites/{site_id}/crawl-urls")
def list_discovered_urls(
    site_id: str,
    limit: int = Query(100, le=500),
    ctx: TenantContext = Depends(verify_hmac_request)
):
    """List discovered URLs for the site."""
    verify_site_ownership(site_id, ctx)
    urls = crawler_repo.list_urls(ctx.tenant_id, site_id)
    return {"urls": urls[:limit], "total": len(urls)}


@router.get("/sites/{site_id}/crawl-documents")
def list_extracted_documents(
    site_id: str,
    limit: int = Query(50, le=200),
    ctx: TenantContext = Depends(verify_hmac_request)
):
    """List extracted documents with title, word count, and quality."""
    verify_site_ownership(site_id, ctx)
    docs = crawler_repo.list_documents(ctx.tenant_id, site_id)
    return {"documents": docs[:limit], "total": len(docs)}


@router.get("/sites/{site_id}/crawl-documents/{doc_id}")
def get_extracted_document(
    site_id: str,
    doc_id: str,
    ctx: TenantContext = Depends(verify_hmac_request)
):
    """Get single extracted document with full text content."""
    verify_site_ownership(site_id, ctx)
    doc = crawler_repo.get_document(doc_id, ctx.tenant_id, site_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or forbidden")
    return doc


@router.get("/sites/{site_id}/crawl-errors")
def list_crawl_errors(
    site_id: str,
    job_id: str = Query(...),
    ctx: TenantContext = Depends(verify_hmac_request)
):
    """List crawl errors for a job."""
    verify_site_ownership(site_id, ctx)
    errors = crawler_repo.list_errors(job_id, ctx.tenant_id, site_id)
    return {"errors": errors, "total": len(errors)}
