# SHODS SHOP — AI va Telegramni yoqish, keyin GitHub push

## 1. Oldingi loyihani saqlang
Eski papkani o‘chirmang. Yangi ZIP-ni alohida papkaga oching. Mahalliy `server/data/db.json` fayli bu yangi ZIP-ga kiritilmagan; avvalgi real ma’lumotlarni tasodifan yo‘qotmaslik uchun originalni alohida zaxiralang.

## 2. Lokal .env yaratish
PowerShell:

```powershell
Copy-Item .env.example .env
notepad .env
```

`.env` ichida quyidagi kalitlarga o‘zingizning qiymatlaringizni yozing:

```dotenv
TELEGRAM_BOT_TOKEN=<BotFather bergan token>
TELEGRAM_BOT_USERNAME=<bot_nomi_username>  # @ belgisiz
GEMINI_API_KEY=<Gemini API kaliti>
GEMINI_MODEL=gemini-3.5-flash-lite
```

`.env` da boshqa misol sozlamalar ham bor. **Hech qachon kalit, `.env` yoki tokenlarni ChatGPT ga, GitHub ga, screenshotga tashlamang.** Agar token oshkor bo‘lsa BotFather orqali darhol yangilang.

## 3. Telegram bot yaratish
- `https://t.me/BotFather` — `/newbot` buyrug‘ini yozing.
- Ko‘rinadigan nomi masalan `SHODS SHOP`, username masalan `shods_shop_uz_bot` (agar bo‘sh bo‘lsa boshqa nom tanlang).
- Token va username `.env` ga kiritiladi.
- **Telegram tasdiqlash SMS emas.** Talaba saytdan Telegramga o‘tib `/start ...` ni bosadi; tizim Telegram akkauntga bog‘lanishni tasdiqlaydi.
- Sayt profilingizdagi telefon raqamiga Telegram yoki SMS o‘zi yubora olmaydi. Haqiqiy telefon raqamni OTP bilan tasdiqlash uchun alohida SMS provayder kerak.
- Bitta botga bir vaqtda ikki `getUpdates` protsessi ishlamasligi va webhook yoqilmagan bo‘lishi kerak.

## 4. AI kaliti
- `https://aistudio.google.com/api-keys` dan server kaliti oling.
- Model rasm ko‘ra oladigan model bo‘lishi kerak. Tavsif, rasm taqqoslash va semantik xizmat qidirish Gemini API orqali bajariladi.
- Narx tavsiyasi oddiy katalog medianasidan olinadi (haqiqiy bozor narxi deb ko‘rsatilmaydi).
- Gemini API xarajati alohida hisoblanishi mumkin. Kalit faqat serverda ishlaydi.

## 5. Ishga tushirish

```powershell
npm.cmd install
npm.cmd run integrations:check
npm.cmd run dev
```

Brauzer: `http://localhost:5173/`.

## 6. Sinov qadamlar
1. «Ro‘yxatdan o‘tish» -> yangi talaba -> «Telegram botni ochish» -> botda Start.
2. Saytga qayting -> «Telegramni tekshirish» -> muvaffaqiyatli holat -> ro‘yxatdan o‘tish.
3. AI bo‘limida xizmat qidirish, tavsif yozish, rasm orqali tekshirishni sinang.
4. AI faqat haqiqiy katalogdagi sotuvchilarni ko‘rsatishi kerak. Tasvir tekshiruvi 100% identiklik kafolati emas.
5. Ro‘yxatdan o‘tgan boshqa talabadan savat va demo buyurtmani sinang; sotuvchi kelgan buyurtmani ko‘rsin.

## 7. GitHub push oldidan

```powershell
npm.cmd run test:api
npm.cmd run build
git status --short
```

`git status` da `.env` yoki `server/data/db.json` ko‘rinsa — to‘xtang, ularni Git'dan chiqarib tashlang. **`git add .env` qilinmaydi.** Bundan keyin repozitoriyga push qilasiz.

## 8. Render deploy
Lokal sinov o‘tgach Render Secret Env Vars’da ayni kalitlarni alohida joylashtiring. Neon `DATABASE_URL` ham Render’ga maxfiy qiymat sifatida beriladi; `.env` faylni serverga push qilish shart emas. `NODE_ENV=production` bo‘lganda Telegram bot sozlanmagan bo‘lsa tizim yangi ro‘yxatdan o‘tishni rad etadi.
