# Berbagi Cerita

Aplikasi SPA dengan peta, PWA (installable + offline), push notification, dan penyimpanan lokal (IndexedDB).

- Live Demo: https://rzptr30.github.io/8-Proyek-Pertama/
- Base API: https://story-api.dicoding.dev/v1

## Fitur
- SPA (hash router), guarded routes, view transitions
- Auth (login/register/logout)
- Map (Leaflet) + marker dari API (location=1)
- Add Story (online) + Outbox (offline queue) + Background Sync (POST /stories)
- IndexedDB saved stories (CRUD) + halaman `#/saved` (hanya baca dari IDB)
- PWA installable + offline shell + dynamic cache (pages, static, images)
- Push Notification (enable/disable), local test notification

## Teknologi
- Webpack + Workbox InjectManifest
- Workbox: precaching, routing, strategies, background sync
- IndexedDB via `idb`
- Leaflet

## Menjalankan
```bash
npm install
# Development (tidak ada precache; offline tidak akurat di dev)
npm run start-dev

# Production build (disarankan untuk uji offline & push)
npm run build
npx http-server dist -p 8081
# buka http://localhost:8081/
```

## PWA & Offline
- Service Worker melakukan precache (production build) dan warm-up `index.html` saat install, sehingga:
  - Offline di localhost (production build) dan GitHub Pages menampilkan shell aplikasi (bukan halaman dino).
- Uji: DevTools → Application → Service Workers → centang "Offline" → reload.

## Push Notification
- VAPID_PUBLIC_KEY: `BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk`
- Secure Origin: gunakan HTTPS (GitHub Pages) atau `http://localhost`. Jangan uji di `http://192.168.x.x`.
- Langkah uji:
  1. Login, pastikan token tersimpan.
  2. Buka `#/about` dan pastikan Base URL = `https://story-api.dicoding.dev/v1`.
  3. Klik "Enable Push" → cek Network: `POST /v1/notifications/subscribe` (status 200/201).
  4. Klik "Uji Notifikasi Lokal" → notifikasi muncul.
  5. Klik "Disable Push" → `DELETE /v1/notifications/unsubscribe` (OK).

## IndexedDB (Saved)
- DB: `stories-db`
  - Store: `savedStories` (keyPath: `id`)
  - Store: `outboxStories` (keyPath: `localId`)
- Halaman `#/saved` menampilkan **hanya** data dari IndexedDB (bukan fetch API).
- Uji:
  1. Detail → "Simpan" → `savedStories` terisi.
  2. `#/saved` menampilkan item.
  3. "Hapus" → item hilang dari UI dan DB.
  4. Offline → `#/saved` tetap tampil.

## Deploy
- GitHub Pages
```bash
npm run build
npm run deploy:pages
```

## Troubleshooting
- Halaman dino saat offline:
  - Pastikan menjalankan production build (bukan `start-dev`).
  - Pastikan SW status "activated" sebelum toggle Offline.
- Push tidak jalan:
  - Origin harus HTTPS atau `http://localhost`.
  - Pastikan Base URL dan token valid.
  - Cek DevTools Network ada `POST /v1/notifications/subscribe`.

## Lisensi
ISC