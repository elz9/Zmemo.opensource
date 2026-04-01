# Gmail Memory - Technical Case Study

## The Problem

Searching through years of emails is slow. Gmail's built-in search is clunky, returns irrelevant results, and lacks the context needed to quickly find what matters.

## The Solution

Built a **local-first desktop application** that indexes your entire Gmail history and provides **sub-300ms search** across all emails - without sending data to any server.

## Technical Details

### Architecture

```
Desktop App (Tauri + Rust)
    ↓
React Frontend (Vite + Tailwind + shadcn/ui)
    ↓
Python Backend (FastAPI)
    ↓
SQLite with FTS5 (Full-Text Search)
```

### Key Engineering Decisions

**Local-First Processing**
- All data stays on user's machine
- No cloud dependencies
- OAuth-based Gmail API read-only access

**Hybrid Search Strategy**
- Primary: BM25 full-text search via SQLite FTS5
- Filters applied pre-results (sender, domain, date, attachments)
- Target latency: <300ms across 100k+ emails

**Background Sync Architecture**
- Initial sync: Batch fetch 500 emails at a time
- Incremental sync: Gmail History API for deltas
- Resumable: Crash recovery with checkpoint system
- Non-blocking: Async processing never blocks UI thread

**Decision Detection System**
- Lightweight local classifier running in Python
- Keyword heuristics for importance signals
- Pattern matching for contracts, approvals, confirmations
- Confidence scoring for prioritization

### Stack Used

| Layer | Technology |
|-------|------------|
| Desktop | Tauri 1.5 (Rust) |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Python 3.10+ + FastAPI |
| Database | SQLite with FTS5 extension |
| API | Gmail API (OAuth 2.0) |

### Performance Characteristics

- **Search Latency**: <300ms across 100k emails
- **Initial Sync**: ~40 min for 100k emails
- **Memory Usage**: ~800MB at 100k emails
- **Resumable**: Crashes don't lose progress

## What This Demonstrates

| Capability | Evidence |
|------------|----------|
| Full-stack development | Rust + Python + React integration |
| Systems thinking | Async pipelines, incrementalsync, crash recovery |
| Performance optimization | FTS5 indexing, efficient data structures |
| Privacy awareness | Local-first architecture, no data exfiltration |
| API integration | Gmail API with OAuth, proper auth flows |
| Desktop app development | Tauri-based cross-platform native app |

## Code Patterns

**Async Everywhere**
All I/O operations are non-blocking to maintain UI responsiveness.

**Deterministic Pipelines**
Email processing is deterministic - no duplicate indexing, consistent results.

**Graceful Degradation**
Network failures, API rate limits, and crashes don't corrupt data.

---

*Built by Raj - Full-stack developer specializing in privacy-aware applications and performant systems.*