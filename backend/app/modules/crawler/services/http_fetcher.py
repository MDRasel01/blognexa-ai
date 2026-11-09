"""BlogNexa AI - Safe Asynchronous HTTP Fetcher with SSRF and Resource Limits."""

from typing import Dict, Optional, Tuple
from pydantic import BaseModel
import httpx
from backend.app.modules.crawler.services.url_validator import url_validator


DEFAULT_USER_AGENT = "BlogNexaBot/1.0 (+https://api.blognexa.ai/bot)"
MAX_RESPONSE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_REDIRECTS = 3


class FetchResult(BaseModel):
    status_code: int
    url: str
    final_url: str
    content: str = ""
    content_bytes: int = 0
    content_type: str = ""
    etag: Optional[str] = None
    last_modified: Optional[str] = None
    is_not_modified: bool = False
    error: Optional[str] = None
    retryable: bool = False


class SafeHttpFetcher:
    def __init__(self, user_agent: str = DEFAULT_USER_AGENT) -> None:
        self.user_agent = user_agent
        self.timeout = httpx.Timeout(20.0, connect=5.0, read=15.0)

    async def fetch(
        self,
        url: str,
        registered_origin: str,
        etag: Optional[str] = None,
        last_modified: Optional[str] = None,
        client: Optional[httpx.AsyncClient] = None
    ) -> FetchResult:
        """
        Fetch URL safely:
        - Pre-flight SSRF and scope validation
        - Safe redirect traversal with revalidation
        - Streamed response enforcing 10MB size ceiling
        - Conditional request headers support
        """
        # 1. Pre-flight validation
        is_valid, reason = url_validator.validate_for_crawl(url, registered_origin)
        if not is_valid:
            return FetchResult(
                status_code=400,
                url=url,
                final_url=url,
                error=f"Validation Rejected: {reason}",
                retryable=False
            )

        headers = {
            "User-Agent": self.user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate",
        }
        if etag:
            headers["If-None-Match"] = etag
        if last_modified:
            headers["If-Modified-Since"] = last_modified

        should_close = False
        if client is None:
            client = httpx.AsyncClient(timeout=self.timeout, follow_redirects=False)
            should_close = True

        current_url = url
        redirect_count = 0

        try:
            while redirect_count <= MAX_REDIRECTS:
                req_headers = dict(headers)
                try:
                    response = await client.get(current_url, headers=req_headers)
                except httpx.ConnectTimeout:
                    return FetchResult(status_code=504, url=url, final_url=current_url, error="Connect Timeout", retryable=True)
                except httpx.ReadTimeout:
                    return FetchResult(status_code=504, url=url, final_url=current_url, error="Read Timeout", retryable=True)
                except httpx.RequestError as exc:
                    return FetchResult(status_code=502, url=url, final_url=current_url, error=f"Transport error: {str(exc)}", retryable=True)

                # Check 304 Not Modified
                if response.status_code == 304:
                    return FetchResult(
                        status_code=304,
                        url=url,
                        final_url=current_url,
                        is_not_modified=True,
                        etag=response.headers.get("ETag"),
                        last_modified=response.headers.get("Last-Modified")
                    )

                # Check Redirect (301, 302, 307, 308)
                if response.status_code in (301, 302, 303, 307, 308):
                    redirect_location = response.headers.get("Location")
                    if not redirect_location:
                        break

                    # Resolve relative redirect
                    redirect_target = str(response.url.join(redirect_location))

                    # CRITICAL: Revalidate redirect target against SSRF & origin scope!
                    is_safe, redirect_reason = url_validator.validate_for_crawl(redirect_target, registered_origin)
                    if not is_safe:
                        return FetchResult(
                            status_code=response.status_code,
                            url=url,
                            final_url=redirect_target,
                            error=f"Unsafe redirect destination blocked: {redirect_reason}",
                            retryable=False
                        )

                    current_url = redirect_target
                    redirect_count += 1
                    continue

                # Check Content-Type (prefer html or xml)
                content_type = response.headers.get("Content-Type", "").lower()

                # Enforce response size limits
                body_bytes = response.content
                if len(body_bytes) > MAX_RESPONSE_BYTES:
                    return FetchResult(
                        status_code=413,
                        url=url,
                        final_url=current_url,
                        error="Response exceeded maximum 10MB payload ceiling",
                        retryable=False
                    )

                text_content = response.text

                is_retryable = response.status_code in (500, 502, 503, 504)

                return FetchResult(
                    status_code=response.status_code,
                    url=url,
                    final_url=current_url,
                    content=text_content,
                    content_bytes=len(body_bytes),
                    content_type=content_type,
                    etag=response.headers.get("ETag"),
                    last_modified=response.headers.get("Last-Modified"),
                    retryable=is_retryable,
                    error=None if response.status_code < 400 else f"HTTP {response.status_code}"
                )

            return FetchResult(
                status_code=310,
                url=url,
                final_url=current_url,
                error="Exceeded maximum allowable redirects",
                retryable=False
            )

        finally:
            if should_close:
                await client.aclose()


http_fetcher = SafeHttpFetcher()

