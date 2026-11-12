# SHODS SHOP — Internetda ishlaydigan pilot versiya

Bu paket SHODS SHOP’ning React/Vite + Node.js veb-ilovasini **Neon PostgreSQL** bilan ishlashga tayyorlaydi. Android Studio talab qilinmaydi. Telefon uchun PWA manifest mavjud.

**Holat:** Backend sinovdan o‘tdi. SHODS SHOP uchun Neon loyihasi va `shods_app_state` jadvali yaratildi. Ammo ommaviy Render serveri hali chiqarilmadi: Render ish maydoni tanlovi va Git repozitoriy havolasi kerak. Onlayn domen hozircha YO‘Q.

## Tizim qanday ishlaydi

- `NODE_ENV=production` bo‘lganda `DATABASE_URL` majburiy, aks holda server ishga tushmaydi. JSON-ga jim o‘tib ketmaydi.
- Mahsulot/xizmatlar, buyurtmalar, sharhlar, murojaatlar, foydalanuvchilar va **sessiyalar** PostgreSQL’dagi `shods_app_state` JSONB hujayrasida saqlanadi. Sessiya tokenining o‘zi emas, uning SHA-256 xeshi saqlanadi.
- Bitta talaba sotuvchi ham xaridor ham bo‘la oladi. Savat, miqdor, narx summasi, lokatsiya, demo to‘lov, reyting, AI yordamchi va admin panel saqlangan.
- O‘zbek, rus, ingliz tillari va yorug‘/qorong‘i rejim mavjud.
- Muhim: **bu dastlabki bitta-serverli pilot**. JSONB umumiy holat mexanizmi parallel serverlar uchun emas. Katta hajm, bir nechta Render instansiya, haqiqiy to‘lov yoki katta auditoriya oldidan foydalanuvchilar, e’lonlar, buyurtmalar, stock, sessiyalarni alohida SQL jadvallariga ajratish va tranzaksiyalarni to‘liq yozish shart.

## Lokal ishga tushirish (Windows PowerShell)

ZIP’ni alohida papkaga oching. VS Code terminalida:

```powershell
npm.cmd install
npm.cmd run dev
```

`http://localhost:5173/` ni oching. Lokal rejimda (DATABASE_URL bo‘lmasa) `server/data/db.json` fayli ishlatiladi; demo hisoblar shu rejim uchun.

Sinov:

```powershell
npm.cmd run test:api
npm.cmd run build
```

## Neon bazasi bilan sinash

1. Neon konsolida SHODS SHOP loyihasi uchun **pooled** Connection string oling. Buni GitHub, chat yoki screenshotsga qo‘ymang.
2. PowerShell terminalda vaqtincha o‘rnating:

```powershell
$env:DATABASE_URL="postgresql://..."   # haqiqiy qiymatni Neon konsolidan oling
$env:SEED_DEMO="0"
npm.cmd run db:check
npm.cmd run dev
```

**Eslatma:** yuqoridagi buyruqda demo o‘chirilganligi sababli katalog dastlab bo‘sh bo‘ladi. Neon’ga boshqa loyiha parolini ulab yubormang.

## Admin yaratish

Baza ulanib bo‘lgach, avval barcha SHODS server instansiyalarini to‘xtating (ma’lumotni yangilovchi parallel server qolmasin). Keyin aynan shu Neon `DATABASE_URL` bilan:

```powershell
npm.cmd run admin:create
```

Kuchli parol yarating, kodga yozmang. Keyin serverni qayta yoqing. Ushbu skript faqat birinchi adminni yaratadi, internetdan hammaga ochiq admin ro‘yxati YO‘Q.

## Render’da internetga chiqarish

1. Loyiha papkasini **maxfiy ma’lumotlarsiz** GitHub repozitoriyga yuklang (`.env` va `server/data/*.json` Git’da bo‘lmasin).
2. Render’da yangi **Web Service** yaratib repozitoriyni tanlang yoki `render.yaml` Blueprint’dan foydalaning.
3. Node runtime, region Frankfurt, build: `npm install && npm run build`, start: `npm start`, health endpoint: `/api/health`.
4. Environment: `DATABASE_URL` (Neon’dan maxfiy), `NODE_ENV=production`, `COOKIE_SECURE=1`, `SEED_DEMO=0`.
5. HTTPS domenni oching va `/api/health` javobida `database.storage = postgres` borligini tekshiring.
6. HTTPS’da telefon brauzeridan PWA’ni o‘rnatish mumkin (brauzer qo‘llashiga qarab).

**Render Free** paketida servis uyquga ketishi va birinchi so‘rov kechikishi mumkin. Rasm va portfolio hozir limitlangan base64 formatida JSONB’da, ko‘payganda obyekt xotirasi (S3-compatible bucket) kerak.

## Demo va haqiqiy xizmatlarni adashtirmang

- **To‘lov:** faqat demo, real pul olinmaydi. Real to‘lov uchun to‘lov provayderining server-side callback/webhook, tranzaksiya va audit integratsiyasi zarur.
- **Telegram:** bot tokeni va nomi berilsa foydalanuvchi Telegram botni ochib tasdiqlaydi. SMS yuborish mavjud emas. Bot konfiguratsiyasiz pilot registratsiya ochiq; ommaviy launchdan oldin autentifikatsiya suiiste’molini tekshirish va tasdiqlashni majburiy qilish kerak.
- **AI:** kalitsiz katalog qidiruvi, shablon tavsif, narx medianasi va rasm dHash. Haqiqiy rasm tushunish uchun serverda `GEMINI_API_KEY` kerak.
- **Xakaton demo ma’lumotlari:** production uchun avtomatik yaratish o‘chirilgan. Sinov buyurtmalarini real sotuv deb ko‘rsatmang.
- **Maxfiylik:** qurilmadan GPS olish faqat ruxsat bilan. Haqiqiy telefon, karta, parolni ochiq loglarga yozmang.

## Eski JSON ma’lumotlarini ko‘chirish

`server/data/db.json` originalini zaxiralang. Migratsiya skripti mavjud, lekin demo hisoblar bo‘lgan bazani avtomatik ko‘chirishdan **ataylab bosh tortadi**. Haqiqiy ma’lumotlar bilan ishlashdan oldin demo hisoblarni olib tashlash, password reset va ma’lumot egalarining roziligini tekshirish kerak.

```powershell
npm.cmd run db:import -- "C:\\backup\\db.json"
```

Skript mavjud foydalanuvchi yoki buyurtma ma’lumotini ustidan yozmaydi. Faqat bo‘sh bazaga ko‘chirish uchun.

## Server strukturasi

- `server/index.mjs`: API, autentifikatsiya, buyurtmalar, admin, AI.
- `server/storage.mjs`: lokal JSON / PostgreSQL umumiy adapter, versiya nazorati.
- `server/db-check.mjs`: PostgreSQL ulanish va sxema tekshiruvi.
- `server/create-admin.mjs`: birinchi adminni yaratish.
- `server/import-json.mjs`: shartli bir martalik JSON migratsiya.
- `src/`: uch tilli frontend va PWA.

**Texnik chek:** hozircha PostgreSQL orqali onlayn end-to-end test yakunlanmagan; lokal API smoke test o‘tgan. Ommaviy foydalanishdan oldin xavfsizlik, maxfiylik, fayl yuklash va yuqori yuklamaga qo‘shimcha sinov o‘tkazing.

## GitHub push OLDIDAN — Telegram va Gemini integratsiya sinovi

1. `https://t.me/BotFather` da `/newbot` orqali bot yarating, username va tokenni oling. Bot xabari **SMS emas, Telegram xabari**.
2. `https://aistudio.google.com/api-keys` da Gemini API kaliti yarating. Bu API alohida hisob-kitob asosida ishlaydi.
3. `.env.example` dan **.env** nusxasini yasang. Unda `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` va `GEMINI_API_KEY` qiymatlarini saqlang. **Bu faylni hech qayerga jo‘natmang va commit qilmang.**
4. `npm.cmd run integrations:check` buyrug‘i bilan bot nomi/tokeni, avvalgi webhook bor-yo‘qligi va AI model ruxsatini tekshiring.
5. `npm.cmd run dev` orqali SHODS SHOP’da yangi profil oching; Telegram botdagi **START** tugmasini bosib, saytga qayting va «Tekshirish»ni bosing. Tasdiqdan keyin ro‘yxatdan o‘ting.
6. AI menyusida **tavsif yaratish** va **rasm orqali tekshirish**ni bajaring. Natijada `engine: gemini` yoki `gemini-vision` bo‘lishi kerak (demo shabloni emas). AI tekshiruvi o‘xshashlikni taxmin qiladi, aniq nusxa ekanini isbotlamaydi.
7. `npm.cmd run test:api`, `npm.cmd run build` va `git status --short` ni bajaring. `.env`, server ma’lumotlari yoki API tokenlari Git’ga tushmaganini ko‘ring; **shundan keyin push**.

**Eslatma:**  `.env` fayli Node.js 20.19+ orqali avtomatik yuklanadi. Agar ikki joyda bir bot `getUpdates` ishlatsa, `409 Conflict` chiqadi. Botga avval webhook o‘rnatilgan bo‘lsa, bitta polling rejimini tanlash kerak.
**Haqiqiy texnik ulanishni tasdiqlash uchun kalitlar foydalanuvchining o‘z kompyuterida berilib, test bajarilishi kerak; bu ZIP maxfiy kalitlarni o‘z ichiga olmaydi.**
