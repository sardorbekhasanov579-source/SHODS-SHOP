@echo off
cd /d "%~dp0"
echo SHODS SHOP: paketlar, API test va frontend build
where node >nul 2>&1 || (echo Node.js topilmadi. Node LTS o'rnating.& pause & exit /b 1)
call npm.cmd install || (echo NPM paket xatosi& pause& exit /b 1)
call npm.cmd run test:api || (echo API sinovi xatosi& pause& exit /b 1)
call npm.cmd run build || (echo Build xatosi& pause& exit /b 1)
echo Barcha lokal sinovlar o'tdi!
pause
