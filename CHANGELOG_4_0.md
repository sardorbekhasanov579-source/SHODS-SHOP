# SHODS SHOP 4.0 — asosiy o‘zgarishlar

**2026-11-14.** Bu versiya eski SHODS SHOP 3.1 kodining ustiga qo‘shilgan; mavjud admin, reklama bannerlari, yangiliklar, chat, mahsulotlar, xizmatlar, Gemini, Telegram, 3 til va PWA funksiyalari saqlangan.

- Yangi buyurtmalar avtomatik to‘langan hisoblanmaydi; `pay_on_receipt` va `unpaid` holati bilan yoziladi.
- Sotuvchi `accepted` → `handed_over` qiladi; xaridor buni o‘zi `received` deb tasdiqlaydi.
- Xaridor "naqd pulni berdim" bildirishi bilan to‘lov yakunlanmaydi; sotuvchi pulni olganini tasdiqlagach `paid` va `completed` bo‘ladi.
- Click/Payme soxta funksional tugmalari qo‘shilmadi; API to‘lovlarni merchant ulanishigacha rad etadi (`503 ONLINE_PAYMENTS_NOT_CONFIGURED`).
- Android Capacitor 7 konfiguratsiyasi va HTTPS API orqali bitta Neon baza bilan ishlaydigan Android veb-bundle.
- Android uchun sessiya Bearer token API; token ilova xotirasida, doimiy ochiq joyda saqlanmaydi; CORS faqat ruxsat etilgan aniq Android originlarga.
- Eski demo buyurtmalar o‘zgarmaydi; faqat yangilari yangi oqimdan foydalanadi. Production'da yangi `demo` checkout ruxsat etilmaydi.
- 7 ta API testi (jumladan to‘lov holatlari va huquqlar) o'tdi.

**Hali tayyor emas:** merchant shartnomasi va haqiqiy Click/Payme tranzaksiyalari, FCM push, Google Play release, Android APK binary, production frontend build bu muhitda. Bular uchun tashqi SDK/xizmatlarga kirish kerak.
