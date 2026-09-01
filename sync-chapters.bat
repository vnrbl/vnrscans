@echo off
setlocal
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ===================================================
echo   VNRScans - Sync All Chapters for All Series
echo ===================================================
echo.
npx.cmd -y tsx scripts/sync-all-chapters.ts %*
pause
