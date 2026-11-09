"""BlogNexa AI - Content Normalization, Hashing and Quality Scoring Service."""

import hashlib
import re
from typing import Tuple


class ContentNormalizer:
    @staticmethod
    def normalize_text(raw_text: str) -> str:
        """Collapse redundant whitespace and ensure consistent line breaks."""
        if not raw_text:
            return ""

        # Normalize line endings
        text = raw_text.replace("\r\n", "\n").replace("\r", "\n")

        # Collapse 3+ consecutive newlines to 2
        text = re.sub(r"\n{3,}", "\n\n", text)

        # Collapse horizontal whitespace
        text = re.sub(r"[ \t]+", " ", text)

        # Strip line ends
        lines = [line.strip() for line in text.splitlines()]
        return "\n".join(lines).strip()

    @staticmethod
    def compute_content_hash(normalized_text: str) -> str:
        """Deterministic SHA-256 fingerprint of normalized content."""
        return hashlib.sha256(normalized_text.encode("utf-8")).hexdigest()

    @classmethod
    def evaluate_quality(cls, title: str, word_count: int, headings_count: int) -> str:
        """
        Classify document extraction quality:
        - HIGH: Title present, word count >= 200, headings present
        - ACCEPTABLE: Word count >= 50 and <= 200 with title
        - LOW: Word count < 50
        - FAILED: Word count == 0
        """
        if word_count == 0:
            return "FAILED"
        if word_count < 50:
            return "LOW"
        if word_count >= 200 and title and headings_count > 0:
            return "HIGH"
        return "ACCEPTABLE"


content_normalizer = ContentNormalizer()

