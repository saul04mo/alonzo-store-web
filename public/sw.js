// IMPORTANTE: bumpear este nombre cada vez que se haga deploy con
// cambios significativos para forzar que los browsers que ya tenían
// la versión vieja en cache actualicen al activarse el nuevo SW.
const CACHE_NAME = 'alonzo-v5-no-mobile-hover';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/images/logoAlonzo.png',
];

// Install: cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and API/auth requests
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;

  // Skip all Firebase, Google, and external API requests
  const skipHosts = ['firestore', 'googleapis', 'firebaseio', 'firebaseapp', 'google.com', 'gstatic'];
  if (skipHosts.some((h) => url.hostname.includes(h))) return;
  if (url.origin !== self.location.origin && !url.hostname.includes('firebasestorage')) return;

  // Images: cache first (they don't change often)
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|webp|svg|gif)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Everything else: network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
