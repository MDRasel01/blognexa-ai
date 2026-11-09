# BlogNexa AI — Security Operations, Audit Logging & Incident Response

**Document ID:** BNX-SEC-OPS-004  
**Date:** 2026-11-09  
**Phase:** 04 — Security Foundation Hardening & Secure Backend Connection  
**Status:** Approved  

---

## 1. Security Event Taxonomy

All security-relevant actions occurring in either the WordPress Plugin or Cloud Backend are categorized into the following event taxonomy:

| Category | Event Code | Severity | Description |
| :--- | :--- | :--- | :--- |
| **Authentication** | `AUTH_ENROLL_SUCCESS` | INFO | Site successfully enrolled and credential issued |
| **Authentication** | `AUTH_ENROLL_FAILED` | WARN | Invalid enrollment token or rate limit exceeded |
| **Authentication** | `AUTH_HMAC_SUCCESS` | DEBUG | Valid HMAC signed request processed |
| **Authentication** | `AUTH_HMAC_INVALID` | WARN | Bad signature, missing headers, or key mismatch |
| **Authentication** | `AUTH_REPLAY_DETECTED`| ERROR | Duplicate nonce detected in Redis replay cache |
| **Authentication** | `AUTH_CLOCK_SKEW` | WARN | Request timestamp outside ±300s window |
| **Authorization** | `ACCESS_CROSS_TENANT` | CRITICAL | Attempted access to another tenant's resource |
| **Authorization** | `ACCESS_DENIED_CAP` | WARN | WordPress user lacks required capability |
| **SSRF** | `SSRF_BLOCKED_IP` | WARN | Outbound crawler destination blocked (private/loopback/cloud metadata) |
| **Lifecycle** | `CRED_ROTATED` | INFO | Site credentials rotated to new key version |
| **Lifecycle** | `CRED_REVOKED` | WARN | Site credentials revoked; connection terminated |

---

## 2. Structured Audit Record Standard

Audit logs must adhere to the standardized schema across both PHP (`wp_bnx_audit`) and Cloud PostgreSQL (`bnx_audit_events`):

```json
{
  "event_id": "evt_98765432-1234-abcd-ef01-23456789abcd",
  "timestamp": "2026-11-09T16:25:00Z",
  "tenant_id": "c1234567-89ab-cdef-0123-456789abcdef",
  "site_id": "s9876543-21ba-fedc-3210-fedcba987654",
  "user_id": "42",
  "action": "AUTH_HMAC_INVALID",
  "object_type": "api_request",
  "object_id": "req-uuid-987654321",
  "details": {
    "path": "/v1/jobs",
    "method": "POST",
    "error": "Signature mismatch"
  },
  "ip_address": "203.0.113.195",
  "user_agent": "BlogNexa-AI-Plugin/1.0.0"
}
```

---

## 3. Automated Secret Redaction Protocol

Before any audit record, error message, or debug log is written to persistent storage or console, it MUST be passed through the automated redaction engine.

### Redaction Rules:
1. **Case-Insensitive Sensitive Key Matching:** Any key matching or containing:
   * `api_secret`, `secret`, `password`, `authorization`, `token`, `access_token`, `refresh_token`, `auth_header`, `cookie`, `private_key`.
2. **Replacement Pattern:** Replace sensitive values with `[REDACTED]`.
3. **Partial Masking for Identifiers:** Credential IDs and Request IDs may display first 4 and last 4 characters (e.g. `cred-****-001`).

---

## 4. Credential Lifecycle Procedures

### 4.1 Rotation Procedure (Zero-Downtime Dual-Key Window)
1. **Initiation:** WordPress administrator clicks "Rotate API Keys" in the plugin Settings panel.
2. **Request:** Client sends signed request to `POST /v1/site/rotate-keys`.
3. **Generation:** Cloud backend generates new `key_version = current + 1` and new `api_secret`.
4. **Grace Window:** Backend keeps the previous key valid for a **24-hour grace period** (or until the client acknowledges the first successful request using the new key).
5. **Storage:** WordPress client receives new credentials, encrypts them via `CredentialStore`, updates local option, and marks rotation complete.
6. **Decommission:** Old key is archived and invalidated.

### 4.2 Revocation Procedure
1. If a website is compromised, decommissioned, or unauthorized:
   * Admin triggers revocation via Cloud Dashboard or API endpoint `POST /v1/site/revoke`.
   * Cloud backend immediately marks the credential status as `REVOKED` in the database.
   * Redis active session and replay keys for that `credential_id` are purged.
   * Any subsequent request with that credential receives `HTTP 401 Unauthorized` with error `CREDENTIAL_REVOKED`.
   * WordPress client transitions connection state machine to `REVOKED`.

---

## 5. Incident Response Playbook: Compromised Credential

1. **Detection:** High frequency of `AUTH_HMAC_INVALID` or `ACCESS_CROSS_TENANT` events in Cloud SIEM.
2. **Containment:** Immediately invoke `POST /v1/site/revoke` for the targeted `credential_id`.
3. **Investigation:** Query `bnx_audit_events` for all requests associated with `credential_id` in the past 7 days.
4. **Remediation:**
   * Rotate WordPress core `AUTH_KEY` and `SECURE_AUTH_KEY` in `wp-config.php`.
   * Clear local plugin encrypted options (`blognexa_credentials`).
   * Perform fresh enrollment handshake to establish a new `site_instance_id` and new API keys.

