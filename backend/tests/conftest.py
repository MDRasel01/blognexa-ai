"""BlogNexa AI - Test Fixtures and Signer Helper."""

import hashlib
import hmac
import time
import uuid
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.hmac_auth import build_canonical_query, build_canonical_string
from backend.app.core.replay_guard import reset_replay_cache
from backend.app.core.rate_limiter import rate_limiter


@pytest.fixture(autouse=True)
def clean_environment():
    """Reset replay guard and rate limiter between tests."""
    reset_replay_cache()
    rate_limiter.reset()
    yield
    reset_replay_cache()
    rate_limiter.reset()


@pytest.fixture
def client():
    return TestClient(app)


def make_signed_headers(
    method: str,
    path: str,
    query: str = "",
    body: str = "",
    credential_id: str = "cred-test-tenant-001",
    api_secret: str = "secret-key-32-chars-long-123456",
    key_version: str = "1",
    timestamp: int = None,
    nonce: str = None,
    request_id: str = None
) -> dict:
    ts = str(timestamp if timestamp is not None else int(time.time()))
    nc = nonce or f"nonce-{uuid.uuid4().hex}"
    req_id = request_id or str(uuid.uuid4())
    body_sha256 = hashlib.sha256(body.encode("utf-8")).hexdigest()
    canonical_query = build_canonical_query(query)

    canonical_str = build_canonical_string(
        method=method,
        path=path,
        query=canonical_query,
        timestamp=ts,
        nonce=nc,
        key_version=key_version,
        request_id=req_id,
        body_sha256=body_sha256
    )

    signature = hmac.new(
        api_secret.encode("utf-8"),
        canonical_str.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    return {
        "Authorization": f"BNX-HMAC {credential_id}:{signature}",
        "X-BNX-Timestamp": ts,
        "X-BNX-Nonce": nc,
        "X-BNX-Key-Version": key_version,
        "X-BNX-Request-ID": req_id,
        "X-BNX-Content-SHA256": body_sha256,
    }

