"""
Gmail Memory Backend — v2
New endpoints:
  GET  /thread/:thread_id  — fetch all emails in a thread
  POST /sync/schedule      — set auto-sync interval
  GET  /stats              — full observability stats (index size, latency, cache)
"""
import asyncio
import time
from dataclasses import dataclass, field
from fastapi import FastAPI, HTTPException, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any

from src.sync.gmail_sync import GmailSync
from src.indexing.indexer import EmailIndexer
from src.search.search_engine import SearchEngine
from src.models.database import Database

app = FastAPI(title="Gmail Memory Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "tauri://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Globals
db = Database()
gmail_sync = GmailSync(db)
indexer = EmailIndexer(db)
search_engine = SearchEngine(db)

# ── Request models (using dataclasses) ───────────────────────────────────────

@dataclass
class SearchQuery:
    query: str
    filters: Optional[Dict[str, Any]] = None
    limit: Optional[int] = 50
    
    def __post_init__(self):
        # Validate limit range
        if self.limit is not None:
            if self.limit < 1:
                self.limit = 1
            elif self.limit > 200:
                self.limit = 200

@dataclass
class ScheduleRequest:
    interval_minutes: int = 30
    
    def __post_init__(self):
        # Coerce payload to int and validate interval range.
        # 0 is a valid value and means "disable auto-sync".
        try:
            self.interval_minutes = int(self.interval_minutes)
        except (TypeError, ValueError):
            self.interval_minutes = 30

        if self.interval_minutes == 0:
            return
        if self.interval_minutes < 5:
            self.interval_minutes = 5
        elif self.interval_minutes > 1440:
            self.interval_minutes = 1440

# ── Lifecycle ─────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    await db.initialize()
    await indexer.initialize()
    await search_engine.initialize()  # also kicks off background embedder fit

    # Auto-load Gmail credentials if they exist
    if gmail_sync.token_path.exists():
        try:
            await gmail_sync.load_credentials()
            print("[Startup] Gmail credentials loaded automatically")
        except Exception as e:
            print(f"[Startup] Failed to load Gmail credentials: {e}")

    # Restart auto-sync if an interval was previously saved
    interval = await db.get_auto_sync_interval()
    if interval and interval > 0:
        gmail_sync.start_auto_sync(interval)
        print(f"[AutoSync] Started: every {interval} minutes")

@app.on_event("shutdown")
async def shutdown_event():
    gmail_sync.stop_auto_sync()
    await db.close()

# ── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/auth/connect")
async def connect_gmail():
    try:
        msg = await gmail_sync.start_oauth()
        return {"status": "success", "message": msg}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/disconnect")
async def disconnect_gmail():
    try:
        await gmail_sync.disconnect()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Sync ──────────────────────────────────────────────────────────────────────

@app.post("/sync/start")
async def start_sync(background_tasks: BackgroundTasks):
    try:
        background_tasks.add_task(_sync_and_invalidate_cache)
        return {"status": "started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def _sync_and_invalidate_cache():
    """Run sync then drop stale cache entries and run decision detection."""
    await gmail_sync.sync_emails()
    search_engine.invalidate_cache()
    await indexer.detect_decisions()

@app.get("/sync/status")
async def get_sync_status():
    try:
        return await gmail_sync.get_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sync/schedule")
async def set_sync_schedule(schedule_data: Dict[str, Any] = Body(...)):
    """
    Set how often the app auto-syncs (in minutes).
    Pass 0 to disable auto-sync.
    """
    try:
        # Parse and validate manually
        req = ScheduleRequest(
            interval_minutes=schedule_data.get("interval_minutes", 30)
        )
        
        await db.set_auto_sync_interval(req.interval_minutes)
        persisted_interval = await db.get_auto_sync_interval()
        if persisted_interval > 0:
            gmail_sync.start_auto_sync(persisted_interval)
        else:
            gmail_sync.stop_auto_sync()
        return {
            "status": "ok",
            "interval_minutes": persisted_interval,
            "auto_sync": persisted_interval > 0,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Search ────────────────────────────────────────────────────────────────────

@app.post("/search")
async def search_emails(query_data: Dict[str, Any] = Body(...)):
    try:
        # Parse and validate manually
        query = SearchQuery(
            query=query_data.get("query", ""),
            filters=query_data.get("filters"),
            limit=query_data.get("limit", 50)
        )
        
        t0 = time.monotonic()
        results = await search_engine.search(
            query=query.query,
            filters=query.filters,
            limit=query.limit,
        )
        latency_ms = round((time.monotonic() - t0) * 1000, 1)
        return {
            "results": results,
            "count": len(results),
            "query": query.query,
            "latency_ms": latency_ms,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Thread view ───────────────────────────────────────────────────────────────

@app.get("/thread/{thread_id}")
async def get_thread(thread_id: str):
    """Return all emails in a thread, oldest first."""
    try:
        emails = await search_engine.search_by_thread(thread_id)
        return {"emails": emails, "count": len(emails)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Stats / observability ─────────────────────────────────────────────────────

@app.get("/stats")
async def get_stats():
    """
    Full observability snapshot for the health dashboard.
    Covers every metric from the engineering rules doc:
      - Index size (DB file in MB)
      - Emails indexed count
      - Last sync time
      - Search cache hit rate (proxy for search latency health)
    """
    try:
        db_stats = await db.get_stats()
        cache_stats = search_engine.cache_stats()
        return {
            **db_stats,
            "cache": cache_stats,
            "embedder_fitted": search_engine._embedding_fitted,
            "auto_sync_active": (
                gmail_sync._auto_sync_task is not None
                and not gmail_sync._auto_sync_task.done()
            ),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── Data management ───────────────────────────────────────────────────────────

@app.delete("/data/delete")
async def delete_local_data():
    try:
        await db.delete_all_data()
        search_engine.invalidate_cache()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
