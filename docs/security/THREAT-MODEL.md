# BlogNexa AI — Threat Model & Security Architecture

**Document ID:** BNX-SEC-THREAT-004  
**Date:** 2026-11-09  
**Phase:** 04 — Security Foundation Hardening & Secure Backend Connection  
**Framework:** STRIDE + Zero Trust Distributed Boundary  
**Status:** Approved  

---

## 1. System Overview & Assets

BlogNexa AI operates as a hybrid SaaS platform:
1. **WordPress Client Nodes:** Decentralized WordPress sites running the BlogNexa AI plugin. Each site holds local content, publishing rights, and communication credentials.
2. **Cloud Backend Hub:** Centralized Python FastAPI cluster serving API endpoints, coordinating AI models, managing vector knowledge embeddings, and storing tenant jobs.

### Primary Protected Assets
* **A-1: API Master Credentials & Signing Secrets:** Used to sign and verify HMAC communication between plugin and cloud.
* **A-2: Tenant Content & Intellectual Property:** Unpublished blog drafts, strategy outlines, SEO competitive data, and brand voice guides.
* **A-3: RAG Knowledge Base & Vector Embeddings:** Proprietary corporate documentation and training chunks.
* **A-4: WordPress Publishing Control:** Privileged capabilities to create, edit, and publish posts on the user's live website.
* **A-5: Infrastructure Resources:** AI provider quotas, cloud database records, Redis clusters, and network egress bandwidth.

---

## 2. Trust Boundaries & Threat Actors

### Trust Boundaries
```
[ Untrusted Internet / Public Browsers ]
                 | (Boundary 1: WordPress Admin Auth & CSRF Nonces)
                 v
[ WordPress Client Node (PHP Server Runtime) ]
                 | (Boundary 2: Outbound HTTPS + Canonical HMAC-SHA256)
                 v
[ Cloud API Gateway (FastAPI Authentication Middleware) ]
                 | (Boundary 3: Tenant Resolution & Role Scoping)
                 v
[ Isolated Data Store (PostgreSQL RLS + Redis Replay Guard) ]
                 | (Boundary 4: Anti-SSRF Egress Sandbox)
                 v
[ External Web Crawlers / AI Providers ]
```

### Threat Actors
1. **External Web Adversary (TA-1):** Unauthenticated Internet actor attempting brute force, SSRF reflection, or replay attacks.
2. **Malicious / Compromised Tenant (TA-2):** Legitimate customer attempting to access another tenant's vector database, documents, or publishing feeds.
3. **Compromised WordPress Environment (TA-3):** Shared hosting neighbor or malicious plugin attempting to inspect WordPress database options or file systems.
4. **Man-in-the-Middle (TA-4):** Network adversary attempting to intercept, tamper with, or replay API communications.

---

## 3. STRIDE Threat Analysis & Defense Controls

### 3.1 Spoofing (Identity & Authenticity)

| Threat ID | Threat Scenario | Impact | Mitigation Strategy | Verification Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **TH-SPOOF-01** | Adversary forges requests to backend pretending to be a legitimate WordPress site. | High | Requests must include valid `Authorization: BNX-HMAC <credential_id>:<signature>`, signed with pre-shared `api_secret`. Unsigned or invalid signature requests are rejected with 401. | Signature verification unit tests; reject invalid signatures. |
| **TH-SPOOF-02** | Staging or cloned WordPress site sends requests using production site credentials. | Medium | Site identity manager links `site_instance_id` with home URL. Discrepancies transition state to `DEGRADED`, blocking automated tasks until re-authenticated. | Clone detection tests with mismatched `home_url`. |
| **TH-SPOOF-03** | Attacker spoofs `tenant_id` or `site_id` header to impersonate another organization. | Critical | Backend **never** trusts client-supplied tenant identifiers. Tenant identity is resolved strictly from the verified database record bound to `credential_id`. | Cross-tenant parameter manipulation test rejecting spoofed headers. |

---

### 3.2 Tampering (Data & Integrity)

| Threat ID | Threat Scenario | Impact | Mitigation Strategy | Verification Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **TH-TAMP-01** | MITM intercepts and modifies the payload body or URL query parameters in transit. | High | Canonical request string binds HTTP Method, canonical path, canonical sorted query, timestamp, nonce, and `X-BNX-Content-SHA256` digest into the HMAC signature. Any alteration breaks verification. | Tamper tests altering single byte in body, query, or path. |
| **TH-TAMP-02** | Malicious local plugin or DB dump attacker tampers with stored credentials in `wp_options`. | High | Encrypted storage format utilizes Authenticated Encryption (libsodium secretbox / OpenSSL AES-256-CBC + HMAC-SHA256). Any ciphertext manipulation fails authentication tag validation. | Tamper test appending/modifying encrypted payload bytes. |

---

### 3.3 Repudiation (Accountability & Audit)

| Threat ID | Threat Scenario | Impact | Mitigation Strategy | Verification Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **TH-REP-01** | Tenant or administrator denies issuing an automated publishing or deletion action. | Medium | All critical operations emit structured immutable audit logs recording user ID, site instance ID, credential ID, timestamp, remote IP, and sanitized payload details. | AuditLogger verification; check record presence in `wp_bnx_audit`. |
| **TH-REP-02** | Audit logs leak plaintext API secrets or auth tokens during incident inspection. | High | Automated recursive key redaction (`api_secret`, `authorization`, `password`, `token`) masks sensitive fields before database insertion. | Audit log redaction test verifying masked tokens. |

---

### 3.4 Information Disclosure (Confidentiality & Isolation)

| Threat ID | Threat Scenario | Impact | Mitigation Strategy | Verification Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **TH-INFO-01** | Cross-Tenant Data Leak: Tenant A queries API with Tenant B's `job_id` or document UUID. | Critical | Backend queries enforce strict tenant scoping (`WHERE tenant_id = :authenticated_tenant_id AND site_id = :authenticated_site_id`). Cross-tenant requests return 404/403. | Multi-tenant isolation test suite asserting zero cross-tenant row visibility. |
| **TH-INFO-02** | Vector Search / RAG Cross-Pollination: Knowledge search returns embeddings from another company. | Critical | Vector database queries mandate metadata filter: `tenant_id == ctx.tenant_id`. Partitioned namespaces or RLS ensure strict logical isolation. | Vector retrieval integration test checking metadata filters. |
| **TH-INFO-03** | Browser inspection exposes master backend API secret in admin interface. | High | Cloud backend master credentials and AI secrets are strictly consumed by PHP server-side code. WordPress Admin React UI communicates only via WordPress REST API with CSRF nonces. | UI codebase audit confirming zero secrets in JS bundles. |

---

### 3.5 Denial of Service & Replay (Availability & Abuse)

| Threat ID | Threat Scenario | Impact | Mitigation Strategy | Verification Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **TH-DOS-01** | Adversary captures valid signed request and replays it repeatedly to exhaust quotas. | High | Redis atomic replay guard (`SET bnx:replay:{credential_id}:{nonce} 1 NX EX 300`) rejects duplicate nonces. Strict timestamp window (300 seconds) prevents old requests from being replayed. | Replay test verifying duplicate request returns 401/409. |
| **TH-DOS-02** | Compromised site floods cloud backend with expensive AI generation jobs. | Medium | Tiered token-bucket rate limiting per credential and operation class (Status: 60/min, Jobs: 10/min, AI/RAG: 5/min). Exceeded rates return 429 Too Many Requests. | Rate-limiter test verifying 429 response when limit exceeded. |
| **TH-DOS-03** | Distributed connection storm or Redis outage renders backend authentication insecure. | High | System adheres to Fail-Closed Principle: If replay cache or credential lookup fails, requests are rejected, never bypassing verification. | Redis disconnect simulation asserting fail-closed 503. |

---

### 3.6 Elevation of Privilege & SSRF (Egress & Execution)

| Threat ID | Threat Scenario | Impact | Mitigation Strategy | Verification Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **TH-SSRF-01** | Attacker provides target URL pointing to cloud metadata (`http://169.254.169.254/latest/meta-data/`) to steal IAM credentials. | Critical | Multi-stage anti-SSRF validator resolves IP pre-flight and forbids link-local, loopback (`127.0.0.0/8`, `::1`), private ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and non-HTTPS schemes. | SSRF unit test verifying 169.254.* and loopback blocked. |
| **TH-SSRF-02** | Attacker exploits DNS rebinding (domain resolves to public IP on check, then private IP on fetch). | High | Client validates IP on resolution and enforces socket-level connection verification; redirects re-evaluated against the SSRF filter; response size capped at 10MB. | DNS rebinding test simulation & redirect validation test. |
| **TH-ELEV-01** | Contributor or Author user in WordPress calls admin-only backend sync endpoints. | High | WordPress REST API enforces custom capabilities (`manage_options` / `manage_blognexa_settings`) on all connection endpoints. Non-privileged roles receive 403 Forbidden. | REST capability tests rejecting non-admin requests. |

---

## 4. Security Control Verification Matrix

| Category | Primary Control | Implementation File | Verification File |
| :--- | :--- | :--- | :--- |
| **Site Identity** | UUIDv4 Generation & URL Binding | `app/Security/SiteIdentity.php` | `tests/Security/SiteIdentityTest.php` |
| **Credential Encryption** | Libsodium Secretbox / OpenSSL AES-CBC | `app/Security/CredentialStore.php` | `tests/Security/CredentialStoreTest.php` |
| **Request Signing** | Canonical HMAC-SHA256 Signer | `app/Infrastructure/HTTP/RequestSigner.php` | `tests/Security/RequestSignerTest.php` |
| **Auth Verification** | FastAPI HMAC Security Middleware | `backend/app/core/hmac_auth.py` | `backend/tests/test_hmac_auth.py` |
| **Replay Defense** | Redis Atomic `SET NX EX` | `backend/app/core/replay_guard.py` | `backend/tests/test_replay_guard.py` |
| **Tenant Isolation** | Server-Derived Context & RLS Filters | `backend/app/core/tenant_context.py` | `backend/tests/test_tenant_isolation.py` |
| **SSRF Shield** | Egress Boundary IP Filtering | `backend/app/core/ssrf_guard.py` | `backend/tests/test_ssrf_guard.py` |
| **Rate Limiting** | Operation-Class Sliding Window | `backend/app/core/rate_limiter.py` | `backend/tests/test_rate_limiter.py` |
