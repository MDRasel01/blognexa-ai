"""BlogNexa AI - Site Enrollment Endpoints."""

import secrets
import time
import uuid
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from backend.app.models.credential import credential_store, CredentialRecord
from backend.app.core.audit_logger import audit_store


router = APIRouter()

# Active one-time enrollment codes: code -> { tenant_id, site_id, expires_at }
_active_enrollment_codes: Dict[str, Dict[str, Any]] = {
    # Pre-seeded test code for end-to-end integration
    "TEST-ENROLL-CODE-12345": {
        "tenant_id": "c1234567-89ab-cdef-0123-456789abcdef",
        "site_id": "s9876543-21ba-fedc-3210-fedcba987654",
        "expires_at": time.time() + 3600
    }
}


class EnrollmentSessionCreate(BaseModel):
    tenant_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    site_id: Optional[str] = None
    ttl_seconds: int = 1800


class EnrollmentExchangeRequest(BaseModel):
    enrollment_code: str
    site_instance_id: str
    site_url: str
    home_url: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


@router.post("/sessions")
def create_enrollment_session(req: EnrollmentSessionCreate):
    """Admin endpoint to create a single-use enrollment code."""
    code = f"BNX-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}"
    _active_enrollment_codes[code] = {
        "tenant_id": req.tenant_id,
        "site_id": req.site_id or str(uuid.uuid4()),
        "expires_at": time.time() + req.ttl_seconds
    }
    audit_store.log("ENROLLMENT_SESSION_CREATED", tenant_id=req.tenant_id, object_id=code)
    return {"enrollment_code": code, "expires_in": req.ttl_seconds}


@router.post("/exchange")
def exchange_enrollment_code(req: EnrollmentExchangeRequest):
    """Exchange single-use enrollment code for permanent API credentials."""
    session = _active_enrollment_codes.get(req.enrollment_code)
    if not session:
        audit_store.log("ENROLLMENT_INVALID_CODE", details={"code": req.enrollment_code})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired enrollment code"
        )

    if time.time() > session["expires_at"]:
        del _active_enrollment_codes[req.enrollment_code]
        audit_store.log("ENROLLMENT_EXPIRED_CODE", details={"code": req.enrollment_code})
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enrollment code has expired"
        )

    # Consume single-use code immediately
    del _active_enrollment_codes[req.enrollment_code]

    tenant_id = session["tenant_id"]
    site_id = req.site_instance_id or session["site_id"]
    credential_id = f"cred-{secrets.token_hex(8)}"
    api_secret = secrets.token_hex(32)  # 64-character hex secret

    record = CredentialRecord(
        credential_id=credential_id,
        api_secret=api_secret,
        key_version="1",
        tenant_id=tenant_id,
        site_id=site_id,
        status="ACTIVE"
    )
    credential_store.register(record)

    audit_store.log(
        "ENROLLMENT_EXCHANGE_SUCCESS",
        tenant_id=tenant_id,
        site_id=site_id,
        credential_id=credential_id,
        details={"site_url": req.site_url}
    )

    return {
        "credential_id": credential_id,
        "api_secret": api_secret,
        "key_version": "1",
        "tenant_id": tenant_id,
        "site_id": site_id,
        "status": "connected"
    }

