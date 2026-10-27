'use strict';
/* NCT DREAM 连连看 - Service Worker（离线缓存） */
const CACHE = 'nct-dream-llk-v5';
const CORE = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/audio.js',
  './js/game.js',
  './js/ui.js',
  './js/main.js',
  './icon.svg',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => hit))
  );
});
