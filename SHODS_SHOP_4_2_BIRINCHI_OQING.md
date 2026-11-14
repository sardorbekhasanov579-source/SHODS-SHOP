# SHODS SHOP 4.2 — O‘rnatish

## Nimalar yangilandi

- Kirish va ro‘yxatdan o‘tish: parolni ko‘rsatish/yashirish ko‘zi (ko‘rinadigan, tugma sifatida accessible).
- Naqd pul: xaridor mahsulotni qabul qiladi, faqat sotuvchi pulni olganidan keyin «To‘landi» deb tasdiqlaydi. Xaridorning «pul berdim» tugmasi olib tashlandi.
- Sotuvchi buyurtmalari: Android pastki panelidagi «Sotish» sotuvchi kabinetini, avval «Kiruvchi buyurtmalar»ni ochadi; kutilayotgan buyurtmalar soni ko‘rinadi.
- Telefon menyusi va sahifalar: ixchamroq, oson boshqariladigan va moslashuvchan.
- Admin «Daromad va premium»: naqd reklama tushumini **haqiqatda olingandan keyin** qo‘lda qayd etish, 7 kun TOP yoki 30 kun SHODS PRO’ni qo‘lda faollashtirish. Hech qanday pul avtomatik yechilmaydi. Reklama admin paneli avvalgidek ishlaydi.
- TOP e’lonlar katalogda oldinroq chiqadi, PRO sotuvchiga belgi qo‘yiladi.
- Eski buyurtmalar, reklama, bildirishnomalar va boshqa foydalanuvchi ma’lumotlariga tegilmaydi.

## Kompyuterda tekshirish
1. ZIP ni oching, **package.json** bor papkada CMD oching.
2. `npm.cmd install`
3. `npm.cmd run test:api`
4. `npm.cmd run build`
5. `npm.cmd run dev`
6. Brauzer: http://localhost:5173

### Android APK
1. Serverni avval aynan shu versiya (4.2) qilib deploy qiling. Serverda haqiqiy DATABASE_URL va Telegram bot sozlangan bo‘lishi kerak; maxfiy kalitlarni APK’ga joylamang.
2. `ANDROID_APK_YASASH.bat` ni ishlating.
3. Android Studio’da Gradle Sync va Build APK. **Haqiqiy APK bu ZIP ichida yo‘q.**
4. Telefon orqali OTP, chat, buyurtma, sotuvchi naqd tasdiqlashi va reklama testlarini bajaring.

## GitHub
Kodlarni mavjud repositoryga nusxalaganda `.git`, `.env`, `node_modules` va mavjud `package-lock.json` ni ehtiyot qiling. Push Render’da avtomatik deploy boshlaydi. **Avval jonli bazani zaxiralang.**

## Cheklovlar
- Click/Payme va karta orqali pul olish *yo‘q*; faqat naqd hisob-kitob qayd etiladi.
- Admin tushum kiritadi, ammo bu bankning mustaqil to‘lov tekshiruvi emas.
- Android Studio, Android SDK, haqiqiy Neon va Telegram hisobida sinov alohida zarur.
- Desktop sayt va Android bitta API/backendlardan foydalanishi uchun server ham 4.2 versiyada bo‘lishi kerak.
