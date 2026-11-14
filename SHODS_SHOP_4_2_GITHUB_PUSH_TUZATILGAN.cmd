@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title SHODS SHOP 4.2 - Xavfsiz GitHub PUSH
cd /d "%~dp0"
set "SOURCE=%~dp0."
set "DEST=%TEMP%\SHODS_SHOP_42_PUSH_%RANDOM%_%RANDOM%"
set "REPO=https://github.com/sardorbekhasanov579-source/SHODS-SHOP.git"

echo.
echo ================================================
echo     SHODS SHOP 4.2 - GitHub PUSH
 echo ================================================
echo Manba papka: "%SOURCE%"
echo GitHub main avtomatik Render deploy boshlaydi.
echo Jonli Neon/Render ma'lumotlar bazasining zaxirasi bo'lishi tavsiya etiladi.
set /p "BACKUP=Zaxira nusxa tekshirilgan bo'lsa HA yozing (aks holda N): "
if /I not "!BACKUP!"=="HA" goto :cancel

if not exist "%SOURCE%\package.json" (
 echo [XATO] Bu papkada package.json yo'q. ZIPni to'liq oching.
 goto :fail
)
where git >nul 2>&1
if errorlevel 1 (
 echo [XATO] Git o'rnatilmagan yoki PATH ga qo'shilmagan.
 goto :fail
)
where node >nul 2>&1
if errorlevel 1 (
 echo [XATO] Node.js o'rnatilmagan yoki PATH ga qo'shilmagan.
 goto :fail
)

echo.
echo [1/6] GitHub main klon qilinmoqda...
git clone --single-branch --branch main "%REPO%" "%DEST%"
if errorlevel 1 goto :fail

echo.
echo [2/6] SHODS SHOP 4.2 kodlari nusxalanmoqda...
robocopy "%SOURCE%" "%DEST%" /E /XD .git node_modules dist android /XF .env .env.* package-lock.json *.zip *.apk *.aab *.log /R:1 /W:1 /NFL /NDL /NP
set "COPY_CODE=!ERRORLEVEL!"
if !COPY_CODE! GEQ 8 (
 echo [XATO] Robocopy nusxalash xatosi: !COPY_CODE!
 goto :fail
)
if exist "%SOURCE%\.env.example" copy /Y "%SOURCE%\.env.example" "%DEST%\.env.example" >nul
cd /d "%DEST%"

echo.
echo [3/6] NPM o'rnatish va API testlari...
call npm.cmd install --include=dev --no-audit
if errorlevel 1 goto :fail
call npm.cmd run test:api
if errorlevel 1 goto :fail

echo.
echo [4/6] Production build...
call npm.cmd run build
if errorlevel 1 goto :fail

echo.
echo [5/6] O'zgarishlar xavfsizligi...
git add -A
if errorlevel 1 goto :fail
git diff --cached --check
if errorlevel 1 (
 echo [XATO] Oq bo'sh joy yoki Git diff muammosi. Natijani yuboring.
 goto :fail
)
git diff --cached --quiet
if not errorlevel 1 (
 echo [MA'LUMOT] GitHub bilan bir xil kod. Push uchun yangi o'zgarish yo'q.
 goto :success
)
git status --short

echo.
echo [ESLATMA] Hozir haqiqiy Click yoki Payme yoqilmaydi, faqat naqd to'lov oqimi.
echo [ESLATMA] Bu amal server kodini 4.2 ga yangilaydi, APK faylini avtomatik chiqarmaydi.
set /p "OK=GitHub main ga push qilish uchun Y yozing: "
if /I not "!OK!"=="Y" goto :cancel

echo.
echo [6/6] Commit va push...
git commit -m "SHODS SHOP 4.2 - compact Android UI cash orders and admin monetization"
if errorlevel 1 goto :fail
git pull --rebase origin main
if errorlevel 1 goto :fail
git push origin main
if errorlevel 1 goto :fail

echo.
echo [TAYYOR] GitHub push muvaffaqiyatli. Render avtomatik deploy boshlaydi.
:success
echo Tekshirish: https://dashboard.render.com/web/srv-dbqrbie1egvs73cvu1p0
pause
exit /b 0

:cancel
echo [BEKOR] GitHub ga hech nima yuborilmadi.
pause
exit /b 2

:fail
echo.
echo [XATO] GitHub push bajarilmadi. Yuqoridagi xatoni yuboring.
echo Vaqtinchalik nusxa: "%DEST%"
pause
exit /b 1
