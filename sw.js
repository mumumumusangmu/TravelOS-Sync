
const PREFIX = 'travelos-shell-' + encodeURIComponent(new URL(self.registration.scope).pathname) + '-';
const CACHE = PREFIX + "0446064e292e";
const SHELL = ["./","./assets/index-Bv013Yu5.css","./assets/index-BvJlavhZ.js","./icon.svg","./icons/apple-touch-icon.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable.png","./index.html","./land-110m.geojson","./manifest.webmanifest"];
self.addEventListener('install', (event) => {
  // A freshly discovered worker must not install stale index.html from CDN/browser HTTP cache.
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL.map(url => new Request(url, { cache: 'reload' })))));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || ['trip-pack.json', 'version.json', 'trip-pack.enc'].some(name => url.pathname.endsWith('/' + name))) return;
  const scope = self.registration.scope;
  if (!url.href.startsWith(scope)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then((cache) => cache.match(new URL('./', scope), { ignoreVary: true })).then((cached) => cached || fetch(event.request)));
  } else {
    // 同源静态外壳不按 Origin 区分；Vite / CDN 的 Vary: Origin 不应使离线缓存失配。
    event.respondWith(caches.open(CACHE).then((cache) => cache.match(event.request, { ignoreVary: true })).then((cached) => cached || fetch(event.request)));
  }
});
