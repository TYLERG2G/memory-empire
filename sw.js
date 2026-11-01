const CACHE = 'MEMORY_RPG_v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/data.js',
  './js/game.js',
  './sw.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-180.png',
  './assets/icons/apple-touch-icon.png',
  './assets/heroines/verda.webp',
  './assets/heroines/verda-sm.webp',
  './assets/heroines/karena.webp',
  './assets/heroines/karena-sm.webp',
  './assets/heroines/elys.webp',
  './assets/heroines/elys-sm.webp',
  './assets/heroines/selas.webp',
  './assets/heroines/selas-sm.webp',
  './assets/heroines/reina.webp',
  './assets/heroines/reina-sm.webp'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        const copy = res.clone();
        try {
          if (res.ok && new URL(e.request.url).origin === self.location.origin) {
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
        } catch (_) {}
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
