# Changelog

All notable changes to BlogNexa AI are documented here.

## [1.0.0] - 2026-11-09
### Phase 01: Product & Technical Foundation (BNX-ENG-001)
* Established engineering baseline, module boundaries, hybrid architecture, and data ownership principles.
* Defined capability matrix (13 capabilities) and threat model.

### Phase 02: Core Architecture & Bootstrap Implementation (BNX-ENG-002)
* Implemented strict, clean `blognexa-ai.php` entry point with requirements checker.
* Implemented application lifecycle managers: `Activator`, `Deactivator`, and `Uninstaller`.
* Implemented database schema installer and versioned migrator (`wp_bnx_*` tables).
* Implemented capability-based access control and `PermissionManager`.
* Implemented WordPress Admin sidebar menu and isolated asset loader.
* Implemented React Admin UI shell (`App.tsx`, `AdminLayout.tsx`, `OverviewPage.tsx`).
* Implemented REST API foundation (`/status` and whitelisted `/settings`).
* Implemented `WordPressHTTPClient` with full SSRF defense against loopback and cloud metadata.
* Implemented `SecretManager` with AES-256-CBC, HMAC, and credential redaction.
* Executed 45 automated unit, integration, and security tests (SEC-001 through SEC-015) with 100% pass rate.

