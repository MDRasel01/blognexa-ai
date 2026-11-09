"""BlogNexa AI - SSRF Guard Tests."""

import pytest
from backend.app.core.ssrf_guard import validate_target_url


@pytest.mark.parametrize("blocked_url", [
    "http://127.0.0.1:8000/internal",
    "http://localhost:5432",
    "http://169.254.169.254/latest/meta-data/",
    "http://10.0.1.5/admin",
    "http://172.16.0.22/metrics",
    "http://192.168.1.1/router",
    "file:///etc/passwd",
    "gopher://127.0.0.1:6379/_",
    "dict://127.0.0.1:11211/stat",
    "ftp://ftp.local/backup.zip",
])
def test_ssrf_guard_blocks_restricted_destinations(blocked_url):
    is_safe, error = validate_target_url(blocked_url)
    assert is_safe is False
    assert error is not None


def test_ssrf_guard_allows_safe_external_url():
    is_safe, error = validate_target_url("https://example.com")
    assert is_safe is True
    assert error is None

