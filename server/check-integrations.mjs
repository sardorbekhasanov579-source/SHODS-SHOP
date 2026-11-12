import './env.mjs';
const botToken=process.env.TELEGRAM_BOT_TOKEN?.trim();
const botName=process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/,'').trim();
const aiKey=process.env.GEMINI_API_KEY?.trim();
const aiModel=process.env.GEMINI_MODEL?.trim()||'gemini-3.5-flash-lite';
let issues=0;
async function fetchJson(url,init={},timeout=15000){
  const controller=new AbortController();const handle=setTimeout(()=>controller.abort(),timeout);
  try{const response=await fetch(url,{...init,signal:controller.signal});
    const data=await response.json().catch(()=>({}));return {status:response.status,data};
  }finally{clearTimeout(handle)}
}
if(!botToken||!botName){console.log('Telegram: sozlanmagan. .env ga TELEGRAM_BOT_TOKEN va TELEGRAM_BOT_USERNAME kiriting.');issues++}
else{
  try{
    const {status,data}=await fetchJson(`https://api.telegram.org/bot${botToken}/getMe`);
    if(status!==200||!data.ok)throw Error(`getMe HTTP ${status}`);
    const actual=(data.result.username||'').toLowerCase();
    if(actual!==botName.toLowerCase())throw Error('Bot username token bilan mos emas');
    console.log(`Telegram: ✅ @${data.result.username} token to‘g‘ri.`);
    const hook=await fetchJson(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    if(hook.data.result?.url){issues++;console.warn('Telegram: ⚠️ Webhook faol. Lokal getUpdates bilan birga ishlamaydi; webhookni ongli ravishda o‘chiring.');}
    else console.log('Telegram: ✅ getUpdates uchun webhook to‘siq yo‘q.');
  }catch(error){issues++;console.error('Telegram: ❌',error.message)}
}
if(!aiKey){console.log('AI: sozlanmagan. .env ga GEMINI_API_KEY kiriting.');issues++}
else{
  try{const r=await fetchJson(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(aiModel)}`,{headers:{'x-goog-api-key':aiKey}});
    if(r.status!==200)throw Error(`Model yoki ruxsatni tekshirib bo‘lmadi (HTTP ${r.status})`);
    console.log(`AI: ✅ Google Gemini API kaliti va ${aiModel} modeliga kirish tekshirildi.`);
    console.log('Eslatma: bu bepul model tekshiruvi; haqiqiy rasm tahlili va javob yaratishni ilovada sinab ko‘ring.');
  }catch(error){issues++;console.error('AI: ❌',error.message)}
}
if(issues){console.error(`Integratsiyalarda ${issues} ta sozlanmagan yoki xato holat. Push qilishdan avval bartaraf eting.`);process.exitCode=1}
else console.log('✅ Telegram va AI konfiguratsiyasi tekshiruvi o‘tdi.');
