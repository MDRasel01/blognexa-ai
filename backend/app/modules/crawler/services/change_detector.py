"""BlogNexa AI - Incremental Crawling & Document Change Detection."""

from typing import Tuple, Optional
from backend.app.modules.crawler.models.entities import crawler_repo, CrawlDocumentRecord


class ChangeDetector:
    @staticmethod
    def detect_change(
        tenant_id: str,
        site_id: str,
        crawl_url_id: str,
        new_content_hash: str,
        http_status: int = 200
    ) -> Tuple[str, Optional[CrawlDocumentRecord]]:
        """
        Detect change category:
        - "NEW": First time this document is processed.
        - "UNCHANGED": HTTP 304 or content_hash identical to existing record.
        - "UPDATED": content_hash differs from existing record.
        - "REMOVED": HTTP 404 or 410.
        """
        existing_doc = crawler_repo.find_document_by_url_id(crawl_url_id, tenant_id, site_id)

        if http_status in (404, 410):
            return "REMOVED", existing_doc

        if http_status == 304:
            return "UNCHANGED", existing_doc

        if not existing_doc:
            return "NEW", None

        if existing_doc.content_hash == new_content_hash:
            return "UNCHANGED", existing_doc

        return "UPDATED", existing_doc


change_detector = ChangeDetector()

