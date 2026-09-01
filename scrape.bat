@echo off
setlocal
echo ===================================================
echo   VNRScans - Interactive Scraper
echo ===================================================
echo.
if exist "C:\Program Files\nodejs\npx.cmd" (
    "C:\Program Files\nodejs\npx.cmd" tsx scripts/scrape-series.ts %*
) else (
    npx.cmd tsx scripts/scrape-series.ts %*
)
pause
