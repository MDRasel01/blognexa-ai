# BlogNexa AI — Step 04 Initial Security & Architecture Audit

**Document ID:** BNX-SEC-AUDIT-004  
**Date:** 2026-11-09  
**Phase:** 04 — Security Foundation Hardening & Secure Backend Connection  
**Status:** Approved Initial Baseline  

---

## 1. Executive Summary

This security audit reviews the existing codebase (Steps 01, 02, and 03) of BlogNexa AI prior to implementing the Phase 04 hybrid cloud communication layer. The objective is to identify security controls already established, evaluate trust boundaries, discover architectural gaps, and define precise remediation requirements.

BlogNexa AI is transitioning from a standalone local WordPress administration plugin to a hybrid system connecting WordPress client installations with a central, multi-tenant Cloud Backend (FastAPI + PostgreSQL + Redis).

---

## 2. Inventory of Current Security Primitives

### 2.1 Encryption & Key Management (`app/Security/SecretManager.php`)
* **Current State:** Implements AES-256-CBC encryption with encrypt-then-MAC (HMAC-SHA256). Master key is derived dynamically from WordPress core `AUTH_KEY` and `SECURE_AUTH_KEY`. Includes an ad-hoc stream cipher fallback when OpenSSL is unavailable.
* **Findings & Gaps:**
  1. **No External Key Support:** The master key derivation relies strictly on WordPress salts, which reside in `wp-config.php` or database backups. It lacks dedicated support for `BLOGNEXA_CREDENTIAL_ENCRYPTION_KEY` located in environment variables or hardware key storage.
  2. **Modern AEAD Missing:** While OpenSSL AES-256-CBC + HMAC-SHA256 is sound, modern authenticated symmetric encryption via `libsodium` (`sodium_crypto_secretbox`) is not prioritized despite PHP 8.1+ having libsodium as a core standard.
  3. **Payload Versioning:** Encrypted payloads use unstructured prefixes (`ossl:`, `strc:`) instead of a versioned envelope tracking key version and cipher algorithm.

### 2.2 Input Sanitization & Nonce Enforcement (`app/Security/InputValidator.php`, `NonceManager.php`)
* **Current State:** Implements recursive input sanitization, strict UUIDv4 regex checks, integer and boolean coercion, and WordPress REST nonce generation and verification (`wp_create_nonce`, `wp_verify_nonce`).
* **Findings:**
  1. WordPress nonces are correctly treated as CSRF defenses for admin browsers, **not** as API authentication tokens.
  2. Input validation covers core types but needs expansion for enrollment tokens and signed header values.

### 2.3 Access Control & Capability Matrix (`app/Security/CapabilityManager.php`, `PermissionManager.php`)
* **Current State:** 13 granular custom capabilities mapped across `administrator`, `editor`, and `author` roles. REST routes require `permission_callback` checking capabilities explicitly.
* **Findings:**
  1. Plugin administrative actions are guarded.
  2. The cloud communication bridge must maintain parity: WordPress user actions must be authorized locally before dispatching authenticated backend jobs.

### 2.4 Network Egress & SSRF Defenses (`app/Infrastructure/HTTP/WordPressHTTPClient.php`)
* **Current State:** Pre-flight destination URL validation checking scheme (`https` only), blocking localhost, loopback (`127.0.0.0/8`, `::1`), link-local metadata (`169.254.0.0/16`), and private IP ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
* **Findings & Gaps:**
  1. **HMAC Signature Headers Missing:** Outgoing requests currently do not sign payloads with HMAC-SHA256 headers (`Authorization: BNX-HMAC`, `X-BNX-Timestamp`, `X-BNX-Nonce`, `X-BNX-Key-Version`).
  2. **DNS Rebinding Vulnerability:** Pre-flight DNS resolution evaluates host IPs, but standard `wp_remote_request` performs a separate DNS resolution at socket connect time, leaving a theoretical window for Time-of-Check to Time-of-Use (TOCTOU) DNS rebinding.
  3. **No Timeout Tiering:** All requests share a single default 20s timeout without separating rapid status polling (3-5s) from heavy AI generation tasks (30-60s).

### 2.5 Database Schema & Local Storage (`app/Database/Schema.php`)
* **Current State:** Four indexed relational tables: `wp_bnx_connections`, `wp_bnx_jobs`, `wp_bnx_publications`, `wp_bnx_audit`.
* **Findings:**
  1. `wp_bnx_connections` exists but requires schema migration fields to record `site_instance_id`, `credential_id`, `api_key_version`, encrypted secret payload, and connection state machine status.
  2. Audit table provides forensic logging, but structured redaction must ensure zero credentials or tokens are stored in the database.

---

## 3. Cloud Backend & Trust Boundary Assessment

* **Current State:** The cloud backend is not yet instantiated. Prior architecture docs define the target stack (Python FastAPI, PostgreSQL, Redis).
* **Critical Architecture Requirements for Step 04:**
  1. **Strict Tenant Context:** The backend must **never** trust a client-supplied `tenant_id` or `site_id` in request payloads. It must resolve tenant identity exclusively from the verified HMAC credential.
  2. **Atomic Replay Guard:** Nonces must be validated and recorded atomically in Redis with `SET bnx:replay:{credential_id}:{nonce} 1 NX EX 300` within a 300-second drift window.
  3. **Fail-Closed Design:** In the event of Redis unavailability or cryptographic failure, protected write operations must fail closed.
  4. **Crawler Security:** Background scraping/crawling workers must enforce anti-SSRF at both application and network routing levels.

---

## 4. Gap Remediation Matrix

| ID | Component | Current State | Target State in Step 04 |
| :--- | :--- | :--- | :--- |
| **GAP-01** | Site Identity | No persistent site UUID | Generate immutable UUIDv4 on activation; detect DB cloning / URL changes |
| **GAP-02** | Credential Storage | AES-CBC with WP salt | Authenticated Libsodium secretbox + OpenSSL fallback; support `BLOGNEXA_CREDENTIAL_ENCRYPTION_KEY` |
| **GAP-03** | Request Integrity | Unsigned HTTPS requests | Standardized canonical HMAC-SHA256 signing across PHP & FastAPI |
| **GAP-04** | Replay Defense | None | 300s timestamp window + Redis atomic nonce tracking (`NX EX`) |
| **GAP-05** | Backend Auth | None (Unimplemented) | FastAPI security middleware with constant-time verification & tenant resolution |
| **GAP-06** | Tenant Isolation | N/A | Server-derived context, schema isolation, and cross-tenant automated test suite |
| **GAP-07** | State Machine | Ad-hoc status | Explicit Connection State Machine (`DISCONNECTED` -> `CONNECTED` -> `DEGRADED` -> `REVOKED`) |
| **GAP-08** | SSRF Defense | Pre-flight URL parsing | Multi-stage anti-SSRF with private IP filtration, metadata blocking, and size caps |

---

## 5. Audit Conclusion

The Step 01-03 foundation provides robust local WordPress security (CSRF nonces, capability checks, and database table structures). Phase 04 will establish the distributed security architecture: authenticated symmetric encryption, canonical request signing, atomic replay prevention, and strict tenant isolation on the Cloud Backend.
