# PowerShell script to start Fraud Detection System in Development Mode

Write-Host "Starting Fraud Detection System in Development Mode..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "Python version: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python from https://python.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Install React dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing React dependencies..." -ForegroundColor Yellow
    npm install
}

# Start React development server in background
Write-Host "Starting React development server..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/c", "npm start" -WindowStyle Minimized

# Wait a moment for React to start
Write-Host "Waiting for React to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Flask backend
Write-Host "Starting Flask backend..." -ForegroundColor Yellow
Set-Location ..
python app.py

Read-Host "Press Enter to exit"
