const CACHE='shods-shop-static-v4';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/manifest.webmanifest','/icon-192.png','/icon-512.png'])))});
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);await self.clients.claim()})()));
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET'||new URL(req.url).pathname.startsWith('/api/'))return; if(req.mode==='navigate'){e.respondWith(fetch(req));return;}e.respondWith(caches.match(req).then(c=>c||fetch(req).then(res=>{if(res.ok&&new URL(req.url).origin===self.location.origin){const clone=res.clone();caches.open(CACHE).then(store=>store.put(req,clone));}return res;})))});
