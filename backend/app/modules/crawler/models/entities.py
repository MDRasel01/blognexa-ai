"""BlogNexa AI - Crawler Domain Models and Storage Repositories."""

import time
import uuid
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class CrawlJobRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    site_id: str
    crawl_mode: str = "incremental"  # full, incremental, targeted
    status: str = "queued"          # queued, running, completed, failed, cancelled
    configuration_snapshot: Dict[str, Any] = Field(default_factory=dict)
    total_discovered: int = 0
    total_queued: int = 0
    total_processed: int = 0
    total_failed: int = 0
    total_skipped: int = 0
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)


class CrawlUrlRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    site_id: str
    original_url: str
    normalized_url: str
    url_hash: str
    canonical_url: Optional[str] = None
    discovery_source: str = "sitemap"  # sitemap, internal_link, manual_seed
    discovery_depth: int = 0
    robots_allowed: bool = True
    crawl_status: str = "discovered"   # discovered, queued, crawled, failed, skipped
    last_http_status: Optional[int] = None
    last_crawled_at: Optional[float] = None
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)


class CrawlDocumentRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    site_id: str
    crawl_url_id: str
    url: str
    canonical_url: str
    document_type: str = "article"
    title: str = ""
    description: str = ""
    language: str = "en"
    author: Optional[str] = None
    published_at: Optional[str] = None
    modified_at: Optional[str] = None
    content_text: str = ""
    content_hash: str = ""
    word_count: int = 0
    headings: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    extraction_quality: str = "HIGH"  # HIGH, ACCEPTABLE, LOW, FAILED
    last_extracted_at: float = Field(default_factory=time.time)
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)


class CrawlDocumentVersionRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    site_id: str
    document_id: str
    version_number: int = 1
    content_hash: str
    content_snapshot: str
    metadata_snapshot: Dict[str, Any] = Field(default_factory=dict)
    change_type: str = "created"  # created, updated, unchanged, removed
    crawl_job_id: str
    created_at: float = Field(default_factory=time.time)


class CrawlLinkRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    site_id: str
    source_document_id: str
    source_url: str
    target_url: str
    normalized_target_url: str
    anchor_text: str = ""
    link_type: str = "content"  # content, navigation, footer, breadcrumb
    is_internal: bool = True
    is_nofollow: bool = False
    created_at: float = Field(default_factory=time.time)


class CrawlErrorRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    site_id: str
    crawl_job_id: str
    crawl_url_id: Optional[str] = None
    url: str
    error_code: str
    error_category: str = "network"  # network, security, parsing, http, policy
    http_status: Optional[int] = None
    retryable: bool = False
    attempt_count: int = 1
    safe_error_message: str
    created_at: float = Field(default_factory=time.time)


class CrawlerRepository:
    """Multi-tenant, thread-safe in-memory data repository for crawler execution."""

    def __init__(self) -> None:
        self.jobs: Dict[str, CrawlJobRecord] = {}
        self.urls: Dict[str, CrawlUrlRecord] = {}  # key: f"{tenant_id}:{site_id}:{url_hash}"
        self.documents: Dict[str, CrawlDocumentRecord] = {}
        self.versions: List[CrawlDocumentVersionRecord] = []
        self.links: List[CrawlLinkRecord] = []
        self.errors: List[CrawlErrorRecord] = []

    # Jobs
    def create_job(self, job: CrawlJobRecord) -> CrawlJobRecord:
        self.jobs[job.id] = job
        return job

    def get_job(self, job_id: str, tenant_id: str, site_id: str) -> Optional[CrawlJobRecord]:
        job = self.jobs.get(job_id)
        if job and job.tenant_id == tenant_id and job.site_id == site_id:
            return job
        return None

    def list_jobs(self, tenant_id: str, site_id: str) -> List[CrawlJobRecord]:
        return [j for j in self.jobs.values() if j.tenant_id == tenant_id and j.site_id == site_id]

    def update_job(self, job: CrawlJobRecord) -> None:
        job.updated_at = time.time()
        self.jobs[job.id] = job

    # URLs
    def upsert_url(self, record: CrawlUrlRecord) -> CrawlUrlRecord:
        key = f"{record.tenant_id}:{record.site_id}:{record.url_hash}"
        existing = self.urls.get(key)
        if existing:
            # Preserve created_at and id
            record.id = existing.id
            record.created_at = existing.created_at
            record.updated_at = time.time()
        self.urls[key] = record
        return record

    def get_url(self, tenant_id: str, site_id: str, url_hash: str) -> Optional[CrawlUrlRecord]:
        key = f"{tenant_id}:{site_id}:{url_hash}"
        return self.urls.get(key)

    def list_urls(self, tenant_id: str, site_id: str) -> List[CrawlUrlRecord]:
        return [u for u in self.urls.values() if u.tenant_id == tenant_id and u.site_id == site_id]

    # Documents
    def save_document(self, doc: CrawlDocumentRecord) -> CrawlDocumentRecord:
        self.documents[doc.id] = doc
        return doc

    def get_document(self, doc_id: str, tenant_id: str, site_id: str) -> Optional[CrawlDocumentRecord]:
        doc = self.documents.get(doc_id)
        if doc and doc.tenant_id == tenant_id and doc.site_id == site_id:
            return doc
        return None

    def find_document_by_url_id(self, crawl_url_id: str, tenant_id: str, site_id: str) -> Optional[CrawlDocumentRecord]:
        for d in self.documents.values():
            if d.crawl_url_id == crawl_url_id and d.tenant_id == tenant_id and d.site_id == site_id:
                return d
        return None

    def list_documents(self, tenant_id: str, site_id: str) -> List[CrawlDocumentRecord]:
        return [d for d in self.documents.values() if d.tenant_id == tenant_id and d.site_id == site_id]

    # Versions
    def add_version(self, version: CrawlDocumentVersionRecord) -> None:
        self.versions.append(version)

    def list_versions(self, document_id: str, tenant_id: str, site_id: str) -> List[CrawlDocumentVersionRecord]:
        return [v for v in self.versions if v.document_id == document_id and v.tenant_id == tenant_id and v.site_id == site_id]

    # Links
    def add_link(self, link: CrawlLinkRecord) -> None:
        self.links.append(link)

    def list_links(self, tenant_id: str, site_id: str) -> List[CrawlLinkRecord]:
        return [lnk for lnk in self.links if lnk.tenant_id == tenant_id and lnk.site_id == site_id]

    # Errors
    def record_error(self, error: CrawlErrorRecord) -> None:
        self.errors.append(error)

    def list_errors(self, job_id: str, tenant_id: str, site_id: str) -> List[CrawlErrorRecord]:
        return [e for e in self.errors if e.crawl_job_id == job_id and e.tenant_id == tenant_id and e.site_id == site_id]

    def reset(self) -> None:
        self.jobs.clear()
        self.urls.clear()
        self.documents.clear()
        self.versions.clear()
        self.links.clear()
        self.errors.clear()


crawler_repo = CrawlerRepository()

