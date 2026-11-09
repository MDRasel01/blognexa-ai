"""BlogNexa AI - Semantic HTML Main Content & Heading Extractor."""

import re
from typing import List, Dict, Any, Tuple
from bs4 import BeautifulSoup, Tag
from pydantic import BaseModel


STRIP_TAGS = [
    "script",
    "style",
    "noscript",
    "iframe",
    "svg",
    "canvas",
    "form",
    "button",
    "select",
    "textarea",
    "input",
]

BOILERPLATE_PATTERNS = re.compile(
    r"(cookie|gdpr|consent|privacy-bar|popup|modal|newsletter-signup|advertisement|banner-ad)",
    re.IGNORECASE
)


class ExtractedContent(BaseModel):
    title: str
    headings: List[Dict[str, Any]]
    content_text: str
    word_count: int
    raw_char_count: int
    status: str = "success"


class ContentExtractor:
    @staticmethod
    def extract_main_content(html: str, fallback_title: str = "") -> ExtractedContent:
        """
        Extract clean main article content, headings, and word count from HTML.
        Removes scripts, styles, banners, navigation, and boilerplate.
        """
        soup = BeautifulSoup(html, "lxml")

        # 1. Strip non-content and executable tags
        for tag_name in STRIP_TAGS:
            for el in soup.find_all(tag_name):
                el.decompose()

        # 2. Strip obvious cookie / popup boilerplate
        for el in soup.find_all(attrs={"class": BOILERPLATE_PATTERNS}):
            el.decompose()
        for el in soup.find_all(attrs={"id": BOILERPLATE_PATTERNS}):
            el.decompose()

        # 3. Locate Main Content Container
        # Priority order: <article>, <main>, role="main", .entry-content, .post-content
        main_container: Tag | None = None

        main_container = (
            soup.find("article") or
            soup.find("main") or
            soup.find(attrs={"role": "main"}) or
            soup.find(attrs={"class": re.compile(r"(entry-content|post-content|article-body)", re.I)}) or
            soup.find("body") or
            soup
        )

        # 4. Extract Title
        extracted_title = ""
        # Check <h1> inside main container or document
        h1 = main_container.find("h1") or soup.find("h1")
        if h1 and h1.get_text(strip=True):
            extracted_title = h1.get_text(strip=True)
        elif fallback_title:
            extracted_title = fallback_title

        # 5. Extract Headings Hierarchy
        headings: List[Dict[str, Any]] = []
        for h in main_container.find_all(["h1", "h2", "h3", "h4", "h5", "h6"]):
            text = h.get_text(separator=" ", strip=True)
            if text:
                level = int(h.name[1])
                headings.append({"level": level, "text": text})

        # 6. Extract Main Body Paragraphs and Structured Text
        text_blocks: List[str] = []
        # Find all meaningful text elements: p, li, blockquote, table, pre
        for el in main_container.find_all(["p", "li", "blockquote", "pre", "h2", "h3", "h4"]):
            text = el.get_text(separator=" ", strip=True)
            # Filter trivial or empty fragments
            if text and len(text) > 10:
                if el.name == "li":
                    text_blocks.append(f"• {text}")
                elif el.name.startswith("h"):
                    text_blocks.append(f"\n## {text}\n")
                elif el.name == "blockquote":
                    text_blocks.append(f"> {text}")
                else:
                    text_blocks.append(text)

        # If paragraphs yielded very little, fallback to full container text
        if not text_blocks:
            full_text = main_container.get_text(separator="\n", strip=True)
            text_blocks = [line.strip() for line in full_text.splitlines() if len(line.strip()) > 15]

        # Join into cohesive markdown-like document
        normalized_content = "\n\n".join(text_blocks)

        # Word count calculation
        words = re.findall(r"\b\w+\b", normalized_content)
        word_count = len(words)

        return ExtractedContent(
            title=extracted_title,
            headings=headings,
            content_text=normalized_content,
            word_count=word_count,
            raw_char_count=len(normalized_content),
            status="success" if word_count > 0 else "empty"
        )


content_extractor = ContentExtractor()

