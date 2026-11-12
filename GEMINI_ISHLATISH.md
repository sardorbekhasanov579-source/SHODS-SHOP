# SHODS SHOP — Gemini 3.5 Flash-Lite ulanishi

Bu versiyada faqat serverdagi AI provayder Google Gemini API ga almashtirildi. Oldingi OpenAI API kaliti endi kerak emas. Telegram bot, Neon, xaridor va sotuvchi kabinetlari o‘zgarmadi.

## 1. Google AI Studio kaliti

https://aistudio.google.com/api-keys sahifasidan **Gemini API kalitini** yarating. Uni hech kimga yubormang. API narxi va kvotalar Google hisobingizga bog‘liq.

## 2. Windows VS Code terminalida

```powershell
Copy-Item .env.example .env
notepad .env
```

`.env` faylida:

```dotenv
GEMINI_API_KEY=SIZNING_MAXFIY_GEMINI_API_KALITINGIZ
GEMINI_MODEL=gemini-3.5-flash-lite
TELEGRAM_BOT_TOKEN=SIZNING_BOTFATHER_TOKENINGIZ
TELEGRAM_BOT_USERNAME=SIZNING_BOT_USERNAME
```

Agar Telegram bot hali tayyor bo‘lmasa, uning ikki sozlamasini vaqtincha bo‘sh qoldirib, AI ni mustaqil sinashingiz mumkin. `integrations:check` Telegram yo‘qligini xato deb ko‘rsatadi.

```powershell
npm.cmd install
npm.cmd run integrations:check
npm.cmd run test:api
npm.cmd run build
npm.cmd run dev
```

Saytni terminalda berilgan URL orqali oching. AI yordamchi → Tavsif yaratish, Rasm orqali tekshirish, Xizmat topish bo‘limlarini tekshiring. AI ulanishi muvaffaqiyatli bo‘lsa `gemini`, `gemini-vision`, `gemini-service-search` ko‘rinadi; aks holda fallback qaytadi.

## 3. Maxfiylik

`.env` fayli `.gitignore` ichida. **GitHub ga .env, Neon DATABASE_URL yoki Gemini/Telegram tokenini yuklamang.** Render da tegishli `GEMINI_API_KEY`, `GEMINI_MODEL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME` qiymatlarini `Environment` bo‘limida kiriting.

API tekshiruv GET `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite` yordamida amalga oshiriladi; ishlab chiqarish jarayonida tavsif/rasm uchun `:generateContent` so‘rovlari jo‘natiladi. Rasm o‘xshashligi taxminiy, aynan bir mahsulot ekanini isbotlamaydi.

## 4. GitHub ga push qilishdan oldin

API sinovi haqiqiy kalit bilan o‘tganini, demo akkauntlarni productionda o‘chirganingizni, frontend build muvaffaqiyatli ekanini va `git status` ichida sirlar yo‘qligini tekshiring.
