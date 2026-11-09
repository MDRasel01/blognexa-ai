# Security Implementation & Threat Controls

**Plugin:** BlogNexa AI  
**Status:** Enforced in Phase 02  

## 1. Custom Capabilities
* `blognexa_access`: Access plugin admin screens.
* `blognexa_manage_settings`: Edit whitelisted settings and connections.
* `blognexa_scan_website`: Trigger website intelligence.
* `blognexa_manage_knowledge`: Manage knowledge items.
* `blognexa_manage_strategy`: Manage topic clusters.
* `blognexa_manage_seo`: Execute keyword research.
* `blognexa_create_blog`: Generate article briefs and drafts.
* `blognexa_edit_blog`: Edit generated drafts in Blog Studio.
* `blognexa_approve_blog`: Review & approve articles.
* `blognexa_publish_blog`: Publish or schedule posts.
* `blognexa_manage_integrations`: Configure RankMath/Yoast/AIOSEO.
* `blognexa_view_analytics`: View content analytics.
* `blognexa_manage_data`: Request data purge.

## 2. SSRF Protection (`WordPressHTTPClient`)
* Enforces HTTPS.
* Strictly blocks `localhost`, `127.0.0.1`, `::1`.
* Blocks cloud metadata IP (`169.254.169.254`).
* Blocks RFC 1918 private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) and reserved IP ranges.

## 3. Secret Management (`SecretManager`)
* AES-256-CBC cipher with HMAC-SHA256 authentication.
* Automatic credential redaction (`SecretManager::redact()`) for all audit and debug logs.
* Secrets never returned in settings API responses.

## 4. REST Security & Whitelisting (`SettingsController`)
* Strictly enforces whitelisted keys only.
* Rejects unknown parameters with HTTP 400 (`blognexa_unknown_setting`).
* Validates types, allowed enums, min/max integer bounds, and valid URLs.

