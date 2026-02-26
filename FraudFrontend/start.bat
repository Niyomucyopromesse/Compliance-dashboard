@echo off
echo Starting Compliance Register Frontend...
cd /d "%~dp0"

:: Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

:: Start the development server
echo Starting Vite dev server...
npm run dev

pause

