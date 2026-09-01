@echo off
setlocal
set "PATH=C:\Program Files\nodejs;%PATH%"
echo ===================================================
echo   VNRScans - Interactive Scraper
echo ===================================================
echo.
npx.cmd -y tsx scripts/scrape-series.ts %*
pause
