$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$backendDir = Join-Path $repoRoot "backend"
$tauriDir = Join-Path $repoRoot "frontend\src-tauri"
$binariesDir = Join-Path $tauriDir "binaries"
$resourcesDir = Join-Path $tauriDir "resources"

$venvPython = Join-Path $backendDir "venv\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
    throw "Missing backend virtualenv at $venvPython. Create backend venv before building desktop release."
}

$specPath = Join-Path $backendDir "main.spec"
if (-not (Test-Path $specPath)) {
    throw "Missing backend spec file: $specPath"
}

Write-Host "[1/3] Building bundled backend executable..."
Push-Location $backendDir
try {
    & $venvPython -m PyInstaller --noconfirm (Split-Path -Leaf $specPath)
    if ($LASTEXITCODE -ne 0) {
        throw "PyInstaller build failed."
    }
}
finally {
    Pop-Location
}

$backendExe = Join-Path $backendDir "dist\backend.exe"
if (-not (Test-Path $backendExe)) {
    throw "Expected backend executable not found: $backendExe"
}

Write-Host "[2/3] Copying backend sidecar..."
New-Item -ItemType Directory -Force -Path $binariesDir | Out-Null
$sidecarTarget = Join-Path $binariesDir "backend-x86_64-pc-windows-msvc.exe"
Copy-Item $backendExe $sidecarTarget -Force

$credentialsSource = Join-Path $repoRoot "credentials.json"
if (-not (Test-Path $credentialsSource)) {
    throw "Missing credentials.json in repo root. Add desktop OAuth credentials before building."
}

Write-Host "[3/3] Copying OAuth credentials resource..."
New-Item -ItemType Directory -Force -Path $resourcesDir | Out-Null
Copy-Item $credentialsSource (Join-Path $resourcesDir "credentials.json") -Force

Write-Host "Desktop build assets prepared."
