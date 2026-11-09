"""BlogNexa AI - Rate Limiting Tests."""

import pytest
from backend.tests.conftest import make_signed_headers
from backend.app.core.rate_limiter import rate_limiter


def test_operation_class_rate_limiting(client):
    """Exceeding operation class limit results in 429 Too Many Requests."""
    # Operation class 'ai' limit is 5 requests per 60 seconds
    client_key = "cred-test-tenant-001"

    # Fill bucket to limit
    for _ in range(5):
        allowed, _ = rate_limiter.check_rate_limit(client_key, "ai")
        assert allowed is True

    # 6th request must be rate limited
    allowed, retry_after = rate_limiter.check_rate_limit(client_key, "ai")
    assert allowed is False
    assert retry_after > 0

