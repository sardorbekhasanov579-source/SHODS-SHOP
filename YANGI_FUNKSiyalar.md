# SHODS SHOP 3.0 — yangilanishlar va haqiqiy chegaralar

- Ommaviy yangiliklar, takliflar va e’lonlar: `Yangiliklar` menyusi.
- Admin paneldagi `Yangiliklar` tabida nashr, qoralama, rasm, til variantlari va xabar tarqatish.
- Taklif yuborish: admin xabar tarqatish belgisini yoqadi -> foydalanuvchiga in-app bildirishnoma keladi (polling ~18 sekund).
- Bildirishnoma faqat foydalanuvchining o‘z hisobida o‘qilgan bo‘ladi.
- Admin paneliga kirish va server API endpointlari admin-only. `admin:create` faqat ishonchli terminalda ishlaydi.
- Reklama bannerlari bosh sahifada avtomatik aylanadi; admin yangi reklama yaratadi/o‘chiradi.
- Chat va xizmat topshiriqlari ham mavjud, sharhlar va oddiy marketplace jarayoni saqlangan.
- Haqiqiy karta to‘lovi hali YO‘Q; demo to‘lovni haqiqiy deb taqdim etmang.
- Telegram tasdiqlash uchun real BotFather tokeni va Render HTTPS webhook zarur. Admin e’lonlaridan Telegram broadcast hozir YO‘Q.
- Qayta qo‘llashda production ma’lumotlarini yo‘qotmaslik uchun serverdagi DATABASE_URL ni o‘zgartirmang.

## Tezkor sinov ssenariysi

1. `npm.cmd install && npm.cmd run test:api && npm.cmd run build`.
2. Demo rejimda admin yaratish: `npm.cmd run admin:create`; mahalliy `.env` ishlatiladi (kuchli maxfiy parol).
3. Admin sifatida kiring -> Admin panel -> Yangiliklar -> yangi taklif yozing -> "Barchaga bildirishnoma yuborish" belgisini yoqing -> nashr eting.
4. Talaba akkauntida "Yangiliklar" sahifasini va qo‘ng‘iroqcha "Bildirishnomalar" menyusini tekshiring.
5. Bitta talaba o‘qigan bo‘lsa, ikkinchi akkauntda bildirishnoma o‘qilmagan bo‘lishi kerak.
6. Oddiy talaba Admin panelni va `/api/admin/news` endpointini boshqara olmasligini tekshiring.
7. Xaridor topshiriq qo‘ysin, sotuvchi taklif bersin, ikkala tomonga bildirishnoma ko‘rinsin.
8. Haqiqiy Neon ma’lumotlarini ishlab turgan serverda sinashdan oldin mustaqil zaxira oling.
