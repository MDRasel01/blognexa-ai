"""BlogNexa AI - Robots.txt Manager & Politeness Tests."""

import pytest
from backend.app.modules.crawler.services.robots_manager import robots_manager, RobotsRules


SAMPLE_ROBOTS_TXT = """
User-agent: Googlebot
Disallow: /google-private/

User-agent: BlogNexaBot
Disallow: /private/
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php
Crawl-delay: 1.5
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap_index.xml

User-agent: *
Disallow: /global-hidden/
Crawl-delay: 5.0
"""


def test_robots_txt_parsing_agent_specific():
    rules = robots_manager.parse_robots_txt(SAMPLE_ROBOTS_TXT, "BlogNexaBot")
    assert rules.crawl_delay == 1.5
    assert len(rules.sitemaps) == 2
    assert "https://example.com/sitemap.xml" in rules.sitemaps

    # Allowed & Disallowed checks
    assert rules.is_allowed("/public/article-1") is True
    assert rules.is_allowed("/private/confidential") is False
    assert rules.is_allowed("/wp-admin/settings.php") is False
    # Allow overrides Disallow:
    assert rules.is_allowed("/wp-admin/admin-ajax.php") is True


def test_robots_txt_wildcard_fallback():
    # If bot name is different, falls back to '*' rules
    rules = robots_manager.parse_robots_txt(SAMPLE_ROBOTS_TXT, "UnknownBot")
    assert rules.crawl_delay == 5.0
    assert rules.is_allowed("/global-hidden/secret") is False
    assert rules.is_allowed("/private/allowed-for-others") is True


def test_robots_txt_crawl_delay_safety_ceiling():
    content = "User-agent: BlogNexaBot\nCrawl-delay: 99.0"
    rules = robots_manager.parse_robots_txt(content, "BlogNexaBot")
    # Must be capped at 10.0 seconds for crawler health
    assert rules.crawl_delay == 10.0


def test_robots_cache_and_expiration():
    origin = "https://test-site.example"
    rules = RobotsRules(sitemaps=[], allow_rules=["/"], disallow_rules=[])
    robots_manager.cache_rules(origin, rules)

    cached = robots_manager.get_cached_rules(origin)
    assert cached is not None
    assert cached.is_allowed("/any-path") is True

    robots_manager.clear()
    assert robots_manager.get_cached_rules(origin) is None

