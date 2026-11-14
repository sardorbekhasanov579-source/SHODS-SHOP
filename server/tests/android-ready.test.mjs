import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shods-android41-'));
process.env.SHODS_TEST_MODE='1';
process.env.SHODS_DATA_PATH=path.join(dir,'db.json');
process.env.GEMINI_API_KEY='';
const {server}=await import('../index.mjs');

test('SHODS SHOP 4.1: Android API handshake, CORS and AI chat fallback',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const health=await fetch(base+'/api/health',{headers:{Origin:'https://localhost'}});
  assert.equal(health.status,200);
  assert.equal(health.headers.get('access-control-allow-origin'),'https://localhost');
  const h=await health.json();
  assert.equal(h.capabilities.android,true);
  assert.equal(h.capabilities.bearerAuth,true);
  assert.equal(h.capabilities.receiptPayment,true);
  const login=await fetch(base+'/api/auth/login',{method:'POST',headers:{Origin:'https://localhost','Content-Type':'application/json','X-SHODS-CLIENT':'android'},body:JSON.stringify({login:'demo_x01',password:'ShodsDemo123!'})});
  assert.equal(login.status,200);
  const l=await login.json();
  assert.match(l.sessionToken,/^s_[0-9a-f]{18}$/);
  const chat=await fetch(base+'/api/ai/assist',{method:'POST',headers:{Origin:'https://localhost','X-SHODS-CLIENT':'android','Content-Type':'application/json',Authorization:`Bearer ${l.sessionToken}`},body:JSON.stringify({action:'chat',lang:'uz',message:'noutbuk kerak'})});
  assert.equal(chat.status,200);
  const data=await chat.json();
  assert.ok(data.reply);
  assert.ok(Array.isArray(data.results));
  assert.equal(chat.headers.get('access-control-allow-origin'),'https://localhost');
 }finally{await new Promise(resolve=>server.close(resolve));fs.rmSync(dir,{recursive:true,force:true})}
});
