import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const temp=fs.mkdtempSync(path.join(os.tmpdir(),'shods-api-test-'));
process.env.SHODS_TEST_MODE='1';
process.env.SHODS_DATA_PATH=path.join(temp,'db.json');
const {server,db}=await import('../index.mjs');

let base;
async function request(route,{method='GET',body,cookie}={}){
  const r=await fetch(base+route,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
  const d=await r.json();return {status:r.status,data:d,cookie:r.headers.get('set-cookie')?.split(';')[0]};
}
async function signIn(login){const r=await request('/api/auth/login',{method:'POST',body:{login,password:'ShodsDemo123!'}});assert.equal(r.status,200,JSON.stringify(r.data));return r.cookie}

test('SHODS SHOP: seller → buyer → admin end-to-end',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base=`http://127.0.0.1:${server.address().port}`;
 try{
  const init=await request('/api/bootstrap');assert.equal(init.status,200);assert.equal(init.data.items.length,18);
  const seller=await signIn('demo_s03');const buyer=await signIn('demo_x01');
  const unauthorized=await request('/api/admin/overview',{cookie:seller});assert.equal(unauthorized.status,403);
  const item=await request('/api/listings',{method:'POST',cookie:seller,body:{name:'Hackathon product',description:'Test',kind:'Moddiy',category:'Ta’lim',price:10500,stock:3,location:'Termiz, institut',active:true}});
  assert.equal(item.status,201,JSON.stringify(item.data));
  const id=item.data.item.id;
  // Upload a real image, attach by URL, and ensure it survives catalog reload.
  const png=fs.readFileSync(new URL('../../public/icon-192.png',import.meta.url));
  const mediaUpload=await request('/api/media',{method:'POST',cookie:seller,body:{image:'data:image/png;base64,'+png.toString('base64')}});
  assert.equal(mediaUpload.status,201,JSON.stringify(mediaUpload.data));
  assert.match(mediaUpload.data.url,/^\/api\/media\/[a-f0-9-]{36}$/);
  const afterImage=await request('/api/listings/'+id,{method:'PATCH',cookie:seller,body:{...item.data.item,image:mediaUpload.data.url}});
  assert.equal(afterImage.status,200,JSON.stringify(afterImage.data));
  assert.equal((await request('/api/bootstrap')).data.items.find(p=>p.id===id).image,mediaUpload.data.url);
  const actualImage=await fetch(base+mediaUpload.data.url);
  assert.equal(actualImage.status,200);
  assert.equal(actualImage.headers.get('content-type'),'image/png');
  assert.deepEqual(Buffer.from(await actualImage.arrayBuffer()),png);

  const browse=await request('/api/bootstrap');assert.ok(browse.data.items.find(p=>p.id===id));
  const selfOrder=await request('/api/orders',{method:'POST',cookie:seller,body:{lines:[{id,qty:1}],payment:'demo'}});assert.equal(selfOrder.status,400);
  const purchased=await request('/api/orders',{method:'POST',cookie:buyer,body:{lines:[{id:'M05',qty:2}],payment:'demo'}});
  assert.equal(purchased.status,201,JSON.stringify(purchased.data));assert.equal(purchased.data.orders[0].total,90000);
  const orderId=purchased.data.orders[0].id;
  const incoming=await request('/api/orders?type=seller',{cookie:seller});assert.ok(incoming.data.orders.find(o=>o.id===orderId));
  const accepted=await request('/api/orders/'+orderId,{method:'PATCH',cookie:seller,body:{status:'accepted'}});assert.equal(accepted.status,200);
  const completed=await request('/api/orders/'+orderId,{method:'PATCH',cookie:seller,body:{status:'completed'}});assert.equal(completed.status,200);
  const review=await request('/api/reviews',{method:'POST',cookie:buyer,body:{itemId:'M05',stars:5,text:'Juda yaxshi mahsulot'}});assert.equal(review.status,201);
  const sellerPublic=await request('/api/sellers/S03');assert.equal(sellerPublic.status,200);assert.equal(sellerPublic.data.completed,1);assert.equal(sellerPublic.data.reviews.length,1);
  const ticket=await request('/api/support',{method:'POST',cookie:buyer,body:{topic:'Technical',message:'Demo sinovda yordam kerak'}});assert.equal(ticket.status,201);
  // Promote a fixture account *only in the isolated test database*.
  db.users.find(u=>u.id==='S01').role='admin';
  const admin=await signIn('demo_s01');
  const summary=await request('/api/admin/overview',{cookie:admin});assert.equal(summary.status,200);assert.ok(summary.data.stats.orders>=1);
  const moderation=await request('/api/admin/listings/'+id,{method:'PATCH',cookie:admin,body:{moderation:'hidden'}});assert.equal(moderation.status,200);
  assert.equal((await request('/api/bootstrap')).data.items.some(x=>x.id===id),false);
  const hideEdit=await request('/api/listings/'+id,{method:'PATCH',cookie:seller,body:{...item.data.item,active:true}});assert.equal(hideEdit.status,200);
  assert.equal((await request('/api/bootstrap')).data.items.some(x=>x.id===id),false);
  const answered=await request('/api/admin/tickets/'+ticket.data.ticket.id,{method:'PATCH',cookie:admin,body:{status:'answered',reply:'Yordam tayyor'}});assert.equal(answered.status,200);
  assert.equal((await request('/api/support',{cookie:buyer})).data.tickets[0].reply,'Yordam tayyor');
  const exported=await request('/api/admin/export',{cookie:admin});assert.equal(exported.status,200);assert.ok(exported.data.users.every(u=>!('passwordHash' in u)));
  const suspended=await request('/api/admin/users/X01',{method:'PATCH',cookie:admin,body:{status:'suspended'}});assert.equal(suspended.status,200);
  assert.equal((await request('/api/orders',{cookie:buyer})).status,401);
  assert.ok(fs.existsSync(process.env.SHODS_DATA_PATH),'database persisted to JSON');
 }finally{await new Promise(resolve=>server.close(resolve));fs.rmSync(temp,{recursive:true,force:true})}
});
