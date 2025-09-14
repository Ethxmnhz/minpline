// Simple service worker for Minpline PWA
// Caches core assets (app shell) and serves them offline.
// Uses a stale-while-revalidate strategy for navigation and static assets.

const VERSION = 'v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== VERSION).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Helper: fetch with network fallback to cache for navigation requests
async function handleNavigationRequest(event) {
  try {
    const networkResponse = await fetch(event.request);
    const cache = await caches.open(VERSION);
    cache.put(event.request, networkResponse.clone());
    return networkResponse;
  } catch (e) {
    const cache = await caches.open(VERSION);
    const cached = await cache.match('/index.html');
    return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigation requests: serve SPA shell offline
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(event));
    return;
  }

  // Static assets (same-origin) - stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(VERSION).then(async cache => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then(response => {
          // Only cache successful basic responses
          if (response && response.status === 200 && response.type === 'basic') {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // For cross-origin (e.g., nutrition API), just fall through to network
});
