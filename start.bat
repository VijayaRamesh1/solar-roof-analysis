@echo off
REM 🚀 Project SolisCAN - Windows Startup Script
REM This script starts both backend and frontend servers

echo 🌟 Starting Project SolisCAN...
echo ==================================
echo.

REM Get the script directory
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Check if backend directory exists
if not exist "%SCRIPT_DIR%backend" (
    echo ❌ Error: backend directory not found
    pause
    exit /b 1
)

REM Check if frontend directory exists
if not exist "%SCRIPT_DIR%frontend" (
    echo ❌ Error: frontend directory not found
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Python is not installed
    pause
    exit /b 1
)

REM Check if Node.js is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Node.js/npm is not installed
    pause
    exit /b 1
)

REM Create logs directory if it doesn't exist
if not exist "%SCRIPT_DIR%logs" mkdir "%SCRIPT_DIR%logs"

REM Check if data files exist
echo 📊 Checking data files...
if not exist "%SCRIPT_DIR%data\buildings.geojson" (
    echo ⚠️  Warning: buildings.geojson not found
    echo    Run 'python backend\fetch_data_auto.py' to fetch data
)

REM Start Backend Server
echo 🔧 Starting Backend Server...
cd /d "%SCRIPT_DIR%backend"

REM Check if Flask is installed
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing Python dependencies...
    pip install -r requirements.txt
)

REM Start backend in new window
start "SolisCAN Backend" /min cmd /c "python serve_api.py > ..\logs\backend.log 2>&1"
echo ✅ Backend starting on http://localhost:5001

REM Wait for backend to start
echo ⏳ Waiting for backend to be ready...
timeout /t 5 /nobreak >nul

REM Start Frontend Server
echo.
echo 🎨 Starting Frontend Development Server...
cd /d "%SCRIPT_DIR%frontend"

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing Node.js dependencies...
    call npm install
)

REM Start frontend in new window
start "SolisCAN Frontend" /min cmd /c "set BROWSER=none && npm start > ..\logs\frontend.log 2>&1"
echo ✅ Frontend starting on http://localhost:3000

REM Wait for frontend to start
echo ⏳ Waiting for frontend to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ==================================
echo 🎉 Project SolisCAN is running!
echo ==================================
echo.
echo 🌐 URLs:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5001
echo.
echo 📝 Logs:
echo    Backend:  logs\backend.log
echo    Frontend: logs\frontend.log
echo.
echo 💡 Tips:
echo    - Close the backend and frontend windows to stop servers
echo    - Refresh browser if app doesn't load immediately
echo    - Check logs if you encounter issues
echo.
echo 🚀 Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo ✨ Enjoy your solar visualization!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Press any key to exit this window (servers will keep running)
pause >nul
