"""BlogNexa AI - Secure XML Sitemap & Sitemap Index Parser Tests."""

import pytest
from backend.app.modules.crawler.services.sitemap_discovery import sitemap_parser


SAMPLE_URLSET_XML = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/post-1</loc>
    <lastmod>2026-11-01T12:00:00Z</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://example.com/post-2</loc>
    <lastmod>2026-11-05T08:30:00Z</lastmod>
  </url>
</urlset>
"""

SAMPLE_INDEX_XML = """<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://example.com/post-sitemap.xml</loc>
    <lastmod>2026-11-08T10:00:00Z</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://example.com/page-sitemap.xml</loc>
  </sitemap>
</sitemapindex>
"""

XXE_MALICIOUS_XML = """<?xml version="1.0"?>
<!DOCTYPE lolz [
 <!ENTITY test SYSTEM "file:///etc/passwd">
]>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>&test;</loc>
  </url>
</urlset>
"""


def test_parse_urlset_sitemap():
    result = sitemap_parser.parse(SAMPLE_URLSET_XML)
    assert result.sitemap_type == "urlset"
    assert len(result.urls) == 2
    assert result.urls[0].loc == "https://example.com/post-1"
    assert result.urls[0].lastmod == "2026-11-01T12:00:00Z"
    assert result.urls[0].changefreq == "daily"
    assert result.urls[0].priority == "0.8"
    assert result.urls[1].loc == "https://example.com/post-2"


def test_parse_sitemap_index():
    result = sitemap_parser.parse(SAMPLE_INDEX_XML)
    assert result.sitemap_type == "sitemapindex"
    assert len(result.child_sitemaps) == 2
    assert "https://example.com/post-sitemap.xml" in result.child_sitemaps
    assert "https://example.com/page-sitemap.xml" in result.child_sitemaps


def test_anti_xxe_entity_defense():
    # defusedxml should reject or neutralize XML with DOCTYPE entity expansion
    with pytest.raises(Exception):
        sitemap_parser.parse(XXE_MALICIOUS_XML)


def test_malformed_xml_rejection():
    with pytest.raises(ValueError):
        sitemap_parser.parse("<incomplete_xml><url><loc>broken")

