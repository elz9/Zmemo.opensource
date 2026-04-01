"""
Database layer using SQLite with FTS5 for fast text search.
Schema v2: adds labels, is_read, attachment_metadata, schema_version table.
"""
import aiosqlite
import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

SCHEMA_VERSION = 2


class Database:
    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            app_data_env = os.getenv("GM_APP_DATA")
            app_data = Path(app_data_env) if app_data_env else (Path.home() / ".gmail-memory")
            app_data.mkdir(parents=True, exist_ok=True)
            db_path = str(app_data / "emails.db")

        self.db_path = db_path
        self.conn: Optional[aiosqlite.Connection] = None

    async def initialize(self):
        """Initialize database and run any pending migrations."""
        self.conn = await aiosqlite.connect(self.db_path)
        await self.conn.execute("PRAGMA journal_mode=WAL")
        await self.conn.execute("PRAGMA synchronous=NORMAL")
        await self.conn.execute("PRAGMA cache_size=-64000")  # 64 MB
        await self.conn.execute("PRAGMA foreign_keys=ON")
        self.conn.row_factory = aiosqlite.Row  # Enable dict-like access to rows

        await self._create_schema_version_table()
        current = await self._get_schema_version()
        await self._run_migrations(current)
        await self._ensure_sync_state_schema()
        await self._ensure_sync_state_row()
        await self.conn.commit()

    # ------------------------------------------------------------------
    # Schema migrations
    # ------------------------------------------------------------------

    async def _create_schema_version_table(self):
        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER NOT NULL
            )
        """)
        row = await (await self.conn.execute("SELECT COUNT(*) FROM schema_version")).fetchone()
        if row[0] == 0:
            await self.conn.execute("INSERT INTO schema_version VALUES (0)")

    async def _get_schema_version(self) -> int:
        row = await (await self.conn.execute("SELECT version FROM schema_version")).fetchone()
        return row[0] if row else 0

    async def _set_schema_version(self, version: int):
        await self.conn.execute("UPDATE schema_version SET version = ?", (version,))

    async def _run_migrations(self, current_version: int):
        if current_version < 1:
            await self._migrate_v1()
        if current_version < 2:
            await self._migrate_v2()

    async def _migrate_v1(self):
        """Initial schema."""
        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS emails (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                message_id          TEXT UNIQUE NOT NULL,
                thread_id           TEXT NOT NULL,
                gmail_id            TEXT UNIQUE NOT NULL,
                subject             TEXT,
                body_clean          TEXT,
                sender              TEXT NOT NULL,
                recipients          TEXT,
                timestamp           INTEGER NOT NULL,
                attachment_names    TEXT,
                is_decision         BOOLEAN DEFAULT 0,
                decision_confidence REAL DEFAULT 0.0,
                created_at          INTEGER DEFAULT (strftime('%s','now'))
            )
        """)
        for idx_sql in [
            "CREATE INDEX IF NOT EXISTS idx_thread_id ON emails(thread_id)",
            "CREATE INDEX IF NOT EXISTS idx_timestamp  ON emails(timestamp DESC)",
            "CREATE INDEX IF NOT EXISTS idx_sender     ON emails(sender)",
            "CREATE INDEX IF NOT EXISTS idx_is_decision ON emails(is_decision)",
        ]:
            await self.conn.execute(idx_sql)

        await self.conn.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS emails_fts USING fts5(
                subject, body_clean, sender, recipients, attachment_names,
                content='emails', content_rowid='id',
                tokenize='porter unicode61'
            )
        """)
        for trigger in [
            """CREATE TRIGGER IF NOT EXISTS emails_ai AFTER INSERT ON emails BEGIN
                   INSERT INTO emails_fts(rowid,subject,body_clean,sender,recipients,attachment_names)
                   VALUES (new.id,new.subject,new.body_clean,new.sender,new.recipients,new.attachment_names);
               END""",
            """CREATE TRIGGER IF NOT EXISTS emails_ad AFTER DELETE ON emails BEGIN
                   DELETE FROM emails_fts WHERE rowid=old.id;
               END""",
            """CREATE TRIGGER IF NOT EXISTS emails_au AFTER UPDATE ON emails BEGIN
                   UPDATE emails_fts SET
                       subject=new.subject, body_clean=new.body_clean,
                       sender=new.sender, recipients=new.recipients,
                       attachment_names=new.attachment_names
                   WHERE rowid=new.id;
               END""",
        ]:
            await self.conn.execute(trigger)

        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS embeddings (
                email_id INTEGER PRIMARY KEY,
                embedding BLOB NOT NULL,
                FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
            )
        """)
        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS sync_state (
                id                    INTEGER PRIMARY KEY CHECK (id=1),
                last_history_id       TEXT,
                last_sync_time        INTEGER DEFAULT 0,
                total_emails_synced   INTEGER DEFAULT 0,
                initial_sync_complete BOOLEAN DEFAULT 0,
                auto_sync_interval    INTEGER DEFAULT 30
            )
        """)
        await self.conn.execute(
            "INSERT OR IGNORE INTO sync_state (id) VALUES (1)"
        )
        await self._set_schema_version(1)

    async def _migrate_v2(self):
        """
        v2 additions:
          - emails.labels          TEXT  (JSON array of Gmail label IDs)
          - emails.is_read         BOOLEAN
          - emails.attachment_meta TEXT  (JSON array of {name, size, mime_type, drive_id})
        """
        for col_sql in [
            "ALTER TABLE emails ADD COLUMN labels          TEXT    DEFAULT '[]'",
            "ALTER TABLE emails ADD COLUMN is_read         BOOLEAN DEFAULT 1",
            "ALTER TABLE emails ADD COLUMN attachment_meta TEXT    DEFAULT '[]'",
            "ALTER TABLE sync_state ADD COLUMN auto_sync_interval INTEGER DEFAULT 30",
        ]:
            try:
                await self.conn.execute(col_sql)
            except Exception:
                pass  # column already exists — safe to ignore

        await self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_is_read ON emails(is_read)"
        )
        await self._set_schema_version(2)

    async def _ensure_sync_state_row(self):
        """Guarantee singleton sync_state row exists for updates/reads."""
        await self.conn.execute(
            "INSERT OR IGNORE INTO sync_state (id) VALUES (1)"
        )

    async def _ensure_sync_state_schema(self):
        """
        Ensure sync_state table and required columns exist even for older/mutated DBs
        that already report latest schema_version.
        """
        await self.conn.execute("""
            CREATE TABLE IF NOT EXISTS sync_state (
                id                    INTEGER PRIMARY KEY CHECK (id=1),
                last_history_id       TEXT,
                last_sync_time        INTEGER DEFAULT 0,
                total_emails_synced   INTEGER DEFAULT 0,
                initial_sync_complete BOOLEAN DEFAULT 0,
                auto_sync_interval    INTEGER DEFAULT 30
            )
        """)

        cursor = await self.conn.execute("PRAGMA table_info(sync_state)")
        columns = [row[1] for row in await cursor.fetchall()]
        if "auto_sync_interval" not in columns:
            await self.conn.execute(
                "ALTER TABLE sync_state ADD COLUMN auto_sync_interval INTEGER DEFAULT 30"
            )

        await self.conn.execute(
            "UPDATE sync_state SET auto_sync_interval=30 WHERE auto_sync_interval IS NULL"
        )

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------

    async def insert_email(self, email_data: Dict[str, Any]) -> Optional[int]:
        """Insert email (idempotent). Returns row id or None if duplicate."""
        try:
            cursor = await self.conn.execute("""
                INSERT INTO emails (
                    message_id, thread_id, gmail_id, subject, body_clean,
                    sender, recipients, timestamp, attachment_names,
                    is_decision, decision_confidence,
                    labels, is_read, attachment_meta
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                email_data["message_id"],
                email_data["thread_id"],
                email_data["gmail_id"],
                email_data.get("subject", ""),
                email_data.get("body_clean", ""),
                email_data["sender"],
                json.dumps(email_data.get("recipients", [])),
                email_data["timestamp"],
                json.dumps(email_data.get("attachment_names", [])),
                email_data.get("is_decision", False),
                email_data.get("decision_confidence", 0.0),
                json.dumps(email_data.get("labels", [])),
                email_data.get("is_read", True),
                json.dumps(email_data.get("attachment_meta", [])),
            ))
            await self.conn.commit()
            return cursor.lastrowid
        except aiosqlite.IntegrityError:
            return None

    async def batch_insert_emails(self, emails: List[Dict[str, Any]]) -> int:
        return sum(1 for e in emails if await self.insert_email(e))

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    async def get_email_by_gmail_id(self, gmail_id: str) -> Optional[Dict[str, Any]]:
        cursor = await self.conn.execute(
            "SELECT * FROM emails WHERE gmail_id=?", (gmail_id,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None

    async def fts_search(self, query: str, limit: int = 100) -> List[int]:
        cursor = await self.conn.execute("""
            SELECT rowid FROM emails_fts WHERE emails_fts MATCH ? ORDER BY rank LIMIT ?
        """, (query, limit))
        return [row[0] for row in await cursor.fetchall()]

    async def get_emails_by_ids(self, email_ids: List[int]) -> List[Dict[str, Any]]:
        if not email_ids:
            return []
        placeholders = ",".join("?" * len(email_ids))
        cursor = await self.conn.execute(
            f"SELECT * FROM emails WHERE id IN ({placeholders})", email_ids
        )
        return [dict(row) for row in await cursor.fetchall()]

    # ------------------------------------------------------------------
    # Sync state
    # ------------------------------------------------------------------

    async def update_sync_state(self, history_id: str, emails_synced: int):
        await self.conn.execute("""
            UPDATE sync_state SET
                last_history_id     = ?,
                last_sync_time      = strftime('%s','now'),
                total_emails_synced = total_emails_synced + ?
            WHERE id=1
        """, (history_id, emails_synced))
        await self.conn.commit()

    async def mark_initial_sync_complete(self):
        await self.conn.execute(
            "UPDATE sync_state SET initial_sync_complete=1 WHERE id=1"
        )
        await self.conn.commit()

    async def get_sync_state(self) -> Dict[str, Any]:
        await self._ensure_sync_state_row()
        cursor = await self.conn.execute("SELECT * FROM sync_state WHERE id=1")
        row = await cursor.fetchone()
        return dict(row) if row else {}

    async def get_auto_sync_interval(self) -> int:
        state = await self.get_sync_state()
        value = state.get("auto_sync_interval", 30)
        try:
            return int(value)
        except (TypeError, ValueError):
            return 30

    async def set_auto_sync_interval(self, minutes: int):
        try:
            minutes = int(minutes)
        except (TypeError, ValueError):
            minutes = 30
        await self._ensure_sync_state_row()
        await self.conn.execute(
            "UPDATE sync_state SET auto_sync_interval=? WHERE id=1", (minutes,)
        )
        await self.conn.commit()

    # ------------------------------------------------------------------
    # Stats
    # ------------------------------------------------------------------

    async def get_stats(self) -> Dict[str, Any]:
        cursor = await self.conn.execute("""
            SELECT
                COUNT(*)                                             AS total_emails,
                COUNT(DISTINCT thread_id)                           AS total_threads,
                SUM(CASE WHEN is_decision=1 THEN 1 ELSE 0 END)     AS decision_emails,
                SUM(CASE WHEN is_read=0    THEN 1 ELSE 0 END)      AS unread_emails
            FROM emails
        """)
        stats = dict(await cursor.fetchone())

        # DB file size
        db_path = Path(self.db_path)
        stats["db_size_mb"] = round(db_path.stat().st_size / 1_048_576, 2) if db_path.exists() else 0

        sync_state = await self.get_sync_state()
        stats["last_sync"] = sync_state.get("last_sync_time", 0)
        stats["initial_sync_complete"] = bool(sync_state.get("initial_sync_complete", 0))
        try:
            stats["auto_sync_interval"] = int(sync_state.get("auto_sync_interval", 30))
        except (TypeError, ValueError):
            stats["auto_sync_interval"] = 30
        return stats

    # ------------------------------------------------------------------
    # Nuke everything
    # ------------------------------------------------------------------

    async def delete_all_data(self):
        await self.conn.execute("DELETE FROM emails")
        await self.conn.execute("DELETE FROM embeddings")
        await self.conn.execute(
            "UPDATE sync_state SET last_history_id=NULL, total_emails_synced=0, initial_sync_complete=0"
        )
        await self.conn.commit()

    async def close(self):
        if self.conn:
            await self.conn.close()
