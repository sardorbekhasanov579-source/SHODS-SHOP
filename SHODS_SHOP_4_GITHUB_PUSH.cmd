@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
if not exist "package.json" (
 echo [XATO] package.json topilmadi. CMD faylni ZIP dan olingan asosiy papkaga qo'ying.
 goto fail
)
set "SRC=%CD%"
set "WORK=%TEMP%\SHODS_SHOP_PUSH_V4_%RANDOM%_%RANDOM%"
echo [1/6] GitHub main klon qilinmoqda...
git clone https://github.com/sardorbekhasanov579-source/SHODS-SHOP.git "%WORK%"
if errorlevel 1 goto fail
echo.
echo [2/6] Yangilangan fayllarni qo'shish (.env, .git va bazaga tegmaymiz)...
robocopy "%SRC%" "%WORK%" /E /R:1 /W:1 /XD ".git" "node_modules" "dist" "android" "server\data" /XF ".env" ".env.local" ".env.production" ".env.development" "SHODS_SHOP_4_GITHUB_PUSH.cmd" "package-lock.json" "*.zip" "*.log" >nul
set "RC=%ERRORLEVEL%"
if %RC% GEQ 8 (
 echo [XATO] Nusxa ko'chirish xatosi. Robocopy: %RC%
 goto fail
)
cd /d "%WORK%"
echo [3/6] npm install va 7+ API testlari...
call npm.cmd install
if errorlevel 1 goto fail
call npm.cmd run test:api
if errorlevel 1 goto fail
echo [4/6] Vite production build...
call npm.cmd run build
if errorlevel 1 goto fail
echo [5/6] Git diff tekshiruv...
rem Dastur kodi va hujjatlardagi qator oxiri bo'shliqlarini olib tashlaymiz.
node -e "const fs=require('fs'),p=require('path');const roots=['server','src'];for(const d of roots){for(const file of fs.readdirSync(d,{recursive:true})){const full=p.join(d,file);if(fs.statSync(full).isFile()&&/\.(mjs|jsx|js|css)$/.test(file)){const text=fs.readFileSync(full,'utf8');fs.writeFileSync(full,text.replace(/[ \t]+(?=\r?$)/gm,''));}}}"
if errorlevel 1 goto fail
git add -A
if errorlevel 1 goto fail
git diff --cached --check
if errorlevel 1 goto fail
git diff --cached --stat
if errorlevel 1 goto fail
set /p "OK=SHODS SHOP 4.0 ni MAIN'ga PUSH qilamizmi? (Y/N): "
if /I not "%OK%"=="Y" (
 echo Push bekor qilindi. Fayllar: %WORK%
 goto finished
)
echo [6/6] Commit va push...
git commit -m "SHODS SHOP 4.0 receipt-first payment and Android app source"
if errorlevel 1 goto fail
git pull --rebase origin main
if errorlevel 1 goto fail
git push origin main
if errorlevel 1 goto fail
echo [MUVAFFAQIYAT] Push yuborildi! Render avtomatik deploy qiladi.
goto finished
:fail
echo.
echo [TO'XTADI] Jonli sayt o'zgarmadi (agar oldin push bajarilmagan bo'lsa).
echo Ishchi papka: %WORK%
:finished
echo.
pause
endlocal
