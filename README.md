# SHODS SHOP 3.0 — barcha manba kodlar (2026-11-13)

**React + Vite + Node.js + PostgreSQL (Neon) + Gemini + Telegram bot + PWA**.
Bu ZIP *faqat patch emas*: loyiha kodining to‘liq nusxasidir. Android Studio kerak emas.

## Hozir mavjud funksiyalar

- Uch tilda interfeys (o‘zbekcha, ruscha, inglizcha); kunduzgi va qorong‘i rejim.
- Bitta hisobda sotuvchi va xaridor kabineti; institut, fakultet, yo‘nalish, kurs ma’lumotlari.
- Moddiy va raqamli mahsulotlar, talabalar xizmatlari; qidiruv, saralash va turkumlar.
- Mahsulot uchun **bitta rasm**, oldindan ko‘rish, avtomatik siqish, server media API va PostgreSQL saqlash.
- Savat, miqdor, narx, demo to‘lov va buyurtma statuslari; mahsulot manzili va xarita havolasi.
- Bajarilgan buyurtmadan keyingi sharhlar va baholash; sotuvchining ommaviy profili.
- Gemini AI yordamchi (serverdagi API kalit bilan) va kalitsiz bazaviy katalog algoritmlari.
- Telegram orqali ro‘yxatdan o‘tishni 6 xonali kod bilan tasdiqlash (production’da HTTPS webhook).
- Qo‘llab-quvvatlash, admin moderatsiyasi, PWA manifest va service worker.

### SHODS SHOP 3.0 yangiliklari

- **Jonli reklama bannerlari:** bosh sahifada 5,5 soniyada avtomatik almashadi, foydalanuvchi vaqtincha to‘xtatishi mumkin. Admin banner yaratadi, rasm va o‘tish sahifasini belgilaydi, e’lonni faollashtiradi yoki o‘chiradi.
- **Yangiliklar va takliflar:** saytning ommaviy `Yangiliklar` sahifasi, admin uchun nashr/qoralama/tahrirlash/o‘chirish; o‘zbekcha, ruscha va inglizcha matn kiritish mumkin (mavjud bo‘lmasa o‘zbekchasi ko‘rinadi).
- **Bildirishnomalar:** admin taklif yoki yangilikni e’lon qilganda `Barchaga bildirishnoma yuborish` katagiga belgi qo‘yadi. Talabalar qo‘ng‘iroqchada xabar oladi; o‘qilgan holat har bir foydalanuvchida mustaqil. Ichki chat, buyurtmalar va topshiriq takliflari ham xabar hosil qiladi. Hozir bildirishnoma **ilova ichida** (Telegram ommaviy xabar/telefon push emas).
- **Xaridor–sotuvchi chati:** mahsulot sahifasidan suhbat ochish va xabar yuborish; xabarlar faqat suhbat ishtirokchilariga ko‘rinadi.
- **Topshiriq–takliflar doskasi:** xaridor bajariladigan ishni e’lon qiladi, talaba narx va izoh bilan taklif yuboradi, xaridor ijrochini tanlaydi.
- **Narx chegirmasi:** sotuvchi ixtiyoriy eski narxni kiritishi mumkin, kartada eski va yangi narx ko‘rinadi.
- **Admin-only boshqaruv:** reklama/yangiliklar, foydalanuvchi bloklash, e’lon moderatsiyasi, support, sharhlar va audit uchun server darajasida admin huquqi tekshiriladi; talaba admin paneliga kira olmaydi.

**Ataylab yo‘q:** portfolio (foydalanuvchi so‘roviga ko‘ra olib tashlangan), haqiqiy bank to‘lovi. To‘lov faqat `demo`. Keyinchalik haqiqiy to‘lov provayderi alohida xavfsiz ulanish bilan yoqiladi.

## Yangi Windows kompyuterida ishga tushirish

1. [Node.js](https://nodejs.org/) 20.19+ (tavsiya: LTS), VS Code va kerak bo‘lsa Git o‘rnating.
2. ZIP’ni oching. `SHODS_SHOP` papkasini VS Code’da oching.
3. Terminalga quyidagini kiriting:

```powershell
npm.cmd install
Copy-Item .env.example .env
notepad .env
npm.cmd run test:api
npm.cmd run build
npm.cmd run dev
```

`http://localhost:5173` sahifasini oching. `Copy-Item` mavjud `.env` bo‘lsa uni almashtirmasligi mumkin; eski kompyuterdagi maxfiy kalitlarni GitHub’ga yuklamang.

**Osonroq:** papka ichidagi `ISHGA_TUSHIR.bat` faylini ishga tushiring. Dastlab kerakli paketlar internet orqali o‘rnatiladi. Windows PowerShell'da `npm` bloklansa, `npm.cmd` foydalaning.

### Ma’lumotlar bazasi

- Lokal sinov: `.env` ichidagi `DATABASE_URL=` bo‘sh qolsin; lokal fayl `server/data/db.json` yaratiladi. Bu Render’dagi haqiqiy ma’lumotlar **emas**.
- Onlayn Neon bilan sinov: Neon konsolidan **mavjud SHODS SHOP bazasining** connection string’ini yangi kompyuterning `.env` fayliga yozing (maxfiy). Shunda o‘sha bazaga ulanadi. Avval zaxira va `npm.cmd run db:check` bilan tekshiring.
- **Bazani ko‘chirmang yoki qayta yaratmang** — foydalanuvchilar, buyurtmalar va rasm ma’lumotlarini saqlab qolish uchun mavjud bazani ulang. `db:import` buyrug‘ini aniq migratsiya rejasisiz bajarmang.
- `NODE_ENV=production` bo‘lsa, `DATABASE_URL` majburiy. `SEED_DEMO=0` ma’qul.

### Telegram va AI

`.env.example` dan `.env` yarating, quyidagilarni shaxsiy kalitlar bilan to‘ldiring:

```dotenv
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
TELEGRAM_PUBLIC_URL=https://shods-shop.onrender.com
```

Render’dagi **Environment** qiymatlarini o‘zboshimchalik bilan o‘zgartirmang. Bot production rejimda HTTPS webhook bilan ishlaydi; mahalliy `localhost` webhook manzili bo‘la olmaydi. Gemini kaliti brauzerga berilmaydi. Kalitlarni chatga, GitHub’ga, ZIP ichiga yoki skrinshotga qo‘ymang.

Tekshiruv: `npm.cmd run integrations:check` (haqiqiy API kalitlari bo‘lsa), so‘ng `npm.cmd run test:api` va `npm.cmd run build`.

### Administrator

Admin yaratilgan bo‘lsa, **yangi kompyuterda qayta yaratish shart emas**. Admin Render’da ishlayotgan ayni bazada saqlangan bo‘lishi kerak. Ma’lum bo‘lgan/leak bo‘lgan parolni almashtiring:

```powershell
npm.cmd run admin:reset
```

Bundan oldin `.env` aynan tegishli bazaga ulanayotganini `npm.cmd run db:check` orqali tekshiring. Yangi bo‘sh bazada ilk adminni yaratish uchun `npm.cmd run admin:create`.

### GitHub’ga xavfsiz push (boshqa kompyuterdan)

Agar GitHub’dagi mavjud SHODS-SHOP repozitoriysini yangilamoqchi bo‘lsangiz, **avval uni clone qiling**, keyin ZIP ichidagi fayllarni clone papkasiga nusxalang (lekin `.git` papkasini almashtirmang). Ushbu ZIP’da `.git` va `.env` yo‘q.

```powershell
git clone https://github.com/sardorbekhasanov579-source/SHODS-SHOP.git
cd SHODS-SHOP
# ZIP ichidagi SHODS_SHOP fayllarini ushbu papkaga ko‘chiring.
npm.cmd install
npm.cmd run test:api
npm.cmd run build
git status --short
git ls-files .env
git add .
git commit -m "Sync SHODS SHOP full source package"
git pull --rebase origin main
git push origin main
```

`git ls-files .env` **hech narsa chiqarmasligi kerak**. `CONFLICT` bo‘lsa push qilmang, avval nizoni hal qiling. `git push --force` ishlatmang.

### Render

Mavjud xizmat: https://shods-shop.onrender.com (Render Free). Render’da build `npm install && npm run build`, start `npm run start`, health check `/api/health`.
`DATABASE_URL`, `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN` kabi maxfiy qiymatlar GitHub’da emas, faqat Render Environment’da saqlanadi. Free rejimdagi uyqu chegarasi shu to‘liq kod bilan o‘zgarmaydi; pullik tarifni hozir yoqmaymiz.

## Kodlar tuzilishi

- `src/App.jsx` — ilovaning sahifalari va foydalanuvchi interfeysi.
- `src/i18n.js`, `src/adminI18n.js`, `src/v3i18n.js` — tarjimalar.
- `src/style.css` — ko‘rinish, responsive, dark mode.
- `server/index.mjs` — API, buyurtmalar, AI, Telegram, admin.
- `server/storage.mjs` — Postgres / lokal saqlash va media.
- `server/create-admin.mjs`, `server/reset-admin.mjs`, `server/db-check.mjs` — boshqaruv buyruqlari.
- `server/tests/` — avtomatik API sinovlari.
- `public/` — PWA ikonkalar, manifest va service worker.
- `docs/` — xakaton materiallari.

**Sinov holati:** 6 ta Node API testi muvaffaqiyatli o‘tdi (shu jumladan yangiliklar, bildirishnoma, admin ruxsatlari, reklama, chat, topshiriqlar, Telegram va Gemini mock sinovlari). TypeScript parseri bilan React JSX sintaksisi ham tekshirildi. Ushbu muhitda `npm install` registry DNS xatosi (`EAI_AGAIN`) bilan yakunlandi, shu sabab **to‘liq React build va jonli Render end-to-end sinovi tasdiqlanmagan**. Yangi kompyuterda `npm.cmd install`, `npm.cmd run test:api`, `npm.cmd run build` bajarib, saytni ishlatib tekshiring. Ishlab turgan Neon bazasi ma’lumotlariga hech qanday o‘zgartirish kiritilmadi.
