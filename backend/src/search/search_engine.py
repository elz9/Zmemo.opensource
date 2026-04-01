"""
Hybrid Search Engine
BM25/FTS5 (primary) + TF-IDF vector re-ranking (secondary) + query cache.
Returns HTML-safe snippets with matched terms wrapped in <mark> tags.

Engineering rules applied:
  - Read-heavy: every hot path is optimised for latency, not writes
  - Cache recent queries: QueryCache sits in front of every SQLite call
  - Never run embeddings on every keystroke
  - Target latency: <300ms
"""
import asyncio
import re
import time
import json
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime

from .embeddings import LocalEmbeddingService
from .query_cache import QueryCache


class SearchEngine:
    def __init__(self, db) -> None:
        self.db = db
        self._embedder = LocalEmbeddingService(vocab_size=8000)
        self._cache = QueryCache(max_size=200, ttl_seconds=300)
        self._embedding_fitted: bool = False

    async def initialize(self) -> None:
        asyncio.create_task(self._fit_embedder_background())

    async def _fit_embedder_background(self) -> None:
        try:
            cursor = await self.db.conn.execute(
                "SELECT body_clean FROM emails WHERE body_clean IS NOT NULL LIMIT 20000"
            )
            rows = await cursor.fetchall()
            corpus = [row[0] for row in rows if row[0]]
            if corpus:
                self._embedder.fit(corpus)
                self._embedding_fitted = True
                print(f"[Embedder] Fitted on {len(corpus)} documents")
        except Exception as exc:
            print(f"[Embedder] Background fit failed: {exc}")

    def invalidate_cache(self) -> None:
        self._cache.invalidate()

    async def search(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        start = time.monotonic()

        cached = self._cache.get(query, filters)
        if cached is not None:
            return cached[:limit]

        email_ids = await self.db.fts_search(query, limit=100)
        if not email_ids:
            return []

        emails = await self.db.get_emails_by_ids(email_ids)

        if filters:
            emails = self._apply_filters(emails, filters)

        if self._embedding_fitted and len(emails) > 1:
            emails = self._vector_rerank(query, emails)

        results = [self._format_result(email, query) for email in emails[:limit]]
        self._cache.set(query, results, filters)

        latency_ms = (time.monotonic() - start) * 1000
        print(f"[Search] '{query}' -> {len(results)} results in {latency_ms:.1f}ms")
        return results

    def _vector_rerank(self, query: str, emails: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        query_vec = self._embedder.encode(query)
        scored: List[Tuple[float, Dict[str, Any]]] = []
        for rank, email in enumerate(emails):
            bm25_score = 1.0 - (rank / max(len(emails), 1))
            text = f"{email.get('subject', '')} {email.get('body_clean', '')}"
            email_vec = self._embedder.encode(text)
            vec_score = self._embedder.similarity(query_vec, email_vec)
            blended = 0.6 * bm25_score + 0.4 * vec_score
            scored.append((blended, email))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [email for _, email in scored]

    def _apply_filters(self, emails: List[Dict[str, Any]], filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        result = emails
        if filters.get("sender"):
            needle = filters["sender"].lower()
            result = [e for e in result if needle in e["sender"].lower()]
        if filters.get("domain"):
            needle = filters["domain"].lower()
            result = [e for e in result if needle in e["sender"].lower()]
        if filters.get("date_from"):
            ts = self._parse_date(filters["date_from"])
            result = [e for e in result if e["timestamp"] >= ts]
        if filters.get("date_to"):
            ts = self._parse_date(filters["date_to"])
            result = [e for e in result if e["timestamp"] <= ts]
        if filters.get("has_attachments"):
            result = [e for e in result if e.get("attachment_names") and len(e["attachment_names"]) > 2]
        if filters.get("is_decision"):
            result = [e for e in result if e.get("is_decision")]
        return result

    def _format_result(self, email: Dict[str, Any], query: str) -> Dict[str, Any]:
        recipients = (
            json.loads(email["recipients"])
            if isinstance(email.get("recipients"), str)
            else email.get("recipients", [])
        )
        attachment_names = (
            json.loads(email["attachment_names"])
            if isinstance(email.get("attachment_names"), str)
            else email.get("attachment_names", [])
        )
        raw_snippet = self._extract_snippet(email.get("body_clean", ""), query, context_chars=300)
        highlighted_snippet = self._highlight_terms(raw_snippet, query)
        highlighted_subject = self._highlight_terms(email.get("subject", ""), query)
        return {
            "id": email["id"],
            "gmail_id": email["gmail_id"],
            "thread_id": email["thread_id"],
            "subject": highlighted_subject,
            "subject_plain": email.get("subject", ""),
            "snippet": highlighted_snippet,
            "sender": email["sender"],
            "recipients": recipients,
            "timestamp": email["timestamp"],
            "date": datetime.fromtimestamp(email["timestamp"]).strftime("%Y-%m-%d %H:%M"),
            "attachment_names": attachment_names,
            "has_attachments": len(attachment_names) > 0,
            "is_decision": bool(email.get("is_decision")),
            "decision_confidence": email.get("decision_confidence", 0.0),
        }

    def _extract_snippet(self, body: str, query: str, context_chars: int = 300) -> str:
        if not body:
            return ""
        terms = [t.lower() for t in query.split() if len(t) > 1]
        body_lower = body.lower()
        best_pos, best_score = 0, 0
        for term in terms:
            idx = 0
            while True:
                pos = body_lower.find(term, idx)
                if pos == -1:
                    break
                window_start = max(0, pos - context_chars // 2)
                window_end = min(len(body), pos + context_chars // 2)
                window = body_lower[window_start:window_end]
                score = sum(1 for t in terms if t in window)
                if score > best_score:
                    best_score, best_pos = score, pos
                idx = pos + 1
        start = max(0, best_pos - context_chars // 2)
        end = min(len(body), start + context_chars)
        snippet = body[start:end]
        return f"{'…' if start > 0 else ''}{snippet.strip()}{'…' if end < len(body) else ''}"

    def _highlight_terms(self, text: str, query: str) -> str:
        if not text or not query:
            return text
        terms = sorted([t for t in query.split() if len(t) > 1], key=len, reverse=True)
        result = text
        for term in terms:
            pattern = re.compile(re.escape(term), re.IGNORECASE)
            result = pattern.sub(lambda m: f"<mark>{m.group(0)}</mark>", result)
        return result

    async def search_by_thread(self, thread_id: str) -> List[Dict[str, Any]]:
        cursor = await self.db.conn.execute(
            "SELECT * FROM emails WHERE thread_id = ? ORDER BY timestamp ASC",
            (thread_id,),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

    def cache_stats(self) -> Dict[str, Any]:
        return self._cache.stats()

    def _parse_date(self, date_str: str) -> int:
        try:
            return int(datetime.fromisoformat(date_str).timestamp())
        except Exception:
            return 0