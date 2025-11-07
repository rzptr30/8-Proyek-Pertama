/* global self, location */
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, setCatchHandler } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// ============ Workbox (PWA Advanced) ============
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

self.skipWaiting();
self.addEventListener('activate', (evt) => evt.waitUntil(self.clients.claim()));

// Fallback SPA (relatif agar bekerja di Pages & lokal)
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, '');
async function shellFallback() {
  const rel = `${BASE_PATH}/index.html`.replace(/\/{2,}/g, '/');
  return (await caches.match(rel)) || caches.match('/index.html');
}

setCatchHandler(async ({ event }) => {
  if (event.request.mode === 'navigate') return shellFallback();
  return Response.error();
});

registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({ cacheName: 'pages', networkTimeoutSeconds: 5 })
);

registerRoute(
  ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
  new StaleWhileRevalidate({ cacheName: 'static-assets' })
);

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 14 * 24 * 60 * 60 })],
  })
);

const API_ORIGIN = 'https://story-api.dicoding.dev';
registerRoute(
  ({ url, request }) =>
    url.origin === API_ORIGIN &&
    url.pathname.startsWith('/v1/stories') &&
    request.method === 'GET',
  new NetworkFirst({ cacheName: 'stories-api', networkTimeoutSeconds: 5 })
);

const storyPostQueue = new BackgroundSyncPlugin('storyPostQueue', { maxRetentionTime: 24 * 60 });
registerRoute(
  ({ url, request }) =>
    url.origin === API_ORIGIN &&
    url.pathname.startsWith('/v1/stories') &&
    request.method === 'POST',
  new NetworkFirst({ cacheName: 'stories-post', plugins: [storyPostQueue] }),
  'POST'
);

// ============ Push Notification ============
async function openUrl(url) {
  const clientsArr = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const existing = clientsArr.find(c => c.url.includes('#/'));
  if (existing) {
    await existing.focus();
    existing.postMessage({ type: 'navigate', url });
    return;
  }
  await self.clients.openWindow(url);
}

self.addEventListener('push', (event) => {
  console.log('[SW] push event diterima');
  let payload = {};
  try {
    if (event.data) {
      payload = event.data.json();
      console.log('[SW] payload JSON:', payload);
    } else {
      console.log('[SW] event.data kosong');
    }
  } catch (e) {
    const text = event.data?.text() || '';
    console.warn('[SW] gagal parse json, pakai text fallback:', text);
    payload = { title: 'Notifikasi', body: text || 'Push tanpa payload.' };
  }

  const title = payload.title || 'Berbagi Cerita';
  const body = payload.body || 'Ada pembaruan cerita.';
  // Gunakan path relatif agar valid di GitHub Pages
  const icon = payload.icon || 'images/icons/icon-192.png';
  const badge = payload.badge || 'images/icons/icon-192.png';
  const url = payload.url || '#/';
  const id = payload.id || '';

  const options = {
    body,
    icon,
    badge,
    data: { url, id },
    actions: [
      { action: 'open', title: 'Buka Aplikasi' },
      ...(id ? [{ action: 'detail', title: 'Lihat Detail' }] : []),
    ],
    tag: 'berbagi-cerita-push',
    renotify: true,
  };

  event.waitUntil(
    (async () => {
      try {
        console.log('[SW] menampilkan notifikasi:', title);
        await self.registration.showNotification(title, options);
      } catch (err) {
        console.error('[SW] gagal showNotification', err);
      }
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  const data = event.notification.data || {};
  let target = data.url || '#/';
  if (action === 'detail' && data.id) {
    target = `#/detail/${data.id}`;
  }
  event.waitUntil(openUrl(target));
});

// Uji notifikasi lokal dari halaman (tanpa push)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'local-notify') {
    const { title = 'Tes', body = 'Notifikasi lokal' } = event.data;
    self.registration.showNotification(title, {
      body,
      icon: 'images/icons/icon-192.png',
      data: { url: '#/' },
      tag: 'local-test'
    }).catch(err => console.error('[SW] local-notify gagal', err));
  }
});