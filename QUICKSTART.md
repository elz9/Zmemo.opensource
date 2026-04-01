# Gmail Memory - Quick Start

Get up and running in 10 minutes.

## 🚀 Fast Track Setup

### 1. Prerequisites (2 min)

Install these if you don't have them:

```bash
# Check versions
node --version   # Need 18+
python3 --version # Need 3.10+
rustc --version   # Need latest stable

# Install if missing:
# - Node: https://nodejs.org/
# - Python: https://python.org/
# - Rust: https://rustup.rs/
```

### 2. Google API Setup (3 min)

1. Go to https://console.cloud.google.com/
2. Create project → Enable Gmail API → Create OAuth credentials (Desktop app)
3. Download `credentials.json`
4. Move to: `~/.gmail-memory/credentials.json` (create folder if needed)

### 3. Install Dependencies (3 min)

```bash
cd gmail-memory

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend  
cd ../frontend
npm install
```

### 4. Run (2 min)

**Terminal 1** - Backend:
```bash
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8765
```

**Terminal 2** - App:
```bash
cd frontend
npm run tauri dev
```

First run compiles Rust (~5 min), subsequent runs are instant.

### 5. Connect Gmail

1. Click "Connect Gmail"
2. Authorize in browser
3. Sync starts automatically
4. Start searching!

## 🎯 First Searches

Try these:

- `invoice` - Find all invoices
- Toggle "Decisions Only" - See AI-detected important emails
- Use sender filter: `stripe.com`
- Date range: Last 30 days

## ⚡ Tips

- Search works during sync (results improve as more emails index)
- Escape key clears search
- All data stays local - check `~/.gmail-memory/`
- Click "Open in Gmail" to view full email

## 🐛 Common Issues

**Backend won't start?**
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

**Frontend errors?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Credentials not found?**
```bash
# Verify location
ls ~/.gmail-memory/credentials.json
# Should exist. If not, re-download from Google Cloud Console
```

## 📚 Next Steps

- Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions
- Review [ARCHITECTURE.md](ARCHITECTURE.md) to understand how it works
- Check [README.md](README.md) for full documentation

## ✅ Success Checklist

- [ ] Backend running at http://127.0.0.1:8765
- [ ] App window open
- [ ] Gmail connected
- [ ] Sync in progress or complete
- [ ] Search returns results

That's it! You're ready to search your email history at lightning speed. 🚀