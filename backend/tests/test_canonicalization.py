"""BlogNexa AI - Cross-Language Canonicalization & Test Vector Parity Tests."""

import hashlib
import hmac
from backend.app.core.hmac_auth import build_canonical_query, build_canonical_string


def test_canonical_query_sorting():
    """Verify that query parameters are sorted alphabetically by ASCII key."""
    raw_query = "b_param=value2&a_param=value1&c_param=hello%20world"
    canonical_query = build_canonical_query(raw_query)
    expected = "a_param=value1&b_param=value2&c_param=hello%20world"
    assert canonical_query == expected


def test_standard_specification_vector():
    """Verify exact bit-for-bit parity with the BNX-HMAC-SHA256 specification vector."""
    method = "POST"
    path = "/v1/jobs"
    raw_query = "action=create&priority=high"
    timestamp = "1731175200"
    nonce = "test-nonce-123456789"
    key_version = "1"
    request_id = "req-uuid-987654321"
    body = '{"prompt":"Write a blog about AI agents","target_words":1200}'
    secret = "secret-key-32-chars-long-123456"
    credential_id = "cred-test-tenant-001"

    body_bytes = body.encode("utf-8")
    body_sha256 = hashlib.sha256(body_bytes).hexdigest()
    expected_body_sha256 = "508616b0fae44ebe7988379e9efe49f34a103453cea848cee9afc8be065c3411"
    assert body_sha256 == expected_body_sha256

    canonical_query = build_canonical_query(raw_query)
    canonical_str = build_canonical_string(
        method=method,
        path=path,
        query=canonical_query,
        timestamp=timestamp,
        nonce=nonce,
        key_version=key_version,
        request_id=request_id,
        body_sha256=body_sha256
    )

    expected_canonical_str = (
        "POST\n"
        "/v1/jobs\n"
        "action=create&priority=high\n"
        "1731175200\n"
        "test-nonce-123456789\n"
        "1\n"
        "req-uuid-987654321\n"
        "508616b0fae44ebe7988379e9efe49f34a103453cea848cee9afc8be065c3411"
    )
    assert canonical_str == expected_canonical_str

    signature = hmac.new(
        secret.encode("utf-8"),
        canonical_str.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    expected_signature = "a7e8a492a81adf7dbbdff63b0788d1419da762a3d4ccc8fb0f62bcab3d88d44b"
    assert signature == expected_signature

