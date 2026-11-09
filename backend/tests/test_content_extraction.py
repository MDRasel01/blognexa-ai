"""BlogNexa AI - Content, Metadata and Link Extraction Tests."""

import pytest
from bs4 import BeautifulSoup
from backend.app.modules.crawler.services.content_extractor import content_extractor
from backend.app.modules.crawler.services.metadata_extractor import metadata_extractor
from backend.app.modules.crawler.services.link_extractor import link_extractor
from backend.app.modules.crawler.services.content_normalizer import content_normalizer


SAMPLE_HTML_PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
  <title>Complete Guide to Cloud Security</title>
  <meta name="description" content="In-depth guide covering cloud security principles and HMAC.">
  <link rel="canonical" href="https://example.com/guide-cloud-security/">
  <meta property="og:title" content="Complete Guide to Cloud Security">
  <meta property="og:description" content="In-depth guide covering cloud security.">
  <meta property="article:published_time" content="2026-11-09T10:00:00Z">
</head>
<body>
  <header>
    <nav>
      <a href="/home">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>
  <div class="cookie-consent-modal">
    Please accept our cookies!
  </div>
  <main>
    <article>
      <h1>Complete Guide to Cloud Security</h1>
      <p>Cloud security relies on multi-layered defense architectures including network isolation, encryption, and strict identity verification.</p>
      <h2>Tenant Isolation Strategies</h2>
      <p>Row-Level Security (RLS) in PostgreSQL ensures that one organization cannot read or mutate data belonging to another tenant.</p>
      <ul>
        <li>Cryptographic request signing</li>
        <li>Redis atomic replay protection</li>
        <li>Pre-flight SSRF IP validation</li>
      </ul>
      <p>For more details, check out our <a href="/docs/hmac-spec">HMAC Protocol Specification</a> and <a href="https://external.org/rfc" rel="nofollow">External RFC</a>.</p>
    </article>
  </main>
  <footer>
    <a href="/privacy">Privacy Policy</a>
  </footer>
</body>
</html>
"""


def test_metadata_extraction():
    soup = BeautifulSoup(SAMPLE_HTML_PAGE, "lxml")
    meta = metadata_extractor.extract(soup, "https://example.com/page")

    assert meta["title"] == "Complete Guide to Cloud Security"
    assert "In-depth guide" in meta["description"]
    assert meta["canonical_url"] == "https://example.com/guide-cloud-security/"
    assert meta["language"] == "en"
    assert meta["published_at"] == "2026-11-09T10:00:00Z"
    assert meta["open_graph"]["title"] == "Complete Guide to Cloud Security"


def test_main_content_extraction():
    extracted = content_extractor.extract_main_content(SAMPLE_HTML_PAGE)
    assert extracted.title == "Complete Guide to Cloud Security"
    assert extracted.word_count > 40

    # Headings hierarchy
    assert len(extracted.headings) >= 2
    assert extracted.headings[0]["level"] == 1
    assert extracted.headings[0]["text"] == "Complete Guide to Cloud Security"
    assert extracted.headings[1]["level"] == 2
    assert extracted.headings[1]["text"] == "Tenant Isolation Strategies"

    # Main text content contains article body
    assert "Row-Level Security" in extracted.content_text
    assert "Cryptographic request signing" in extracted.content_text

    # Cookie banner boilerplate stripped
    assert "Please accept our cookies" not in extracted.content_text


def test_link_extraction_and_classification():
    soup = BeautifulSoup(SAMPLE_HTML_PAGE, "lxml")
    links = link_extractor.extract_links(soup, "https://example.com/page", "https://example.com")

    # Found internal links
    internal_links = [l for l in links if l["is_internal"]]
    external_links = [l for l in links if not l["is_internal"]]

    assert any(l["normalized_target_url"] == "https://example.com/docs/hmac-spec" for l in internal_links)
    assert any(l["normalized_target_url"] == "https://example.com/privacy" for l in internal_links)

    # Classification
    nav_link = next(l for l in links if l["normalized_target_url"] == "https://example.com/home")
    assert nav_link["link_type"] == "navigation"

    footer_link = next(l for l in links if l["normalized_target_url"] == "https://example.com/privacy")
    assert footer_link["link_type"] == "footer"

    # Nofollow check
    ext_link = next(l for l in links if l["target_url"] == "https://external.org/rfc")
    assert ext_link["is_nofollow"] is True


def test_content_normalization_and_quality():
    raw_text = "  First Paragraph  \n\n\n\n  Second Paragraph with text.  "
    clean = content_normalizer.normalize_text(raw_text)
    assert clean == "First Paragraph\n\nSecond Paragraph with text."

    content_hash = content_normalizer.compute_content_hash(clean)
    assert len(content_hash) == 64

    # Quality scoring
    q_high = content_normalizer.evaluate_quality("Great Title", 250, 3)
    assert q_high == "HIGH"

    q_low = content_normalizer.evaluate_quality("Short", 20, 0)
    assert q_low == "LOW"

    q_failed = content_normalizer.evaluate_quality("", 0, 0)
    assert q_failed == "FAILED"

