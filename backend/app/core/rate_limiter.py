"""BlogNexa AI - Rate Limiter with Operation-Class Sliding Windows."""

import time
import threading
from typing import Dict, List, Tuple


OPERATION_LIMITS = {
    "status": (60, 60),    # 60 requests per 60 seconds
    "job": (10, 60),       # 10 requests per 60 seconds
    "ai": (5, 60),         # 5 requests per 60 seconds
    "default": (30, 60),   # 30 requests per 60 seconds
}


class SlidingWindowRateLimiter:
    def __init__(self) -> None:
        self._history: Dict[str, List[float]] = {}
        self._lock = threading.Lock()

    def check_rate_limit(self, client_key: str, op_class: str = "default") -> Tuple[bool, int]:
        """
        Check rate limit for client_key and operation class.
        Returns: (allowed: bool, retry_after: int)
        """
        limit, window = OPERATION_LIMITS.get(op_class, OPERATION_LIMITS["default"])
        now = time.time()
        bucket_key = f"{client_key}:{op_class}"

        with self._lock:
            timestamps = self._history.get(bucket_key, [])
            # Filter timestamps within current window
            valid_timestamps = [t for t in timestamps if now - t < window]

            if len(valid_timestamps) >= limit:
                oldest = valid_timestamps[0]
                retry_after = max(1, int(window - (now - oldest)))
                self._history[bucket_key] = valid_timestamps
                return False, retry_after

            valid_timestamps.append(now)
            self._history[bucket_key] = valid_timestamps
            return True, 0

    def reset(self) -> None:
        with self._lock:
            self._history.clear()


rate_limiter = SlidingWindowRateLimiter()
