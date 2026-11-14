import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shods-monetization-'));
process.env.SHODS_TEST_MODE='1';
process.env.SHODS_DATA_PATH=path.join(dir,'db.json');
const {server,db}=await import('../index.mjs');
let root;
async function req(route,{method='GET',body,cookie}={}){
 const response=await fetch(root+route,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
 return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
async function login(name){const res=await req('/api/auth/login',{method:'POST',body:{login:name,password:'ShodsDemo123!'}});assert.equal(res.status,200);return res.cookie;}
test('SHODS SHOP 4.2 admin-only manual revenue and TOP/PRO benefits',async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));root=`http://127.0.0.1:${server.address().port}`;
 try{
  db.users.find(x=>x.id==='S01').role='admin';
  const admin=await login('demo_s01'),student=await login('demo_s03');
  const reportPath='/api/admin/finance';
  assert.equal((await req(reportPath,{cookie:student})).status,403);
  assert.equal((await req(reportPath,{method:'POST',cookie:student,body:{kind:'pro',amount:30000,description:'banned user'}})).status,403);
  const initial=await req(reportPath,{cookie:admin});assert.equal(initial.status,200);assert.equal(initial.data.totalReceived,0);
  assert.equal((await req(reportPath,{method:'POST',cookie:admin,body:{kind:'pro',amount:0,description:'invalid'}})).status,400);
  const recorded=await req(reportPath,{method:'POST',cookie:admin,body:{kind:'advertisement',amount:100000,description:'Local advertisement paid cash'}});
  assert.equal(recorded.status,201,JSON.stringify(recorded.data));
  assert.equal(recorded.data.entry.paymentMethod,'cash');
  assert.equal((await req(reportPath,{cookie:admin})).data.totalReceived,100000);
  assert.equal((await req('/api/admin/boost/M05',{method:'PATCH',cookie:student,body:{days:7}})).status,403);
  const boosted=await req('/api/admin/boost/M05',{method:'PATCH',cookie:admin,body:{days:7}});
  assert.equal(boosted.status,200);assert.ok(Date.parse(boosted.data.item.boostUntil)>Date.now());
  const pro=await req('/api/admin/pro/S03',{method:'PATCH',cookie:admin,body:{days:30}});
  assert.equal(pro.status,200);assert.ok(Date.parse(pro.data.user.proUntil)>Date.now());
  const browse=await req('/api/bootstrap');assert.equal(browse.status,200);
  assert.ok(browse.data.items.find(x=>x.id==='M05').boostUntil);
  assert.ok(browse.data.items.find(x=>x.id==='M05').sellerProUntil);
  const report=await req(reportPath,{cookie:admin});assert.equal(report.data.proSellers.length,1);assert.equal(report.data.boostedListings.length,1);
  assert.equal(report.data.totalReceived,100000,'activation never counts as income');
  assert.equal((await req('/api/admin/pro/S03',{method:'PATCH',cookie:admin,body:{days:0}})).status,200);
  assert.equal((await req('/api/admin/boost/M05',{method:'PATCH',cookie:admin,body:{days:0}})).status,200);
  const after=await req(reportPath,{cookie:admin});assert.equal(after.data.proSellers.length,0);assert.equal(after.data.boostedListings.length,0);
  assert.equal(after.data.totalReceived,100000,'manual cash receipt remains in audit history');
  const forbiddenDemo=await req('/api/orders',{method:'POST',cookie:student,body:{payment:'demo',lines:[{id:'M05',qty:1}]}});
  assert.equal(forbiddenDemo.status,400);
 } finally { await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true}); }
});
