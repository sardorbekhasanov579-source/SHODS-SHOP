import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'shods-news-'));
process.env.SHODS_TEST_MODE='1';
process.env.SHODS_DATA_PATH=path.join(tmp,'state.json');
const {server,db}=await import('../index.mjs');
let base;
async function call(url,{method='GET',body,cookie}={}){
 const response=await fetch(`${base}/api${url}`,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
 return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
}
async function login(name){const res=await call('/auth/login',{method:'POST',body:{login:name,password:'ShodsDemo123!'}});assert.equal(res.status,200);return res.cookie}
test('news is public, editing and broadcasts only for admin; read status is private',async()=>{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));base=`http://127.0.0.1:${server.address().port}`;
 try{
  const studentA=await login('demo_s02'),studentB=await login('demo_s03');
  const badPost=await call('/admin/news',{method:'POST',cookie:studentA,body:{title:'Test taklif',body:'Talabalarga kerakli muhim taklif',kind:'offer',broadcast:true}});
  assert.equal(badPost.status,403);
  const badGet=await call('/admin/news',{cookie:studentA});assert.equal(badGet.status,403);
  db.users.find(u=>u.id==='S01').role='admin';const admin=await login('demo_s01');
  const created=await call('/admin/news',{method:'POST',cookie:admin,body:{title:'Katta imkoniyat',body:'Barcha talabalar uchun yangi loyiha taqdimoti e’lon qilindi.',kind:'offer',titleRu:'Новая возможность',titleEn:'New opportunity',published:true,broadcast:true}});
  assert.equal(created.status,201,JSON.stringify(created.data));
  assert.ok(created.data.news.broadcastedAt);
  const {news}= (await call('/news')).data;
  assert.equal(news.length,1);assert.equal(news[0].titleEn,'New opportunity');
  const a=(await call('/notifications',{cookie:studentA})).data.notifications;
  const b=(await call('/notifications',{cookie:studentB})).data.notifications;
  assert.equal(a.length,1);assert.equal(b.length,1);assert.equal(a[0].read,false);
  assert.equal(b[0].read,false);assert.equal(a[0].targetId,created.data.news.id);
  assert.equal((await call('/notifications/read',{method:'POST',cookie:studentA,body:{id:a[0].id}})).status,200);
  assert.equal((await call('/notifications',{cookie:studentA})).data.notifications[0].read,true);
  assert.equal((await call('/notifications',{cookie:studentB})).data.notifications[0].read,false);
  assert.equal((await call('/admin/news/'+created.data.news.id,{method:'PATCH',cookie:studentB,body:{published:false}})).status,403);
  assert.equal((await call('/admin/news/'+created.data.news.id,{method:'PATCH',cookie:admin,body:{published:false}})).status,200);
  assert.equal((await call('/news')).data.news.length,0);
  const state=JSON.parse(fs.readFileSync(process.env.SHODS_DATA_PATH,'utf8'));
  assert.equal(state.news.length,1);assert.equal(state.notifications.filter(x=>x.audience==='all').length,1);
 }finally{await new Promise(done=>server.close(done));fs.rmSync(tmp,{recursive:true,force:true})}
});
