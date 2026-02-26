@echo off
echo ========================================
echo  Fraud Detection Backend Startup
echo ========================================
echo.

REM Check if venv exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install/update dependencies
echo Installing dependencies...
pip install --upgrade pip
pip install -r requirements-minimal.txt
if errorlevel 1 (
    echo Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Starting FastAPI Backend...
echo ========================================
echo.
echo Server will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.

REM Start the server
REM Run from parent directory to maintain proper package structure
cd ..
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
cd app

pause
