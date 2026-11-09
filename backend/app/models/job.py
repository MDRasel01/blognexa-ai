"""BlogNexa AI - Job Models and Tenant-Isolated Storage."""

import time
import uuid
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class JobRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    site_id: str
    title: str
    prompt: str
    target_words: int = 1000
    status: str = "PENDING"
    created_at: float = Field(default_factory=time.time)


class JobStore:
    def __init__(self) -> None:
        self._jobs: Dict[str, JobRecord] = {}
        # Pre-seed sample jobs for tenant isolation verification
        self.create_job(
            job_id="job-tenant-1-exclusive-001",
            tenant_id="c1234567-89ab-cdef-0123-456789abcdef",
            site_id="s9876543-21ba-fedc-3210-fedcba987654",
            title="Tenant 1 Secret Strategy",
            prompt="Generate Q1 Strategy for Tenant 1"
        )
        self.create_job(
            job_id="job-tenant-2-exclusive-002",
            tenant_id="c9999999-99ab-cdef-0123-999999999999",
            site_id="s8888888-21ba-fedc-3210-888888888888",
            title="Tenant 2 Confidential Launch",
            prompt="Generate Marketing Launch for Tenant 2"
        )

    def create_job(self, tenant_id: str, site_id: str, title: str, prompt: str, target_words: int = 1000, job_id: Optional[str] = None) -> JobRecord:
        record = JobRecord(
            id=job_id or str(uuid.uuid4()),
            tenant_id=tenant_id,
            site_id=site_id,
            title=title,
            prompt=prompt,
            target_words=target_words
        )
        self._jobs[record.id] = record
        return record

    def get_job(self, job_id: str, tenant_id: str) -> Optional[JobRecord]:
        """Tenant-scoped retrieval: Returns None if job does not belong to the requested tenant."""
        record = self._jobs.get(job_id)
        if record and record.tenant_id == tenant_id:
            return record
        return None

    def list_jobs(self, tenant_id: str, site_id: Optional[str] = None) -> List[JobRecord]:
        """Tenant-scoped list: Returns only records belonging to the authenticated tenant."""
        results = [j for j in self._jobs.values() if j.tenant_id == tenant_id]
        if site_id:
            results = [j for j in results if j.site_id == site_id]
        return results


job_store = JobStore()

