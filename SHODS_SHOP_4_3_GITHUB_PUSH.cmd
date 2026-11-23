@echo off
setlocal EnableExtensions
chcp 65001 >nul
title SHODS SHOP 4.3 - GitHub Push
cd /d "%~dp0"
set "SOURCE=%~dp0."
set "TARGET=%TEMP%\SHODS_SHOP_43_PUSH_%RANDOM%_%RANDOM%"
echo.
echo ================================================
echo SHODS SHOP 4.3 - xavfsiz GitHub push
 echo Baza va Render .env sozlamalariga tegilmaydi.
echo ================================================
echo.
echo [1/6] GitHub main tarmog'ini klon qilish...
git clone https://github.com/sardorbekhasanov579-source/SHODS-SHOP.git "%TARGET%"
if errorlevel 1 goto :fail

echo.
echo [2/6] 4.3 fayllarini qo'shish...
robocopy "%SOURCE%" "%TARGET%" /E /R:1 /W:1 /XD .git node_modules dist android .vscode /XF .env .env.local .env.production .env.development .env.test *.log *.zip
set "RC=%ERRORLEVEL%"
if %RC% GEQ 8 goto :fail
cd /d "%TARGET%"

echo.
echo [3/6] npm paketlari va 11 ta API sinovi...
call npm.cmd install --include=dev --no-audit
if errorlevel 1 goto :fail
call npm.cmd run test:api
if errorlevel 1 goto :fail

echo.
echo [4/6] Production build...
call npm.cmd run build
if errorlevel 1 goto :fail

echo.
echo [5/6] Git diff tekshiruvi...
node -e "const fs=require('fs');for(const p of ['src/App.jsx','server/index.mjs','src/style.css']){const s=fs.readFileSync(p,'utf8');fs.writeFileSync(p,s.replace(/[ \t]+(?=\r?$)/gm,''))}"
if errorlevel 1 goto :fail
git add -A
if errorlevel 1 goto :fail
git diff --cached --check
if errorlevel 1 goto :fail
git status --short

echo.
echo [6/6] GitHub main ga push qilish - Render AUTOMATIK DEPLOY qiladi.
echo MUHIM: avval haqiqiy Neon bazaning zaxira nusxasini tekshiring.
set "ANSWER="
set /p "ANSWER=Push qilishni tasdiqlaysizmi? HA deb yozing: "
if /I not "%ANSWER%"=="HA" (
 echo [BEKOR] Push bajarilmadi.
 goto :end
)
git diff --cached --quiet
if not errorlevel 1 (
 echo [INFO] GitHub ga yuboriladigan yangi o'zgarish yo'q.
 goto :end
)
git commit -m "SHODS SHOP 4.3 Android update checks"
if errorlevel 1 goto :fail
git pull --rebase origin main
if errorlevel 1 goto :fail
git push origin main
if errorlevel 1 goto :fail
echo.
echo [MUVAFFAQIYAT] GitHub push bajarildi. Render Live holatini kutib tekshiring.
goto :end
:fail
echo.
echo [XATO] Push tugallanmagan. Yuqoridagi xabarni yuboring.
:end
echo Ishchi nusxa: "%TARGET%"
pause
endlocal
