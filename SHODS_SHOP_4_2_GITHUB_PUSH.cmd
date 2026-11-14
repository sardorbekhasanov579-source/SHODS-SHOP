@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
title SHODS SHOP 4.2 - GitHub push
set "SOURCE=%~dp0."
set "DEST=%TEMP%\SHODS_SHOP_42_PUSH_%RANDOM%_%RANDOM%"
set "REPO=https://github.com/sardorbekhasanov579-source/SHODS-SHOP.git"
echo ==========================================
echo SHODS SHOP 4.2 - Web + Android backend
 echo ==========================================
echo [OGOHLANTIRISH] Render main'dan avtomatik deploy qiladi.
echo Jonli bazangizni zaxiralaganingizga ishonch hosil qiling.
set /p "BACKUP=Zaxira nusxa tekshirildimi? davom etish uchun HA yozing: "
if /I not "!BACKUP!"=="HA" goto :cancel
if not exist "package.json" goto :fail
echo [1/6] GitHub main kodini klon qilish...
git clone "%REPO%" "%DEST%"
if errorlevel 1 goto :fail
echo [2/6] 4.2 loyihani nusxalash (eski Git tarixi va env saqlanadi)...
robocopy "%SOURCE%" "%DEST%" /E /XD .git node_modules dist android /XF .env .env.* package-lock.json *.zip *.apk *.aab *.log /R:1 /W:1 /NFL /NDL /NP
set "COPYERR=!ERRORLEVEL!"
if !COPYERR! GEQ 8 goto :fail
if exist ".env.example" copy /Y ".env.example" "%DEST%\.env.example" >nul
cd /d "%DEST%"
echo [3/6] npm install va test...
call npm.cmd install --include=dev --no-audit
if errorlevel 1 goto :fail
call npm.cmd run test:api
if errorlevel 1 goto :fail
echo [4/6] Frontend build...
call npm.cmd run build
if errorlevel 1 goto :fail
echo [5/6] Git diff tekshiruv...
node -e "const fs=require('fs');const p='server/storage.mjs';const s=fs.readFileSync(p,'utf8');fs.writeFileSync(p,s.replace(/[ \t]+(?=\r?$)/gm,''));"
if errorlevel 1 goto :fail
git add -A
if errorlevel 1 goto :fail
git diff --cached --check
if errorlevel 1 goto :fail
git status --short
set /p "OK=4.2 kodlarini main'ga push qilamizmi? Davom etish uchun Y yozing: "
if /I not "!OK!"=="Y" goto :cancel
echo [6/6] GitHub push...
git commit -m "SHODS SHOP 4.2 native Android API Telegram and mobile UI"
if errorlevel 1 goto :fail
git pull --rebase origin main
if errorlevel 1 goto :fail
git push origin main
if errorlevel 1 goto :fail
echo [TAYYOR] GitHub push bajarildi. Render'da deploy LIVE bo'lishini kuting.
pause
exit /b 0
:cancel
echo [BEKOR] Hech narsa push qilinmadi.
pause
exit /b 2
:fail
echo [XATO] Push bajarilmadi.
echo Vaqtinchalik loyiha: "%DEST%"
pause
exit /b 1
