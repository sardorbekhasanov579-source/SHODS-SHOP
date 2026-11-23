# SHODS SHOP 4.3 — Web + Android APK yangilanishi

## Nimalar tayyor

- Web va Android bir xil Render API/Neon bazaga ulanadi (avvalgi arxitektura saqlangan).
- Android ilova versiyasi **4.3.0**. Android Gradle versiyasi yig‘ish vaqtida avtomatik `versionName 4.3.0`, `versionCode 40300` qilinadi.
- Ilova ochilganda va yana faollashganda (kamida 15 daqiqada bir) serverdan `GET /api/app/android-release` ni tekshiradi.
- Ilovada **Profil → Ilova yangilanishlari → Yangilanishni tekshirish** tugmasi bor.
- Yangi APK nashr qilinganda foydalanuvchiga banner chiqadi va **Yangilash** tugmasi xavfsiz HTTPS manzilni Android brauzerida ochadi.
- Hech qanday APK foydalanuvchining ruxsatisiz o‘rnatilmaydi.
- Sotuvchi buyurtma boshqaruvi, faqat naqd to‘lov, TOP/PRO, yangiliklar, reklama, chat, AI, Telegram mexanizmlari avvalgidek qoladi.

**MUHIM:** Bu arxiv **Android manba loyihasi**, unda hozir tayyor `.apk` yo‘q. Yig‘ish Windows + Android Studio/SDK va internet talab qiladi.

## 1. Birinchi ish: server va ma'lumotlar

1. SHODS SHOP 4.3 kodini avval mahalliy kompyuterda tekshiring:
   ```cmd
   npm.cmd install
   npm.cmd run test:api
   npm.cmd run build
   ```
2. Jonli bazaning zaxira nusxasini saqlang. *Render `DATABASE_URL` qiymatini o‘zgartirmang.*
3. 4.3 backendni GitHub `main` ga faqat testdan so‘ng push qiling; Render `Live` bo‘lsin.
4. `https://shods-shop.onrender.com/api/health` manzilida `version: 4.3.0`, `capabilities.android: true` ekanini tekshiring.
5. `https://shods-shop.onrender.com/api/app/android-release` hozir `releasePublished:false` qaytarishi NORMAL — hali APK nashr etilmagan.

## 2. Android APK yaratish

1. Windows’da Node.js, Android Studio, Android SDK va kerakli Java/JDK sozlangan bo‘lishi kerak.
2. Shu papkadagi `ANDROID_APK_YASASH.bat` ni ishga tushiring.
3. Skript paketlarni o‘rnatadi, API test va Vite buildni bajaradi, Capacitor Android’ni yaratadi/sinxronlaydi, Android versiyasini **4.3.0** qiladi va Gradle debug APK yig‘ishni sinab ko‘radi.
4. Yig‘ilsa, sinov APK shu yerda:
   `android\app\build\outputs\apk\debug\app-debug.apk`
5. Gradle bo‘lmasa, `npx.cmd cap open android` orqali Android Studio’da **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

**Eskisini ustiga o‘rnatish:** Oldingi APK bilan yangi APK **bir xil `appId` (`uz.shodsshop.app`) va bir xil imzo kalitida** bo‘lishi kerak. Android odatda versiya kodi oshganini ham talab qiladi. Har xil kompyuterdagi `debug.keystore`lar turlicha bo‘lishi mumkin, shuning uchun oldingi debug APK ustiga yangisini o‘rnatib bo‘lmasligi ehtimoli bor. Buning uchun doimiy saqlanadigan release signing keystore ishlating. Maxfiy kalitni GitHub/ZIPga joylamang.

**Eslatma:** Oldingi **4.2 APK’ning o‘zida versiya tekshiruvchi kod yo‘q**, shuning uchun u 4.3 chiqqanini avtomatik aytmaydi. 4.3’ni dastlab qo‘lda o‘rnatasiz; undan keyingi yangilanishlar uchun xabarnoma ishlaydi.

## 3. Keyingi versiyani e'lon qilish (masalan, 4.3.1)

1. Yangi APK’ni doimiy release signing kaliti bilan yig‘ing.
2. Uni ommaga ochiq, ishonchli **HTTPS** manzilga yuklang (masalan, GitHub Releases). Manzil haqiqiy `.apk` yuklanadigan URL bo‘lishi kerak.
3. Render → SHODS-SHOP → Environment bo‘limida:
   ```env
   SHODS_ANDROID_RELEASE_VERSION=4.3.1
   SHODS_ANDROID_APK_URL=https://SIZNING-ISHONCHLI-DOMEN/SHODS-SHOP-4.3.1.apk
   SHODS_ANDROID_RELEASE_NOTES=Interfeys va buyurtmalarda yaxshilanishlar
   ```
4. Render qayta ishga tushgach, Android 4.3.0 ilovasi yangi versiyani ko‘rsatadi.
5. `SHODS_ANDROID_RELEASE_VERSION` va URL bo‘sh bo‘lsa, tizim *hech qanday soxta yangilanish* ko‘rsatmaydi.

**Diqqat:** `SHODS_ANDROID_APK_URL` misoli haqiqiy manzil emas. Bu sozlamalarni APK ommaga joylanmaguncha Render’da kiritmang. Tugma o‘rnatishni avtomatik boshlamaydi: Android foydalanuvchining roziligini so‘raydi.

## 4. Test senariysi

- Web: ro‘yxatdan o‘tish, sotuvchi e’lon yaratishi, xaridor savati va naqd buyurtmani saqlanishi.
- Android: internetga kirish, mahsulotlar, Telegram botni tashqi brauzerda ochish, 6 xonali kodni kiritish, AI so‘rovi, sotuvchi buyurtmasi.
- Telefon: Profil → Yangilanishni tekshirish (APK nashr etilmagan bo‘lsa, xabar chiqmasligi kerak).
- Render’da amalda mavjud 4.3.1 release e’lon qilinsa, APK 4.3.0’da banner va URL ochilishini tekshirish.
- `INSTALL_FAILED_UPDATE_INCOMPATIBLE` bo‘lsa, imzo kaliti mos emas. **Avval ma’lumotlarni zaxiralamasdan va sessiya holatini tushunmasdan APK’ni o‘chirmang.**

## 5. Xavfsizlik va to‘lov

- Neon bazasiga avtomatik migratsiya yoki o‘chirish buyruqlari yo‘q.
- `.env` va maxfiy kalitlar ZIPga kiritilmaydi. `VITE_SHODS_API_URL` — ochiq API manzili, maxfiy kalit emas.
- Click/Payme haqiqatda faollashtirilmagan; faqat naqd to‘lov va sotuvchi tasdig‘i saqlanadi.
- APK shifrlangan HTTPS bo‘ylab API’ga ulanadi. Yangi APK faqat ishonchli manzildan yuklanadi.

## 6. Tekshiruv haqidagi eslatma

Serverning **11 ta avtomatik API testi** bu ish muhitida muvaffaqiyatli o‘tdi; Android versiya Gradle faylida avtomatik o‘zgartirilishi ham sinab ko‘rildi. JSX sintaksisi tekshirildi. Bu muhitda Android SDK va npm paketlari bo‘lmagani uchun **yakuniy Vite build va tayyor APK** yig‘ib tekshirilmagan. Windows’dagi ishga tushirish natijasini alohida tekshiring.
