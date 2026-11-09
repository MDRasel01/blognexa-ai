"""BlogNexa AI - Secure XML Sitemap & Sitemap Index Parser."""

from typing import List, Dict, Optional, Set
from pydantic import BaseModel
import defusedxml.ElementTree as ET


class SitemapEntry(BaseModel):
    loc: str
    lastmod: Optional[str] = None
    changefreq: Optional[str] = None
    priority: Optional[str] = None


class SitemapParseResult(BaseModel):
    sitemap_type: str  # "urlset" or "sitemapindex"
    urls: List[SitemapEntry] = []
    child_sitemaps: List[str] = []


def strip_namespace(tag: str) -> str:
    """Strip XML namespace prefix like {http://www.sitemaps.org/schemas/sitemap/0.9}."""
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


class SitemapParser:
    """Secure, anti-XXE parser for XML Sitemaps and Sitemap Indexes."""

    @staticmethod
    def parse(xml_content: str | bytes) -> SitemapParseResult:
        if isinstance(xml_content, str):
            xml_bytes = xml_content.encode("utf-8")
        else:
            xml_bytes = xml_content

        try:
            root = ET.fromstring(xml_bytes)
        except Exception as e:
            raise ValueError(f"Malformed XML sitemap: {str(e)}")

        root_tag = strip_namespace(root.tag).lower()

        if root_tag == "sitemapindex":
            child_sitemaps: List[str] = []
            for elem in root:
                if strip_namespace(elem.tag).lower() == "sitemap":
                    for child in elem:
                        if strip_namespace(child.tag).lower() == "loc" and child.text:
                            loc = child.text.strip()
                            if loc:
                                child_sitemaps.append(loc)
            return SitemapParseResult(sitemap_type="sitemapindex", child_sitemaps=child_sitemaps)

        elif root_tag == "urlset":
            urls: List[SitemapEntry] = []
            for elem in root:
                if strip_namespace(elem.tag).lower() == "url":
                    entry_dict = {}
                    for child in elem:
                        tag_name = strip_namespace(child.tag).lower()
                        if child.text:
                            entry_dict[tag_name] = child.text.strip()

                    if "loc" in entry_dict and entry_dict["loc"]:
                        urls.append(SitemapEntry(
                            loc=entry_dict["loc"],
                            lastmod=entry_dict.get("lastmod"),
                            changefreq=entry_dict.get("changefreq"),
                            priority=entry_dict.get("priority")
                        ))
            return SitemapParseResult(sitemap_type="urlset", urls=urls)

        else:
            raise ValueError(f"Unsupported XML root element: {root_tag}")


sitemap_parser = SitemapParser()

