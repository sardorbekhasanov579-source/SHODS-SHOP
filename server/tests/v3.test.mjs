import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const temp=fs.mkdtempSync(path.join(os.tmpdir(),'shods-v3-test-'));
process.env.SHODS_TEST_MODE='1';process.env.SHODS_DATA_PATH=path.join(temp,'db.json');
const {server,db}=await import('../index.mjs');
let base;
async function call(url,{method='GET',body,cookie}={}){
  const r=await fetch(base+'/api'+url,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
  const data=await r.json();return {status:r.status,data,cookie:r.headers.get('set-cookie')?.split(';')[0]};
}
async function login(username){const r=await call('/auth/login',{method:'POST',body:{login:username,password:'ShodsDemo123!'}});assert.equal(r.status,200);return r.cookie}
test('SHODS SHOP V3: admin banners, chat permissions, projects, proposals and notifications',async()=>{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));base=`http://127.0.0.1:${server.address().port}`;
 try{
  const seller=await login('demo_s05'),buyer=await login('demo_x01'),unauth=await call('/admin/ads',{cookie:buyer});assert.equal(unauth.status,403);
  db.users.find(u=>u.id==='S01').role='admin';const admin=await login('demo_s01');
  const ad=await call('/admin/ads',{method:'POST',cookie:admin,body:{title:'Ochiq dars',subtitle:'Talabalar uchun reklama',theme:'teal',target:'services',active:true}});
  assert.equal(ad.status,201,JSON.stringify(ad.data));assert.equal((await call('/ads')).data.ads.length,1);
  assert.equal((await call('/admin/ads/'+ad.data.ad.id,{method:'PATCH',cookie:buyer,body:{active:false}})).status,403);
  assert.equal((await call('/admin/ads/'+ad.data.ad.id,{method:'PATCH',cookie:admin,body:{active:false}})).status,200);
  assert.equal((await call('/ads')).data.ads.length,0);
  assert.equal((await call('/admin/ads/'+ad.data.ad.id,{method:'PATCH',cookie:admin,body:{active:true}})).status,200);
  const chat=await call('/chats',{method:'POST',cookie:buyer,body:{itemId:'M10'}});assert.equal(chat.status,200,JSON.stringify(chat.data));
  const chatId=chat.data.chat.id;const message=await call('/chats/'+chatId+'/messages',{method:'POST',cookie:buyer,body:{text:'Assalomu alaykum, dastur mavjudmi?'}});
  assert.equal(message.status,201,JSON.stringify(message.data));
  assert.equal((await call('/chats/'+chatId+'/messages',{cookie:seller})).data.messages[0].text,'Assalomu alaykum, dastur mavjudmi?');
  assert.equal((await call('/chats/'+chatId+'/messages',{cookie:admin})).status,403);
  const alerts=await call('/notifications',{cookie:seller});assert.equal(alerts.status,200);assert.ok(alerts.data.notifications.some(n=>n.type==='chat'));
  assert.equal((await call('/notifications/read',{method:'POST',cookie:seller,body:{}})).status,200);
  assert.ok((await call('/notifications',{cookie:seller})).data.notifications.every(n=>n.read));
  const job=await call('/jobs',{method:'POST',cookie:buyer,body:{title:'Slayd dizayni kerak',description:'PowerPoint uchun 10 sahifali sifatli taqdimot',category:'Slayd',budget:70000}});
  assert.equal(job.status,201,JSON.stringify(job.data));const jobId=job.data.job.id;
  const proposal=await call('/jobs/'+jobId+'/proposals',{method:'POST',cookie:seller,body:{price:65000,note:'Taqdimotni 2 kunda tayyorlayman.'}});
  assert.equal(proposal.status,201,JSON.stringify(proposal.data));
  assert.equal((await call('/jobs/'+jobId+'/proposals',{cookie:buyer})).data.proposals.length,1);
  assert.equal((await call('/jobs/'+jobId+'/accept',{method:'PATCH',cookie:seller,body:{proposalId:proposal.data.proposal.id}})).status,403);
  const accepted=await call('/jobs/'+jobId+'/accept',{method:'PATCH',cookie:buyer,body:{proposalId:proposal.data.proposal.id}});
  assert.equal(accepted.status,200,JSON.stringify(accepted.data));assert.equal(accepted.data.job.status,'assigned');
  assert.ok((await call('/notifications',{cookie:seller})).data.notifications.some(n=>n.type==='job'));
  const state=JSON.parse(fs.readFileSync(process.env.SHODS_DATA_PATH,'utf8'));
  assert.equal(state.ads.length,1);assert.equal(state.chats.length,1);assert.equal(state.jobs.length,1);assert.equal(state.proposals.length,1);
  assert.equal((await call('/admin/overview',{cookie:admin})).data.stats.adsActive,1);
 }finally{await new Promise(done=>server.close(done));fs.rmSync(temp,{recursive:true,force:true})}
});
