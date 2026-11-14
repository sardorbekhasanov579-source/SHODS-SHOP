@echo off
setlocal
chcp 65001 >nul
title SHODS SHOP API holatini tekshirish
node -e "const u='https://shods-shop.onrender.com/api/health';(async()=>{try{const r=await fetch(u,{signal:AbortSignal.timeout(45000)});const d=await r.json();console.log('Server:',u);console.log('HTTP:',r.status);console.log('Version:',d.version||'eski API');console.log('Android tayyormi:',d.capabilities?.android===true?'HA':'YOQ - 4.1 server deploy kerak');console.log('Baza:',d.database?.storage||'nomalum',d.database?.connected===true?'connected':'tekshirilmagan');console.log('Telegram:',d.capabilities?.telegramConfigured===true?'sozlangan':'tekshirilmagan');console.log('Webhook:',d.capabilities?.telegramWebhook===true?'webhook':'tekshirilmagan');}catch(e){console.error('API xato:',e.message)}})()"
pause
