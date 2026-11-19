// Service worker: offline app shell without ever caching private data.
// - Navigations: network first; offline falls back to the last cached /app shell.
// - /assets/* (content-hashed by Vite, immutable): cache first.
// - /api/* and every cross-origin request (Firebase, banks, AI): never intercepted or cached.
const CACHE_NAME = 'jornada-shell-v3';
const SHELL = ['/app', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && url.pathname.startsWith('/app')) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/app', copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('/app')) || Response.error())
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }))
    );
  }
});
