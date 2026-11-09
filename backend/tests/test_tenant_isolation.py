"""BlogNexa AI - Multi-Tenant Isolation Tests."""

import json
import pytest
from backend.tests.conftest import make_signed_headers


def test_tenant_cannot_read_another_tenants_job(client):
    """Tenant 1 must receive 404/Forbidden when querying Tenant 2's exclusive job."""
    # Tenant 1 queries Tenant 2's job: "job-tenant-2-exclusive-002"
    headers = make_signed_headers(
        method="GET",
        path="/v1/jobs/job-tenant-2-exclusive-002",
        credential_id="cred-test-tenant-001",
        api_secret="secret-key-32-chars-long-123456"
    )
    res = client.get("/v1/jobs/job-tenant-2-exclusive-002", headers=headers)
    assert res.status_code == 404
    assert "Job not found or access forbidden" in res.json()["detail"]


def test_list_jobs_returns_only_authenticated_tenant_data(client):
    """Listing jobs returns only jobs matching the authenticated tenant context."""
    headers = make_signed_headers(
        method="GET",
        path="/v1/jobs",
        credential_id="cred-test-tenant-001",
        api_secret="secret-key-32-chars-long-123456"
    )
    res = client.get("/v1/jobs", headers=headers)
    assert res.status_code == 200
    data = res.json()

    # Verify every returned job belongs exclusively to Tenant 1
    tenant_1_id = "c1234567-89ab-cdef-0123-456789abcdef"
    for job in data["jobs"]:
        assert job["tenant_id"] == tenant_1_id
        assert job["id"] != "job-tenant-2-exclusive-002"


def test_server_overrides_client_supplied_tenant_id(client):
    """Server-derived tenant context must overwrite any client-injected tenant parameter."""
    body_data = {
        "title": "Injected Tenant Job",
        "prompt": "Test injection",
        "target_words": 500,
        "client_supplied_tenant_id": "c9999999-99ab-cdef-0123-999999999999"  # Tenant 2
    }
    body_json = json.dumps(body_data, separators=(',', ':'))
    headers = make_signed_headers(
        method="POST",
        path="/v1/jobs",
        body=body_json,
        credential_id="cred-test-tenant-001",
        api_secret="secret-key-32-chars-long-123456"
    )
    res = client.post("/v1/jobs", content=body_json, headers=headers)
    assert res.status_code == 200
    created = res.json()

    # Must be bound to Tenant 1, completely ignoring the injected Tenant 2 ID!
    assert created["tenant_id"] == "c1234567-89ab-cdef-0123-456789abcdef"


def test_knowledge_rag_query_strictly_isolated(client):
    """RAG search retrieves only the authenticated tenant's knowledge chunks."""
    headers = make_signed_headers(
        method="GET",
        path="/v1/knowledge/query",
        query="q=Tenant",
        credential_id="cred-test-tenant-001",
        api_secret="secret-key-32-chars-long-123456"
    )
    res = client.get("/v1/knowledge/query?q=Tenant", headers=headers)
    assert res.status_code == 200
    data = res.json()

    # Results must only contain Tenant 1's brand guidelines, never Tenant 2's financial data
    for item in data["results"]:
        assert item["tenant_id"] == "c1234567-89ab-cdef-0123-456789abcdef"
        assert "Financial Projections" not in item["title"]

