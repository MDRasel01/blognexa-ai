"""BlogNexa AI - URL Scope, Exclusion and SSRF Validation Service."""

import urllib.parse
import fnmatch
from typing import List, Tuple, Optional
from backend.app.core.ssrf_guard import validate_target_url


DEFAULT_EXCLUSION_PATTERNS: List[str] = [
    "*/wp-admin/*",
    "*/wp-login.php*",
    "*/cart/*",
    "*/checkout/*",
    "*/my-account/*",
    "*/feed/*",
    "*/xmlrpc.php*",
    "*/wp-json/*",
    "*?add-to-cart=*",
    "*/search/*",
]


class UrlValidator:
    @staticmethod
    def is_same_origin(url: str, registered_origin: str) -> bool:
        """Verify URL matches the authorized site origin (hostname and scheme)."""
        u_parsed = urllib.parse.urlparse(url)
        o_parsed = urllib.parse.urlparse(registered_origin)

        u_host = (u_parsed.hostname or "").lower()
        o_host = (o_parsed.hostname or "").lower()

        return u_host == o_host and u_host != ""

    @staticmethod
    def is_excluded(url: str, custom_patterns: Optional[List[str]] = None) -> bool:
        """Check if URL matches any default or custom exclusion patterns."""
        parsed = urllib.parse.urlparse(url)
        path = parsed.path

        patterns = list(DEFAULT_EXCLUSION_PATTERNS)
        if custom_patterns:
            patterns.extend(custom_patterns)

        for pat in patterns:
            pat = pat.strip()
            if not pat:
                continue
            # Match against full URL or path
            if fnmatch.fnmatch(url, pat) or fnmatch.fnmatch(path, pat):
                return True

        return False

    @classmethod
    def validate_for_crawl(
        cls,
        url: str,
        registered_origin: str,
        custom_patterns: Optional[List[str]] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate URL for crawling:
        1. Valid HTTP/HTTPS scheme and hostname
        2. Scope check: same origin as registered site
        3. Exclusion patterns check
        4. SSRF defense check (reuse Step 04)
        """
        if not url:
            return False, "Empty URL"

        # 1. Scope check
        if not cls.is_same_origin(url, registered_origin):
            return False, "URL is outside authorized registered origin scope"

        # 2. Exclusion pattern check
        if cls.is_excluded(url, custom_patterns):
            return False, "URL matches an exclusion pattern"

        # 3. SSRF Shield (Step 04 reuse)
        is_safe, error_msg = validate_target_url(url)
        if not is_safe:
            return False, f"SSRF Check Failed: {error_msg}"

        return True, None


url_validator = UrlValidator()

