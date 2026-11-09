"""BlogNexa AI - URL and Content Duplicate Detection Service."""

from typing import Optional, Tuple
from backend.app.modules.crawler.models.entities import crawler_repo, CrawlDocumentRecord


class DuplicateDetector:
    @staticmethod
    def is_url_duplicate(tenant_id: str, site_id: str, url_hash: str) -> bool:
        """Check if URL was already registered for this tenant and site."""
        return crawler_repo.get_url(tenant_id, site_id, url_hash) is not None

    @staticmethod
    def find_content_duplicate(tenant_id: str, site_id: str, content_hash: str) -> Optional[CrawlDocumentRecord]:
        """Check if exact content hash already exists for another document in this site."""
        if not content_hash:
            return None

        documents = crawler_repo.list_documents(tenant_id, site_id)
        for doc in documents:
            if doc.content_hash == content_hash:
                return doc
        return None


duplicate_detector = DuplicateDetector()

