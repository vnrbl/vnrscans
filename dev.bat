@echo off
setlocal
cd /d "%~dp0"

:: Ensure nodejs is in PATH and strip corrupt quotes
set "PATH=C:\Program Files\nodejs;%PATH%"
set "PATH=%PATH:"=%"

echo ===================================================
echo   VNRScans - Development Server
echo ===================================================
echo.

call node "node_modules\next\dist\bin\next" dev %*
