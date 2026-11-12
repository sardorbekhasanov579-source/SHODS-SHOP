import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'shods-webhook-test-'));
process.env.SHODS_TEST_MODE='1';
process.env.SEED_DEMO='0';
process.env.SHODS_DATA_PATH=path.join(tmp,'db.json');
process.env.TELEGRAM_BOT_TOKEN='00000:mock_webhook_bot_key';
process.env.TELEGRAM_BOT_USERNAME='shods_fake_webhook_bot';
process.env.TELEGRAM_PUBLIC_URL='https://shods-shop.onrender.com';
delete process.env.DATABASE_URL;
const messages=[];
const oldFetch=globalThis.fetch;
globalThis.fetch=async (url,options)=>{
  if(String(url).includes('api.telegram.org')){
    const b=JSON.parse(options.body);
    if(String(url).endsWith('/sendMessage'))messages.push(b);
    return new Response(JSON.stringify({ok:true,result:{message_id:1}}),{status:200,headers:{'Content-Type':'application/json'}});
  }
  return oldFetch(url,options);
};
const {server}=await import('../index.mjs');
let base;
async function request(route,{method='GET',body,headers={}}={}){
  const resp=await oldFetch(base+route,{method,headers:{'Content-Type':'application/json',...headers},body:body?JSON.stringify(body):undefined});
  return {status:resp.status,data:await resp.json()};
}
test('Telegram webhook: secure signature, sends real 6-digit code, confirms once',async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base=`http://127.0.0.1:${server.address().port}`;
  try{
    const c=await request('/api/auth/telegram/start',{method:'POST',body:{}});
    assert.equal(c.status,200);
    const secret=crypto.createHmac('sha256',process.env.TELEGRAM_BOT_TOKEN).update('shods-shop-telegram-webhook-v1').digest('hex');
    const update={update_id:55,message:{text:'/start '+c.data.token,chat:{id:88776655,type:'private'}}};
    const denied=await request('/api/telegram/webhook',{method:'POST',headers:{'x-telegram-bot-api-secret-token':'bad'},body:update});
    assert.equal(denied.status,403);
    const approved=await request('/api/telegram/webhook',{method:'POST',headers:{'x-telegram-bot-api-secret-token':secret},body:update});
    assert.equal(approved.status,200,JSON.stringify(approved.data));
    assert.equal(messages.length,1);
    const code=messages[0].text.match(/\b\d{6}\b/)[0];
    assert.equal((await request('/api/auth/telegram/status?token='+c.data.token)).data.verified,false);
    const confirmed=await request('/api/auth/telegram/confirm',{method:'POST',body:{token:c.data.token,code}});
    assert.equal(confirmed.status,200);
    assert.equal((await request('/api/auth/telegram/status?token='+c.data.token)).data.verified,true);
    const payload={name:'Webhook Student',login:'webhook_student',password:'very-strong-password',institute:'Termiz davlat pedagogika instituti',faculty:'Tillar',direction:'Language',course:2,telegramToken:c.data.token};
    const register=await request('/api/auth/register',{method:'POST',body:payload});
    assert.equal(register.status,201,JSON.stringify(register.data));
    const repeat=await request('/api/auth/register',{method:'POST',body:{...payload,login:'another_name'}});
    assert.equal(repeat.status,403);
  }finally{
    await new Promise(resolve=>server.close(resolve));
    fs.rmSync(tmp,{recursive:true,force:true});
    globalThis.fetch=oldFetch;
  }
});
