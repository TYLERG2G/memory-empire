/* 記憶帝國：女傑翻牌 — Service Worker v4f2（stage clip+swap） */
const CACHE = 'MEMORY_RPG_v4f2';
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
  './css/battle-stage.css',
  './assets/icons/icons.svg',
  './js/content_zh.js',
  './js/audio.js',
  './js/fx.js',
  './js/story.js',
  './js/heroine.js',
  './js/battle-stage.js',
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
  './assets/heroines/reina-sm.webp',
  './assets/battle/heroines/verda_idle0.png',
  './assets/battle/heroines/karena_idle0.png',
  './assets/battle/bg/ch1.png',
  './assets/battle/monsters/ch1_mob_a.png',
  './assets/battle/monsters/default_mob.png',
  './assets/battle/monsters/default_boss.png',
  './assets/battle/bg/ch1@3x.png',
  './assets/battle/bg/ch2.png',
  './assets/battle/bg/ch2@3x.png',
  './assets/battle/bg/ch3.png',
  './assets/battle/bg/ch3@3x.png',
  './assets/battle/bg/ch4.png',
  './assets/battle/bg/ch4@3x.png',
  './assets/battle/bg/ch5.png',
  './assets/battle/bg/ch5@3x.png',
  './assets/battle/heroines/elys_attack.png',
  './assets/battle/heroines/elys_hit.png',
  './assets/battle/heroines/elys_idle0.png',
  './assets/battle/heroines/elys_idle1.png',
  './assets/battle/heroines/elys_victory.png',
  './assets/battle/heroines/karena_attack.png',
  './assets/battle/heroines/karena_hit.png',
  './assets/battle/heroines/karena_idle1.png',
  './assets/battle/heroines/karena_victory.png',
  './assets/battle/heroines/reina_attack.png',
  './assets/battle/heroines/reina_hit.png',
  './assets/battle/heroines/reina_idle0.png',
  './assets/battle/heroines/reina_idle1.png',
  './assets/battle/heroines/reina_victory.png',
  './assets/battle/heroines/selas_attack.png',
  './assets/battle/heroines/selas_hit.png',
  './assets/battle/heroines/selas_idle0.png',
  './assets/battle/heroines/selas_idle1.png',
  './assets/battle/heroines/selas_victory.png',
  './assets/battle/heroines/verda_attack.png',
  './assets/battle/heroines/verda_hit.png',
  './assets/battle/heroines/verda_idle1.png',
  './assets/battle/heroines/verda_victory.png',
  './assets/battle/monsters/ch1_boss.png',
  './assets/battle/monsters/ch1_boss@1.5x.png',
  './assets/battle/monsters/ch1_mob_b.png',
  './assets/battle/monsters/ch2_boss.png',
  './assets/battle/monsters/ch2_boss@1.5x.png',
  './assets/battle/monsters/ch2_mob_a.png',
  './assets/battle/monsters/ch2_mob_b.png',
  './assets/battle/monsters/ch3_boss.png',
  './assets/battle/monsters/ch3_boss@1.5x.png',
  './assets/battle/monsters/ch3_mob_a.png',
  './assets/battle/monsters/ch3_mob_b.png',
  './assets/battle/monsters/ch4_boss.png',
  './assets/battle/monsters/ch4_boss@1.5x.png',
  './assets/battle/monsters/ch4_mob_a.png',
  './assets/battle/monsters/ch4_mob_b.png',
  './assets/battle/monsters/ch5_boss.png',
  './assets/battle/monsters/ch5_boss@1.5x.png',
  './assets/battle/monsters/ch5_mob_a.png',
  './assets/battle/monsters/ch5_mob_b.png',
  './assets/battle/monsters/default_boss@1.5x.png'
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
