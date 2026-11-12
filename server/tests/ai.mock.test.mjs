import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'shods-ai-mock-test-'));
process.env.SHODS_TEST_MODE='1';
process.env.SHODS_DATA_PATH=path.join(tmp,'db.json');
process.env.SEED_DEMO='1';
process.env.GEMINI_API_KEY='fake-test-only';
process.env.GEMINI_MODEL='gemini-3.5-flash-lite';
delete process.env.DATABASE_URL;
const originalFetch=globalThis.fetch;
let received=[];
globalThis.fetch=async (url,init)=>{
  if(String(url).startsWith('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent')){
    const payload=JSON.parse(init.body);received.push(payload);
    assert.equal(init.headers['x-goog-api-key'],'fake-test-only');
    const isImage=payload.contents[0].parts.some(i=>i.inline_data);
    const inputText=payload.contents[0].parts[0].text;
    if(isImage)assert.equal(payload.contents[0].parts[1].inline_data.mime_type,'image/png');const text=isImage?JSON.stringify({description:'Sanash o‘yini',possibleIds:['M05'],suggestedCategory:'Ta’lim'}):inputText.includes('SEMANTIK')?JSON.stringify({ids:['S11','S12']}):'Talabalar uchun tayyorlangan chiroyli slayd dizayni.';
    return new Response(JSON.stringify({candidates:[{content:{parts:[{text}]},finishReason:'STOP'}]}),{status:200,headers:{'Content-Type':'application/json'}});
  }
  return originalFetch(url,init);
};
const {server}=await import('../index.mjs');
let base;
const request=async(route,{method='GET',body,cookie}={})=>{
 const res=await fetch(base+route,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
 return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};
};
test('Gemini GenerateContent text and image integrations produce grounded UI results (mocked network)',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;
 try{
  const auth=await request('/api/auth/login',{method:'POST',body:{login:'demo_x01',password:'ShodsDemo123!'}});
  assert.equal(auth.status,200);
  const desc=await request('/api/ai/assist',{method:'POST',cookie:auth.cookie,body:{action:'description',title:'Slayd',category:'Slayd'}});
  assert.equal(desc.status,200);assert.equal(desc.data.engine,'gemini');
  const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9YiXaK0AAAAASUVORK5CYII=';
  const scan=await request('/api/ai/assist',{method:'POST',cookie:auth.cookie,body:{action:'image',image}});
  assert.equal(scan.status,200,JSON.stringify(scan.data));assert.equal(scan.data.engine,'gemini-vision');assert.equal(scan.data.matches[0].id,'M05');
  const semantic=await request('/api/ai/assist',{method:'POST',cookie:auth.cookie,body:{action:'finder',query:'Menga taqdimot slaydlari tayyorlaydigan talaba kerak'}});
  assert.equal(semantic.status,200);assert.equal(semantic.data.engine,'gemini-service-search');assert.equal(semantic.data.results[0].id,'S11');
  assert.equal(received.length,3);
  assert.equal(received[1].contents[0].parts[1].inline_data.mime_type,'image/png');
 }finally{await new Promise(resolve=>server.close(resolve));globalThis.fetch=originalFetch;fs.rmSync(tmp,{recursive:true,force:true})}
});

