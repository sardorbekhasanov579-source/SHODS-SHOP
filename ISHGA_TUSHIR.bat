@echo off
cd /d "%~dp0"
echo SHODS SHOP - ishga tushirish
where node >nul 2>&1 || (echo Node.js o'rnatilmagan!& pause & exit /b 1)
if not exist node_modules (echo Paketlar o'rnatilmoqda...& call npm.cmd install || (pause& exit /b 1))
echo Brauzer: http://localhost:5173
call npm.cmd run dev
pause
