const CACHE='shods-shop-static-v42';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/manifest.webmanifest','/icon-192.png','/icon-512.png'])))});
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',e=>{
 const req=e.request;if(req.method!=='GET'||new URL(req.url).pathname.startsWith('/api/'))return;
 if(new URL(req.url).origin!==self.location.origin)return;
 e.respondWith(fetch(req).then(res=>{if(res.ok&&req.mode!=='navigate')caches.open(CACHE).then(c=>c.put(req,res.clone()));return res}).catch(async()=>await caches.match(req)||Response.error()));
});
