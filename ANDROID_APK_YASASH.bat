@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"
title SHODS SHOP 4.2 Android APK
if not exist "package.json" (
 echo [XATO] package.json topilmadi. BAT fayl asosiy loyiha papkasida turishi kerak.
 goto :fail
)
echo ================================================
echo SHODS SHOP 4.2 - Android APK tayyorlash
echo ================================================
echo [1/5] Paketlar va Capacitor Browser o'rnatilmoqda...
call npm.cmd install --include=dev --no-audit
if errorlevel 1 goto :fail
echo [2/5] Backend API testlari...
call npm.cmd run test:api
if errorlevel 1 goto :fail
echo [3/5] Web/Android interfeysi yig'ilmoqda...
call npm.cmd run build
if errorlevel 1 goto :fail
echo [4/5] Android loyihasi sinxronlanmoqda...
if not exist "android\gradlew.bat" (
 call npx.cmd cap add android
 if errorlevel 1 goto :fail
)
call npx.cmd cap sync android
if errorlevel 1 goto :fail
echo [5/5] Android APK debug build...
call "android\gradlew.bat" -p android assembleDebug
if errorlevel 1 (
 echo.
 echo [OGOHLANTIRISH] Gradle APK yig'a olmadi. Android SDK/JDK ni Android Studio'da sozlang.
 echo Android Studio ochish uchun: npx cap open android
 goto :studio
)
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
 echo.
 echo [TAYYOR] android\app\build\outputs\apk\debug\app-debug.apk
 echo [MUHIM] APK to'g'ri ulanishi uchun Render API 4.2 ga yangilangan bo'lishi kerak.
 pause
 exit /b 0
)
:studio
echo Android Studio orqali: Build - Build Bundle(s)/APK(s) - Build APK(s)
call npx.cmd cap open android
pause
exit /b 1
:fail
echo.
echo [TO'XTADI] Yuqoridagi xatoni o'qing. GitHub/Render/Neon o'zgarmadi.
pause
exit /b 1
