"""BlogNexa AI - Internal and External Link Graph Extractor."""

import urllib.parse
from typing import List, Dict, Any, Set
from bs4 import BeautifulSoup
from backend.app.modules.crawler.services.url_normalizer import url_normalizer
from backend.app.modules.crawler.services.url_validator import url_validator


class ExtractedLink(dict):
    """Link dictionary holding normalized target, anchor, internal flag, and placement type."""
    pass


class LinkExtractor:
    @staticmethod
    def extract_links(soup: BeautifulSoup, current_url: str, registered_origin: str) -> List[Dict[str, Any]]:
        links: List[Dict[str, Any]] = []
        seen_targets: Set[str] = set()

        for a_tag in soup.find_all("a", href=True):
            raw_href = a_tag["href"].strip()
            if not raw_href or raw_href.startswith(("#", "javascript:", "mailto:", "tel:")):
                continue

            resolved_url = urllib.parse.urljoin(current_url, raw_href)
            normalized_url = url_normalizer.normalize(resolved_url)
            if not normalized_url:
                continue

            if normalized_url in seen_targets:
                continue
            seen_targets.add(normalized_url)

            # Determine if internal
            is_internal = url_validator.is_same_origin(normalized_url, registered_origin)

            # Check nofollow
            rel = (a_tag.get("rel") or [])
            if isinstance(rel, str):
                rel = rel.split()
            is_nofollow = "nofollow" in [r.lower() for r in rel]

            # Anchor text
            anchor_text = a_tag.get_text(separator=" ", strip=True)

            # Classify link type by parent containers
            link_type = "content"
            parent = a_tag.parent
            depth = 0
            while parent and depth < 5:
                tag_name = parent.name.lower()
                classes = " ".join(parent.get("class") or []).lower()
                if tag_name == "nav" or "nav" in classes or "menu" in classes:
                    link_type = "navigation"
                    break
                elif tag_name == "footer" or "footer" in classes:
                    link_type = "footer"
                    break
                elif "breadcrumb" in classes:
                    link_type = "breadcrumb"
                    break
                parent = parent.parent
                depth += 1

            links.append({
                "source_url": current_url,
                "target_url": resolved_url,
                "normalized_target_url": normalized_url,
                "anchor_text": anchor_text,
                "link_type": link_type,
                "is_internal": is_internal,
                "is_nofollow": is_nofollow,
            })

        return links


link_extractor = LinkExtractor()

