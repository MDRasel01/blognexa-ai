# BlogNexa AI — Crawler Domain Architecture Specification

**Document ID:** BNX-CRAWL-ARCH-005  
**Date:** 2026-11-09  
**Phase:** 05 — Website Intelligence Ingestion  
**Status:** Canonical Standard  

---

## 1. System Overview & Ingestion Flow

The BlogNexa AI Website Intelligence Ingestion Engine transforms unstructured client websites into structured, normalized, and version-tracked documents.

```
+-------------------------------------------------------------------------+
|                        WORDPRESS CLIENT NODE                            |
|  [Admin UI: Website Intelligence] ---> [Plugin Controller: Proxy API]   |
+-------------------------------------------------------------------------+
                                    |
                    Authenticated HTTPS + HMAC-SHA256
                                    |
                                    v
+-------------------------------------------------------------------------+
|                       CLOUD BACKEND (FASTAPI)                           |
|  1. Authenticate Request & Derive Tenant Context (Step 04 Guard)       |
|  2. Validate Site Ownership & Domain Match                              |
|  3. Snapshot Crawl Configuration & Create CrawlJob                      |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                     ASYNC CRAWL ORCHESTRATOR                            |
|                                                                         |
|  [Step A: Seed & Discovery]                                             |
|   - Fetch & Parse robots.txt (BlogNexaBot/1.0, Crawl-delay)             |
|   - Discover XML Sitemaps (/sitemap.xml, /wp-sitemap.xml)               |
|   - Anti-XXE Parsing with defusedxml -> Extract candidate URLs          |
|                                                                         |
|  [Step B: URL Filtering & SSRF Shield]                                  |
|   - Normalize URLs (strip fragments, tracking params, sort query)       |
|   - Compute url_hash = SHA256(normalized_url)                           |
|   - Filter by Origin Scope (same-domain only) & Exclusion Patterns      |
|   - Revalidate through SSRF Shield (no private IPs / metadata)          |
|                                                                         |
|  [Step C: Safe Asynchronous Fetching]                                   |
|   - HTTPX AsyncClient with connection pool and host politeness          |
|   - Stream response, enforce 10MB limit, handle redirects safely        |
|   - Conditional GET with ETag / If-Modified-Since                       |
|                                                                         |
|  [Step D: Extraction & Normalization]                                    |
|   - Semantic HTML extraction (<main>, <article>, <h1>-<h6>, <p>)        |
|   - Strip boilerplate (scripts, styles, banners, navigation noise)      |
|   - Extract Metadata (Open Graph, Twitter, canonical, author, dates)    |
|   - Extract Internal Link Graph                                         |
|                                                                         |
|  [Step E: Deduplication, Versioning & Persistence]                      |
|   - Compute content_hash = SHA256(normalized_body_text)                 |
|   - Detect exact content duplicates & canonical overrides               |
|   - Compare with stored version -> Create new version if modified       |
|   - Classify extraction quality (HIGH, ACCEPTABLE, LOW, FAILED)         |
|   - Store structured document records partitioned by tenant_id, site_id |
+-------------------------------------------------------------------------+
                                    |
                                    v
                   [ STEP 06 KNOWLEDGE BASE HANDOFF ]
```

---

## 2. Core Entities & Relational Data Model

Every entity includes `tenant_id` and `site_id` derived exclusively from verified HMAC credentials.

### 2.1 `CrawlJob`
Represents an execution instance of a website scan.
* `id`: UUIDv4
* `tenant_id`: UUIDv4
* `site_id`: UUIDv4
* `crawl_mode`: Enum (`full`, `incremental`, `targeted`)
* `status`: Enum (`queued`, `running`, `completed`, `failed`, `cancelled`)
* `configuration_snapshot`: JSON (frozen parameters at job start)
* `total_discovered`: Integer
* `total_queued`: Integer
* `total_processed`: Integer
* `total_failed`: Integer
* `total_skipped`: Integer
* `started_at`: Timestamp
* `completed_at`: Timestamp

### 2.2 `CrawlUrl`
Inventory of all discovered URLs for a site.
* `id`: UUIDv4
* `tenant_id`: UUIDv4
* `site_id`: UUIDv4
* `original_url`: String (up to 2048 chars)
* `normalized_url`: String (canonicalized URL)
* `url_hash`: String (SHA-256 of normalized URL, indexed)
* `canonical_url`: String (HTML canonical destination)
* `discovery_source`: Enum (`sitemap`, `internal_link`, `manual_seed`)
* `discovery_depth`: Integer (0 for sitemap/root, 1+ for link depth)
* `robots_allowed`: Boolean
* `crawl_status`: Enum (`discovered`, `queued`, `crawled`, `failed`, `skipped`)
* `last_http_status`: Integer (e.g. 200, 301, 304, 404)
* `last_crawled_at`: Timestamp

### 2.3 `CrawlDocument`
The extracted, clean, structured content of an ingested web page.
* `id`: UUIDv4
* `tenant_id`: UUIDv4
* `site_id`: UUIDv4
* `crawl_url_id`: UUIDv4 (FK to `CrawlUrl`)
* `canonical_url`: String
* `document_type`: String (`post`, `page`, `article`, `webpage`)
* `title`: String
* `description`: String
* `language`: String (`en`, etc.)
* `author`: String
* `published_at`: Timestamp
* `modified_at`: Timestamp
* `content_text`: Text (normalized main body text)
* `content_hash`: String (SHA-256 of normalized body)
* `word_count`: Integer
* `headings`: JSON array (`[{"level": 1, "text": "..."}, ...]`)
* `metadata`: JSON object (OpenGraph, Twitter, Schema.org)
* `extraction_quality`: Enum (`HIGH`, `ACCEPTABLE`, `LOW`, `FAILED`)
* `last_extracted_at`: Timestamp

### 2.4 `CrawlDocumentVersion`
Immutable snapshot recording content modifications over time.
* `id`: UUIDv4
* `tenant_id`: UUIDv4
* `site_id`: UUIDv4
* `document_id`: UUIDv4 (FK to `CrawlDocument`)
* `version_number`: Integer (1, 2, 3...)
* `content_hash`: String
* `content_snapshot`: Text
* `metadata_snapshot`: JSON
* `change_type`: Enum (`created`, `updated`, `unchanged`, `removed`)
* `crawl_job_id`: UUIDv4
* `created_at`: Timestamp

### 2.5 `CrawlLink`
Records internal graph relationships between ingested documents.
* `id`: UUIDv4
* `tenant_id`: UUIDv4
* `site_id`: UUIDv4
* `source_document_id`: UUIDv4
* `source_url`: String
* `target_url`: String
* `normalized_target_url`: String
* `anchor_text`: String
* `link_type`: Enum (`content`, `navigation`, `footer`, `breadcrumb`)
* `is_internal`: Boolean
* `is_nofollow`: Boolean

### 2.6 `CrawlError`
Structured log of non-fatal and fatal crawl failures.
* `id`: UUIDv4
* `tenant_id`: UUIDv4
* `site_id`: UUIDv4
* `crawl_job_id`: UUIDv4
* `crawl_url_id`: UUIDv4 (optional)
* `url`: String
* `error_code`: String (`HTTP_404`, `SSRF_BLOCKED`, `TIMEOUT`, `OVERSIZED`, etc.)
* `error_category`: Enum (`network`, `security`, `parsing`, `http`, `policy`)
* `http_status`: Integer
* `retryable`: Boolean
* `attempt_count`: Integer
* `safe_error_message`: String (sanitized, zero secrets)

---

## 3. Crawler Lifecycle State Machine

```
                 [ User Initiates Crawl ]
                            |
                            v
                       +----------+
                       |  QUEUED  |
                       +----------+
                            |
                  Worker claims job
                            |
                            v
                       +----------+
            +--------> | RUNNING  | <--------+
            |          +----------+          |
            |           /    |   \           |
     Sitemap/Links     /     |    \     Fetch/Extract
      discovered      /      |     \      completed
            |        /       |      \        |
            +-------+        |       +-------+
                             |
         +-------------------+-------------------+
         |                   |                   |
All URLs processed     Job Cancelled       Fatal Unrecoverable
         |                   |                   |
         v                   v                   v
   +-----------+       +-----------+       +----------+
   | COMPLETED |       | CANCELLED |       |  FAILED  |
   +-----------+       +-----------+       +----------+
```

---

## 4. Politeness & Egress Control Policy

* **User-Agent:** `BlogNexaBot/1.0 (+https://api.blognexa.ai/bot)`
* **Host Politeness:** Maximum 2 concurrent connections per host origin.
* **Crawl-Delay:** Default minimum 0.5s between requests to the same origin; respect robots.txt `Crawl-delay` up to a maximum safety ceiling of 10s.
* **Per-Crawl Ceiling:** Default max pages = 500 (configurable up to 2,000). Max discovery depth = 5 hops.
* **Response Size Cap:** 10 MB maximum compressed / decompressed payload.
* **Timeouts:** Connect = 5s, Read = 15s, Total HTTP timeout = 20s.

