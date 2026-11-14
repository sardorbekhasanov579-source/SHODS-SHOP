# SHODS SHOP 4.0 — veb-sayt va Android APK (bir xil server)

## Ushbu ZIP ichida nimalar bor?

- Avvalgi SHODS SHOP 3.1 ning asosiy ko‘k–moviy dizayni, animatsiyali admin reklamalari, yangiliklar, chat, xizmatlar, Gemini va Telegram kodlari saqlangan.
- **Yangi buyurtmalar**: mahsulotni olgandan keyin to‘lash (`pay_on_receipt`). Checkout paytida avtomatik "to‘landi" deb yozilmaydi.
- Buyurtma oqimi: `new` → `accepted` → `handed_over` → **xaridor tasdiqlaydi** → `received` → **naqd pul berilganini xaridor bildiradi** → **sotuvchi olganini tasdiqlaydi** → `completed`, `paid`.
- Click va Payme **hozir ulanmagan**; tugma orqali sun’iy "to‘landi" holati yaratilmaydi. Merchant shartnomasi, provayder ma’lumotlari va imzolangan callback tekshiruvisiz haqiqiy to‘lov faollashtirilmaydi.
- Android uchun Capacitor 7 boshlang‘ich loyiha konfiguratsiyasi qo‘shilgan. Frontend APK ichida ishlaydi, **HTTPS API** esa saytniki bilan bir xil: `https://shods-shop.onrender.com`. Login va buyurtmalar bitta server orqali ishlaydi.

## Windows'da saytni ishga tushirish

`package.json` joylashgan papkada CMD/PowerShell:

```cmd
npm.cmd install
npm.cmd run test:api
npm.cmd run build
npm.cmd run dev
```

Sayt: `http://localhost:5173`

Lokal muhitda `DATABASE_URL` bo‘lmasa alohida test JSON bazasi ishlaydi. **Jonli Neon ma’lumotlari o‘zgarmaydi.** Render'dagi maxfiy `DATABASE_URL`, Gemini va Telegram kalitlarini `src`/GitHub'ga yozmang. Avval zaxira nusxasini oling.

## Android APK yaratish — Windows + Android Studio

1. [Android Studio](https://developer.android.com/studio) ni o‘rnating; SDK va Android emulator/USB telefonni sozlang.
2. ZIP’ni oching. `ANDROID_APK_YASASH.bat` ni ikki marta bosing. U `npm install`, API testlari, `vite build`, `npx cap add android` va `npx cap sync android`ni bajaradi.
3. Android Studio oynasi ochiladi. **Build > Build Bundle(s) / APK(s) > Build APK(s)** ni tanlang.
4. DEBUG APK: `android/app/build/outputs/apk/debug/app-debug.apk`.
5. Telefonga o‘rnatib, login, mahsulot, chat va to‘lov jarayonini sinang.

Ilova identifikatori: `uz.shodsshop.app`. Google Play nashri uchun release signing key, Play Console akkaunti, maxfiylik siyosati, ilova testlari va siyosat tekshiruvi kerak bo‘ladi. Debug APK Play Store versiyasi emas. Bu ZIP **tayyor .apk fayli emas**, APKni yaratish uchun to‘liq manba kodidir.

**Mobil API xavfsizligi:** Android’da foydalanuvchi sessiya tokeni vaqtincha xotirada saqlanadi; ilova yopilib qayta ochilgach qayta login talab qilinishi mumkin. Bu bosqichda parollar/tokensiz noaniq saqlash yo‘q. Android origin `https://localhost` bo‘lib, server faqat ushbu va aniq belgilangan boshqa mahalliy originlarga CORS ruxsat beradi. Sayt esa avvalgidek HTTP-only cookie sessiyasidan foydalanadi. Ilova va web sahifasi **bir xil Neon bazasiga** API orqali ulanadi.

## Ayni paytdagi to‘lov holati

| Holat | Kim tasdiqlaydi? | Pul yechiladimi? |
| --- | --- | --- |
| Buyurtma berildi | Xaridor | Yo‘q |
| Qabul qilindi / tayyorlanmoqda | Sotuvchi | Yo‘q |
| Topshirildi | Sotuvchi | Yo‘q |
| Mahsulot qabul qilindi | Xaridor | Yo‘q |
| Naqd pul berdim | Xaridor | Tizim onlayn pul yechmaydi |
| Naqd pul olindi | Sotuvchi | Buyurtma naqd to‘langan deb qayd etiladi |
| Click/Payme | Hozir o‘chiq | Merchant ulanmaguncha **yo‘q** |

Sotuvchi xaridor tasdig‘isiz yangi buyurtmani `completed` qilishga haqli emas. Xaridor esa o‘zi `paid` deb qo‘ya olmaydi. Nizoli buyurtmalarda hozir qo‘llab-quvvatlash bo‘limi mavjud. Kelajakda pulni platforma orqali qabul qilish uchun tijorat shartnomalari, huquqiy hisob-kitoblar va provayder integratsiyasi zarur.

## Production deploy'dan oldin

1. Jonli bazaning **haqiqiy DATABASE_URL manbasini aniqlang** va zaxira oling. Noto‘g‘ri Neon proyektga ulanib, foydalanuvchilarni yo‘qotib qo‘ymang.
2. GitHub’ga push **faqat test/build o‘tgach**; `SHODS_SHOP_4_GITHUB_PUSH.cmd` scripti alohida vaqtinchalik klonda ishlaydi va push oldidan `Y` deb tasdiq so‘raydi.
3. Render avtomatik deploy yoqilgan; `main` ga push jonli saytni almashtiradi. $7 lik tarifga avtomatik o‘tish yo‘q.
4. Website va Android API’ga ulanish uchun Render xizmati internetda mavjud bo‘lishi kerak. Free server uxlab qolishi mumkin.
5. Telefon bildirishnomalari (OS push) uchun FCM, real Click/Payme uchun merchant credentials va callbacklar — **keyingi bosqich**. Hozirgi sayt ichidagi xabarlar ishlashda davom etadi.

## Tarmoq cheklovi bilan sinov

Bu paketni tayyorlash muhitida npm registry'dan paketlarni olish mumkin bo‘lmadi. `node --test server/tests/*.test.mjs` orqali **7 ta API testi o‘tdi**, `tsc --jsx preserve` orqali JSX sintaksisi tekshirildi. **Vite production build va haqiqiy Android APK hosil qilish bu muhitda bajarilmagan.** Windows’da yuqoridagi buyruqlar bilan tekshiring; build xatosi chiqsa push qilmang.
