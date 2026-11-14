import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'shods-receipt-'));
process.env.SHODS_TEST_MODE='1';
process.env.SHODS_DATA_PATH=path.join(dir,'db.json');
const {server,db}=await import('../index.mjs');
let base;
async function req(route,{method='GET',body,cookie,bearer,origin,client}={}){
 const res=await fetch(base+route,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(bearer?{Authorization:`Bearer ${bearer}`}:{}) ,...(origin?{Origin:origin}:{}),...(client?{'X-SHODS-CLIENT':client}:{})},body:body?JSON.stringify(body):undefined});
 return {status:res.status,data:await res.json(),headers:res.headers,cookie:res.headers.get('set-cookie')?.split(';')[0]};
}
async function login(name,origin){const r=await req('/api/auth/login',{method:'POST',body:{login:name,password:'ShodsDemo123!'},...(origin?{origin,client:'android'}:{})});assert.equal(r.status,200,JSON.stringify(r.data));return r;}

test('SHODS SHOP 4: receipt-first order, cash payment verification, authorization and Android session',async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 base=`http://127.0.0.1:${server.address().port}`;
 try{
  const seller=await login('demo_s03'),buyer=await login('demo_x01');
  const native=await login('demo_x01','https://localhost');
  assert.match(native.data.sessionToken,/^s_[a-f0-9]{18}$/);
  const cors=await fetch(base+'/api/orders',{method:'OPTIONS',headers:{Origin:'https://localhost','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization,content-type'}});
  assert.equal(cors.status,204);assert.equal(cors.headers.get('access-control-allow-origin'),'https://localhost');
  const methods=await req('/api/payments/methods');assert.equal(methods.data.cashOnReceipt,true);assert.equal(methods.data.clickEnabled,false);
  const bought=await req('/api/orders',{method:'POST',cookie:buyer.cookie,body:{lines:[{id:'M05',qty:2}],payment:'pay_on_receipt'}});
  assert.equal(bought.status,201,JSON.stringify(bought.data));
  const order=bought.data.orders[0];
  assert.equal(order.total,90000);assert.equal(order.paymentStatus,'unpaid');assert.equal(order.status,'new');assert.equal(order.payment,'pay_on_receipt');
  // Browser checkout cannot decide it is paid by passing a forged status.
  const premature=await req(`/api/orders/${order.id}/cash-confirm`,{method:'POST',cookie:seller.cookie,body:{paymentStatus:'paid'}});
  assert.equal(premature.status,409);
  const buyerHandover=await req(`/api/orders/${order.id}`,{method:'PATCH',cookie:buyer.cookie,body:{status:'handed_over'}});assert.equal(buyerHandover.status,403);
  const sellerComplete=await req(`/api/orders/${order.id}`,{method:'PATCH',cookie:seller.cookie,body:{status:'completed'}});assert.equal(sellerComplete.status,400);
  const accepted=await req(`/api/orders/${order.id}`,{method:'PATCH',cookie:seller.cookie,body:{status:'accepted'}});assert.equal(accepted.status,200);
  const handed=await req(`/api/orders/${order.id}`,{method:'PATCH',cookie:seller.cookie,body:{status:'handed_over'}});assert.equal(handed.status,200);
  const forgedReceipt=await req(`/api/orders/${order.id}/receive`,{method:'POST',cookie:seller.cookie});assert.equal(forgedReceipt.status,403);
  const confirmed=await req(`/api/orders/${order.id}/receive`,{method:'POST',bearer:native.data.sessionToken,origin:'https://localhost',client:'android'});
  assert.equal(confirmed.status,200,JSON.stringify(confirmed.data));assert.equal(confirmed.data.order.status,'received');assert.equal(confirmed.data.order.paymentStatus,'unpaid');
  assert.equal(confirmed.headers.get('access-control-allow-origin'),'https://localhost');
  const duplicate=await req(`/api/orders/${order.id}/receive`,{method:'POST',cookie:buyer.cookie});assert.equal(duplicate.status,409);
  const fakeOnline=await req(`/api/orders/${order.id}/payment-intent`,{method:'POST',cookie:buyer.cookie,body:{provider:'click',paymentStatus:'paid'}});assert.equal(fakeOnline.status,503);
  // A buyer cash-claim is no longer required for seller settlement.
  assert.equal(confirmed.data.order.paymentStatus,'unpaid');
  const unauthorizedCash=await req(`/api/orders/${order.id}/cash-confirm`,{method:'POST',cookie:buyer.cookie});assert.equal(unauthorizedCash.status,403);
  const paid=await req(`/api/orders/${order.id}/cash-confirm`,{method:'POST',cookie:seller.cookie});
  assert.equal(paid.status,200,JSON.stringify(paid.data));assert.equal(paid.data.order.paymentStatus,'paid');assert.equal(paid.data.order.paymentMethod,'cash');assert.equal(paid.data.order.status,'completed');assert.ok(paid.data.order.receivedAt&&paid.data.order.paidAt);
  assert.equal((await req(`/api/orders/${order.id}/cash-confirm`,{method:'POST',cookie:seller.cookie})).status,409);
  assert.equal((await req('/api/auth/me',{bearer:native.data.sessionToken,origin:'https://localhost'})).data.user.login,'demo_x01');
  assert.ok(fs.existsSync(process.env.SHODS_DATA_PATH));
 }finally{await new Promise(resolve=>server.close(resolve));fs.rmSync(dir,{recursive:true,force:true});}
});
