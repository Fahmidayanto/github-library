@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ===================================================================
echo   Project Github-library: FE & BE Launcher
echo   Frontend : http://localhost:3055 (Tab Terminal 1: FE :3055)
echo   Backend  : http://localhost:4000 (Tab Terminal 2: BE :4000)
echo ===================================================================

echo [INFO] Membuka VS Code Workspace...
echo [INFO] 2 Tab terminal terpisah (bukan split) akan aktif di panel terminal internal.
code .

exit /b 0
