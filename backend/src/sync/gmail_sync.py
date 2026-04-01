"""
Gmail Sync Module — v2
Adds: rich attachment metadata (size, MIME type, Google Drive ID),
      Gmail label extraction, is_read flag, auto-sync scheduler.
"""
import asyncio
import base64
import json
import os
import pickle
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


class GmailSync:
    def __init__(self, db) -> None:
        self.db = db
        self.service = None
        self.credentials = None
        self.is_syncing = False
        self.sync_progress: Dict[str, Any] = {
            "status": "idle",
            "total_processed": 0,
            "current_batch": 0,
            "errors": 0,
        }
        self._auto_sync_task: Optional[asyncio.Task] = None

        app_data_env = os.getenv("GM_APP_DATA")
        self.app_data = Path(app_data_env) if app_data_env else (Path.home() / ".gmail-memory")
        self.app_data.mkdir(parents=True, exist_ok=True)
        self.token_path = self.app_data / "token.pickle"
        credentials_env = os.getenv("GM_CREDENTIALS_PATH")
        self.credentials_path = Path(credentials_env) if credentials_env else (self.app_data / "credentials.json")

    # ------------------------------------------------------------------
    # Auth
    # ------------------------------------------------------------------

    async def start_oauth(self) -> str:
        if not self.credentials_path.exists():
            raise FileNotFoundError(
                "credentials.json not found. Download it from Google Cloud Console "
                f"and place it at {self.credentials_path}"
            )
        flow = InstalledAppFlow.from_client_secrets_file(
            str(self.credentials_path), SCOPES, redirect_uri="http://localhost:8080/"
        )
        self.credentials = flow.run_local_server(port=8080)
        with open(self.token_path, "wb") as f:
            pickle.dump(self.credentials, f)
        self.service = build("gmail", "v1", credentials=self.credentials)
        return "Authentication successful"

    async def load_credentials(self) -> bool:
        if not self.token_path.exists():
            return False
        with open(self.token_path, "rb") as f:
            self.credentials = pickle.load(f)
        if self.credentials.expired and self.credentials.refresh_token:
            self.credentials.refresh(Request())
            with open(self.token_path, "wb") as f:
                pickle.dump(self.credentials, f)
        self.service = build("gmail", "v1", credentials=self.credentials)
        return True

    async def disconnect(self):
        if self.token_path.exists():
            os.remove(self.token_path)
        self.service = None
        self.credentials = None
        self.stop_auto_sync()

    # ------------------------------------------------------------------
    # Auto-sync scheduler
    # ------------------------------------------------------------------

    def start_auto_sync(self, interval_minutes: int) -> None:
        """Start a background task that re-syncs every N minutes."""
        self.stop_auto_sync()
        self._auto_sync_task = asyncio.create_task(
            self._auto_sync_loop(interval_minutes)
        )

    def stop_auto_sync(self) -> None:
        if self._auto_sync_task and not self._auto_sync_task.done():
            self._auto_sync_task.cancel()
        self._auto_sync_task = None

    async def _auto_sync_loop(self, interval_minutes: int) -> None:
        """Runs indefinitely, triggering sync every interval_minutes."""
        while True:
            await asyncio.sleep(interval_minutes * 60)
            try:
                print(f"[AutoSync] Triggering scheduled sync (every {interval_minutes}m)")
                await self.sync_emails()
            except Exception as exc:
                print(f"[AutoSync] Error during scheduled sync: {exc}")

    # ------------------------------------------------------------------
    # Sync orchestration
    # ------------------------------------------------------------------

    async def sync_emails(self) -> None:
        if self.is_syncing:
            return

        self.is_syncing = True
        self.sync_progress["status"] = "running"

        try:
            if not self.service:
                await self.load_credentials()
            if not self.service:
                raise RuntimeError("Not authenticated with Gmail")

            sync_state = await self.db.get_sync_state()
            if not sync_state.get("initial_sync_complete"):
                await self._initial_sync()
            else:
                await self._incremental_sync(sync_state.get("last_history_id"))

            self.sync_progress["status"] = "complete"
        except Exception as exc:
            self.sync_progress["status"] = "error"
            self.sync_progress["errors"] += 1
            raise exc
        finally:
            self.is_syncing = False

    async def _initial_sync(self) -> None:
        print("[Sync] Starting initial sync …")
        page_token = None
        total = 0

        while True:
            kwargs: Dict[str, Any] = {"userId": "me", "maxResults": 500}
            if page_token:
                kwargs["pageToken"] = page_token

            results = self.service.users().messages().list(**kwargs).execute()
            messages = results.get("messages", [])
            if not messages:
                break

            await self._process_message_batch([m["id"] for m in messages])
            total += len(messages)
            self.sync_progress["total_processed"] = total
            self.sync_progress["current_batch"] = len(messages)
            print(f"[Sync] {total} emails processed …")

            page_token = results.get("nextPageToken")
            if not page_token:
                break

            await asyncio.sleep(0.1)  # avoid rate-limit burst

        await self.db.mark_initial_sync_complete()
        profile = self.service.users().getProfile(userId="me").execute()
        await self.db.update_sync_state(profile["historyId"], total)
        print(f"[Sync] Initial sync complete. Total: {total}")

    async def _incremental_sync(self, last_history_id: str) -> None:
        print(f"[Sync] Incremental from historyId={last_history_id}")
        try:
            history = self.service.users().history().list(
                userId="me", startHistoryId=last_history_id
            ).execute()
            changes = history.get("history", [])
            if not changes:
                print("[Sync] No new changes.")
                return

            message_ids = {
                msg["message"]["id"]
                for change in changes
                for msg in change.get("messagesAdded", [])
            }
            if message_ids:
                await self._process_message_batch(list(message_ids))

            new_history_id = history.get("historyId")
            await self.db.update_sync_state(new_history_id, len(message_ids))
            print(f"[Sync] Incremental done. {len(message_ids)} new emails.")
        except Exception as exc:
            if "historyId" in str(exc):
                print("[Sync] History ID expired — falling back to full sync")
                await self._initial_sync()
            else:
                raise

    async def _process_message_batch(self, message_ids: List[str]) -> None:
        for msg_id in message_ids:
            try:
                message = self.service.users().messages().get(
                    userId="me", id=msg_id, format="full"
                ).execute()
                email_data = self._normalize_message(message)
                await self.db.insert_email(email_data)
            except Exception as exc:
                print(f"[Sync] Error processing {msg_id}: {exc}")
                self.sync_progress["errors"] += 1

    # ------------------------------------------------------------------
    # Normalisation
    # ------------------------------------------------------------------

    def _normalize_message(self, message: Dict) -> Dict[str, Any]:
        headers = {
            h["name"].lower(): h["value"]
            for h in message["payload"].get("headers", [])
        }
        timestamp = int(message.get("internalDate", 0)) // 1000
        sender = headers.get("from", "unknown")
        recipients = [
            headers[f] for f in ("to", "cc", "bcc") if f in headers
        ]
        subject = headers.get("subject", "(no subject)")
        body = self._extract_body(message["payload"])
        body_clean = self._clean_body(body)

        # ── v2: rich attachment metadata ──────────────────────────────
        attachment_meta = self._extract_attachment_meta(message["payload"])
        attachment_names = [a["name"] for a in attachment_meta]

        # ── v2: labels & read status ──────────────────────────────────
        labels: List[str] = message.get("labelIds", [])
        is_read = "UNREAD" not in labels

        return {
            "message_id": headers.get("message-id", message["id"]),
            "thread_id": message.get("threadId", ""),
            "gmail_id": message["id"],
            "subject": subject,
            "body_clean": body_clean,
            "sender": sender,
            "recipients": recipients,
            "timestamp": timestamp,
            "attachment_names": attachment_names,
            "attachment_meta": attachment_meta,      # NEW
            "labels": labels,                         # NEW
            "is_read": is_read,                       # NEW
            "is_decision": False,
            "decision_confidence": 0.0,
        }

    # ------------------------------------------------------------------
    # Body extraction & cleaning
    # ------------------------------------------------------------------

    def _extract_body(self, payload: Dict) -> str:
        if "body" in payload and "data" in payload["body"]:
            return base64.urlsafe_b64decode(payload["body"]["data"]).decode(
                "utf-8", errors="ignore"
            )
        for part in payload.get("parts", []):
            if part["mimeType"] == "text/plain":
                if "data" in part.get("body", {}):
                    return base64.urlsafe_b64decode(part["body"]["data"]).decode(
                        "utf-8", errors="ignore"
                    )
            if part["mimeType"].startswith("multipart"):
                body = self._extract_body(part)
                if body:
                    return body
        return ""

    def _clean_body(self, body: str) -> str:
        if not body:
            return ""
        for pattern in [
            r"\n--\s*\n.*", r"\nSent from my .*",
            r"\n_{3,}.*", r"\nBest regards,.*",
            r"\nThanks,.*\n.*\n.*",
        ]:
            body = re.sub(pattern, "", body, flags=re.DOTALL)
        lines = [l for l in body.split("\n") if not l.strip().startswith(">")]
        body = "\n".join(lines)
        body = re.sub(r"\n{3,}", "\n\n", body)
        body = re.sub(r" {2,}", " ", body)
        return body.strip()

    # ------------------------------------------------------------------
    # Attachment metadata (v2)
    # ------------------------------------------------------------------

    def _extract_attachment_meta(self, payload: Dict) -> List[Dict[str, Any]]:
        """
        Return list of dicts:
          {name, size_bytes, mime_type, attachment_id, drive_file_id}
        size_bytes comes directly from the Gmail API part body size.
        drive_file_id is populated only when the attachment is a Drive file.
        """
        meta: List[Dict[str, Any]] = []
        self._walk_parts_for_attachments(payload, meta)
        return meta

    def _walk_parts_for_attachments(self, payload: Dict, meta: List[Dict]) -> None:
        filename = payload.get("filename", "")
        body = payload.get("body", {})

        if filename:
            # Extract Drive file ID from headers if present
            headers = {
                h["name"].lower(): h["value"]
                for h in payload.get("headers", [])
            }
            drive_id = headers.get("x-gm-file-id", None)

            meta.append({
                "name": filename,
                "size_bytes": body.get("size", 0),
                "mime_type": payload.get("mimeType", "application/octet-stream"),
                "attachment_id": body.get("attachmentId", None),
                "drive_file_id": drive_id,
            })

        for part in payload.get("parts", []):
            self._walk_parts_for_attachments(part, meta)

    # ------------------------------------------------------------------
    # Status
    # ------------------------------------------------------------------

    async def get_status(self) -> Dict[str, Any]:
        stats = await self.db.get_stats()
        
        # Add connection information
        is_connected = bool(self.service and self.credentials)
        email_address = None
        
        if is_connected and self.service:
            try:
                profile = self.service.users().getProfile(userId="me").execute()
                email_address = profile.get("emailAddress")
            except Exception:
                # If we can't get the profile, still consider it connected if we have credentials
                pass
        
        return {
            **self.sync_progress, 
            **stats, 
            "is_connected": is_connected,
            "email_address": email_address
        }
