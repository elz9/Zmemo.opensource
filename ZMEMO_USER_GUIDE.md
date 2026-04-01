# Zmemo Guide: Local-First Gmail Search for Everyday Use

## What This App Does
Zmemo helps you search your Gmail history quickly by building a private search index on your own device.

Think of it as a personal search layer on top of Gmail:
- It connects to your Gmail account with read-only permission.
- It copies email content and metadata to a local database on your machine.
- It builds a fast search index so results appear almost instantly.
- It keeps updating in the background so new emails become searchable.

The goal is simple: fast email search without sending your email archive to a third-party cloud service.

## Who This Is For
Zmemo is useful if you:
- Have years of email and need faster retrieval.
- Want better filtering and "decision" discovery (approvals, confirmations, commitments).
- Care about privacy and prefer local processing over cloud-based indexing tools.

## How to Start Using Zmemo
## 1) Open the app and connect Gmail
When you click Connect Gmail, Zmemo opens a Google sign-in flow in your browser.

What happens during this step:
- You approve read-only Gmail access.
- Zmemo stores your sign-in token locally, so you do not need to sign in every time.
- No send/edit/delete Gmail permissions are requested.

## 2) Let the first sync finish
The first sync downloads your email history in batches. This can take time depending on mailbox size.

During this phase:
- Zmemo pulls your email data from Gmail.
- It normalizes and stores the content in a local SQLite database.
- It builds a full-text index for fast searching.

You can usually start searching before everything is fully complete, and results improve as more mail is indexed.

## 3) Search and filter
After indexing starts, you can:
- Search by words or phrases.
- Filter by sender, domain, date range, attachments, and decision-only mode.
- Open any result in Gmail when you need the original message view.

## How Sync Works (In Plain Language)
Zmemo uses a two-phase sync model:

- Initial sync: one-time bulk download of your mailbox.
- Incremental sync: after initial sync, only new or changed emails are fetched.

This keeps the app fast over time and avoids re-downloading everything repeatedly.

You can also choose an auto-sync interval from the app's stats/health panel.

## Why Search Feels Fast
Zmemo is designed for local speed:
- Email text is indexed in a local full-text search database.
- Repeated queries are cached in memory.
- Search is local, so there is no network round trip for every query.
- Ranking blends keyword matching with local semantic scoring once background fitting is ready.

In practice, this is why common searches can feel near-instant once indexing is established.

## Privacy Model: What Stays Local
Zmemo is local-first by design:
- Your indexed email database is stored on your device.
- Search queries are processed on your device.
- Decision detection and ranking happen locally.
- No separate company cloud is used to process your mailbox content.

### Data stored locally
Typical local files include:
- Email database (searchable local copy)
- Gmail auth token (for future syncs)
- OAuth client credentials used by the app

## What Network Calls Still Happen
To be accurate, Zmemo still needs internet access for specific purposes:
- Gmail API and Google OAuth (to authenticate and sync mail).
- Opening an email in Gmail opens the Gmail web URL.
- The desktop app has updater logic, but current config keeps automatic updater disabled.
- The UI loads web fonts in the frontend build.

Important privacy point:
- Your email content is fetched from Google (because that is where Gmail lives).
- Zmemo does not send your mailbox content to a separate analytics/search cloud service.

## Why This Is Privacy-Focused
Zmemo follows practical privacy principles:
- Minimum Gmail scope: read-only.
- Local processing first: indexing, search, and classification run on-device.
- User control: disconnect and remove local data when needed.
- Transparent storage: data lives in local app-data locations under your user profile.

## Understanding "Disconnect"
When you disconnect in the app:
- The app removes its local Gmail token and stops syncing.
- Your local indexed emails can still remain on disk unless you delete local data.

If you want complete removal:
- Disconnect from Zmemo.
- Delete local app-data files/folder for Zmemo.
- Optionally revoke app access from your Google account security page.

## What Is Indexed
Zmemo stores and indexes practical email details such as:
- Subject and cleaned body text
- Sender and recipient fields
- Timestamps and thread IDs
- Attachment names and metadata
- Read/unread and labels

It also marks likely "decision" emails using local rules (for example approvals, confirmations, and agreement-like language).

## Typical User Workflow
A simple weekly routine:
1. Keep auto-sync enabled.
2. Search naturally by topic, person, or company.
3. Use filters to narrow noise.
4. Use decision-only mode for high-signal messages.
5. Open exact results in Gmail when action is needed.

## Best Practices for Trust and Privacy
- Use an OS account with disk encryption enabled.
- Keep your machine locked when away.
- Protect backups if your app-data folders are included.
- Periodically review connected apps in your Google account.

## Final Takeaway
Zmemo is built for people who want speed and privacy together:
- Gmail remains the source of truth.
- Your search experience is powered locally.
- Your email archive is not being shipped to an extra cloud search backend.

That local-first architecture is the core reason Zmemo can be both fast and privacy-conscious.
