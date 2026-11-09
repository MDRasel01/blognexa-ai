"""BlogNexa AI - Atomic Replay Protection Guard."""

import time
import threading
from typing import Dict, Tuple
from backend.app.core.config import settings

try:
    import redis
    _redis_client = redis.Redis.from_url(
        settings.REDIS_URL,
        decode_responses=True,
        socket_connect_timeout=0.1,
        socket_timeout=0.1
    )
    # Ping once to check connectivity; if unavailable, deactivate client
    _redis_client.ping()
except Exception:
    _redis_client = None


class InMemoryReplayCache:
    """Thread-safe in-memory cache with TTL cleanup for testing and local runtimes."""

    def __init__(self) -> None:
        self._cache: Dict[str, float] = {}
        self._lock = threading.Lock()

    def set_if_not_exists(self, key: str, ttl: int) -> bool:
        now = time.time()
        with self._lock:
            # Purge expired
            expired = [k for k, exp in self._cache.items() if exp <= now]
            for k in expired:
                del self._cache[k]

            if key in self._cache:
                return False  # Already exists! Replay detected.

            self._cache[key] = now + ttl
            return True

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()


_memory_cache = InMemoryReplayCache()


def check_and_record_nonce(credential_id: str, nonce: str, ttl_seconds: int = 300) -> bool:
    """
    Atomically verify that (credential_id, nonce) has not been seen before.
    Returns True if valid (fresh), False if replay detected.
    """
    key = f"bnx:replay:{credential_id}:{nonce}"

    # 1. Attempt Redis atomic SET NX EX if client available and connected
    if _redis_client is not None:
        try:
            # set(key, value, nx=True, ex=ttl_seconds) returns True if set, None/False if existed
            result = _redis_client.set(key, "1", nx=True, ex=ttl_seconds)
            return bool(result)
        except Exception:
            if settings.FAIL_CLOSED_REPLAY:
                # If Redis fails in strict fail-closed mode, reject writes
                return False

    # 2. Use thread-safe in-memory cache
    return _memory_cache.set_if_not_exists(key, ttl_seconds)


def reset_replay_cache() -> None:
    """Reset cache (primarily for test fixtures)."""
    _memory_cache.clear()
    if _redis_client is not None:
        try:
            for key in _redis_client.scan_iter("bnx:replay:*"):
                _redis_client.delete(key)
        except Exception:
            pass
