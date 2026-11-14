# SHODS SHOP 4.1 — haqiqiy Android ulanishi va mobil dizayn

## Nima aniqlandi

2026-11-14 holatida Render sayti 3.1 versiyada, eski APK esa 4.0 kodidan yig‘ilgan. Android WebView `https://localhost` originidan chiqadi va Render’dagi backend 4.1 API + CORS + Bearer sessiyasini qo‘llamaguncha to‘liq ishlamaydi. APK `localhost` bazasiga **bevosita** ulanmaydi; bir xil **HTTPS Node.js API** orqali Neon/PostgreSQL ga ulanadi.

Render loglarida `Telegram:on` va `Telegram webhook configured` yozuvlari ko‘rinadi. Bu konfiguratsiya borligini bildiradi, lekin haqiqiy telefondan OTP yuborish oxirigacha ishlaganini isbotlamaydi. Mahalliy `AI:off Telegram:demo` natijasi esa lokal `.env` fayli yo‘qligi yoki bo‘shligidan kelishi mumkin.

## Qanday ishlaydi

- Web: `https://shods-shop.onrender.com` → Render API → mavjud PostgreSQL.
- Android APK: telefon interfeysi (ichiga yig‘ilgan) → ayni Render HTTPS API → **o‘sha** PostgreSQL.
- Ma’lumotlar bazasi URL APK ichiga kiritilmaydi. `DATABASE_URL` maxfiy qiymati faqat Render Environment’da bo‘ladi.
- Mahsulotlar, sotuvchi/xaridor hisobi, reklama, yangiliklar, chat, buyurtmalar va Telegram bir xil server orqali ishlaydi.
- Yangi API’da `/api/health` Android qobiliyatini bildiradi; ilova eski serverni aniqlab aniq ogohlantiradi.

## 1. Avval mavjud jonli bazani saqlang

Render: `SHODS-SHOP` → Environment’da `DATABASE_URL` qaysi PostgreSQL xizmatiga tegishli ekanini tekshiring, **qiymatini hech kimga yubormang**. Zaxira nusxa oling. Boshqa Neon loyihasiga ko‘r-ko‘rona almashtirmang: ilgari yaratilgan `shods-shop` Neon loyihasining asosiy state jadvali bo‘sh chiqdi, jonli sayt shu bazani ishlatayotgani isbotlanmagan. `DATABASE_URL`, `TELEGRAM_BOT_TOKEN` va `GEMINI_API_KEY` o‘zgartirilmaydi.

## 2. Avval Web/Render backend 4.1 ga yangilansin

`SHODS_SHOP_4_1_GITHUB_PUSH.cmd` ni shu ZIP’ning asosiy papkasida ishga tushiring. Skript:

1. GitHub’dagi mavjud repozitoriyni yangi vaqtinchalik papkaga klonlaydi;
2. 4.1 kodlarini nusxalaydi, `.git` va maxfiy `.env`ni almashtirmaydi;
3. npm paketlarini o‘rnatib, 8 ta API testi va production buildni tekshiradi;
4. Sizdan push qilishga tasdiq oladi;
5. GitHub `main` ga push qiladi; Render auto deploy yoqilgan bo‘lsa, yangilanadi.

Pushdan so‘ng Render deploy `Live` bo‘lishi kerak. So‘ng `API_STATUS_TEKSHIR.cmd`ni oching: `Version: 4.1.0`, `Android tayyormi: HA`, `Baza: postgres connected` holatini kuting. `API_STATUS_TEKSHIR.cmd` faqat o‘qiydi, hech qanday ma’lumotni o‘zgartirmaydi.

## 3. Keyin Android APK tayyorlang

Windows kompyuterga Node.js LTS, Android Studio va Android SDK kerak. Shu papkada `ANDROID_APK_YASASH.bat`ni oching. U npm paketlari, test, build, `npx cap add/sync android` va Gradle debug buildni bajaradi. Android SDK sozlangan bo‘lsa APK:

`android\app\build\outputs\apk\debug\app-debug.apk`

Agar Gradle build bajarilmasa Android Studio’da shu loyihaning `android` papkasini oching va `Build → Build Bundle(s)/APK(s) → Build APK(s)` ni tanlang. Eski APK’ni o‘chirib, yangisini o‘rnating. `@capacitor/browser` Telegram havolasini telefonning tashqi brauzer oynasida ochadi; bot ochilgach `Start`ni bosing va OTP kodni ilovaga qaytib kiriting.

## 4. Telefon orqali amaliy sinov

1. APK’ni oching — bosh sahifada SHODS SHOP mobil menyu, qidiruv, dinamik reklama, mahsulot kartalari chiqishi kerak.
2. Kirish/ro‘yxatdan o‘tish sahifasiga boring. Telegram botga o‘tib `Start` va 6 xonali kodni tekshiring. `TELEGRAM_NOT_CONFIGURED` chiqsa, Render Environment’dagi bot sozlamalari va loglarni tekshiring.
3. Kirganingizdan so‘ng sotuvchi rejimida mahsulot qo‘shing. Xuddi shu e’lon Web katalogida chiqishini tekshiring.
4. Web’dan buyurtma bering va APK’da sotuvchi holatini ko‘ring.
5. APK’dagi SHODS AI ga savol yuboring; javob server orqali keladi, Gemini kaliti APK’da saqlanmaydi.

## Hozirgi cheklovlar

- Ushbu ZIP **tayyor `.apk` fayl emas**; APK Android SDK/Gradle orqali kompyuteringizda yig‘iladi.
- O‘zgarishlar hozircha GitHub, Render yoki Neon’ga yuborilmadi. Shu sabab yangi APK hozirgi Render 3.1 bilan ishlamaydi.
- `npm run test:api` — 8 ta test o‘tdi. JSX sintaksisi TypeScript parseri bilan tekshirildi. Ushbu muhitda npm paketlarini internetdan olish imkoni bo‘lmagani uchun to‘liq Vite build va haqiqiy telefondagi sinov **hali tasdiqlanmagan**.
- Telegram webhook testlari mock qilingan; telefon orqali real Telegram yuborish/olish alohida sinov talab qiladi.
- Haqiqiy Click/Payme pul yechish hali yoqilmagan. Mahsulotni qabul qilib, keyin naqd to‘lovni tasdiqlash oqimi mavjud.
- Admin panel faqat `admin` roliga ochiladi. Muhim ma’lumotlarni ishlab turgan bazadan o‘chirmang.

Agar `API_STATUS_TEKSHIR.cmd` da `Version: eski API` yoki `Android tayyormi: YOQ` chiqsa, muammo APK’da emas — server hali yangilanmagan.
