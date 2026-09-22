<#
  start-local.ps1 - one-command local startup for the Inventory Management Dashboard.

  Brings up the database, the API, and the frontend for local development.

  Usage:
    powershell -ExecutionPolicy Bypass -File .\start-local.ps1

  It will:
    1. Start PostgreSQL (portable install at C:\pglocal on port 5433, or Docker if available).
    2. Start the API (http://localhost:4000) with AUTH_MODE=dev.
    3. Start the frontend (http://localhost:3000, or next free port).

  Logs are written to .local-logs\. Press Ctrl+C in the API/frontend windows to stop them,
  or run stop-local.ps1 (if present) to stop background processes.
#>

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$logs = Join-Path $root '.local-logs'
New-Item -ItemType Directory -Force -Path $logs | Out-Null

$DbUrl = 'postgresql://postgres:postgres@127.0.0.1:5433/inventory?schema=public'

function Test-Port($port) {
  return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

Write-Host '== 1/3  Database ==' -ForegroundColor Cyan
if (Test-Port 5433) {
  Write-Host 'Postgres already listening on 5433.' -ForegroundColor Green
} elseif (Test-Path 'C:\pglocal\pgsql\bin\pg_ctl.exe') {
  Write-Host 'Starting portable PostgreSQL on port 5433...'
  Start-Process -FilePath 'C:\pglocal\pgsql\bin\pg_ctl.exe' `
    -ArgumentList '-D','C:\pglocal\data','-l','C:\pglocal\server.log','-o','-p 5433','start' `
    -WindowStyle Hidden
  Start-Sleep -Seconds 5
} else {
  Write-Warning 'No portable Postgres found. Trying Docker...'
  docker compose up -d db
}

Write-Host '== 2/3  API (port 4000) ==' -ForegroundColor Cyan
if (Test-Port 4000) {
  Write-Host 'API already listening on 4000.' -ForegroundColor Green
} else {
  $env:DATABASE_URL = $DbUrl
  Start-Process -FilePath 'node' `
    -ArgumentList 'node_modules\ts-node\dist\bin.js','src\index.ts' `
    -WorkingDirectory (Join-Path $root 'api') `
    -RedirectStandardOutput (Join-Path $logs 'api-out.log') `
    -RedirectStandardError  (Join-Path $logs 'api-err.log') `
    -WindowStyle Hidden
  Write-Host 'API starting (logs: .local-logs\api-out.log)...'
  Start-Sleep -Seconds 8
}

Write-Host '== 3/3  Frontend (port 3000) ==' -ForegroundColor Cyan
if ((Test-Port 3000) -or (Test-Port 3001)) {
  Write-Host 'Frontend already running on 3000/3001.' -ForegroundColor Green
} else {
  Start-Process -FilePath 'node' `
    -ArgumentList 'node_modules\next\dist\bin\next','dev' `
    -WorkingDirectory (Join-Path $root 'frontend') `
    -RedirectStandardOutput (Join-Path $logs 'fe-out.log') `
    -RedirectStandardError  (Join-Path $logs 'fe-err.log') `
    -WindowStyle Hidden
  Write-Host 'Frontend starting (logs: .local-logs\fe-out.log)...'
  Start-Sleep -Seconds 15
}

Write-Host ''
Write-Host 'All services launched.' -ForegroundColor Green
Write-Host '  API:      http://localhost:4000/health'
Write-Host '  Frontend: http://localhost:3000  (check .local-logs\fe-out.log for the actual port)'
Write-Host '  Sign in:  open /sign-in and use the dev login buttons.'
