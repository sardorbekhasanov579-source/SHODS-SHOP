# SHODS SHOP 4.5 — Profil va yon menyu

## Yangi funksiyalar
- Android va mobil web uchun chapdan ochiladigan ☰ menyu; xaridor/sotuvchi kabinetiga o‘tish
- Profil sahifasi: ism, institut, fakultet, yo‘nalish, kurs, profil rasmi
- Profil rasmi mavjud autentifikatsiyalangan `/api/media` orqali yuklanadi, profilga `/api/account/profile` orqali saqlanadi
- Sozlamalar: UZ/RU/EN, kun/tun
- Xavfsizlik: joriy parol bilan parol almashtirish; boshqa sessiyalar bekor qilinadi
- Oldingi mahsulotlar, buyurtmalar va chatlar o‘chirilmaydi

## Windows / VS Code
1. Avval GitHub clone papkangizning alohida nusxasini oling.
2. ZIP ichidagi yangilangan fayllarni o‘sha clone papkaga ko‘chiring; `.git` papkasini o‘chirmang. `node_modules`, `android/build`, `.env` ni eski papkangizda saqlang.
3. `npm.cmd install`
4. `npm.cmd run test:api`
5. `npm.cmd run build`
6. Brauzerda `npm.cmd run dev` bilan profil, sozlamalar va yon menyuni sinang.
7. `git status`, `git add -A`, `git diff --cached --check`, `git commit -m "SHODS SHOP 4.5 profile and side drawer"`, `git push origin main`.
8. Render `Live` bo‘lgach `ANDROID_APK_YASASH.bat` ni ishga tushiring. `BUILD SUCCESSFUL` ni tekshiring.
9. Eski APK ustiga o‘rnatish uchun avvalgi imzo kaliti bir xil bo‘lishi shart.

## Eslatma
Bu muhitda Windows ZIP tarkibidagi node_modules Linuxda Vite build qila olmadi (Rollup platforma moduli yo‘q). JSX sintaksisi tekshirildi va serverdagi mavjud 11 test o‘tdi. **Windowsda `npm.cmd run build` va real Android sinovi shart.**
Neon ma’lumotlarini migratsiya qilish yoki o‘chirish talab etilmaydi; profil uchun foydalanuvchi yozuviga qo‘shimcha `avatar` maydoni qo‘shiladi.
Hozirgi Android sessiya tokeni Capacitor Preferences’da; ommaviy release oldidan Keystore asosidagi secure storage tavsiya qilinadi.
