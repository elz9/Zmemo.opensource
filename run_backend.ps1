# Gmail Memory - Run Backend
# This script starts the FastAPI backend server

Write-Host "Starting Gmail Memory Backend..." -ForegroundColor Cyan

# Check for credentials.json
$credentialsPath = "$HOME\.gmail-memory\credentials.json"
if (-not (Test-Path $credentialsPath)) {
    Write-Host "WARNING: credentials.json not found in $credentialsPath" -ForegroundColor Yellow
    Write-Host "Please download it from Google Cloud Console and place it there to enable Gmail sync." -ForegroundColor Gray
}

# Run the backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8765 --reload --no-access-log
