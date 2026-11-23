# SHODS SHOP 4.4 — o‘rnatish va xavfsizlik

## O‘zgarishlar
- Android login tokeni Capacitor Preferences orqali ilova qayta ochilganda tiklanadi. Parol saqlanmaydi. **Preferences shifrlangan maxfiy ombor emas**: real ishlab chiqarish uchun Android Keystore bilan himoyalangan token saqlashni joriy etish kerak.
- Serverda yangi sessiya muddati 30 kun. Muddati tugasa, foydalanuvchi yana kiradi. Ilova o‘chirilsa yoki hisobdan chiqilsa sessiya qayta tiklanmaydi.
- Mobil ekranning yuqorisida doim ko‘rinadigan «Xaridor / Sotuvchi» tugmalari. Oxirgi tanlov eslab qolinadi.
- Baza migratsiyasi amalga oshirilmagan; mavjud Neon PostgreSQL DATABASE_URL o‘zgarishsiz qoladi.

## Ishga tushirish (PowerShell)
1. Oldingi loyiha va Neon bazasining zaxira nusxasini oling.
2. GitHub repozitoriyasining toza nusxasiga fayllarni nusxalang; `.git`, `.env`, `node_modules`, `android`, `dist` papkalarini ko‘chirmang.
3. `npm.cmd install` (internet talab etiladi; `@capacitor/preferences` yangi bog‘liqlik).
4. `npm.cmd run test:api` va `npm.cmd run build`.
5. `git diff --cached --check` va o‘zgarishlarni tekshirgandan so‘ng push qiling.
6. Render yangi serverni Live holatiga keltirgandan keyin `ANDROID_APK_YASASH.bat` orqali APK yig‘ing.
7. Avvalgi APK bilan bir xil Android imzo kaliti bo‘lsa ustiga o‘rnating; aks holda avval ma’lumotlarni saqlab, ilovani qayta o‘rnatish kerak bo‘lishi mumkin.

## Pullik baza tayyorgarligi
- **Hozir pullik tarifni yoqmang.** Neon loyihasining o‘zini upgrade qilish ma’lumotlarni ko‘chirishni talab qilmasligi mumkin.
- Upgrade oldidan `pg_dump` orqali zaxira, foydalanuvchilar, buyurtmalar, chatlar va media soni/namunalarini solishtirish, qayta tiklash sinovi, keyin tarifni o‘zgartirish.
- Serverning `DATABASE_URL` qiymatini hozir o‘zgartirmang. Render hosting tarifi Neon DB tarifidan alohida.
- Eski JSONB `shods_app_state` sxemasi saqlanadi; alohida migratsiya talab etilmaydi.

## Tekshirish kerak
- Android telefonni qayta ochib sessiya saqlanishini, hisobdan chiqishni, sotuvchi/xaridor rejimlarini tekshiring.
- Server 4.4 ga yangilangandan keyin Telegram va Neon bilan haqiqiy integratsiya sinovini bajaring.
- Bu ZIP manba kodidir, tayyor APK emas. Android SDK bu muhitda mavjud emas, shu sabab APK yig‘ilishi tasdiqlanmagan.
