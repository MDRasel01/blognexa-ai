"""BlogNexa AI - Master Asynchronous Crawl Orchestrator Service."""

import asyncio
import time
import urllib.parse
from typing import Dict, Any, List, Optional

from backend.app.modules.crawler.models.entities import (
    CrawlJobRecord,
    CrawlUrlRecord,
    CrawlDocumentRecord,
    CrawlDocumentVersionRecord,
    CrawlLinkRecord,
    CrawlErrorRecord,
    crawler_repo,
)
from backend.app.modules.crawler.services.robots_manager import robots_manager, RobotsRules
from backend.app.modules.crawler.services.sitemap_discovery import sitemap_parser
from backend.app.modules.crawler.services.url_normalizer import url_normalizer
from backend.app.modules.crawler.services.url_validator import url_validator
from backend.app.modules.crawler.services.http_fetcher import http_fetcher, FetchResult
from backend.app.modules.crawler.services.content_extractor import content_extractor
from backend.app.modules.crawler.services.metadata_extractor import metadata_extractor
from backend.app.modules.crawler.services.link_extractor import link_extractor
from backend.app.modules.crawler.services.content_normalizer import content_normalizer
from backend.app.modules.crawler.services.change_detector import change_detector


class CrawlOrchestrator:
    def __init__(self) -> None:
        self._active_tasks: Dict[str, asyncio.Task] = {}

    def create_and_start_job(
        self,
        tenant_id: str,
        site_id: str,
        registered_origin: str,
        crawl_mode: str = "incremental",
        configuration: Optional[Dict[str, Any]] = None
    ) -> CrawlJobRecord:
        """Create new crawl job and launch background worker."""
        config = configuration or {
            "max_pages": 100,
            "max_depth": 3,
            "respect_robots": True,
            "custom_exclusions": []
        }

        job = CrawlJobRecord(
            tenant_id=tenant_id,
            site_id=site_id,
            crawl_mode=crawl_mode,
            status="queued",
            configuration_snapshot=config
        )
        crawler_repo.create_job(job)

        # Launch background execution if running inside an event loop
        try:
            loop = asyncio.get_running_loop()
            task = loop.create_task(
                self._execute_crawl(job.id, tenant_id, site_id, registered_origin, config)
            )
            self._active_tasks[job.id] = task
        except RuntimeError:
            # Synchronous testbed or thread without active event loop
            pass

        return job

    def cancel_job(self, job_id: str, tenant_id: str, site_id: str) -> bool:
        """Signal job cancellation and abort background task."""
        job = crawler_repo.get_job(job_id, tenant_id, site_id)
        if not job or job.status in ("completed", "failed", "cancelled"):
            return False

        job.status = "cancelled"
        job.completed_at = time.time()
        crawler_repo.update_job(job)

        task = self._active_tasks.get(job_id)
        if task and not task.done():
            task.cancel()

        return True

    async def _execute_crawl(
        self,
        job_id: str,
        tenant_id: str,
        site_id: str,
        origin: str,
        config: Dict[str, Any]
    ) -> None:
        job = crawler_repo.get_job(job_id, tenant_id, site_id)
        if not job:
            return

        job.status = "running"
        job.started_at = time.time()
        crawler_repo.update_job(job)

        max_pages = config.get("max_pages", 100)
        max_depth = config.get("max_depth", 3)
        respect_robots = config.get("respect_robots", True)
        custom_exclusions = config.get("custom_exclusions", [])

        # Step 1: Robots.txt Discovery & Rules
        robots_rules = await self._fetch_robots_txt(origin)
        if robots_rules and robots_rules.sitemaps:
            sitemap_candidates = robots_rules.sitemaps
        else:
            sitemap_candidates = [
                f"{origin}/sitemap.xml",
                f"{origin}/wp-sitemap.xml",
                f"{origin}/sitemap_index.xml"
            ]

        # Step 2: Sitemap Processing
        discovered_urls: List[str] = []
        for sitemap_url in sitemap_candidates:
            if job.status == "cancelled":
                return
            s_result = await http_fetcher.fetch(sitemap_url, origin)
            if s_result.status_code == 200 and s_result.content:
                try:
                    parsed = sitemap_parser.parse(s_result.content)
                    if parsed.sitemap_type == "urlset":
                        for item in parsed.urls:
                            discovered_urls.append(item.loc)
                    elif parsed.sitemap_type == "sitemapindex":
                        # Process child sitemaps (1 level)
                        for child in parsed.child_sitemaps[:5]:
                            c_res = await http_fetcher.fetch(child, origin)
                            if c_res.status_code == 200 and c_res.content:
                                c_parsed = sitemap_parser.parse(c_res.content)
                                for item in c_parsed.urls:
                                    discovered_urls.append(item.loc)
                    break # successfully processed primary sitemap
                except Exception:
                    pass

        # If no sitemap URLs, start with root origin
        if not discovered_urls:
            discovered_urls.append(origin)

        # Step 3: Register discovered seed URLs
        crawl_queue: List[Tuple[str, int]] = []  # (url, depth)
        for raw_url in discovered_urls:
            norm_url = url_normalizer.normalize(raw_url, origin)
            if not norm_url:
                continue

            is_eligible, _ = url_validator.validate_for_crawl(norm_url, origin, custom_exclusions)
            if not is_eligible:
                continue

            url_h = url_normalizer.hash_url(norm_url)
            url_rec = crawler_repo.get_url(tenant_id, site_id, url_h)
            if not url_rec:
                url_rec = CrawlUrlRecord(
                    tenant_id=tenant_id,
                    site_id=site_id,
                    original_url=raw_url,
                    normalized_url=norm_url,
                    url_hash=url_h,
                    discovery_source="sitemap",
                    discovery_depth=0
                )
                crawler_repo.upsert_url(url_rec)
                job.total_discovered += 1

            crawl_queue.append((norm_url, 0))

        job.total_queued = len(crawl_queue)
        crawler_repo.update_job(job)

        # Step 4: Crawl Processing Loop
        visited_urls = set()

        while crawl_queue and job.total_processed < max_pages:
            # Check cancellation
            fresh_job = crawler_repo.get_job(job_id, tenant_id, site_id)
            if fresh_job and fresh_job.status == "cancelled":
                return

            current_url, depth = crawl_queue.pop(0)
            if current_url in visited_urls:
                continue
            visited_urls.add(current_url)

            # Robots.txt Allow/Disallow evaluation
            parsed_path = urllib.parse.urlparse(current_url).path or "/"
            if respect_robots and robots_rules and not robots_rules.is_allowed(parsed_path):
                job.total_skipped += 1
                crawler_repo.update_job(job)
                continue

            # Politeness delay
            delay = robots_rules.crawl_delay if (robots_rules and robots_rules.crawl_delay) else 0.05
            if delay > 0:
                await asyncio.sleep(min(delay, 0.5))

            # Fetch document
            url_h = url_normalizer.hash_url(current_url)
            existing_url = crawler_repo.get_url(tenant_id, site_id, url_h)

            fetch_res = await http_fetcher.fetch(current_url, origin)

            if existing_url:
                existing_url.last_http_status = fetch_res.status_code
                existing_url.last_crawled_at = time.time()
                existing_url.crawl_status = "crawled" if fetch_res.status_code == 200 else "failed"
                crawler_repo.upsert_url(existing_url)

            if fetch_res.status_code != 200:
                job.total_failed += 1
                crawler_repo.record_error(CrawlErrorRecord(
                    tenant_id=tenant_id,
                    site_id=site_id,
                    crawl_job_id=job_id,
                    url=current_url,
                    error_code=f"HTTP_{fetch_res.status_code}",
                    http_status=fetch_res.status_code,
                    safe_error_message=fetch_res.error or f"HTTP {fetch_res.status_code}"
                ))
                crawler_repo.update_job(job)
                continue

            # Parse and Extract HTML
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(fetch_res.content, "lxml")

            metadata = metadata_extractor.extract(soup, current_url)
            extracted = content_extractor.extract_main_content(fetch_res.content, metadata.get("title", ""))
            clean_body = content_normalizer.normalize_text(extracted.content_text)
            content_h = content_normalizer.compute_content_hash(clean_body)
            quality = content_normalizer.evaluate_quality(extracted.title, extracted.word_count, len(extracted.headings))

            # Document change and versioning
            url_record_id = existing_url.id if existing_url else str(time.time())
            change_type, existing_doc = change_detector.detect_change(
                tenant_id, site_id, url_record_id, content_h, fetch_res.status_code
            )

            doc_id = existing_doc.id if existing_doc else None
            doc_record = CrawlDocumentRecord(
                id=doc_id or CrawlDocumentRecord(tenant_id="", site_id="", crawl_url_id="", url="", canonical_url="").id,
                tenant_id=tenant_id,
                site_id=site_id,
                crawl_url_id=url_record_id,
                url=current_url,
                canonical_url=metadata.get("canonical_url") or current_url,
                title=extracted.title or metadata.get("title", ""),
                description=metadata.get("description", ""),
                language=metadata.get("language", "en"),
                author=metadata.get("author"),
                published_at=metadata.get("published_at"),
                modified_at=metadata.get("modified_at"),
                content_text=clean_body,
                content_hash=content_h,
                word_count=extracted.word_count,
                headings=extracted.headings,
                metadata=metadata,
                extraction_quality=quality
            )
            crawler_repo.save_document(doc_record)

            # Record version snapshot if new or updated
            if change_type in ("NEW", "UPDATED"):
                existing_versions = crawler_repo.list_versions(doc_record.id, tenant_id, site_id)
                v_num = len(existing_versions) + 1
                crawler_repo.add_version(CrawlDocumentVersionRecord(
                    tenant_id=tenant_id,
                    site_id=site_id,
                    document_id=doc_record.id,
                    version_number=v_num,
                    content_hash=content_h,
                    content_snapshot=clean_body,
                    metadata_snapshot=metadata,
                    change_type="created" if change_type == "NEW" else "updated",
                    crawl_job_id=job_id
                ))

            # Link Extraction & Discovery of Next Depth URLs
            if depth < max_depth:
                extracted_links = link_extractor.extract_links(soup, current_url, origin)
                for lnk in extracted_links:
                    if not lnk["is_internal"] or lnk["is_nofollow"]:
                        continue

                    tgt = lnk["normalized_target_url"]
                    tgt_h = url_normalizer.hash_url(tgt)

                    if not crawler_repo.get_url(tenant_id, site_id, tgt_h):
                        is_ok, _ = url_validator.validate_for_crawl(tgt, origin, custom_exclusions)
                        if is_ok:
                            crawler_repo.upsert_url(CrawlUrlRecord(
                                tenant_id=tenant_id,
                                site_id=site_id,
                                original_url=lnk["target_url"],
                                normalized_url=tgt,
                                url_hash=tgt_h,
                                discovery_source="internal_link",
                                discovery_depth=depth + 1
                            ))
                            job.total_discovered += 1
                            if tgt not in visited_urls:
                                crawl_queue.append((tgt, depth + 1))

                    # Persist link relationship
                    crawler_repo.add_link(CrawlLinkRecord(
                        tenant_id=tenant_id,
                        site_id=site_id,
                        source_document_id=doc_record.id,
                        source_url=current_url,
                        target_url=lnk["target_url"],
                        normalized_target_url=tgt,
                        anchor_text=lnk["anchor_text"],
                        link_type=lnk["link_type"],
                        is_internal=True,
                        is_nofollow=lnk["is_nofollow"]
                    ))

            job.total_processed += 1
            crawler_repo.update_job(job)

        # Finalize job
        job.status = "completed"
        job.completed_at = time.time()
        crawler_repo.update_job(job)

    async def _fetch_robots_txt(self, origin: str) -> Optional[RobotsRules]:
        cached = robots_manager.get_cached_rules(origin)
        if cached:
            return cached

        robots_url = f"{origin.rstrip('/')}/robots.txt"
        res = await http_fetcher.fetch(robots_url, origin)
        if res.status_code == 200 and res.content:
            rules = robots_manager.parse_robots_txt(res.content)
            robots_manager.cache_rules(origin, rules)
            return rules

        return None


crawl_orchestrator = CrawlOrchestrator()
