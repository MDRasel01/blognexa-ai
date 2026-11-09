"""BlogNexa AI - URL Normalizer, Scope and Validation Tests."""

import pytest
from backend.app.modules.crawler.services.url_normalizer import url_normalizer
from backend.app.modules.crawler.services.url_validator import url_validator


def test_url_normalization_rules():
    # Lowercase host, strip default port, strip fragment
    raw = "HTTPS://Example.COM:443/Blog/Article/#section"
    expected = "https://example.com/Blog/Article/"
    assert url_normalizer.normalize(raw) == expected


def test_url_tracking_param_removal():
    # Removes utm_*, fbclid, preserves content query params (p=10, cat=tech)
    raw = "https://example.com/post?utm_source=twitter&p=10&fbclid=12345&cat=tech"
    # Query parameters sorted alphabetically: cat=tech&p=10
    expected = "https://example.com/post?cat=tech&p=10"
    assert url_normalizer.normalize(raw) == expected


def test_url_relative_resolution():
    base = "https://example.com/articles/guide/"
    relative = "../tips"
    expected = "https://example.com/articles/tips"
    assert url_normalizer.normalize(relative, base) == expected


def test_url_hash_deterministic():
    url = "https://example.com/about-us/"
    h1 = url_normalizer.hash_url(url)
    h2 = url_normalizer.hash_url(url)
    assert h1 == h2
    assert len(h1) == 64  # SHA-256 hex


def test_same_origin_scope_validation():
    origin = "https://example.com"
    assert url_validator.is_same_origin("https://example.com/page", origin) is True
    # Subdomains and external domains rejected by default
    assert url_validator.is_same_origin("https://sub.example.com/page", origin) is False
    assert url_validator.is_same_origin("https://google.com", origin) is False


def test_exclusion_patterns():
    assert url_validator.is_excluded("https://example.com/wp-admin/plugins.php") is True
    assert url_validator.is_excluded("https://example.com/cart/") is True
    assert url_validator.is_excluded("https://example.com/blog/article-1") is False


def test_validate_for_crawl_ssrf_blocking():
    origin = "http://127.0.0.1"
    # Private / loopback target rejected by SSRF guard
    is_ok, reason = url_validator.validate_for_crawl("http://127.0.0.1/admin", origin)
    assert is_ok is False
    assert "SSRF" in reason or "restricted" in reason.lower()

