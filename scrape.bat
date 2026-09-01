@echo off
setlocal
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

echo ===================================================
echo   VNRScans - Interactive Scraper
echo ===================================================
echo.

call npx.cmd -y tsx scripts/scrape-series.ts %*

echo.
echo ===================================================
echo   Finished! Press any key to exit...
echo ===================================================
pause
