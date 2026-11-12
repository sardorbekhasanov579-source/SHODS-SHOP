import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

// All credentials are FAKE and no network calls are made in this test.
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'shods-telegram-test-'));
process.env.SHODS_TEST_MODE='1';
process.env.TELEGRAM_BOT_TOKEN='00000:mock_token_not_valid';
process.env.TELEGRAM_BOT_USERNAME='shods_fake_test_bot';
process.env.SHODS_DATA_PATH=path.join(tmp,'db.json');
process.env.SEED_DEMO='0';
delete process.env.DATABASE_URL;
const {server,verifyTelegramChallenge,db}=await import('../index.mjs');
let base;
const request=async (route,{method='GET',body}={})=>{
  const response=await fetch(base+route,{method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
  return {status:response.status,data:await response.json()};
};
test('Telegram signup challenge persists and can be used only once',async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base=`http://127.0.0.1:${server.address().port}`;
  try{
    const begin=await request('/api/auth/telegram/start',{method:'POST',body:{}});
    assert.equal(begin.status,200);
    assert.ok(begin.data.url.includes('shods_fake_test_bot'));
    assert.equal((await request('/api/auth/telegram/status?token='+begin.data.token)).data.verified,false);
    assert.equal(await verifyTelegramChallenge(begin.data.token,1234567),true);
    assert.equal((await request('/api/auth/telegram/status?token='+begin.data.token)).data.verified,false);
    const otp=String(crypto.createHmac('sha256',process.env.TELEGRAM_BOT_TOKEN).update(`${begin.data.token}:1234567`).digest().readUInt32BE(0)%1000000).padStart(6,'0');
    const failOtp=await request('/api/auth/telegram/confirm',{method:'POST',body:{token:begin.data.token,code:'111111'===otp?'000000':'111111'}});
    assert.equal(failOtp.status,400);
    const confirmed=await request('/api/auth/telegram/confirm',{method:'POST',body:{token:begin.data.token,code:otp}});
    assert.equal(confirmed.status,200,JSON.stringify(confirmed.data));
    assert.equal((await request('/api/auth/telegram/status?token='+begin.data.token)).data.verified,true);
    assert.equal(await verifyTelegramChallenge(begin.data.token,1234567),false);
    const payload={name:'Telegram test student',login:'telegram_test_2026',password:'ThisIsAStrongPassword42!',institute:'Termiz davlat pedagogika instituti',faculty:'Tillar',direction:'Ingliz tili',course:2,telegramToken:begin.data.token};
    const registered=await request('/api/auth/register',{method:'POST',body:payload});
    assert.equal(registered.status,201,JSON.stringify(registered.data));
    assert.equal(db.users.find(u=>u.login===payload.login)?.telegramChatId,'1234567');
    assert.equal((await request('/api/auth/register',{method:'POST',body:{...payload,login:'telegram_second_2026'}})).status,403);
    const second=await request('/api/auth/telegram/start',{method:'POST',body:{}});
    assert.equal(await verifyTelegramChallenge(second.data.token,1234567),false);
    assert.ok(fs.readFileSync(process.env.SHODS_DATA_PATH,'utf8').includes('telegramChatId'));
  }finally{
    await new Promise(resolve=>server.close(resolve));
    fs.rmSync(tmp,{recursive:true,force:true});
  }
});
