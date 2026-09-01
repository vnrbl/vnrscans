@echo off
setlocal
echo ===================================================
echo   VNRScans - Sync All Chapters for All Series
echo ===================================================
echo.
if exist "C:\Program Files\nodejs\npx.cmd" (
    "C:\Program Files\nodejs\npx.cmd" tsx scripts/sync-all-chapters.ts %*
) else (
    npx.cmd tsx scripts/sync-all-chapters.ts %*
)
pause
