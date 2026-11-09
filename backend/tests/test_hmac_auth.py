"""BlogNexa AI - HMAC Authentication Tests."""

import time
import pytest
from backend.tests.conftest import make_signed_headers
from backend.app.models.credential import credential_store


def test_valid_signed_request_succeeds(client):
    headers = make_signed_headers(method="GET", path="/v1/site/status")
    response = client.get("/v1/site/status", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert data["tenant_id"] == "c1234567-89ab-cdef-0123-456789abcdef"


def test_missing_auth_headers_returns_401(client):
    response = client.get("/v1/site/status")
    assert response.status_code == 401
    assert "Missing required" in response.json()["detail"]


def test_clock_skew_exceeded_returns_401(client):
    past_timestamp = int(time.time()) - 600  # 10 minutes in the past
    headers = make_signed_headers(
        method="GET",
        path="/v1/site/status",
        timestamp=past_timestamp
    )
    response = client.get("/v1/site/status", headers=headers)
    assert response.status_code == 401
    assert "CLOCK_SKEW_EXCEEDED" in response.json()["detail"]


def test_content_digest_tamper_returns_401(client):
    body = '{"prompt":"hello"}'
    headers = make_signed_headers(method="POST", path="/v1/jobs", body=body)
    # Alter body in transit
    tampered_body = '{"prompt":"malicious tampered payload"}'
    response = client.post("/v1/jobs", content=tampered_body, headers=headers)
    assert response.status_code == 401
    assert "CONTENT_DIGEST_MISMATCH" in response.json()["detail"]


def test_signature_tamper_returns_401(client):
    headers = make_signed_headers(method="GET", path="/v1/site/status")
    # Corrupt last character of signature
    headers["Authorization"] = headers["Authorization"][:-1] + "x"
    response = client.get("/v1/site/status", headers=headers)
    assert response.status_code == 401
    assert "Invalid HMAC request signature" in response.json()["detail"]


def test_revoked_credential_returns_401(client):
    # Revoke cred-test-tenant-001 temporarily
    credential_store.revoke("cred-test-tenant-001")
    headers = make_signed_headers(method="GET", path="/v1/site/status")
    response = client.get("/v1/site/status", headers=headers)
    assert response.status_code == 401
    assert "CREDENTIAL_REVOKED" in response.json()["detail"]

    # Restore active state
    cred = credential_store.get("cred-test-tenant-001")
    if cred:
        cred.status = "ACTIVE"
