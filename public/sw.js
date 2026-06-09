const CACHE_NAME = 'teamchemie-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.jsx',
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Offline during install is ok, continue
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Firebase and other external API calls - network only
  if (event.request.url.includes('firebase') || event.request.url.includes('googleapis')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('Offline - Firebase not available', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
    );
    return;
  }

  // App shell: Network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before returning
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          return response || new Response('Offline - page not cached', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});
