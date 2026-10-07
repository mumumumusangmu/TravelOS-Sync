
const PREFIX = 'travelos-shell-' + encodeURIComponent(new URL(self.registration.scope).pathname) + '-';
const FX_CACHE = PREFIX + 'fx';
const CURRENCIES = ["CNY","TRY","EGP","EUR","USD"], FX_PROVIDER = "fawazahmed0/currency-api";
function validateFx(value) {
  const allowed = ['base', 'asOf', 'updated', 'source', 'rates'];
  if (!value || Object.keys(value).some(key => !allowed.includes(key)) || value.base !== 'CNY' || value.source !== FX_PROVIDER || typeof value.asOf !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.asOf) || new Date(value.asOf).toISOString().slice(0,10) !== value.asOf || typeof value.updated !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value.updated) || !Number.isFinite(Date.parse(value.updated))) throw new Error('汇率资料无效');
  if (!value.rates || Object.keys(value.rates).length !== 5 || CURRENCIES.some(code => !Number.isFinite(value.rates[code]) || value.rates[code] <= 0) || value.rates.CNY !== 1) throw new Error('汇率资料无效');
  return value;
}
const CACHE = PREFIX + "8b30164ee213";
const SHELL = ["./","./assets/index-BcJrvHpU.css","./assets/index-DQ2BHSIt.js","./icon.svg","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable.png","./index.html","./land-110m.geojson","./manifest.webmanifest"];
self.addEventListener('install', (event) => {
  // A freshly discovered worker must not install stale index.html from CDN/browser HTTP cache.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL.map(url => new Request(url, { cache: 'reload' })))));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE && key !== FX_CACHE).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || ['trip-pack.json', 'version.json', 'trip-pack.enc'].some(name => url.pathname.endsWith('/' + name))) return;
  const scope = self.registration.scope;
  if (!url.href.startsWith(scope)) return;
  if (url.pathname === new URL('fx.json',scope).pathname) {
    event.respondWith((async () => {
      const cache=await caches.open(FX_CACHE);
      try {
        const response=await fetch(new Request(event.request,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(5000)}));
        if(!response.ok)throw new Error('Unavailable');
        const text=await response.clone().text();if(text.length>4096)throw new Error('Invalid');
        validateFx(JSON.parse(text));await cache.put(event.request,response.clone());return response;
      } catch { return (await cache.match(event.request,{ignoreVary:true})) || new Response('',{status:503}); }
    })());return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then((cache) => cache.match(new URL('./', scope), { ignoreVary: true })).then((cached) => cached || fetch(event.request)));
  } else {
    // 同源静态外壳不按 Origin 区分；Vite / CDN 的 Vary: Origin 不应使离线缓存失配。
    event.respondWith(caches.open(CACHE).then((cache) => cache.match(event.request, { ignoreVary: true })).then((cached) => cached || fetch(event.request)));
  }
});
