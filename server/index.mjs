import './env.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {loadState,persistState,withFreshState,databaseHealth,closeStorage,storeImage,loadImage} from './storage.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const DATA=process.env.SHODS_DATA_PATH||path.join(ROOT,'server','data','db.json');
const PORT=Number(process.env.PORT)||3001;
const AI_KEY=process.env.GEMINI_API_KEY||'';
const AI_MODEL=process.env.GEMINI_MODEL||'gemini-3.5-flash-lite';
const BOT_TOKEN=process.env.TELEGRAM_BOT_TOKEN||'';
const BOT_NAME=(process.env.TELEGRAM_BOT_USERNAME||'').replace('@','');
const telegramEnabled=Boolean(BOT_TOKEN&&BOT_NAME);
// In production use an HTTPS Telegram webhook; do not run getUpdates polling.
const PUBLIC_URL=(process.env.TELEGRAM_PUBLIC_URL||process.env.RENDER_EXTERNAL_URL||'').replace(/\/$/,'');
const WEBHOOK_SECRET=BOT_TOKEN ? crypto.createHmac('sha256',BOT_TOKEN).update('shods-shop-telegram-webhook-v1').digest('hex') : '';
const webhookEnabled=telegramEnabled && (process.env.NODE_ENV==='production' || process.env.SHODS_TEST_MODE==='1') && /^https:\/\/[^\s/]+/.test(PUBLIC_URL);
const otpValue=(token,chatId)=>String(crypto.createHmac('sha256',BOT_TOKEN).update(`${token}:${chatId}`).digest().readUInt32BE(0)%1000000).padStart(6,'0');
const otpHash=(token,code)=>crypto.createHash('sha256').update(`${token}:${code}:${BOT_TOKEN}`).digest('hex');
async function telegramApi(method,payload){
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
  try{
    const resp=await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`,{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal
    });
    const data=await resp.json();
    if(!resp.ok || !data.ok)throw Error(`Telegram ${method}: HTTP ${resp.status}, error ${data.error_code||'unknown'}`);
    return data.result;
  }finally{clearTimeout(timeout)}
}

const institutions=['Termiz davlat pedagogika instituti','Termiz davlat universiteti','Termiz muhandislik va agrotexnologiyalar universiteti','Denov tadbirkorlik va pedagogika instituti','Boshqa OTM'];
const faculties=['Jismoniy madaniyat va san’at','Ijtimoiy fanlar','Maktabgacha va boshlang‘ich ta’lim','Tillar','Tabiiy va aniq fanlar'];
const productSeeds=[
['M01','Mualliflik rasmlari to‘plami','Raqamli','Dizayn',25000,'S01','🎨'],
['M02','Qo‘lda bezatilgan mato sumka','Moddiy','Qo‘l mehnati',60000,'S01','👜'],
['M03','Mahalliy tarix fotoalbomi','Raqamli','Elektron materiallar',35000,'S02','📷'],
['M04','Milliy qadriyatlar stol o‘yini','Moddiy','Ta’lim',55000,'S02','🎲'],
['M05','Sanash o‘yini to‘plami','Moddiy','Ta’lim',45000,'S03','🧮'],
['M06','Bolalar uchun hikoyalar to‘plami','Raqamli','Elektron materiallar',20000,'S03','📚'],
['M07','Inglizcha so‘z kartochkalari','Moddiy','Ta’lim',30000,'S04','🗂️'],
['M08','O‘zbekcha va inglizcha audiohikoyalar','Raqamli','Elektron materiallar',25000,'S04','🎧'],
['M09','Geometrik shakllar to‘plami','Moddiy','Ta’lim',50000,'S05','📐'],
['M10','Oddiy hisoblash mini dasturi','Raqamli','IT va dasturlash',40000,'S05','💻'],
['S11','Slayd va taqdimot dizayni','Xizmat','Slayd',50000,'S05','📊'],
['S12','Test va krossvord tuzish','Xizmat','Test va krossvord',30000,'S03','📝'],
['S13','Elektron konspekt tayyorlash','Xizmat','Elektron konspekt',25000,'S03','📒'],
['S14','Qo‘llanma va metodik ishlanma','Xizmat','Qo‘llanma',80000,'S02','📗'],
['S15','Kurs ishi: maslahat va tahrir','Xizmat','Kurs ishi',120000,'S04','🎓'],
['S16','Diplom ishi: maslahat va formatlash','Xizmat','Diplom ishi',150000,'S05','📄'],
['S17','Veb-sayt yaratish','Xizmat','IT va dasturlash',300000,'S05','🧑‍💻'],
['S18','Tarjima xizmati','Xizmat','Tarjima',40000,'S04','🌐']
];
const now=()=>new Date().toISOString();
const uid=(prefix='')=>prefix+crypto.randomBytes(9).toString('hex');
const hashPassword=(pw)=>{const salt=crypto.randomBytes(16).toString('hex');return `${salt}:${crypto.scryptSync(pw,salt,64).toString('hex')}`};
const checkPassword=(pw,stored)=>{try{const [salt,value]=stored.split(':');const actual=crypto.scryptSync(pw,salt,64);const old=Buffer.from(value,'hex');return actual.length===old.length&&crypto.timingSafeEqual(actual,old)}catch{return false}};
const publicUser=(u)=>u?({id:u.id,name:u.name,login:u.login,institute:u.institute,faculty:u.faculty,direction:u.direction,course:u.course,role:u.role||'student',status:u.status||'active',proUntil:u.proUntil||null}):null;
function seeds(){const names=['San’at talabasi','Tarix talabasi','Boshlang‘ich ta’lim talabasi','Tillar talabasi','Aniq fanlar talabasi'];const users=names.map((name,i)=>({id:`S0${i+1}`,name,login:`demo_s0${i+1}`,passwordHash:hashPassword('ShodsDemo123!'),institute:institutions[0],faculty:faculties[i],direction:'Demo yo‘nalish',course:2,role:'student',status:'active'}));users.push({id:'X01',name:'Sinov xaridori',login:'demo_x01',passwordHash:hashPassword('ShodsDemo123!'),institute:institutions[0],faculty:faculties[4],direction:'Sun’iy intellekt',course:1,role:'student',status:'active'});return {users,items:productSeeds.map(([id,name,kind,category,price,seller,emoji])=>({id,name,kind,category,price,seller,emoji,active:true,stock:kind==='Xizmat'?100:kind==='Raqamli'?99:20,description:`${name} — talaba tomonidan tayyorlangan ${kind==='Xizmat'?'xizmat':'mahsulot'}.`,location:kind==='Xizmat'?'Onlayn':'Termiz shahri, institut hududi',image:null,imageHash:null,createdAt:now()})),orders:[],reviews:[],tickets:[],favorites:{},audit:[],ads:[],chats:[],messages:[],jobs:[],proposals:[],notifications:[],news:[],incomeEntries:[]}};
// Demonstration identities never appear in real production accounts.
const seedDemo = process.env.NODE_ENV !== 'production' && process.env.SEED_DEMO !== '0';
function initialState(){return seedDemo?seeds():{users:[],items:[],orders:[],reviews:[],tickets:[],favorites:{},audit:[],sessions:{},ads:[],chats:[],messages:[],jobs:[],proposals:[],notifications:[],news:[],incomeEntries:[]}}
let db=await loadState(DATA,initialState);
async function save(){await persistState(DATA,db)}
const loginAttempts=new Map();db.telegramChallenges??={};
const sessionKey=token=>crypto.createHash('sha256').update(token).digest('hex');
const clean=s=>String(s??'').trim();
const short=(s,n=150)=>clean(s).slice(0,n);
const positiveInt=(v)=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const response=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))};
const fail=(status,message)=>Object.assign(new Error(message),{status});
function loginCookie(res,token){res.setHeader('Set-Cookie',`shods_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${process.env.COOKIE_SECURE==='1'?'; Secure':''}`)}
const signout=(res)=>res.setHeader('Set-Cookie','shods_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
function sessionTokenFrom(req){const bearer=String(req.headers.authorization||'').match(/^Bearer (s_[a-f0-9]{18})$/i)?.[1];const cookie=String(req.headers.cookie||'').split(';').map(p=>p.trim()).find(c=>c.startsWith('shods_session='));return bearer||cookie?.slice(14)}
function getUser(req){const token=sessionTokenFrom(req);const sess=token&&db.sessions[sessionKey(token)];if(!sess||sess.expires<Date.now())return null;const user=db.users.find(u=>u.id===sess.id);return user&&(user.status||'active')==='active'?user:null}
function authed(req){const user=getUser(req);if(!user)throw fail(401,'LOGIN_REQUIRED');return user}
function administrator(req){const user=authed(req);if(user.role!=='admin')throw fail(403,'ADMIN_ONLY');return user}
function notify(userId,type,title,detail='',link=''){
  db.notifications??=[];
  db.notifications.unshift({id:uid('N_'),userId,type,title:short(title,140),detail:short(detail,260),link:short(link,140),read:false,createdAt:now()});
  db.notifications=db.notifications.slice(0,3000);
}
// One global notification per announcement: avoids copying the same alert
// into the JSON state once per registered student. Read status stays per-user.
function notifyAll(type,title,detail='',link='news',targetId=null){
  db.notifications??=[];
  db.notifications.unshift({id:uid('N_'),audience:'all',type,title:short(title,140),detail:short(detail,260),link:short(link,140),targetId,readBy:[],createdAt:now()});
  db.notifications=db.notifications.slice(0,3000);
}
function newsPayload(b){
  const title=short(b.title,125),body=short(b.body,3500),kind=short(b.kind||'news',20);
  if(title.length<5 || body.length<15 || !['news','offer','notice'].includes(kind))throw fail(400,'INVALID_NEWS');
  const image=b.image||null;if(image&&!imageOk(image))throw fail(400,'INVALID_IMAGE');
  return {title,body,kind,image,titleRu:short(b.titleRu,125),bodyRu:short(b.bodyRu,3500),titleEn:short(b.titleEn,125),bodyEn:short(b.bodyEn,3500),published:b.published!==false};
}
function chatSummary(c,viewer){
  const other=db.users.find(u=>u.id===(c.members.find(id=>id!==viewer)||''));
  const last=(db.messages||[]).filter(m=>m.chatId===c.id).at(-1);
  return {...c,other:other?publicUser(other):null,lastMessage:last?{text:last.text,createdAt:last.createdAt,from:last.from}:null};
}
function visibleJob(job){return job.status!=='hidden' && job.status!=='closed';}
function audit(admin,action,target,detail=''){db.audit??=[];db.audit.unshift({id:uid('A_'),admin:admin.id,adminName:admin.name,action,target,detail:short(detail,150),at:now()});db.audit=db.audit.slice(0,500)}
const visible=(item)=>item.active&&item.moderation!=='hidden';
const imageOk=(s)=>!s||(typeof s==='string'&&( /^\/api\/media\/[a-f0-9-]{36}$/.test(s) || (s.length<1300000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s)) ));
async function body(req){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1800000)throw fail(413,'PAYLOAD_TOO_LARGE');chunks.push(chunk)}try{return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}')}catch{throw fail(400,'INVALID_JSON')}}
const reviewsFor=(itemId)=>db.reviews.filter(r=>r.itemId===itemId);
function itemPublic(p){const {portfolio:_legacyPortfolio,...safeItem}=p;const seller=db.users.find(u=>u.id===p.seller);const reviews=reviewsFor(p.id);return {...safeItem,sellerName:seller?.name||'Talaba',institute:seller?.institute||'',faculty:seller?.faculty||'',rating:reviews.length?reviews.reduce((n,r)=>n+r.stars,0)/reviews.length:0,reviewCount:reviews.length,sellerProUntil:seller?.proUntil||null};}
const allowedKinds=['Moddiy','Raqamli','Xizmat'];
function listingPayload(data,user){const name=short(data.name,120),description=short(data.description,1400),category=short(data.category,100);const kind=clean(data.kind);const price=Number(data.price),stock=positiveInt(data.stock);const location=short(data.location,200);if(!name||!category||!allowedKinds.includes(kind)||!Number.isSafeInteger(price)||price<=0||price>1e9||stock<1||stock>100000||!location)throw fail(400,'INVALID_LISTING');if(!imageOk(data.image))throw fail(400,'INVALID_IMAGE');return {name,description,kind,category,price,stock,location,latitude:typeof data.latitude==='number'&&Math.abs(data.latitude)<=90?data.latitude:null,longitude:typeof data.longitude==='number'&&Math.abs(data.longitude)<=180?data.longitude:null,active:!!data.active,oldPrice:Number.isSafeInteger(Number(data.oldPrice))&&Number(data.oldPrice)>price&&Number(data.oldPrice)<=1e9?Number(data.oldPrice):null,image:data.image||null,imageHash:/^[a-f0-9]{16}$/.test(data.imageHash||'')?data.imageHash:null,emoji:kind==='Xizmat'?'🧑‍💻':kind==='Raqamli'?'📘':'📦',seller:user.id}}
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function ham(a,b){let n=0;for(let i=0;i<16;i++){let v=parseInt(a[i],16)^parseInt(b[i],16);n+=((v>>0)&1)+((v>>1)&1)+((v>>2)&1)+((v>>3)&1)}return n}
function finder(query){const words=clean(query).toLocaleLowerCase().split(/\s+/).filter(w=>w.length>2);return db.items.filter(p=>visible(p)).map(p=>{const seller=db.users.find(u=>u.id===p.seller);const hay=[p.name,p.description,p.category,seller?.faculty].join(' ').toLocaleLowerCase();const match=words.reduce((s,w)=>s+(hay.includes(w)?1:0),0);const rs=reviewsFor(p.id);const rating=rs.length?rs.reduce((s,r)=>s+r.stars,0)/rs.length:0;return {p,score:match*10+rating/5}}).filter(x=>x.score>0&&(words.length?x.score>=10:true)).sort((a,b)=>b.score-a.score).slice(0,8).map(x=>itemPublic(x.p))}
const averagePrice=(category,kind)=>{const a=db.items.filter(p=>visible(p)&&p.category===category&&p.kind===kind).map(x=>x.price).sort((a,b)=>a-b);return a.length?a[Math.floor(a.length/2)]:null};
// Google Gemini GenerateContent REST integration. The API key never reaches the browser.
async function modelResponse(prompt,image,{json=false}={}) {
  if (!AI_KEY) return null;
  const parts=[{text:prompt}];
  if(image){
    const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(image);
    if(!match)throw fail(400,'INVALID_IMAGE');
    parts.push({inline_data:{mime_type:`image/${match[1]}`,data:match[2]}});
  }
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),27000);
  try{
    const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(AI_MODEL)}:generateContent`;
    const res=await fetch(url,{
      method:'POST',
      headers:{'x-goog-api-key':AI_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({
        contents:[{role:'user',parts}],
        generationConfig:{temperature:0.2,maxOutputTokens:2048,...(json?{responseMimeType:'application/json'}:{})}
      }),
      signal:controller.signal
    });
    if(!res.ok)throw Error(`GEMINI_API_${res.status}`);
    const data=await res.json();
    const answer=(data.candidates||[]).flatMap(c=>c.content?.parts||[]).filter(p=>typeof p.text==='string').map(p=>p.text).join('\n').trim();
    if(!answer)throw Error(`GEMINI_EMPTY_RESPONSE_${data.candidates?.[0]?.finishReason||'UNKNOWN'}`);
    return answer;
  }finally{clearTimeout(timer)}
}

async function aiAssist(data){const action=clean(data.action);const aiLanguage=({uz:'o‘zbek',ru:'rus',en:'ingliz'})[data.lang]||'o‘zbek';
 if(action==='chat'){
   const question=short(data.message,700);
   if(!question)throw fail(400,'QUERY_REQUIRED');
   const candidates=finder(question).slice(0,5);
   const catalogue=candidates.map(x=>({id:x.id,title:x.name,category:x.category,price:x.price,kind:x.kind}));
   if(!AI_KEY)return {engine:'unconfigured',reply:'SHODS AI serverda hali yoqilmagan. Katalogdagi mahsulotlarni ko‘rib chiqishingiz mumkin.',results:candidates};
   try{
    const prompt=`SHODS SHOP talabalar marketplace yordamchisisiz. ${aiLanguage} tilida 2-5 gap bilan javob bering. Savol: ${JSON.stringify(question)}. Katalog faktlari: ${JSON.stringify(catalogue)}. Narx, mahsulot mavjudligi, sotuvchi shaxsi yoki yetkazib berish va'dasini katalogda bo'lmasa uydirmang. Mahsulotlar ro'yxati to'liq bo'lmasligi mumkin; noaniq faktlar uchun tekshirishni tavsiya qiling. Faqat oddiy foydali javob bering.`;
    const answer=await modelResponse(prompt);
    return {engine:'gemini',reply:String(answer||'').slice(0,1500),results:candidates};
   }catch(e){console.warn('AI mobile chat unavailable:',e.message);return {engine:'catalog-fallback',reply:'AI hozir javob bera olmadi. Quyidagi katalog natijalarini tekshirib ko‘ring.',results:candidates};}
 }
 if(action==='finder'){
    const query=short(data.query,350);
    if(!query)throw fail(400,'QUERY_REQUIRED');
    const basic=finder(query);
    if(AI_KEY){try{
      const catalogue=db.items.filter(visible).slice(0,120).map(x=>({id:x.id,title:x.name,type:x.kind,category:x.category,description:short(x.description,180),price:x.price}));
      const prompt=`Foydalanuvchi institut talabalarining mahsulot yoki xizmatini qidirmoqda. So‘rov: ${JSON.stringify(query)}. FAQAT mavjud katalog ID laridan foydalaning; mahsulot va xizmatlarni SEMANTIK mosligiga ko‘ra saralang. Yangi mahsulot yoki fakt O‘YLAB TOPMANG. Mos kelmasa bo‘sh ro‘yxat qaytaring. Faqat JSON: {"ids":["M05"]}. Katalog: ${JSON.stringify(catalogue)}`;
      const answer=await modelResponse(prompt,null,{json:true});
      const parsed=JSON.parse(answer.replace(/^```(?:json)?\s*/,'').replace(/```$/,'').trim());
      const ids=Array.isArray(parsed.ids)?parsed.ids.slice(0,8):[];
      const uniqueIds=[...new Set(ids.filter(x=>typeof x==='string'))];
      const results=uniqueIds.map(id=>db.items.find(item=>item.id===id&&visible(item))).filter(Boolean).map(itemPublic);
      return {engine:'gemini-service-search',results,note:'AI natijalari faqat katalogda mavjud mahsulot va xizmatlardan tanlandi.'};
    }catch(e){console.warn('AI semantic search unavailable:',e.message);return {engine:'catalog-ranking-fallback',results:basic,warning:'AI vaqtincha mavjud emas; oddiy katalog qidiruvi ishlatildi.'}}}
    return {engine:'catalog-ranking',results:basic};
  }
  if(action==='price'){const median=averagePrice(short(data.category),clean(data.kind));return {engine:'catalog-median',median,range:median?[Math.round(median*.9/1000)*1000,Math.round(median*1.1/1000)*1000]:null,note:'Faqat katalogdagi e’lon narxlariga asoslangan; bozor bahosi emas'};}
  if(action==='description'){const name=short(data.title,120),category=short(data.category,100);if(!name)throw fail(400,'TITLE_REQUIRED');if(AI_KEY){try{const text=await modelResponse(`${aiLanguage} tilida talaba marketplace uchun qisqa, halol, reklamaga mos tavsif yozing. Dalilsiz fakt qo‘shmang. Mahsulot: ${name}. Turkum: ${category}. Faqat 2-3 gap qaytaring.`);if(text)return {engine:'gemini',description:text.slice(0,1100)}}catch(e){console.warn('AI description unavailable:',e.message);return {engine:'template-fallback',warning:'AI provider temporarily unavailable',description:`${name} — ${category||'talabalar'} yo‘nalishidagi mahsulot yoki xizmat. Xususiyatlarini sotuvchidan aniqlashtiring.`}}}
    return {engine:'template',description:`${name} — ${category||'talabalar'} yo‘nalishidagi mahsulot yoki xizmat. Xususiyatlari, bajarilish muddati va foydalanish shartlarini sotuvchidan aniqlashtiring.`};}
  if(action==='image'){if(!imageOk(data.image)||!data.image)throw fail(400,'IMAGE_REQUIRED');const hash=/^[a-f0-9]{16}$/.test(data.imageHash||'')?data.imageHash:null;const visualMatches=hash?db.items.filter(p=>visible(p)&&p.imageHash).map(p=>({item:itemPublic(p),distance:ham(hash,p.imageHash)})).filter(x=>x.distance<=14).sort((a,b)=>a.distance-b.distance).slice(0,6).map(x=>({...x.item,similarity:Math.round((1-x.distance/64)*100)})):[];
    if(AI_KEY){try{const catalog=db.items.filter(p=>visible(p)).slice(0,100).map(x=>({id:x.id,name:x.name,category:x.category,price:x.price}));const txt=await modelResponse(`${aiLanguage} tilida javob bering. Rasmni ko‘ring va undagi mahsulotni 1-2 gapda tasvirlang. Shu katalogda bo‘lishi MUMKIN bo‘lgan eng ko‘pi bilan 3 ta o‘xshash ID ni kiriting. Faqat JSON: {"description":"...","possibleIds":["..."],"suggestedCategory":"..."}. Moslikka ishonchingiz bo‘lmasa bo‘sh massiv qaytaring. Katalog: ${JSON.stringify(catalog)}`,data.image,{json:true});const parsed=JSON.parse(txt.replace(/^```(?:json)?\s*/,'').replace(/```$/,'').trim());const matches=(Array.isArray(parsed.possibleIds)?parsed.possibleIds:[]).slice(0,3).map(id=>db.items.find(p=>p.id===id&&visible(p))).filter(Boolean).map(itemPublic);return {engine:'gemini-vision',description:short(parsed.description,500),category:short(parsed.suggestedCategory,100),matches,visualMatches,warning:'O‘xshashlik taxminiy; mahsulot aynan bir xil ekanini kafolatlamaydi'};}catch(err){console.warn('AI image fallback:',err.message)}}
    return {engine:'image-fingerprint',matches:visualMatches,warning:'Rasm o‘xshashligi (dHash) faqat ilgari rasmini yuklagan e’lonlarda ishlaydi. Bu AI model emas; bir xil mahsulotni kafolatlamaydi.'};}
  throw fail(400,'INVALID_AI_ACTION')}
function limitLogin(req){const ip=String(req.socket.remoteAddress||'unknown');const old=loginAttempts.get(ip)||[];const recent=old.filter(t=>t>Date.now()-10*60000);if(recent.length>=30)throw fail(429,'TOO_MANY_ATTEMPTS');recent.push(Date.now());loginAttempts.set(ip,recent)}
async function router(req,res){const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);const p=url.pathname,method=req.method;
  if(p==='/api/health'){const database=await databaseHealth();return response(res,200,{ok:true,version:'4.2.0',database,capabilities:{android:true,bearerAuth:true,telegramConfigured:telegramEnabled,telegramWebhook:webhookEnabled,receiptPayment:true,aiConfigured:!!AI_KEY}});}
  if(p==='/api/payments/methods'&&method==='GET')return response(res,200,{cashOnReceipt:true,onlyMethod:'cash',sellerConfirmsPayment:true,clickEnabled:false,paymeEnabled:false,onlineStatus:'disabled'});
  // Photos are uploaded first and receive a stable URL. Only owners with a
  // valid session can upload. The media response is read-only and public.
  if(p==='/api/media'&&method==='POST'){
    const u=authed(req),b=await body(req);
    const match=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(b.image||''));
    if(!match)throw fail(400,'INVALID_IMAGE');
    const bytes=Buffer.from(match[2],'base64');
    const mime='image/'+match[1];
    const valid=bytes.length>=12&&bytes.length<=600000&&(
      (mime==='image/jpeg'&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)||
      (mime==='image/png'&&bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))||
      (mime==='image/webp'&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP'));
    if(!valid)throw fail(400,'INVALID_IMAGE');
    const url=await storeImage(DATA,u.id,mime,bytes);
    return response(res,201,{url});
  }
  if(p==='/api/bootstrap'&&method==='GET')return response(res,200,{items:db.items.filter(visible).map(itemPublic),institutions,faculties,config:{aiEnabled:!!AI_KEY,telegramEnabled,telegramBotName:BOT_NAME}});
  if(p==='/api/auth/me'&&method==='GET')return response(res,200,{user:publicUser(getUser(req))});
  if(p==='/api/auth/login'&&method==='POST'){limitLogin(req);const b=await body(req);const u=db.users.find(x=>x.login===short(b.login,100));if(!u||!checkPassword(String(b.password||''),u.passwordHash))throw fail(401,'INVALID_CREDENTIALS');if((u.status||'active')!=='active')throw fail(403,'ACCOUNT_SUSPENDED');const token=uid('s_');db.sessions[sessionKey(token)]={id:u.id,expires:Date.now()+7*86400000};await save();loginCookie(res,token);return response(res,200,{user:publicUser(u),...(req.headers['x-shods-client']==='android'?{sessionToken:token}:{})})}
  if(p==='/api/auth/logout'&&method==='POST'){const token=sessionTokenFrom(req);if(token){delete db.sessions[sessionKey(token)];await save()}signout(res);return response(res,200,{ok:true})}
  if(p==='/api/auth/telegram/start'&&method==='POST'){if(!telegramEnabled)throw fail(503,'TELEGRAM_NOT_CONFIGURED');limitLogin(req);for(const [k,v] of Object.entries(db.telegramChallenges))if(v.expires<Date.now())delete db.telegramChallenges[k];const token=uid('reg_');db.telegramChallenges[token]={verified:false,expires:Date.now()+600000};await save();return response(res,200,{token,url:`https://t.me/${BOT_NAME}?start=${token}`,expiresIn:600})}
  if(p==='/api/auth/telegram/status'&&method==='GET'){const token=short(url.searchParams.get('token'),100),v=db.telegramChallenges[token];return response(res,200,{verified:!!v&&v.expires>Date.now()&&v.verified,codeSent:!!v?.otpHash})}
  if(p==='/api/auth/telegram/confirm'&&method==='POST'){
    if(!telegramEnabled)throw fail(503,'TELEGRAM_NOT_CONFIGURED');
    limitLogin(req);
    const b=await body(req),token=short(b.token,100),code=String(b.code||'').trim();
    const c=db.telegramChallenges[token];
    if(!c || c.expires<Date.now() || !c.otpHash)throw fail(400,'TELEGRAM_CODE_EXPIRED');
    if(c.verified)return response(res,200,{verified:true});
    if((c.attempts||0)>=5)throw fail(429,'TELEGRAM_TOO_MANY_ATTEMPTS');
    c.attempts=(c.attempts||0)+1;
    if(!/^\d{6}$/.test(code)||otpHash(token,code)!==c.otpHash){await save();return response(res,400,{error:'TELEGRAM_INVALID_CODE'})}
    c.verified=true;delete c.otpHash;
    await save();return response(res,200,{verified:true});
  }
  if(p==='/api/telegram/webhook'&&method==='POST'){
    if(!webhookEnabled)throw fail(404,'NOT_FOUND');
    const h=String(req.headers['x-telegram-bot-api-secret-token']||'');
    const x=Buffer.from(h),y=Buffer.from(WEBHOOK_SECRET);
    if(x.length!==y.length || !crypto.timingSafeEqual(x,y))throw fail(403,'FORBIDDEN');
    const update=await body(req),message=update.message;
    if(!message || message.chat?.type!=='private')return response(res,200,{ok:true});
    const token=String(message.text||'').match(/^\/start(?:@\w+)?\s+(reg_[a-f0-9]{18})$/)?.[1];
    if(!token){await telegramApi('sendMessage',{chat_id:message.chat.id,text:'SHODS SHOP: Ro‘yxatdan o‘tish sahifasidagi Telegram tugmasini bosing.'});return response(res,200,{ok:true})}
    const registered=await verifyTelegramChallenge(token,message.chat.id);
    if(!registered){await telegramApi('sendMessage',{chat_id:message.chat.id,text:'Havola eskirgan yoki ushbu Telegram hisobidan foydalanilgan. Saytdan yangi tasdiqlash havolasini oling.'});return response(res,200,{ok:true})}
    const code=otpValue(token,message.chat.id);
    await telegramApi('sendMessage',{chat_id:message.chat.id,text:`SHODS SHOP tasdiqlash kodi: ${code}\nKod 10 daqiqa amal qiladi. Hech kimga bermang.`});
    return response(res,200,{ok:true});
  }
  if(p==='/api/auth/register'&&method==='POST'){limitLogin(req);const b=await body(req);const name=short(b.name,100),login=short(b.login,45).toLowerCase(),password=String(b.password||'');if(!name||!login||!/^[a-z0-9_]{4,45}$/.test(login)||password.length<8||password.length>128||!short(b.institute)||!short(b.faculty)||!short(b.direction)||!Number.isInteger(Number(b.course))||Number(b.course)<1||Number(b.course)>6)throw fail(400,'INVALID_REGISTRATION');if(db.users.some(u=>u.login===login))throw fail(409,'LOGIN_TAKEN');if(process.env.NODE_ENV==='production'&&!telegramEnabled)throw fail(503,'TELEGRAM_NOT_CONFIGURED');if(telegramEnabled){const challenge=db.telegramChallenges[clean(b.telegramToken)];if(!challenge||!challenge.verified||challenge.expires<Date.now())throw fail(403,'TELEGRAM_REQUIRED');if(db.users.some(u=>u.telegramChatId===challenge.chatId))throw fail(409,'TELEGRAM_ALREADY_USED');delete db.telegramChallenges[clean(b.telegramToken)];b.telegramChatId=challenge.chatId;}
    const u={id:uid('U_'),name,login,passwordHash:hashPassword(password),institute:short(b.institute,140),faculty:short(b.faculty,140),direction:short(b.direction,140),course:Number(b.course),role:'student',status:'active',...(b.telegramChatId?{telegramChatId:b.telegramChatId}:{})};db.users.push(u);await save();const token=uid('s_');db.sessions[sessionKey(token)]={id:u.id,expires:Date.now()+7*86400000};await save();loginCookie(res,token);return response(res,201,{user:publicUser(u),...(req.headers['x-shods-client']==='android'?{sessionToken:token}:{})})}
  if(p==='/api/listings/mine'&&method==='GET'){const u=authed(req);return response(res,200,{items:db.items.filter(i=>i.seller===u.id).map(itemPublic)})}
  if(p==='/api/listings'&&method==='POST'){const u=authed(req),b=await body(req);const item={id:uid('P_'),...listingPayload(b,u),createdAt:now(),moderation:'approved'};db.items.unshift(item);await save();return response(res,201,{item:itemPublic(item)})}
  const listingMatch=p.match(/^\/api\/listings\/([^/]+)$/);
  if(listingMatch&&method==='PATCH'){const u=authed(req),item=db.items.find(i=>i.id===listingMatch[1]);if(!item)throw fail(404,'NOT_FOUND');if(item.seller!==u.id)throw fail(403,'FORBIDDEN');const b=await body(req);const merged={...item,...b,kind:b.kind??item.kind};const validated=listingPayload(merged,u);Object.assign(item,validated);delete item.portfolio;await save();return response(res,200,{item:itemPublic(item)})}
  if(p==='/api/orders'&&method==='GET'){const u=authed(req);const type=url.searchParams.get('type')||'buyer';const rows=db.orders.filter(o=>type==='seller'?o.seller===u.id:type==='both'?(o.seller===u.id||o.buyer===u.id):o.buyer===u.id);return response(res,200,{orders:rows.map(o=>({...o,buyerName:db.users.find(u=>u.id===o.buyer)?.name||'',sellerName:db.users.find(u=>u.id===o.seller)?.name||''}))})}
  if(p==='/api/orders'&&method==='POST'){const u=authed(req),b=await body(req);if(b.payment!=='pay_on_receipt')throw fail(400,'CASH_ONLY_AFTER_RECEIPT');if(!Array.isArray(b.lines)||b.lines.length===0||b.lines.length>30)throw fail(400,'EMPTY_CART');const seen=new Set(),rows=[];for(const l of b.lines){if(seen.has(l.id))throw fail(400,'DUPLICATE_ITEM');seen.add(l.id);const item=db.items.find(p=>p.id===l.id);const qty=positiveInt(l.qty);if(!item||!visible(item)||!qty||qty>item.stock||qty>1000)throw fail(400,'UNAVAILABLE_ITEM');if(item.seller===u.id)throw fail(400,'OWN_ITEM');rows.push({item,qty})}
    const created=rows.map(({item,qty})=>({id:uid('B_'),itemId:item.id,name:item.name,price:item.price,qty,total:item.price*qty,seller:item.seller,buyer:u.id,buyerCode:u.id,location:item.location,latitude:item.latitude,longitude:item.longitude,kind:item.kind,payment:'pay_on_receipt',paymentStatus:'unpaid',paymentMethod:null,receivedAt:null,paidAt:null,status:'new',createdAt:now()}));for(const r of rows)r.item.stock-=r.qty;db.orders.unshift(...created);for(const o of created)notify(o.seller,'order','Yangi buyurtma',`${o.name} · ${o.qty} dona`,'seller');await save();return response(res,201,{orders:created})}
  const orderMatch=p.match(/^\/api\/orders\/([^/]+)$/);
  // Delivery-first settlement: seller can hand over; ONLY buyer can confirm receipt.
  // Neither receipt nor an untrusted UI callback can mark an order as paid.
  if(orderMatch&&method==='PATCH'){
    const u=authed(req),order=db.orders.find(o=>o.id===orderMatch[1]);
    if(!order)throw fail(404,'NOT_FOUND');
    if(order.seller!==u.id)throw fail(403,'FORBIDDEN');
    const b=await body(req),next=clean(b.status);
    const delivery=order.payment==='pay_on_receipt';
    const transitions=delivery?{new:['accepted','cancelled'],accepted:['handed_over','cancelled'],handed_over:[],received:[],completed:[],cancelled:[],disputed:[]}:{new:['accepted','cancelled'],accepted:['completed','cancelled'],completed:[],cancelled:[]};
    if(!transitions[order.status]?.includes(next))throw fail(400,'INVALID_STATUS');
    if(next==='cancelled'){const item=db.items.find(x=>x.id===order.itemId);if(item)item.stock+=order.qty;}
    order.status=next;order.updatedAt=now();
    if(next==='handed_over')order.handedOverAt=now();
    notify(order.buyer,'order',next==='handed_over'?'Mahsulot topshirildi deb belgilandi':`Buyurtma: ${next}`,order.name,'buyer');
    await save();return response(res,200,{order});
  }
  const receiveMatch=p.match(/^\/api\/orders\/([^/]+)\/receive$/);
  if(receiveMatch&&method==='POST'){
    const u=authed(req),order=db.orders.find(o=>o.id===receiveMatch[1]);
    if(!order)throw fail(404,'NOT_FOUND');
    if(order.buyer!==u.id)throw fail(403,'FORBIDDEN');
    if(order.payment!=='pay_on_receipt'||order.status!=='handed_over')throw fail(409,'RECEIPT_NOT_AVAILABLE');
    order.status='received';order.receivedAt=now();order.updatedAt=now();
    notify(order.seller,'order','Xaridor mahsulotni qabul qildi',`${order.name} · To‘lov kutilmoqda`,'seller');
    await save();return response(res,200,{order});
  }
  const cashClaimMatch=p.match(/^\/api\/orders\/([^/]+)\/cash-claim$/);
  if(cashClaimMatch&&method==='POST'){
    const u=authed(req),order=db.orders.find(o=>o.id===cashClaimMatch[1]);
    if(!order)throw fail(404,'NOT_FOUND');
    if(order.buyer!==u.id)throw fail(403,'FORBIDDEN');
    if(order.payment!=='pay_on_receipt'||order.status!=='received'||order.paymentStatus!=='unpaid'||order.cashClaimedAt)throw fail(409,'CASH_CLAIM_NOT_AVAILABLE');
    order.paymentMethod='cash';order.cashClaimedAt=now();order.updatedAt=now();
    notify(order.seller,'payment','Xaridor naqd pul berganini bildirdi',`${order.name} · Pulni haqiqatan olgan bo‘lsangiz tasdiqlang`,'seller');
    await save();return response(res,200,{order});
  }
  const cashConfirmMatch=p.match(/^\/api\/orders\/([^/]+)\/cash-confirm$/);
  if(cashConfirmMatch&&method==='POST'){
    const u=authed(req),order=db.orders.find(o=>o.id===cashConfirmMatch[1]);
    if(!order)throw fail(404,'NOT_FOUND');
    if(order.seller!==u.id)throw fail(403,'FORBIDDEN');
    if(order.payment!=='pay_on_receipt'||order.status!=='received'||order.paymentStatus!=='unpaid')throw fail(409,'CASH_CONFIRM_NOT_AVAILABLE');
    order.paymentMethod='cash';order.paymentStatus='paid';order.paidAt=now();order.paidConfirmedBy=u.id;order.cashConfirmationSource='seller';order.status='completed';order.updatedAt=now();
    notify(order.buyer,'payment','Naqd to‘lov sotuvchi tomonidan tasdiqlandi',`${order.name} · ${order.total} so‘m`,'buyer');
    await save();return response(res,200,{order});
  }
  const onlineMatch=p.match(/^\/api\/orders\/([^/]+)\/payment-intent$/);
  if(onlineMatch&&method==='POST'){
    const u=authed(req),order=db.orders.find(o=>o.id===onlineMatch[1]);
    if(!order)throw fail(404,'NOT_FOUND');
    if(order.buyer!==u.id)throw fail(403,'FORBIDDEN');
    if(order.payment!=='pay_on_receipt'||order.status!=='received'||order.paymentStatus!=='unpaid')throw fail(409,'PAYMENT_NOT_DUE');
    const b=await body(req);
    if(!['payme','click'].includes(b.provider))throw fail(400,'INVALID_PAYMENT_PROVIDER');
    // No merchant credentials/provider verification is configured. We never invent a paid state.
    throw fail(503,'ONLINE_PAYMENTS_NOT_CONFIGURED');
  }
  const sellerProfileMatch=p.match(/^\/api\/sellers\/([^/]+)$/);
  if(sellerProfileMatch&&method==='GET'){
    const u=db.users.find(x=>x.id===sellerProfileMatch[1]);if(!u)throw fail(404,'NOT_FOUND');
    const listings=db.items.filter(i=>i.seller===u.id&&visible(i));
    const listingIds=new Set(listings.map(x=>x.id));
    const reviews=db.reviews.filter(r=>listingIds.has(r.itemId)).map(r=>({...r,buyerName:db.users.find(x=>x.id===r.buyer)?.name||'Xaridor'}));
    const completed=db.orders.filter(o=>o.seller===u.id&&o.status==='completed').length;
    return response(res,200,{seller:{id:u.id,name:u.name,institute:u.institute,faculty:u.faculty,direction:u.direction,course:u.course},items:listings.map(itemPublic),reviews,completed});
  }
  if(p==='/api/reviews'&&method==='GET'){const itemId=url.searchParams.get('itemId');const rows=itemId?db.reviews.filter(x=>x.itemId===itemId):db.reviews;return response(res,200,{reviews:rows.map(r=>({...r,buyerName:db.users.find(u=>u.id===r.buyer)?.name||'Xaridor'}))})}
  if(p==='/api/reviews'&&method==='POST'){const u=authed(req),b=await body(req);const itemId=short(b.itemId,80),stars=Number(b.stars),text=short(b.text,600);if(!Number.isInteger(stars)||stars<1||stars>5||!text)throw fail(400,'INVALID_REVIEW');if(!db.orders.some(o=>o.buyer===u.id&&o.itemId===itemId&&o.status==='completed'))throw fail(403,'PURCHASE_REQUIRED');if(db.reviews.some(r=>r.buyer===u.id&&r.itemId===itemId))throw fail(409,'ALREADY_REVIEWED');const r={id:uid('R_'),itemId,buyer:u.id,stars,text,createdAt:now()};db.reviews.unshift(r);await save();return response(res,201,{review:{...r,buyerName:u.name}})}
  if(p==='/api/favorites'&&method==='GET'){const u=authed(req);return response(res,200,{ids:db.favorites[u.id]||[]})}
  const favMatch=p.match(/^\/api\/favorites\/([^/]+)$/);
  if(favMatch&&method==='POST'){const u=authed(req);if(!db.items.some(i=>i.id===favMatch[1]&&visible(i)))throw fail(404,'NOT_FOUND');let list=db.favorites[u.id]||[];list=list.includes(favMatch[1])?list.filter(x=>x!==favMatch[1]):[...list,favMatch[1]];db.favorites[u.id]=list;await save();return response(res,200,{ids:list})}
  // V3: Admin-curated news, offers and announcements with an in-app broadcast.
  if(p==='/api/news' && method==='GET')return response(res,200,{news:(db.news||[]).filter(n=>n.published).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,80)});
  if(p==='/api/admin/news' && method==='GET'){administrator(req);return response(res,200,{news:db.news||[]})}
  if(p==='/api/admin/news' && method==='POST'){
    const admin=administrator(req),b=await body(req),details=newsPayload(b);
    const entry={id:uid('NEWS_'),...details,authorId:admin.id,createdAt:now(),updatedAt:now(),broadcastedAt:null};
    db.news??=[];db.news.unshift(entry);
    if(entry.published&&b.broadcast===true){
      notifyAll('news',entry.title,entry.body.slice(0,180),'news',entry.id);entry.broadcastedAt=now();
    }
    audit(admin,'news.create',entry.id,entry.title);await save();return response(res,201,{news:entry});
  }
  const newsMatch=p.match(/^\/api\/admin\/news\/([^/]+)$/);
  if(newsMatch&&method==='PATCH'){
    const admin=administrator(req),entry=(db.news||[]).find(n=>n.id===newsMatch[1]),b=await body(req);
    if(!entry)throw fail(404,'NOT_FOUND');
    const next={...entry,...b};Object.assign(entry,newsPayload(next));entry.updatedAt=now();
    if(entry.published && b.broadcast===true){
      notifyAll('news',entry.title,entry.body.slice(0,180),'news',entry.id);entry.broadcastedAt=now();
    }
    audit(admin,'news.update',entry.id,entry.title);await save();return response(res,200,{news:entry});
  }
  if(newsMatch&&method==='DELETE'){
    const admin=administrator(req),idx=(db.news||[]).findIndex(n=>n.id===newsMatch[1]);
    if(idx<0)throw fail(404,'NOT_FOUND');db.news.splice(idx,1);audit(admin,'news.delete',newsMatch[1]);await save();return response(res,200,{ok:true});
  }
  // V3: public marketing banners. Only admins may create, edit or delete.
  if(p==='/api/ads'&&method==='GET')return response(res,200,{ads:(db.ads||[]).filter(a=>a.active && (!a.startsAt||a.startsAt<=now()) && (!a.endsAt||a.endsAt>=now())).slice(0,24)});
  if(p==='/api/admin/ads'&&method==='GET'){administrator(req);return response(res,200,{ads:db.ads||[]})}
  if(p==='/api/admin/ads'&&method==='POST'){
    const a=administrator(req),b=await body(req),title=short(b.title,100),subtitle=short(b.subtitle,200);
    if(!title)throw fail(400,'AD_TITLE_REQUIRED');
    const theme=['blue','teal','orange','violet'].includes(b.theme)?b.theme:'blue';
    const target=['catalog','services','ai','jobs','home'].includes(b.target)?b.target:'catalog';
    const image=b.image||null;if(image && !imageOk(image))throw fail(400,'INVALID_IMAGE');
    const ad={id:uid('AD_'),title,subtitle,theme,target,image,active:b.active!==false,createdAt:now(),createdBy:a.id};
    db.ads.unshift(ad);audit(a,'ad.create',ad.id,title);await save();return response(res,201,{ad});
  }
  const adMatch=p.match(/^\/api\/admin\/ads\/([^/]+)$/);
  if(adMatch&&method==='PATCH'){
    const a=administrator(req),ad=(db.ads||[]).find(x=>x.id===adMatch[1]),b=await body(req);if(!ad)throw fail(404,'NOT_FOUND');
    if(b.title!==undefined){const v=short(b.title,100);if(!v)throw fail(400,'AD_TITLE_REQUIRED');ad.title=v}
    if(b.subtitle!==undefined)ad.subtitle=short(b.subtitle,200);
    if(b.active!==undefined)ad.active=!!b.active;
    if(b.theme!==undefined){if(!['blue','teal','orange','violet'].includes(b.theme))throw fail(400,'INVALID_AD_THEME');ad.theme=b.theme}
    if(b.target!==undefined){if(!['catalog','services','ai','jobs','home'].includes(b.target))throw fail(400,'INVALID_AD_TARGET');ad.target=b.target}
    if(b.image!==undefined){if(b.image&&!imageOk(b.image))throw fail(400,'INVALID_IMAGE');ad.image=b.image||null}
    audit(a,'ad.update',ad.id);await save();return response(res,200,{ad});
  }
  if(adMatch&&method==='DELETE'){const a=administrator(req);const i=(db.ads||[]).findIndex(x=>x.id===adMatch[1]);if(i<0)throw fail(404,'NOT_FOUND');db.ads.splice(i,1);audit(a,'ad.delete',adMatch[1]);await save();return response(res,200,{ok:true});}

  // V3: secure one-to-one messenger (only chat participants can read/send).
  if(p==='/api/chats'&&method==='GET'){
    const u=authed(req);return response(res,200,{chats:(db.chats||[]).filter(c=>c.members.includes(u.id)).map(c=>chatSummary(c,u.id)).sort((a,b)=>(b.lastMessage?.createdAt||b.createdAt).localeCompare(a.lastMessage?.createdAt||a.createdAt))});
  }
  if(p==='/api/chats'&&method==='POST'){
    const u=authed(req),b=await body(req),item=db.items.find(x=>x.id===short(b.itemId,80)),otherId=item?.seller||short(b.userId,80);
    const other=db.users.find(x=>x.id===otherId && (x.status||'active')==='active');
    if(!other||other.id===u.id)throw fail(400,'INVALID_RECIPIENT');
    const members=[u.id,other.id].sort();
    let chat=(db.chats||[]).find(c=>c.members?.length===2&&members.every(x=>c.members.includes(x)));
    if(!chat){chat={id:uid('C_'),members,createdAt:now(),itemId:item?.id||null};db.chats??=[];db.chats.push(chat);await save()}
    return response(res,200,{chat:chatSummary(chat,u.id)});
  }
  const msgMatch=p.match(/^\/api\/chats\/([^/]+)\/messages$/);
  if(msgMatch&&method==='GET'){
    const u=authed(req),c=(db.chats||[]).find(x=>x.id===msgMatch[1]);if(!c||!c.members.includes(u.id))throw fail(403,'FORBIDDEN');
    return response(res,200,{messages:(db.messages||[]).filter(m=>m.chatId===c.id).slice(-100)});
  }
  if(msgMatch&&method==='POST'){
    const u=authed(req),c=(db.chats||[]).find(x=>x.id===msgMatch[1]),b=await body(req);
    if(!c||!c.members.includes(u.id))throw fail(403,'FORBIDDEN');
    const text=short(b.text,1200);if(text.length<1)throw fail(400,'EMPTY_MESSAGE');
    const recent=(db.messages||[]).filter(m=>m.from===u.id && Date.now()-Date.parse(m.createdAt)<60000);
    if(recent.length>=20)throw fail(429,'MESSAGE_RATE_LIMIT');
    const message={id:uid('M_'),chatId:c.id,from:u.id,text,createdAt:now()};db.messages??=[];db.messages.push(message);
    const target=c.members.find(id=>id!==u.id);notify(target,'chat',`Xabar: ${u.name}`,text,'chats');await save();return response(res,201,{message});
  }
  // V3: job requests. Buyer posts, providers propose; only owner accepts.
  if(p==='/api/jobs'&&method==='GET'){
    return response(res,200,{jobs:(db.jobs||[]).filter(visibleJob).map(j=>({...j,buyerName:db.users.find(x=>x.id===j.buyer)?.name||'Talaba',proposalCount:(db.proposals||[]).filter(x=>x.jobId===j.id).length})).slice(0,250)});
  }
  if(p==='/api/jobs/mine'&&method==='GET'){
    const u=authed(req);return response(res,200,{jobs:(db.jobs||[]).filter(j=>j.buyer===u.id),proposals:(db.proposals||[]).filter(x=>x.seller===u.id)});
  }
  if(p==='/api/jobs'&&method==='POST'){
    const u=authed(req),b=await body(req);const title=short(b.title,120),description=short(b.description,1500),category=short(b.category,80),budget=Number(b.budget);
    if(title.length<5||description.length<15||!category||!Number.isSafeInteger(budget)||budget<1000||budget>1000000000)throw fail(400,'INVALID_JOB');
    const job={id:uid('J_'),buyer:u.id,title,description,category,budget,deadline:short(b.deadline,30),status:'open',createdAt:now()};db.jobs??=[];db.jobs.unshift(job);await save();return response(res,201,{job});
  }
  const proposalMatch=p.match(/^\/api\/jobs\/([^/]+)\/proposals$/);
  if(proposalMatch&&method==='GET'){
    const u=authed(req),job=(db.jobs||[]).find(j=>j.id===proposalMatch[1]);if(!job)throw fail(404,'NOT_FOUND');
    const proposals=(db.proposals||[]).filter(x=>x.jobId===job.id);
    return response(res,200,{proposals:(job.buyer===u.id?proposals:proposals.filter(x=>x.seller===u.id)).map(x=>({...x,sellerName:db.users.find(u=>u.id===x.seller)?.name||''}))});
  }
  if(proposalMatch&&method==='POST'){
    const u=authed(req),job=(db.jobs||[]).find(j=>j.id===proposalMatch[1]),b=await body(req),price=Number(b.price),note=short(b.note,700);
    if(!job||job.status!=='open')throw fail(400,'JOB_CLOSED');if(job.buyer===u.id)throw fail(403,'OWN_JOB');
    if(!Number.isSafeInteger(price)||price<1000||price>1000000000||note.length<8)throw fail(400,'INVALID_PROPOSAL');
    if((db.proposals||[]).some(p=>p.jobId===job.id&&p.seller===u.id))throw fail(409,'ALREADY_PROPOSED');
    const proposal={id:uid('P_'),jobId:job.id,seller:u.id,price,note,status:'pending',createdAt:now()};db.proposals??=[];db.proposals.unshift(proposal);
    notify(job.buyer,'proposal','Yangi taklif',`${job.title} · ${u.name}`,'jobs');await save();return response(res,201,{proposal});
  }
  const jobAccept=p.match(/^\/api\/jobs\/([^/]+)\/accept$/);
  if(jobAccept&&method==='PATCH'){
    const u=authed(req),job=(db.jobs||[]).find(j=>j.id===jobAccept[1]),b=await body(req),proposal=(db.proposals||[]).find(x=>x.id===b.proposalId&&x.jobId===job?.id);
    if(!job||job.buyer!==u.id)throw fail(403,'FORBIDDEN');if(job.status!=='open'||!proposal)throw fail(400,'INVALID_PROPOSAL');
    job.status='assigned';job.acceptedProposal=proposal.id;proposal.status='accepted';
    for(const p2 of db.proposals.filter(x=>x.jobId===job.id&&x.id!==proposal.id))p2.status='declined';
    notify(proposal.seller,'job','Taklifingiz tanlandi',job.title,'jobs');await save();return response(res,200,{job,proposal});
  }
  // V3: private in-app alerts.
  if(p==='/api/notifications'&&method==='GET'){
    const u=authed(req);return response(res,200,{notifications:(db.notifications||[]).filter(n=>n.userId===u.id||n.audience==='all').slice(0,80).map(n=>({...n,read:n.audience==='all'?Boolean(n.readBy?.includes(u.id)):Boolean(n.read),readBy:undefined}))});
  }
  if(p==='/api/notifications/read'&&method==='POST'){
    const u=authed(req),b=await body(req);for(const n of db.notifications||[]){
      if(b.id&&n.id!==b.id)continue;
      if(n.userId===u.id)n.read=true;
      if(n.audience==='all'){n.readBy??=[];if(!n.readBy.includes(u.id))n.readBy.push(u.id)}
    }
    await save();return response(res,200,{ok:true});
  }
  if(p==='/api/support'&&method==='GET'){const u=authed(req);return response(res,200,{tickets:db.tickets.filter(x=>x.user===u.id)})}
  if(p==='/api/support'&&method==='POST'){const u=authed(req),b=await body(req);const message=short(b.message,1500),topic=short(b.topic,100);if(!message||!topic)throw fail(400,'INVALID_TICKET');const ticket={id:uid('T_'),user:u.id,topic,message,status:'new',createdAt:now()};db.tickets.unshift(ticket);await save();return response(res,201,{ticket})}
  // SHODS SHOP 4.2: manually verified offline advertising revenue only.
  // No bank charges or automatic payment confirmation occur here.
  if(p==='/api/admin/finance'&&method==='GET'){
    administrator(req);
    const entries=db.incomeEntries||[];
    return response(res,200,{entries:entries.slice(0,200),totalReceived:entries.reduce((n,x)=>n+x.amount,0),
      proSellers:db.users.filter(u=>u.proUntil&&new Date(u.proUntil)>new Date()).map(publicUser),
      boostedListings:db.items.filter(i=>i.boostUntil&&new Date(i.boostUntil)>new Date()).map(itemPublic)});
  }
  if(p==='/api/admin/finance'&&method==='POST'){
    const admin=administrator(req),b=await body(req);
    const kind=short(b.kind,24),amount=positiveInt(b.amount),description=short(b.description,200);
    if(!['advertisement','top','pro','other'].includes(kind)||!amount||amount>100000000||description.length<3)throw fail(400,'INVALID_FINANCE_ENTRY');
    const entry={id:uid('FIN_'),kind,amount,description,paymentMethod:'cash',confirmedBy:admin.id,confirmedAt:now()};
    db.incomeEntries??=[];db.incomeEntries.unshift(entry);db.incomeEntries=db.incomeEntries.slice(0,2000);
    audit(admin,'finance.cash_received',entry.id,`${kind}: ${amount} UZS`);
    await save();return response(res,201,{entry});
  }
  const boostMatch=p.match(/^\/api\/admin\/boost\/([^/]+)$/);
  if(boostMatch&&method==='PATCH'){
    const admin=administrator(req),item=db.items.find(x=>x.id===boostMatch[1]),b=await body(req);
    if(!item)throw fail(404,'NOT_FOUND');
    const days=Number(b.days);
    if(!Number.isInteger(days)||days<0||days>30)throw fail(400,'INVALID_BOOST_DAYS');
    item.boostUntil=days?new Date(Date.now()+days*86400000).toISOString():null;
    audit(admin,'listing.boost',item.id,String(days));await save();return response(res,200,{item:itemPublic(item)});
  }
  const proMatch=p.match(/^\/api\/admin\/pro\/([^/]+)$/);
  if(proMatch&&method==='PATCH'){
    const admin=administrator(req),user=db.users.find(x=>x.id===proMatch[1]),b=await body(req);
    if(!user)throw fail(404,'NOT_FOUND');if(user.role==='admin')throw fail(403,'PROTECTED_ADMIN');
    const days=Number(b.days);
    if(!Number.isInteger(days)||days<0||days>365)throw fail(400,'INVALID_PRO_DAYS');
    user.proUntil=days?new Date(Date.now()+days*86400000).toISOString():null;
    audit(admin,'user.pro',user.id,String(days));await save();return response(res,200,{user:publicUser(user)});
  }
  // All administrative actions require a verified administrator session on the server.
  if(p==='/api/admin/overview'&&method==='GET'){
    administrator(req);
    const total=db.orders.reduce((sum,o)=>sum+(o.status==='cancelled'?0:o.total),0);
    return response(res,200,{stats:{users:db.users.length,activeUsers:db.users.filter(u=>(u.status||'active')==='active').length,listings:db.items.length,activeListings:db.items.filter(visible).length,orders:db.orders.length,demoTurnover:total,newsPublished:(db.news||[]).filter(n=>n.published).length,adsActive:(db.ads||[]).filter(a=>a.active).length,jobsOpen:(db.jobs||[]).filter(j=>j.status==='open').length,chats:(db.chats||[]).length,ticketsOpen:db.tickets.filter(t=>t.status==='new'||t.status==='open').length,reviews:db.reviews.length},recentOrders:db.orders.slice(0,8),recentTickets:db.tickets.slice(0,6),recentUsers:db.users.slice(-6).reverse().map(publicUser)});
  }
  if(p==='/api/admin/users'&&method==='GET'){administrator(req);return response(res,200,{users:db.users.map(publicUser)});}
  const adminUserMatch=p.match(/^\/api\/admin\/users\/([^/]+)$/);
  if(adminUserMatch&&method==='PATCH'){
    const a=administrator(req),u=db.users.find(u=>u.id===adminUserMatch[1]),b=await body(req);
    if(!u)throw fail(404,'NOT_FOUND');if(u.id===a.id||u.role==='admin')throw fail(403,'PROTECTED_ADMIN');
    if(!['active','suspended'].includes(b.status))throw fail(400,'INVALID_STATUS');u.status=b.status;audit(a,'user.status',u.id,u.status);await save();return response(res,200,{user:publicUser(u)});
  }
  if(p==='/api/admin/listings'&&method==='GET'){administrator(req);return response(res,200,{items:db.items.map(itemPublic)});}
  const adminListingMatch=p.match(/^\/api\/admin\/listings\/([^/]+)$/);
  if(adminListingMatch&&method==='PATCH'){
    const a=administrator(req),item=db.items.find(i=>i.id===adminListingMatch[1]),b=await body(req);
    if(!item)throw fail(404,'NOT_FOUND');if(!['approved','hidden'].includes(b.moderation))throw fail(400,'INVALID_STATUS');
    item.moderation=b.moderation;audit(a,'listing.moderation',item.id,b.moderation);await save();return response(res,200,{item:itemPublic(item)});
  }
  if(p==='/api/admin/orders'&&method==='GET'){administrator(req);return response(res,200,{orders:db.orders.map(o=>({...o,buyerName:db.users.find(u=>u.id===o.buyer)?.name||'',sellerName:db.users.find(u=>u.id===o.seller)?.name||''}))});}
  if(p==='/api/admin/tickets'&&method==='GET'){administrator(req);return response(res,200,{tickets:db.tickets.map(t=>({...t,userName:db.users.find(u=>u.id===t.user)?.name||''}))});}
  const adminTicketMatch=p.match(/^\/api\/admin\/tickets\/([^/]+)$/);
  if(adminTicketMatch&&method==='PATCH'){
    const a=administrator(req),t=db.tickets.find(x=>x.id===adminTicketMatch[1]),b=await body(req);
    if(!t)throw fail(404,'NOT_FOUND');if(!['new','open','answered','closed'].includes(b.status))throw fail(400,'INVALID_STATUS');
    t.status=b.status;t.reply=short(b.reply,1200);t.updatedAt=now();audit(a,'ticket.reply',t.id,t.status);await save();return response(res,200,{ticket:t});
  }
  if(p==='/api/admin/reviews'&&method==='GET'){administrator(req);return response(res,200,{reviews:db.reviews.map(r=>({...r,buyerName:db.users.find(u=>u.id===r.buyer)?.name||''}))});}
  const adminReviewMatch=p.match(/^\/api\/admin\/reviews\/([^/]+)$/);
  if(adminReviewMatch&&method==='DELETE'){
    const a=administrator(req),i=db.reviews.findIndex(x=>x.id===adminReviewMatch[1]);if(i<0)throw fail(404,'NOT_FOUND');db.reviews.splice(i,1);audit(a,'review.remove',adminReviewMatch[1]);await save();return response(res,200,{ok:true});
  }
  if(p==='/api/admin/audit'&&method==='GET'){administrator(req);return response(res,200,{audit:(db.audit||[]).slice(0,200)});}
  if(p==='/api/admin/export'&&method==='GET'){
    const a=administrator(req);audit(a,'data.export','backup');await save();
    return response(res,200,{exportedAt:now(),users:db.users.map(publicUser),items:db.items,orders:db.orders,reviews:db.reviews,tickets:db.tickets,ads:db.ads||[],news:db.news||[],incomeEntries:db.incomeEntries||[],chats:db.chats||[],jobs:db.jobs||[],proposals:db.proposals||[],notifications:db.notifications||[],audit:db.audit});
  }
  if(p==='/api/ai/assist'&&method==='POST'){authed(req);const result=await aiAssist(await body(req));return response(res,200,result)}
  throw fail(404,'NOT_FOUND');
}

async function handle(req,res){try{
  const nativeOrigins=new Set(['http://localhost','https://localhost','capacitor://localhost']);
  const origin=String(req.headers.origin||'');
  const isNativeOrigin=nativeOrigins.has(origin)&&req.url?.startsWith('/api/');
  if(isNativeOrigin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization,X-SHODS-CLIENT');res.setHeader('Access-Control-Max-Age','600');}
  if(req.method==='OPTIONS'&&isNativeOrigin){res.writeHead(204);res.end();return;}
  if(['POST','PUT','PATCH','DELETE'].includes(req.method||'')){
    const origin=req.headers.origin;
    if(origin && process.env.NODE_ENV==='production'){
      const incomingHost=String(req.headers.host||'').split(':')[0].toLowerCase();
      let source;
      try{source=new URL(origin).hostname.toLowerCase()}catch{throw fail(403,'INVALID_ORIGIN')}
      if(source!==incomingHost&&!isNativeOrigin)throw fail(403,'INVALID_ORIGIN');
    }
  }
  if(req.url?.startsWith('/api/')){
    const p=new URL(req.url,'http://localhost').pathname;
    // Product images are independent of marketplace JSON; read them without
    // taking the global marketplace-state lock or reading sessions.
    const mediaId=req.method==='GET'&&p.match(/^\/api\/media\/([a-f0-9-]{36})$/)?.[1];
    if(mediaId){
      const media=await loadImage(DATA,mediaId);
      if(!media)throw fail(404,'NOT_FOUND');
      res.writeHead(200,{'Content-Type':media.mime,'Content-Length':media.bytes.length,
        'Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff'});
      res.end(media.bytes);return;
    }
    const write=['POST','PUT','PATCH','DELETE'].includes(req.method||'') && p!=='/api/ai/assist';
    return await withFreshState(DATA,write,async state=>{db=state;return router(req,res)});
  }if(req.method!=='GET')throw fail(405,'METHOD_NOT_ALLOWED');const dist=path.join(ROOT,'dist');let u;try{u=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{throw fail(400,'INVALID_URL')}const requestFile=path.resolve(dist,'.'+u);if(!requestFile.startsWith(dist+path.sep)&&requestFile!==dist)throw fail(403,'FORBIDDEN');const filename=fs.existsSync(requestFile)&&fs.statSync(requestFile).isFile()?requestFile:path.join(dist,'index.html');if(!fs.existsSync(filename))return response(res,404,{error:'Build not found. Run npm run dev or npm run build.'});const contentTypes={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.ico':'image/x-icon'};res.writeHead(200,{'Content-Type':contentTypes[path.extname(filename)]||'application/octet-stream','Cache-Control':filename.endsWith('index.html')?'no-cache':'public, max-age=3600'});fs.createReadStream(filename).pipe(res);}catch(e){if(!res.headersSent)response(res,e.status||500,{error:e.message||'SERVER_ERROR'});else res.end();if(!e.status)console.error(e)}}
const server=http.createServer(handle);
server.requestTimeout=30000;
server.headersTimeout=35000;
process.on('SIGTERM',()=>{server.close(async()=>{await closeStorage();process.exit(0)})});
if(process.env.SHODS_TEST_MODE!=='1')server.listen(PORT,'0.0.0.0',()=>console.log(`SHODS SHOP API: http://localhost:${PORT} · AI:${AI_KEY?'on':'off'} Telegram:${telegramEnabled?'on':'demo'}`));
export {server,db,handle};

// Telegram /start associates a private chat with a one-use six-digit code.
// The code is never sent through the browser API, and only its hash is stored.
export async function verifyTelegramChallenge(token,chatId){
  if(!/^reg_[a-f0-9]{18}$/.test(String(token)))return false;
  const v=db.telegramChallenges[token];
  if(!v || v.expires<Date.now() || v.verified)return false;
  if(!Number.isSafeInteger(Number(chatId))||!Number(chatId))return false;
  if(db.users.some(u=>String(u.telegramChatId)===String(chatId)))return false;
  if(v.chatId && v.chatId!==String(chatId))return false;
  v.chatId=String(chatId);
  v.otpHash=otpHash(token,otpValue(token,chatId));
  v.expires=Date.now()+600000;
  v.attempts??=0;
  await save();return true;
}

if(telegramEnabled && process.env.SHODS_TEST_MODE!=='1'){
  if(webhookEnabled){
    const setup=async(attempt=1)=>{
      try{
        await telegramApi('setWebhook',{
          url:`${PUBLIC_URL}/api/telegram/webhook`,secret_token:WEBHOOK_SECRET,
          allowed_updates:['message'],max_connections:1,drop_pending_updates:false
        });
        console.log('Telegram webhook configured (OTP verification ready).');
      }catch(e){
        console.warn('Telegram webhook configuration failed:',e.message);
        if(attempt<5)setTimeout(()=>setup(attempt+1),Math.min(60000,5000*attempt));
      }
    };
    // The server is already listening when setWebhook completes.
    void setup();
  }else if(process.env.NODE_ENV==='production'){
    console.warn('Telegram webhook disabled: set TELEGRAM_PUBLIC_URL to https://your-domain');
  }else{
    // Development does not poll or take webhook ownership from the production bot.
    console.log('Telegram bot polling off in development; use the production webhook for real codes.');
  }
}
