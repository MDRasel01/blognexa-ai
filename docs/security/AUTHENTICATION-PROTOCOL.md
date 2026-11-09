# BlogNexa AI — Cloud HMAC Authentication Protocol Specification

**Document ID:** BNX-SEC-AUTH-004  
**Date:** 2026-11-09  
**Phase:** 04 — Security Foundation Hardening & Secure Backend Connection  
**Protocol Version:** BNX-HMAC-SHA256-v1  
**Status:** Canonical Standard  

---

## 1. Overview & Security Goals

The BlogNexa Cloud HMAC Authentication Protocol provides mutual authentication, payload integrity verification, anti-tampering protection, and replay resistance for all server-to-server HTTPS communication between WordPress client installations and the BlogNexa Cloud Backend.

### Core Guarantees
1. **Authenticity:** Only client nodes holding the valid shared `api_secret` can generate valid signatures.
2. **Integrity:** Any alteration of HTTP method, path, query parameters, timestamp, nonce, or body payload invalidates the signature.
3. **Freshness:** Strict 300-second timestamp drift limit prevents old or expired requests.
4. **Replay Defense:** Unique nonces verified atomically via Redis `SET NX EX` guarantee single execution.
5. **No Secret In Transit:** The pre-shared secret is never transmitted over the network.

---

## 2. Request Headers

Every authenticated request to the BlogNexa Cloud API MUST include the following HTTP headers:

| Header Name | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `Authorization` | String | `BNX-HMAC <credential_id>:<signature>` | `BNX-HMAC cred-01:a7e8a4...` |
| `X-BNX-Timestamp` | Integer | Unix epoch timestamp in seconds UTC | `1731175200` |
| `X-BNX-Nonce` | String | Cryptographically random unique string (UUID or 16+ hex) | `test-nonce-123456789` |
| `X-BNX-Key-Version` | String | Version number of the signing credential | `1` |
| `X-BNX-Request-ID` | String | Distributed tracing UUIDv4 | `req-uuid-987654321` |
| `X-BNX-Content-SHA256` | String | Hex-encoded lowercase SHA-256 digest of raw request body | `508616b0...` |

*(Note: For empty GET/DELETE bodies, `X-BNX-Content-SHA256` is the SHA-256 of empty string `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`)*.

---

## 3. Canonical Request Construction

The canonical request string is formed by concatenating 8 elements delimited strictly by newline characters (`\n` / ASCII `0x0A`):

```text
HTTP_METHOD
CANONICAL_PATH
CANONICAL_QUERY
TIMESTAMP
NONCE
KEY_VERSION
REQUEST_ID
BODY_SHA256
```

### Detailed Field Formatting Rules
1. **`HTTP_METHOD`**: Uppercase string (e.g. `GET`, `POST`, `PUT`, `DELETE`).
2. **`CANONICAL_PATH`**: Normalized absolute URI path, starting with `/` (e.g. `/v1/jobs`). Redundant slashes removed; trailing slash preserved only if part of the route.
3. **`CANONICAL_QUERY`**: Query string sorted alphabetically by ASCII byte order of parameter keys (e.g. `action=create&priority=high`). Empty string if no query parameters.
4. **`TIMESTAMP`**: Raw string integer of `X-BNX-Timestamp`.
5. **`NONCE`**: Raw string value of `X-BNX-Nonce`.
6. **`KEY_VERSION`**: Raw string value of `X-BNX-Key-Version`.
7. **`REQUEST_ID`**: Raw string value of `X-BNX-Request-ID`.
8. **`BODY_SHA256`**: Hex-encoded lowercase SHA-256 digest of the request body bytes.

---

## 4. Signature Calculation & Verification

### 4.1 Calculation (Client-Side PHP)
```php
$canonicalString = implode("\n", [
    strtoupper($httpMethod),
    $canonicalPath,
    $canonicalQuery,
    $timestamp,
    $nonce,
    $keyVersion,
    $requestId,
    $bodySha256
]);

$signature = hash_hmac('sha256', $canonicalString, $apiSecret);
```

### 4.2 Verification (FastAPI Backend)
```python
import hmac
import hashlib

canonical_string = "\n".join([
    http_method.upper(),
    canonical_path,
    canonical_query,
    timestamp,
    nonce,
    key_version,
    request_id,
    body_sha256
])

expected_signature = hmac.new(
    api_secret.encode('utf-8'),
    canonical_string.encode('utf-8'),
    hashlib.sha256
).hexdigest()

# Constant-time comparison to prevent timing side-channel attacks:
if not hmac.compare_digest(expected_signature, received_signature):
    raise HTTPException(status_code=401, detail="Invalid HMAC signature")
```

---

## 5. Canonical Test Vectors (Shared Across PHP & Python)

### Test Vector 1: POST /v1/jobs with JSON Payload

```json
{
  "description": "POST request with query parameters and JSON payload",
  "input": {
    "method": "POST",
    "path": "/v1/jobs",
    "query": "action=create&priority=high",
    "timestamp": "1731175200",
    "nonce": "test-nonce-123456789",
    "key_version": "1",
    "request_id": "req-uuid-987654321",
    "body": "{\"prompt\":\"Write a blog about AI agents\",\"target_words\":1200}",
    "secret": "secret-key-32-chars-long-123456",
    "credential_id": "cred-test-tenant-001"
  },
  "expected": {
    "body_sha256": "508616b0fae44ebe7988379e9efe49f34a103453cea848cee9afc8be065c3411",
    "canonical_string": "POST\n/v1/jobs\naction=create&priority=high\n1731175200\ntest-nonce-123456789\n1\nreq-uuid-987654321\n508616b0fae44ebe7988379e9efe49f34a103453cea848cee9afc8be065c3411",
    "signature": "a7e8a492a81adf7dbbdff63b0788d1419da762a3d4ccc8fb0f62bcab3d88d44b",
    "authorization_header": "BNX-HMAC cred-test-tenant-001:a7e8a492a81adf7dbbdff63b0788d1419da762a3d4ccc8fb0f62bcab3d88d44b"
  }
}
```

### Test Vector 2: GET /v1/site/status with Empty Body

```json
{
  "description": "GET request with no body and no query",
  "input": {
    "method": "GET",
    "path": "/v1/site/status",
    "query": "",
    "timestamp": "1731175200",
    "nonce": "get-status-nonce-987",
    "key_version": "1",
    "request_id": "req-status-456",
    "body": "",
    "secret": "secret-key-32-chars-long-123456",
    "credential_id": "cred-test-tenant-001"
  },
  "expected": {
    "body_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "canonical_string": "GET\n/v1/site/status\n\n1731175200\nget-status-nonce-987\n1\nreq-status-456\ne3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
}
```

---

## 6. Timestamp Skew & Expiration

1. Allowed clock drift window: **±300 seconds** (5 minutes).
2. If `abs(current_utc_timestamp - request_timestamp) > 300`:
   * The backend rejects the request immediately with `HTTP 401 Unauthorized` and code `CLOCK_SKEW_EXCEEDED`.
   * Nonce checking is bypassed for expired requests to preserve Redis capacity.

