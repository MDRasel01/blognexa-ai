"""BlogNexa AI - HTML Metadata, OpenGraph & Social Tag Extractor."""

from typing import Dict, Any, Optional
from bs4 import BeautifulSoup


class MetadataExtractor:
    @staticmethod
    def extract(soup: BeautifulSoup, base_url: str = "") -> Dict[str, Any]:
        """Extract title, canonical, language, Open Graph and Twitter Card tags."""
        data: Dict[str, Any] = {
            "title": "",
            "description": "",
            "canonical_url": "",
            "language": "en",
            "author": None,
            "published_at": None,
            "modified_at": None,
            "open_graph": {},
            "twitter": {},
        }

        # 1. Language
        html_tag = soup.find("html")
        if html_tag and html_tag.get("lang"):
            data["language"] = html_tag["lang"].strip().split("-")[0].lower()

        # 2. Document Title
        title_tag = soup.find("title")
        if title_tag and title_tag.string:
            data["title"] = title_tag.string.strip()

        # 3. Canonical URL
        canonical_tag = soup.find("link", rel=lambda v: v and "canonical" in v.lower())
        if canonical_tag and canonical_tag.get("href"):
            data["canonical_url"] = canonical_tag["href"].strip()

        # 4. Meta tags (Description, Author, Dates, OpenGraph, Twitter)
        meta_tags = soup.find_all("meta")
        for tag in meta_tags:
            name = (tag.get("name") or "").lower()
            prop = (tag.get("property") or "").lower()
            content = (tag.get("content") or "").strip()

            if not content:
                continue

            # Core description
            if name == "description" and not data["description"]:
                data["description"] = content

            # Author
            if name in ("author", "article:author") or prop == "article:author":
                if not data["author"]:
                    data["author"] = content

            # Dates
            if prop in ("article:published_time", "og:published_time") or name == "publish_date":
                data["published_at"] = content
            if prop in ("article:modified_time", "og:modified_time") or name == "last_modified":
                data["modified_at"] = content

            # Open Graph
            if prop.startswith("og:"):
                key = prop[3:]
                data["open_graph"][key] = content
                if key == "title" and not data["title"]:
                    data["title"] = content
                if key == "description" and not data["description"]:
                    data["description"] = content

            # Twitter Cards
            if name.startswith("twitter:"):
                key = name[8:]
                data["twitter"][key] = content

        return data


metadata_extractor = MetadataExtractor()

