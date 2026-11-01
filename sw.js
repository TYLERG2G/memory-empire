/* 記憶帝國：女傑翻牌 — Service Worker v4a（UI v4） */
const CACHE = 'MEMORY_RPG_v4a';
// 核心殼層：缺一即安裝失敗
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/data.js',
  './js/game.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-180.png',
  './assets/icons/apple-touch-icon.png'
];
// v3 模組與素材：逐一快取，個別缺失不影響安裝（平行開發中模組可能尚未就緒）
const OPTIONAL = [
  './sw.js',
  './css/fx.css',
  './css/heroine.css',
  './css/ui-v4.css',
  './assets/icons/icons.svg',
  './js/content_zh.js',
  './js/audio.js',
  './js/fx.js',
  './js/story.js',
  './js/heroine.js',
  './js/vendor/pixelfx/pixelfx.bundle.js',
  './assets/sfx/mouth-pop.ogg',
  './assets/sfx/plop.ogg',
  './assets/sfx/pop.ogg',
  './assets/sfx/triangle.ogg',
  './assets/sfx/whoosh.ogg',
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
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(CORE).then(() => Promise.all(OPTIONAL.map((u) => c.add(u).catch(() => null))))
    ).then(() => self.skipWaiting())
  );
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
      }).catch(() => (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
    })
  );
});
