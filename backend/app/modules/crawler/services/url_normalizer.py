"""BlogNexa AI - Canonical URL Normalizer and Hashing Service."""

import hashlib
import posixpath
import urllib.parse
from typing import Set


TRACKING_QUERY_PARAMS: Set[str] = {
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fbclid",
    "gclid",
    "gclsrc",
    "dclid",
    "msclkid",
    "mc_eid",
    "_ga",
    "_gl",
    "ref",
}


class UrlNormalizer:
    @staticmethod
    def normalize(url: str, base_url: str = "") -> str:
        """
        Normalize URL:
        - Resolves relative URLs against base_url
        - Lowercases scheme and host
        - Removes default ports
        - Strips fragments
        - Strips tracking query parameters
        - Alphabetically sorts remaining query parameters
        - Resolves dot segments
        """
        if not url:
            return ""

        url = url.strip()

        # 1. Resolve relative URLs if base provided
        if base_url:
            url = urllib.parse.urljoin(base_url, url)

        parsed = urllib.parse.urlparse(url)

        scheme = parsed.scheme.lower()
        if scheme not in ("http", "https"):
            return ""

        hostname = (parsed.hostname or "").lower()
        if not hostname:
            return ""

        # Remove default ports
        port = parsed.port
        if (scheme == "http" and port == 80) or (scheme == "https" and port == 443):
            port = None

        netloc = hostname if port is None else f"{hostname}:{port}"

        # Normalize path
        path = parsed.path or "/"
        # Resolve dot segments
        path = posixpath.normpath(path)
        # Ensure trailing slash if original had trailing slash or was root
        if (parsed.path.endswith("/") and not path.endswith("/")) or path == ".":
            path = path.rstrip(".") + "/"
        if not path.startswith("/"):
            path = "/" + path

        # Filter and sort query parameters
        query = parsed.query
        normalized_query = ""
        if query:
            pairs = urllib.parse.parse_qsl(query, keep_blank_values=True)
            filtered_pairs = [
                (k, v) for k, v in pairs
                if k.lower() not in TRACKING_QUERY_PARAMS
            ]
            if filtered_pairs:
                sorted_pairs = sorted(filtered_pairs, key=lambda x: x[0])
                normalized_query = urllib.parse.urlencode(sorted_pairs)

        # Build final normalized URL (fragments explicitly omitted)
        return urllib.parse.urlunparse((scheme, netloc, path, "", normalized_query, ""))

    @staticmethod
    def hash_url(normalized_url: str) -> str:
        """Deterministic SHA-256 digest of normalized URL."""
        return hashlib.sha256(normalized_url.encode("utf-8")).hexdigest()


url_normalizer = UrlNormalizer()

