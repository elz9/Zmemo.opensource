# Gmail Memory - Complete Setup Guide

This guide will walk you through setting up Gmail Memory from scratch.

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] Node.js 18 or higher installed
- [ ] Python 3.10 or higher installed
- [ ] Rust toolchain installed (for Tauri)
- [ ] A Google account with Gmail

## Step 1: Install System Dependencies

### macOS

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node python@3.11 rust
```

### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install dependencies
sudo apt install -y nodejs npm python3 python3-pip python3-venv curl

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### Windows

1. Install [Node.js](https://nodejs.org/) (LTS version)
2. Install [Python](https://www.python.org/downloads/) (3.10+)
3. Install [Rust](https://www.rust-lang.org/tools/install)
4. Install [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/downloads/)

## Step 2: Set Up Google Cloud Project

### 2.1 Create Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Name it "Gmail Memory" and click "Create"

### 2.2 Enable Gmail API

1. In the Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click "Enable"

### 2.3 Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure OAuth consent screen:
   - User Type: External
   - App name: Gmail Memory
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add `../auth/gmail.readonly`
   - Test users: Add your Gmail address
4. Create OAuth Client ID:
   - Application type: Desktop app
   - Name: Gmail Memory Desktop
5. Click "Download JSON"
6. Save the file as `credentials.json`

### 2.4 Place Credentials

Create the app data directory and move credentials:

**macOS/Linux:**
```bash
mkdir -p ~/.gmail-memory
mv ~/Downloads/credentials.json ~/.gmail-memory/
```

**Windows:**
```powershell
mkdir $env:APPDATA\gmail-memory
move Downloads\credentials.json $env:APPDATA\gmail-memory\
```

## Step 3: Clone and Setup Project

```bash
# Clone repository (or extract downloaded files)
cd gmail-memory

# Verify structure
ls -la
# Should see: backend/ frontend/ src-tauri/ README.md
```

## Step 4: Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Verify installation
python -c "import fastapi; print('FastAPI installed successfully')"
```

## Step 5: Frontend Setup

```bash
# Navigate to frontend (from project root)
cd frontend

# Install Node dependencies
npm install

# This will install:
# - React
# - Vite
# - Tauri
# - Tailwind CSS
# - shadcn/ui components
# - All other dependencies

# Verify installation
npm list --depth=0
```

## Step 6: First Run

### 6.1 Start Backend Service

```bash
# In Terminal 1
cd backend
source venv/bin/activate  # Or venv\Scripts\activate on Windows
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8765
```

You should see:
```
INFO:     Started server process
INFO:     Uvicorn running on http://127.0.0.1:8765
```

### 6.2 Start Tauri Application

```bash
# In Terminal 2
cd frontend
npm run tauri dev
```

First run will:
- Compile Rust code (takes 5-10 minutes)
- Start Vite dev server
- Open the application window

## Step 7: Connect Gmail

1. In the application window, click **"Connect Gmail"**
2. Browser will open with Google OAuth
3. Sign in with your Gmail account
4. Review permissions (read-only access)
5. Click **"Allow"**
6. Browser will show "Authentication successful"
7. Return to app - sync will start automatically

## Step 8: Initial Sync

The app will now sync your emails:

- Progress shown in top-right corner
- Emails indexed in batches of 500
- Search available immediately (partial results)
- Full sync time depends on mailbox size:
  - 10k emails: ~5 minutes
  - 50k emails: ~20 minutes
  - 100k emails: ~40 minutes

**You can start searching immediately** - results will improve as more emails are indexed.

## Step 9: Test Search

Try these example searches:

1. **Simple keyword**: `invoice`
2. **Sender filter**: `from:stripe.com`
3. **Time range**: Use date filters for last month
4. **Decisions**: Toggle "Decisions Only" filter
5. **Attachments**: Toggle "Has Attachments" filter

## Troubleshooting

### Backend Won't Start

```bash
# Check Python version
python --version  # Should be 3.10+

# Reinstall dependencies
pip install --force-reinstall -r requirements.txt
```

### Frontend Won't Build

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Rust Compilation Errors

```bash
# Update Rust
rustup update

# Clear Tauri cache
cd src-tauri
cargo clean
```

### Gmail Connection Fails

1. Verify `credentials.json` is in correct location:
   - macOS/Linux: `~/.gmail-memory/credentials.json`
   - Windows: `%APPDATA%\gmail-memory\credentials.json`

2. Check OAuth consent screen is configured for "External" users
3. Add your Gmail address as a test user
4. Ensure Gmail API is enabled

### Search Returns No Results

1. Wait for initial sync to complete
2. Check sync status in top-right corner
3. Verify database exists:
   - macOS/Linux: `~/.gmail-memory/emails.db`
   - Windows: `%APPDATA%\gmail-memory\emails.db`

### Application Crashes

Check logs:
```bash
# Tauri logs
cd src-tauri
cargo tauri dev  # Shows detailed errors

# Backend logs
# Terminal shows uvicorn output
```

## Production Build

Once everything works in development:

```bash
cd frontend
npm run tauri build
```

This creates a production binary in:
- **macOS**: `src-tauri/target/release/bundle/macos/`
- **Linux**: `src-tauri/target/release/bundle/appimage/`
- **Windows**: `src-tauri/target/release/bundle/msi/`

## Auto-Update Setup (One-Time)

To enable in-app updates (no reinstall required), configure updater signing + release artifacts:

1. Generate updater signing keys (keep private key secret):

```bash
cd frontend
npx tauri signer generate -w ~/.tauri/gmail-memory-updater.key
```

2. Put the generated public key in:
   - `frontend/src-tauri/tauri.conf.json` -> `tauri.updater.pubkey`

3. Update the release feed URL in:
   - `frontend/src-tauri/tauri.conf.json` -> `tauri.updater.endpoints`
   - It should point to your hosted `latest.json` feed.

4. Sign release bundles with your private key when publishing:

```bash
set TAURI_PRIVATE_KEY_PATH=%USERPROFILE%\\.tauri\\gmail-memory-updater.key
set TAURI_KEY_PASSWORD=your_password
npm run tauri build
```

5. Publish `latest.json` + signed bundles (MSI/AppImage/dmg) to your release host (for example GitHub Releases).

After this setup, the app checks for updates on startup and can download/install updates in-place.

## Next Steps

1. **Customize search**: Adjust filters for your workflow
2. **Regular syncs**: Click "Sync" button periodically
3. **Explore decisions**: Review AI-detected important emails
4. **Privacy**: All data stays local - verify in `~/.gmail-memory/`

## Getting Help

- Read the [README.md](README.md) for architecture details
- Check [GitHub Issues](https://github.com/yourrepo/gmail-memory/issues)
- Review engineering rules in project documentation

## Success Checklist

After setup, you should have:

- [x] Backend running on `http://127.0.0.1:8765`
- [x] Frontend Tauri app open
- [x] Gmail connected (OAuth complete)
- [x] Initial sync running or complete
- [x] Search returning results
- [x] Filters working
- [x] "Open in Gmail" button opens correct emails

Congratulations! 🎉 Gmail Memory is now ready to use.
