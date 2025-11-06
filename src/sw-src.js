/* global self */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// App shell (di-inject saat build prod). Di dev, file ini dicopy apa adanya.
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

self.skipWaiting();
self.addEventListener('activate', (evt) => evt.waitUntil(self.clients.claim()));

// Fallback SPA offline
setCatchHandler(async ({ event }) => {
  if (event.request.mode === 'navigate') {
    return caches.match('/index.html');
  }
  return Response.error();
});

// Navigasi: NetworkFirst
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({ cacheName: 'pages', networkTimeoutSeconds: 5 })
);

// Static assets: JS/CSS/Workers → SWR
registerRoute(
  ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
  new StaleWhileRevalidate({ cacheName: 'static-assets' })
);

// Images: CacheFirst + Expiration
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 14 * 24 * 60 * 60 })],
  })
);

// API Stories: NetworkFirst (cache dinamis)
const API_ORIGIN = 'https://story-api.dicoding.dev';
registerRoute(
  ({ url, request }) =>
    url.origin === API_ORIGIN &&
    url.pathname.startsWith('/v1/stories') &&
    request.method === 'GET',
  new NetworkFirst({ cacheName: 'stories-api', networkTimeoutSeconds: 5 })
);

// Background Sync untuk POST /stories (offline queue)
const storyPostQueue = new BackgroundSyncPlugin('storyPostQueue', { maxRetentionTime: 24 * 60 });

registerRoute(
  ({ url, request }) =>
    url.origin === API_ORIGIN &&
    url.pathname.startsWith('/v1/stories') &&
    request.method === 'POST',
  new NetworkFirst({ cacheName: 'stories-post', plugins: [storyPostQueue] }),
  'POST'
);