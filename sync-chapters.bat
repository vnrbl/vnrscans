@echo off
setlocal
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

echo ===================================================
echo   VNRScans - Sync All Chapters for All Series
echo ===================================================
echo.

call npx.cmd -y tsx scripts/sync-all-chapters.ts %*

echo.
echo ===================================================
echo   Finished! Press any key to exit...
echo ===================================================
pause
