# Run this in PowerShell from the Fraud_Detector folder (where this file is).
# Requires Git installed and in PATH.

Set-Location $PSScriptRoot

Write-Host "Staging all files..." -ForegroundColor Cyan
git add .
if ($LASTEXITCODE -ne 0) { Write-Host "Git add failed. Is Git installed?" -ForegroundColor Red; exit 1 }

Write-Host "Status:" -ForegroundColor Cyan
git status --short

Write-Host "`nCommitting..." -ForegroundColor Cyan
git commit -m "Compliance RegMgmt: allowlist, SQLite/Redis cache, notify owners, deployment-ready"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed (maybe nothing to commit or not a git repo)." -ForegroundColor Yellow
    exit 1
}

Write-Host "`nPushing to origin..." -ForegroundColor Cyan
$branch = git rev-parse --abbrev-ref HEAD 2>$null
if (-not $branch) { $branch = "main" }
git push -u origin $branch
if ($LASTEXITCODE -ne 0) {
    Write-Host "Push failed. Add remote first: git remote add origin <your-repo-url>" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nDone." -ForegroundColor Green
