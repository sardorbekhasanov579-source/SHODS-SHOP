# SHODS SHOP — Render, Neon, Telegram va Admin tuzatishlari

## Tuzatilgan xatolar

1. **`ENOTFOUND dpg-...`**: noto‘g‘ri / eski DATABASE_URL tufayli bo‘lgan. Render `Environment`da **shods-shop** Neon loyihasining to‘g‘ri pooled PostgreSQL connection stringi tursin. Eski xatolik tarixda qolishi mumkin, `Your service is live` keyingi muvaffaqiyatli deployni ko‘rsatadi.
2. **`DATABASE_VERSION_CONFLICT`**: HTTP yozuvlari Neon jadvalining `FOR UPDATE` blokirovkasi bilan ketma-ket bajariladi; bot va boshqa server bir vaqtning o‘zida yozuvlarni bosib yubormaydi.
3. **`Telegram polling error: fetch failed`**: ishlab chiqarish muhitida `getUpdates` polling olib tashlangan, Telegramning rasmiy `setWebhook` usuli ishlatiladi. Muhim: haqiqiy Telegramga ulanib ko‘rish kerak. Tarmoq yoki token xato bo‘lsa qayd paydo bo‘ladi.
4. **Telegram kodi**: foydalanuvchi saytning ro‘yxatdan o‘tish oynasida botni ochadi → Telegramda `Start` bosadi → **6 xonali kod** keladi → kodni saytga kiritadi → tasdiqlaydi → ro‘yxatdan o‘tadi. Kod 10 daqiqali, beshta noto‘g‘ri urinishdan keyin yangi kod kerak.
5. **Admin login**: server har API so‘rovida Neondan yangilangan holatni ko‘radi. CLI orqali yaratilgan adminni topish uchun `npm run db:check` dan foydalaning.

## Render Environment (SHODS-SHOP, boshqa xizmatga tegmang)

Quyidagilarni tekshiring yoki qo‘shing:

- `DATABASE_URL` — shods-shop Neon loyihasi **Pooled connection** URI (maxfiy)
- `NODE_ENV` = `production`
- `COOKIE_SECURE` = `1`
- `SEED_DEMO` = `0`
- `TELEGRAM_PUBLIC_URL` = `https://shods-shop.onrender.com`
- `TELEGRAM_BOT_TOKEN` — BotFather token (maxfiy)
- `TELEGRAM_BOT_USERNAME` — bot nomi, @ belgisiz
- `GEMINI_API_KEY` — Google kaliti (maxfiy)
- `GEMINI_MODEL` = `gemini-3.5-flash-lite` (API ro‘yxatida mavjudligini alohida tekshiring)

**Token, parol va `DATABASE_URL` ni chatga, GitHubga yoki rasmlarga kiritmang.**

## Kompyuteringizda yangi kodni push qilish

1. Bu ZIP arxivni alohida papkaga oching.
2. **Oldingi `.env` faylini lokal foydalanish uchun** yangi papkaga nusxalang; GitHubga push qilmang.
3. Terminal: `npm.cmd install`, `npm.cmd run test:api`, `npm.cmd run build`.
4. GitHub repo papkangizga yangi arxivdagi kod fayllarini ko‘chiring (`.env` ni ko‘chirmang). **Gitni boshqa repo ichida qayta `git init` qilmang.**
5. `git status`, `git ls-files .env` (bo‘sh bo‘lishi kerak), `git add .`, `git commit -m "Fix Telegram OTP webhook and Neon concurrency"`, `git push origin main`.
6. Render auto-deploy ishga tushadi. `Logs`da `Telegram webhook configured (OTP verification ready)` kutiladi.
7. Site: `https://shods-shop.onrender.com` → **Ro‘yxatdan o‘tish** → **Telegram botni ochish** → **Start** → Telegramdan kod → saytga kod.

Agar Telegramda kod kelmasa: Render logini tekshiring. `Telegram webhook configuration failed` chiqsa, bot tokeni, internet tarmog‘i, `TELEGRAM_PUBLIC_URL` va `@username` ni tekshiring. Bot oldindan boshqa serverda ishlayotgan bo‘lsa ham webhook yangi ishlab chiqarish serveriga yo‘naltiriladi; **kompyuterdagi eski polling serverini yoping**.

## Admin panelga kirish

- Kompyuteringizdagi `.env` DATABASE_URL Render bilan **bir xil shods-shop** Neon bazasini ko‘rsatsin.
- `npm.cmd run db:check` — `Administratorlar: 1` bo‘lishi kerak.
- `Administratorlar: 0` bo‘lsa `npm.cmd run admin:create` bilan admin yarating.
- Parol oldin chatga yozib yuborilgan bo‘lsa, `npm.cmd run admin:reset` bilan yangi **16+ belgili** parol yarating. Uni hech kimga yubormang.
- Onlayn sayt → **Kirish** → admin login va yangi parol → **Admin panel**.

## Sinov chegarasi

Lokal avtomatik API testlaridan 3 tasi o‘tdi. Google Gemini yoki Telegramning real serveri bilan end-to-end sinov foydalanuvchi tokenlari Renderda o‘rnatilgach o‘tkazilishi kerak. Free Render bo‘sh vaqtda uyquga ketishi mumkin, Telegram xabarlari server uyg‘ongunicha kechikishi ehtimoli bor.
