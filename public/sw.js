const CACHE_NAME = 'nd-quation-v3';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/img/logo.png',
  '/img/icon-192.png',
  '/img/icon-512.png',
  '/img/maskable-192.png',
  '/img/maskable-512.png',
  '/img/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.hostname === 'script.google.com' || request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')));
    return;
  }

  // Prefer the newest deployed files. Cache is only a fallback for offline use;
  // cache-first here can leave the app running old JavaScript after an update.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (url.origin === self.location.origin && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
