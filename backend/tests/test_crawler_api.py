"""BlogNexa AI - Crawler API Endpoints & Multi-Tenant Authorization Tests."""

import json
import pytest
from backend.tests.conftest import make_signed_headers
from backend.app.modules.crawler.models.entities import crawler_repo, CrawlJobRecord, CrawlUrlRecord, CrawlDocumentRecord


@pytest.fixture(autouse=True)
def clean_crawler():
    crawler_repo.reset()
    yield
    crawler_repo.reset()


def test_start_crawl_job_authenticated(client):
    site_id = "s9876543-21ba-fedc-3210-fedcba987654"
    path = f"/v1/sites/{site_id}/crawl-jobs"
    body = json.dumps({
        "registered_origin": "https://example.com",
        "mode": "incremental",
        "configuration": {"max_pages": 50, "max_depth": 2}
    }, separators=(',', ':'))

    headers = make_signed_headers(
        method="POST",
        path=path,
        body=body,
        credential_id="cred-test-tenant-001",
        api_secret="secret-key-32-chars-long-123456"
    )

    response = client.post(path, content=body, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert data["site_id"] == site_id
    assert data["status"] in ("queued", "running")


def test_cross_tenant_access_forbidden(client):
    """Tenant 1 attempting to manage Tenant 2's site must be rejected with 403."""
    tenant_2_site = "s8888888-21ba-fedc-3210-888888888888"
    path = f"/v1/sites/{tenant_2_site}/crawl-jobs"
    body = json.dumps({"registered_origin": "https://tenant2.example", "mode": "full"}, separators=(',', ':'))

    # Signed with Tenant 1's credentials:
    headers = make_signed_headers(
        method="POST",
        path=path,
        body=body,
        credential_id="cred-test-tenant-001",
        api_secret="secret-key-32-chars-long-123456"
    )

    response = client.post(path, content=body, headers=headers)
    assert response.status_code == 403
    assert "Forbidden" in response.json()["detail"]


def test_get_and_cancel_crawl_job(client):
    site_id = "s9876543-21ba-fedc-3210-fedcba987654"
    tenant_id = "c1234567-89ab-cdef-0123-456789abcdef"

    job = CrawlJobRecord(
        tenant_id=tenant_id,
        site_id=site_id,
        crawl_mode="full",
        status="running"
    )
    crawler_repo.create_job(job)

    # 1. Get job
    path_get = f"/v1/sites/{site_id}/crawl-jobs/{job.id}"
    headers_get = make_signed_headers(
        method="GET",
        path=path_get,
        credential_id="cred-test-tenant-001",
        api_secret="secret-key-32-chars-long-123456"
    )
    res_get = client.get(path_get, headers=headers_get)
    assert res_get.status_code == 200
    assert res_get.json()["id"] == job.id

    # 2. Cancel job
    path_cancel = f"/v1/sites/{site_id}/crawl-jobs/{job.id}/cancel"
    headers_cancel = make_signed_headers(
        method="POST",
        path=path_cancel,
        credential_id="cred-test-tenant-001",
        api_secret="secret-key-32-chars-long-123456"
    )
    res_cancel = client.post(path_cancel, headers=headers_cancel)
    assert res_cancel.status_code == 200
    assert res_cancel.json()["status"] == "cancelled"


def test_list_urls_and_documents(client):
    site_id = "s9876543-21ba-fedc-3210-fedcba987654"
    tenant_id = "c1234567-89ab-cdef-0123-456789abcdef"

    # Seed URL and Document
    url_rec = CrawlUrlRecord(
        tenant_id=tenant_id,
        site_id=site_id,
        original_url="https://example.com/test-article",
        normalized_url="https://example.com/test-article",
        url_hash="hash_test_article_001",
        crawl_status="crawled"
    )
    crawler_repo.upsert_url(url_rec)

    doc_rec = CrawlDocumentRecord(
        tenant_id=tenant_id,
        site_id=site_id,
        crawl_url_id=url_rec.id,
        url=url_rec.normalized_url,
        canonical_url=url_rec.normalized_url,
        title="Test Article Title",
        content_text="Detailed article content...",
        word_count=150
    )
    crawler_repo.save_document(doc_rec)

    # 1. List URLs
    path_urls = f"/v1/sites/{site_id}/crawl-urls"
    headers_urls = make_signed_headers(
        method="GET",
        path=path_urls,
        credential_id="cred-test-tenant-001",
        api_secret="secret-key-32-chars-long-123456"
    )
    res_urls = client.get(path_urls, headers=headers_urls)
    assert res_urls.status_code == 200
    assert res_urls.json()["total"] == 1

    # 2. List Documents
    path_docs = f"/v1/sites/{site_id}/crawl-documents"
    headers_docs = make_signed_headers(
        method="GET",
        path=path_docs,
        credential_id="cred-test-tenant-001",
        api_secret="secret-key-32-chars-long-123456"
    )
    res_docs = client.get(path_docs, headers=headers_docs)
    assert res_docs.status_code == 200
    assert res_docs.json()["total"] == 1
    assert res_docs.json()["documents"][0]["title"] == "Test Article Title"

