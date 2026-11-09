"""BlogNexa AI - Canonical HMAC-SHA256 Authentication Middleware and Dependency."""

import hashlib
import hmac
import time
import urllib.parse
from fastapi import Request, HTTPException, Security, status
from fastapi.security import APIKeyHeader

from backend.app.core.config import settings
from backend.app.core.tenant_context import TenantContext
from backend.app.core.replay_guard import check_and_record_nonce
from backend.app.models.credential import credential_store
from backend.app.core.audit_logger import audit_store


HEADER_AUTH = "Authorization"
HEADER_TIMESTAMP = "X-BNX-Timestamp"
HEADER_NONCE = "X-BNX-Nonce"
HEADER_KEY_VERSION = "X-BNX-Key-Version"
HEADER_REQUEST_ID = "X-BNX-Request-ID"
HEADER_CONTENT_SHA256 = "X-BNX-Content-SHA256"


def build_canonical_query(raw_query: str) -> str:
    """Sort query parameters alphabetically by key and rawurlencode."""
    if not raw_query:
        return ""
    parsed = urllib.parse.parse_qsl(raw_query, keep_blank_values=True)
    sorted_pairs = sorted(parsed, key=lambda pair: pair[0])
    return "&".join(f"{urllib.parse.quote(k, safe='') }={urllib.parse.quote(v, safe='')}" for k, v in sorted_pairs)


def build_canonical_string(
    method: str,
    path: str,
    query: str,
    timestamp: str,
    nonce: str,
    key_version: str,
    request_id: str,
    body_sha256: str
) -> str:
    """Construct 8-line canonical request string."""
    canonical_path = "/" + path.lstrip("/")
    return "\n".join([
        method.upper(),
        canonical_path,
        query,
        timestamp,
        nonce,
        key_version,
        request_id,
        body_sha256.lower()
    ])


async def verify_hmac_request(request: Request) -> TenantContext:
    """
    FastAPI dependency: verifies HMAC signature, timestamp skew, content digest,
    replay resistance, and resolves server-derived TenantContext.
    """
    headers = request.headers
    auth_header = headers.get(HEADER_AUTH)
    ts_header = headers.get(HEADER_TIMESTAMP)
    nonce_header = headers.get(HEADER_NONCE)
    key_ver_header = headers.get(HEADER_KEY_VERSION, "1")
    req_id_header = headers.get(HEADER_REQUEST_ID, "")
    content_sha256_header = headers.get(HEADER_CONTENT_SHA256)

    # 1. Verify required headers present
    if not auth_header or not ts_header or not nonce_header or not content_sha256_header:
        audit_store.log("AUTH_MISSING_HEADERS", details={"path": request.url.path})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing required BlogNexa authentication headers."
        )

    # 2. Parse Authorization header: BNX-HMAC <credential_id>:<signature>
    parts = auth_header.strip().split(" ")
    if len(parts) != 2 or parts[0] != "BNX-HMAC":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed Authorization header format. Expected 'BNX-HMAC <credential_id>:<signature>'."
        )

    cred_parts = parts[1].split(":")
    if len(cred_parts) != 2:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed credential signature pair. Expected '<credential_id>:<signature>'."
        )

    credential_id, received_signature = cred_parts[0], cred_parts[1]

    # 3. Verify timestamp skew
    try:
        req_timestamp = int(ts_header)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid timestamp header format."
        )

    now = int(time.time())
    if abs(now - req_timestamp) > settings.MAX_TIMESTAMP_SKEW_SECONDS:
        audit_store.log("AUTH_CLOCK_SKEW", credential_id=credential_id, details={"skew": abs(now - req_timestamp)})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Request timestamp outside allowable skew window (CLOCK_SKEW_EXCEEDED)."
        )

    # 4. Resolve credential
    cred_record = credential_store.get(credential_id)
    if not cred_record:
        audit_store.log("AUTH_UNKNOWN_CREDENTIAL", credential_id=credential_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unknown or inactive credential (INVALID_CREDENTIAL)."
        )

    if cred_record.status == "REVOKED":
        audit_store.log("AUTH_REVOKED_CREDENTIAL", credential_id=credential_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credential has been revoked (CREDENTIAL_REVOKED)."
        )

    # 5. Verify Content-SHA256
    raw_body = await request.body()
    computed_body_sha256 = hashlib.sha256(raw_body).hexdigest()
    if not hmac.compare_digest(computed_body_sha256.lower(), content_sha256_header.lower()):
        audit_store.log("AUTH_CONTENT_TAMPERED", credential_id=credential_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Content digest mismatch (CONTENT_DIGEST_MISMATCH)."
        )

    # 6. Canonicalize query & build canonical request string
    canonical_query = build_canonical_query(request.url.query)
    canonical_str = build_canonical_string(
        method=request.method,
        path=request.url.path,
        query=canonical_query,
        timestamp=ts_header,
        nonce=nonce_header,
        key_version=key_ver_header,
        request_id=req_id_header,
        body_sha256=computed_body_sha256
    )

    # 7. Compute & verify HMAC signature using constant-time comparison
    expected_signature = hmac.new(
        cred_record.api_secret.encode("utf-8"),
        canonical_str.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, received_signature):
        audit_store.log("AUTH_HMAC_INVALID", credential_id=credential_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid HMAC request signature."
        )

    # 8. Replay attack protection (atomic check and record)
    fresh_nonce = check_and_record_nonce(credential_id, nonce_header, settings.REPLAY_CACHE_TTL_SECONDS)
    if not fresh_nonce:
        audit_store.log("AUTH_REPLAY_DETECTED", credential_id=credential_id, details={"nonce": nonce_header})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Duplicate request nonce detected (REPLAY_ATTACK_DETECTED)."
        )

    # 9. Return server-derived TenantContext
    return TenantContext(
        credential_id=cred_record.credential_id,
        tenant_id=cred_record.tenant_id,
        site_id=cred_record.site_id,
        key_version=cred_record.key_version,
        scopes=cred_record.scopes
    )

