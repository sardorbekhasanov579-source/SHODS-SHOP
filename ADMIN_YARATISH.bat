@echo off
cd /d "%~dp0"
echo SHODS SHOP - admin hisob yaratish. Oldin serverni to'xtating.
call npm.cmd run admin:create
pause
