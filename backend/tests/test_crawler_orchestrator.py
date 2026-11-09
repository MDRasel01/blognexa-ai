"""BlogNexa AI - Crawler Orchestrator & Job Lifecycle Tests."""

import pytest
from backend.app.modules.crawler.models.entities import crawler_repo, CrawlJobRecord, CrawlDocumentRecord, CrawlDocumentVersionRecord
from backend.app.modules.crawler.services.crawl_orchestrator import crawl_orchestrator
from backend.app.modules.crawler.services.change_detector import change_detector


@pytest.fixture(autouse=True)
def clean_crawler_repo():
    crawler_repo.reset()
    yield
    crawler_repo.reset()


def test_crawl_job_creation():
    tenant_id = "c1234567-89ab-cdef-0123-456789abcdef"
    site_id = "s9876543-21ba-fedc-3210-fedcba987654"

    job = crawl_orchestrator.create_and_start_job(
        tenant_id=tenant_id,
        site_id=site_id,
        registered_origin="https://example.com",
        crawl_mode="full",
        configuration={"max_pages": 50, "max_depth": 2}
    )

    assert job.id is not None
    assert job.tenant_id == tenant_id
    assert job.site_id == site_id
    assert job.crawl_mode == "full"
    assert job.status in ("queued", "running")

    # Retrieve from repository
    retrieved = crawler_repo.get_job(job.id, tenant_id, site_id)
    assert retrieved is not None
    assert retrieved.id == job.id


def test_crawl_job_cancellation():
    tenant_id = "c1234567-89ab-cdef-0123-456789abcdef"
    site_id = "s9876543-21ba-fedc-3210-fedcba987654"

    job = crawl_orchestrator.create_and_start_job(
        tenant_id=tenant_id,
        site_id=site_id,
        registered_origin="https://example.com"
    )

    cancelled = crawl_orchestrator.cancel_job(job.id, tenant_id, site_id)
    assert cancelled is True

    updated_job = crawler_repo.get_job(job.id, tenant_id, site_id)
    assert updated_job.status == "cancelled"


def test_change_detection_and_versioning():
    tenant_id = "c1234567-89ab-cdef-0123-456789abcdef"
    site_id = "s9876543-21ba-fedc-3210-fedcba987654"
    url_id = "url_test_101"

    # 1. First time document is seen -> "NEW"
    change_type, doc = change_detector.detect_change(
        tenant_id=tenant_id,
        site_id=site_id,
        crawl_url_id=url_id,
        new_content_hash="hash_v1_11111"
    )
    assert change_type == "NEW"

    # Save initial doc
    doc_record = CrawlDocumentRecord(
        tenant_id=tenant_id,
        site_id=site_id,
        crawl_url_id=url_id,
        url="https://example.com/post-1",
        canonical_url="https://example.com/post-1",
        title="Initial Title",
        content_text="Initial Body Text",
        content_hash="hash_v1_11111"
    )
    crawler_repo.save_document(doc_record)
    crawler_repo.add_version(CrawlDocumentVersionRecord(
        tenant_id=tenant_id,
        site_id=site_id,
        document_id=doc_record.id,
        version_number=1,
        content_hash="hash_v1_11111",
        content_snapshot="Initial Body Text",
        change_type="created",
        crawl_job_id="job_test_01"
    ))

    # 2. Rescanned with same content -> "UNCHANGED"
    change_type2, _ = change_detector.detect_change(
        tenant_id=tenant_id,
        site_id=site_id,
        crawl_url_id=url_id,
        new_content_hash="hash_v1_11111"
    )
    assert change_type2 == "UNCHANGED"

    # 3. Content updated -> "UPDATED"
    change_type3, existing = change_detector.detect_change(
        tenant_id=tenant_id,
        site_id=site_id,
        crawl_url_id=url_id,
        new_content_hash="hash_v2_22222"
    )
    assert change_type3 == "UPDATED"
    assert existing is not None

    # Save version 2
    crawler_repo.add_version(CrawlDocumentVersionRecord(
        tenant_id=tenant_id,
        site_id=site_id,
        document_id=doc_record.id,
        version_number=2,
        content_hash="hash_v2_22222",
        content_snapshot="Updated Body Text",
        change_type="updated",
        crawl_job_id="job_test_02"
    ))

    # Check version history
    versions = crawler_repo.list_versions(doc_record.id, tenant_id, site_id)
    assert len(versions) == 2
    assert versions[0].version_number == 1
    assert versions[1].version_number == 2
    assert versions[1].content_hash == "hash_v2_22222"

