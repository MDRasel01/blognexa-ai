# BlogNexa AI — Step 05 Initial Architecture & Technical Audit

**Document ID:** BNX-CRAWL-AUDIT-005  
**Date:** 2026-11-09  
**Phase:** 05 — Website Intelligence Ingestion  
**Status:** Approved Initial Baseline  

---

## 1. Executive Summary

This pre-implementation technical audit reviews the existing BlogNexa AI architecture (Steps 01 through 04) to establish the technical foundation for the **Step 05 Website Discovery, Crawling & Content Extraction Engine**.

The objective of Step 05 is to build a production-grade, multi-tenant website ingestion pipeline that discovers URLs via sitemaps and internal links, fetches HTML safely using asynchronous workers, removes page boilerplate, extracts structured semantic articles, resolves canonical duplicates, and tracks content versions for downstream RAG and Knowledge Base processing (Step 06).

---

## 2. Review of Existing Foundations (Steps 01 – 04)

### 2.1 Security & Authentication Bridge (Step 04)
* **HMAC Request Signing:** Standardized 8-line canonical signing protocol (`RequestSigner.php` in WordPress and `hmac_auth.py` in FastAPI) ensures all crawler API requests from WordPress to Cloud Backend are mutually authenticated.
* **Tenant Isolation:** `get_tenant_context()` strictly resolves `tenant_id` and `site_id` from authenticated HMAC credentials. Client-injected tenant parameters are rejected.
* **SSRF Shield (`backend/app/core/ssrf_guard.py`):** Multi-stage validation blocks loopback (`127.0.0.0/8`, `::1`), cloud metadata (`169.254.169.254`), private IP ranges (RFC 1918, RFC 4193), and non-HTTP/HTTPS schemes. **This shield will be reused for all outbound crawler requests.**
* **Replay Protection & Rate Limiting:** Nonce tracking with Redis (`SET NX EX`) and operation-class rate limits (`status`, `job`, `ai`).

### 2.2 WordPress Plugin UI & State (Step 03)
* **Website Intelligence Module (`resources/js/features/website-intelligence/WebsiteIntelligenceView.tsx`):**
  * Present in React SPA dashboard.
  * Controls available: `includePosts`, `includePages`, `respectRobots`, `scanType` (`incremental` vs `full`), and `excludePatterns`.
  * Ready to connect to live backend REST routes.
* **REST Registrar & Controllers (`app/API/Controllers/`):**
  * `StatusController`, `SettingsController`, `ConnectionController`.
  * Ready to receive `CrawlerController.php` for dispatching crawl commands and retrieving live progress.

### 2.3 Cloud Backend Runtime (Python FastAPI in `backend/`)
* FastAPI 0.115+ application with clean modular structure.
* Async HTTP client (`httpx.AsyncClient`) available.
* HTML/XML parsing libraries installed: `beautifulsoup4`, `lxml`, `defusedxml`.

---

## 3. Crawler Domain Architecture & Gaps to Fill

| Area | Current Baseline | Target Implementation in Step 05 |
| :--- | :--- | :--- |
| **Sitemap Engine** | None | XML sitemap parser, sitemap index processor, WordPress XML sitemap endpoint discovery, anti-XXE (`defusedxml`). |
| **Robots.txt Engine** | None | RFC-compliant `robots.txt` parser with User-Agent `BlogNexaBot/1.0`, Allow/Disallow rule evaluation, crawl-delay politeness. |
| **URL Pipeline** | None | Canonical query sorting, fragment stripping, tracking parameter removal (`utm_*`, `fbclid`), SHA256 URL hashing. |
| **Safe HTTP Fetcher** | Basic Client | Async HTTPX fetcher with connection pooling, tiered timeouts, 10MB response limits, redirect revalidation, and conditional headers (`ETag`, `If-Modified-Since`). |
| **Content Extractor** | None | Semantic HTML hierarchy extraction (`<main>`, `<article>`, `<h1>-<h6>`, `<p>`), boilerplate/nav/footer stripping, structured JSON output. |
| **Duplicate & Change** | None | Exact URL deduplication, canonical link resolution, content hashing (`SHA256(text)`), version snapshotting (`crawl_document_versions`). |
| **Job Orchestration** | Stubbed Job Store | Asynchronous Crawl Orchestrator managing `QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED` states with concurrency limits per host. |
| **Plugin Integration** | Mocked UI Table | Live proxy controller in PHP dispatching to cloud backend and polling live status for the React Admin interface. |

---

## 4. Architectural Invariants for Step 05

1. **No Crawling from the Browser:** The WordPress Admin React app NEVER initiates direct HTTP fetches to scanned targets. All crawling executes through backend asynchronous workers.
2. **Reuse Step 04 SSRF Guard:** Every single URL (initial seed, sitemap link, internal link, redirect target) MUST pass `validate_target_url()` before any socket connection is opened.
3. **Strict Origin Scope:** By default, only the verified registered origin of the site is eligible for crawling. Subdomains and external third-party domains are forbidden.
4. **Tenant Isolation Invariant:** All crawl jobs, discovered URLs, extracted documents, and version snapshots MUST be partitioned by `tenant_id` and `site_id`.
5. **Fail-Safe Processing:** A failure on one URL must never crash the crawl job. Failed URLs are classified and recorded in `crawl_errors`.

