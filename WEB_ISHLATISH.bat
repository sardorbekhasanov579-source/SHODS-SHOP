@echo off
cd /d "%~dp0"
call npm.cmd install
if errorlevel 1 (pause & exit /b 1)
call npm.cmd run dev
pause
