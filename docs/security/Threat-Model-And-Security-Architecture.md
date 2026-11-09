# Security Architecture & Threat Model
**Plugin:** BlogNexa AI  
**Scope:** Security Baseline (Phase 01)  

---

## 1. Threat Matrix & Mitigations

| Threat | Risk Level | Mitigation Architecture |
| :--- | :--- | :--- |
| **Bypass of Administrative Access** | Critical | Custom WordPress capabilities checked via `PermissionManager::can()` on every REST route and admin screen. Never rely on UI visibility. |
| **Cross-Site Request Forgery (CSRF)** | High | WordPress REST Cookie + Nonce authentication (`X-WP-Nonce`) required on all mutating API calls. |
| **Server-Side Request Forgery (SSRF)** | Critical | Cloud crawler blocks private ranges (RFC 1918), loopback (`127.0.0.1`), link-local, cloud metadata (`169.254.169.254`), and strictly validates destination DNS before HTTP requests. |
| **Secret & Key Exposure** | High | AI keys and backend signing secrets are never exposed in JavaScript bundles or REST responses. Credentials in database are hashed or encrypted. |
| **Duplicate Publishing Collision** | Medium | `wp_bnx_publications` unique constraint on `idempotency_key` ensures a generation request cannot publish duplicate WordPress posts. |
| **SQL Injection** | Critical | Absolute avoidance of unescaped query concatenation. All database interaction uses parameterized `$wpdb->prepare()` or `dbDelta()` schema definitions. |
| **Arbitrary File Upload** | Critical | Image Studio strictly verifies MIME type, extension, magic bytes, re-encodes rasters, and rejects SVG files by default. |
| **Cross-Site Scripting (XSS)** | High | All REST inputs are sanitized via `InputValidator`; all outputs in PHP views are escaped via `esc_html`, `esc_url`, `esc_attr`. React renders JSX safely. |

---

## 2. Capability Hierarchy
* `blognexa_access`: Access the BlogNexa dashboard and view overview metrics.
* `blognexa_manage_settings`: Configure backend credentials, API endpoints, and data retention.
* `blognexa_scan_website`: Trigger website intelligence and re-crawling.
* `blognexa_manage_knowledge`: Edit or delete stored website knowledge items.
* `blognexa_manage_strategy`: Edit topic clusters and content roadmaps.
* `blognexa_manage_seo`: Execute keyword research and competitor analysis.
* `blognexa_create_blog`: Generate article drafts and briefs.
* `blognexa_edit_blog`: Modify generated drafts in Blog Studio.
* `blognexa_approve_blog`: Editorial approval for generated content.
* `blognexa_publish_blog`: Push content to WordPress posts (draft/publish/schedule).
* `blognexa_manage_integrations`: Connect RankMath, Yoast, or AIOSEO.
* `blognexa_view_analytics`: View traffic and content performance reports.
* `blognexa_manage_data`: Request data purge or export.

