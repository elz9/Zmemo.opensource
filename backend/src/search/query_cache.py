"""
Query Result Cache
LRU cache for search results — repeated queries never touch SQLite.
Follows engineering rules: pre-compute, cache recent queries, memory control.
"""
import time
from collections import OrderedDict
from typing import Any, Dict, List, Optional, Tuple


class QueryCache:
    """
    In-memory LRU cache for search results.

    Design decisions:
      - Fixed max size (default 200 entries) — never grows unbounded
      - TTL of 5 minutes — stale results auto-expire after a sync
      - Cache key = (query, frozen filters) — different filters = different entry
      - Thread-safe enough for single-process FastAPI with asyncio
    """

    def __init__(self, max_size: int = 200, ttl_seconds: int = 300):
        self._max_size = max_size
        self._ttl = ttl_seconds
        self._store: OrderedDict[str, Tuple[List[Any], float]] = OrderedDict()
        self._hits: int = 0
        self._misses: int = 0

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get(self, query: str, filters: Optional[Dict] = None) -> Optional[List[Any]]:
        """
        Return cached results or None if not found / expired.
        Moves hit entry to end (most recently used).
        """
        key = self._make_key(query, filters)
        if key not in self._store:
            self._misses += 1
            return None

        results, stored_at = self._store[key]
        if self._is_expired(stored_at):
            del self._store[key]
            self._misses += 1
            return None

        # Move to end (most recently used)
        self._store.move_to_end(key)
        self._hits += 1
        return results

    def set(self, query: str, results: List[Any], filters: Optional[Dict] = None) -> None:
        """
        Store results in cache, evicting LRU entry if at capacity.
        """
        key = self._make_key(query, filters)

        # Evict oldest entry if full
        if len(self._store) >= self._max_size and key not in self._store:
            self._store.popitem(last=False)

        self._store[key] = (results, time.monotonic())
        self._store.move_to_end(key)

    def invalidate(self) -> None:
        """Clear entire cache — call after a sync completes."""
        self._store.clear()

    def stats(self) -> Dict[str, Any]:
        """Return cache statistics for the observability dashboard."""
        total = self._hits + self._misses
        return {
            "entries": len(self._store),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": round(self._hits / total, 3) if total > 0 else 0.0,
            "ttl_seconds": self._ttl,
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _make_key(self, query: str, filters: Optional[Dict]) -> str:
        """Deterministic cache key from query + filters."""
        q = query.strip().lower()
        if not filters:
            return q
        # Sort filter keys so {a:1, b:2} and {b:2, a:1} produce the same key
        filter_str = "&".join(f"{k}={v}" for k, v in sorted(filters.items()) if v)
        return f"{q}|{filter_str}"

    def _is_expired(self, stored_at: float) -> bool:
        return (time.monotonic() - stored_at) > self._ttl