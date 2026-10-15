@echo off
title Github-library - codebase-memory-mcp Daemon
echo ===================================================
echo   Github-library - codebase-memory-mcp Daemon (3D UI)
echo ===================================================
echo.

cd /d "%~dp0"

REM Lokasi binary codebase-memory-mcp (instal npm global / .local/bin)
set "MCP=C:\Users\fahmi\.local\bin\codebase-memory-mcp.exe"

if not exist "%MCP%" (
    echo [ERROR] Binary tidak ditemukan: %MCP%
    echo [INFO]  Install ulang: npm i -g codebase-memory-mcp
    pause
    exit /b 1
)

echo [INFO] Memeriksa instance yang sudah berjalan di port 9749...
powershell -Command "if (Get-NetTCPConnection -LocalPort 9749 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>&1
if %errorlevel%==0 (
    echo [INFO] Daemon sudah berjalan, buka http://localhost:9749
    pause
    exit /b 0
)

echo [INFO] Menjalankan daemon codebase-memory-mcp dengan 3D UI di console ini...
echo [INFO] UI graph tersedia di http://localhost:9749
echo [INFO] Tekan Ctrl+C untuk menghentikan daemon.
echo.

call "%MCP%" --ui=true --port=9749

echo.
echo [INFO] Daemon berhenti.
pause
