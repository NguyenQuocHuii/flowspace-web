const CACHE_NAME = 'flowspace-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/register.html',
  '/app.html',
  '/favicon.svg',
  '/css/design-system.css',
  '/css/landing.css',
  '/css/login.css',
  '/css/app.css',
  '/css/dashboard.css',
  '/js/core/auth.js',
  '/js/core/seed-data.js',
  '/js/core/utils.js',
  '/js/core/router.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Check if it's an API call
  if (url.pathname.startsWith('/api/')) {
    // Check if the request contains Authorization headers
    const hasAuthToken = event.request.headers.has('Authorization');
    if (hasAuthToken) {
      // Network only, do not cache authenticated API calls
      event.respondWith(fetch(event.request));
      return;
    }

    // Network-first strategy for other public/non-authenticated API calls
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.status === 200 && event.request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(response => {
        if (response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
