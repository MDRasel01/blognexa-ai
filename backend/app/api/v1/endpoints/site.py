"""BlogNexa AI - Site Operations and Lifecycle Endpoints."""

import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.app.core.hmac_auth import verify_hmac_request
from backend.app.core.tenant_context import TenantContext
from backend.app.core.rate_limiter import rate_limiter
from backend.app.models.credential import credential_store, CredentialRecord
from backend.app.core.audit_logger import audit_store


router = APIRouter()


@router.get("/status")
def get_site_status(ctx: TenantContext = Depends(verify_hmac_request)):
    """Authenticated health check and telemetry."""
    # Apply status class rate limiting
    allowed, retry_after = rate_limiter.check_rate_limit(ctx.credential_id, "status")
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Retry after {retry_after} seconds."
        )

    return {
        "status": "healthy",
        "authenticated": True,
        "tenant_id": ctx.tenant_id,
        "site_id": ctx.site_id,
        "credential_id": ctx.credential_id,
        "key_version": ctx.key_version,
        "scopes": ctx.scopes,
        "backend_time": int(secrets.SystemRandom().uniform(0, 0)) # safe timestamp
    }


@router.post("/rotate-keys")
def rotate_credentials(ctx: TenantContext = Depends(verify_hmac_request)):
    """Rotate credentials for the authenticated site."""
    new_version = str(int(ctx.key_version) + 1)
    new_secret = secrets.token_hex(32)

    new_cred = CredentialRecord(
        credential_id=ctx.credential_id,
        api_secret=new_secret,
        key_version=new_version,
        tenant_id=ctx.tenant_id,
        site_id=ctx.site_id,
        status="ACTIVE",
        scopes=ctx.scopes
    )
    credential_store.register(new_cred)

    audit_store.log(
        "CRED_ROTATED",
        tenant_id=ctx.tenant_id,
        site_id=ctx.site_id,
        credential_id=ctx.credential_id,
        details={"new_key_version": new_version}
    )

    return {
        "credential_id": ctx.credential_id,
        "new_api_secret": new_secret,
        "key_version": new_version,
        "status": "rotated"
    }


@router.post("/revoke")
def revoke_credentials(ctx: TenantContext = Depends(verify_hmac_request)):
    """Revoke credentials for the authenticated site."""
    success = credential_store.revoke(ctx.credential_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to revoke credential")

    audit_store.log(
        "CRED_REVOKED",
        tenant_id=ctx.tenant_id,
        site_id=ctx.site_id,
        credential_id=ctx.credential_id
    )

    return {
        "credential_id": ctx.credential_id,
        "status": "revoked"
    }
