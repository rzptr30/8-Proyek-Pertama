/**
 * Registrasi Service Worker yang otomatis menyesuaikan base path:
 * - Lokal/dev (localhost, npm run start-dev)  -> sw.js di root: /sw.js
 * - GitHub Pages (https://username.github.io/REPO/) -> sw.js di /REPO/sw.js
 *
 * Cara kerja:
 * 1. Cek variabel global window.__PUBLIC_BASE_PATH__ (jika kamu definisikan via DefinePlugin).
 * 2. Cek process.env.PUBLIC_BASE_PATH (jika dibundel Webpack define).
 * 3. Deteksi dari <link rel="manifest"> (ambil prefix path manifest).
 * 4. Deteksi dari lokasi pathname (asumsi pola /NAMA_REPO/ saat di GitHub Pages).
 *
 * Jika semua gagal -> fallback '' (root).
 */
export async function registerSW(customBasePath) {
  if (!('serviceWorker' in navigator)) return;

  const basePath = normaliseBasePath(
    customBasePath ??
      window.__PUBLIC_BASE_PATH__ ??
      (typeof process !== 'undefined' && process.env && process.env.PUBLIC_BASE_PATH) ??
      detectFromManifest() ??
      detectFromPath() ??
      ''
  );

  const swUrl = `${basePath}/sw.js`.replace(/\/{2,}/g, '/');

  try {
    const reg = await navigator.serviceWorker.register(swUrl);

    // (Opsional) Dengarkan update sw untuk menampilkan UI "Versi baru tersedia"
    listenForSWUpdates(reg);

    return reg;
  } catch (e) {
    // Tetap log agar bisa dilihat di production console
    console.error('[SW] Registration failed:', e);
  }
}

/* ---------------- Helper Functions ---------------- */

function normaliseBasePath(p) {
  if (!p) return '';
  // Hilangkan trailing slash tapi tetap pertahankan leading slash
  return ('/' + p.replace(/^\/+/, '')).replace(/\/+$/, '');
}

function detectFromManifest() {
  const link = document.querySelector('link[rel="manifest"]');
  if (!link) return null;
  try {
    const url = new URL(link.href, location.origin);
    // Contoh: /8-Proyek-Pertama/manifest.webmanifest -> ambil /8-Proyek-Pertama
    const parts = url.pathname.split('/').filter(Boolean);
    if (!parts.length) return '';
    // Jika nama terakhir mengandung 'manifest', buang segmen terakhir
    if (/manifest/i.test(parts[parts.length - 1])) {
      parts.pop();
    }
    if (!parts.length) return '';
    return '/' + parts.join('/');
  } catch {
    return null;
  }
}

function detectFromPath() {
  // Jika path seperti /8-Proyek-Pertama/ -> anggap segmen pertama sebagai repo
  const parts = location.pathname.split('/').filter(Boolean);
  if (!parts.length) return '';
  // Heuristik: jika bukan build dev (biasanya hanya /) dan bukan dist, ambil segmen pertama
  if (parts[0] && parts[0] !== 'dist' && parts[0] !== 'assets') {
    return '/' + parts[0];
  }
  return '';
}

function listenForSWUpdates(reg) {
  if (!reg) return;
  reg.addEventListener('updatefound', () => {
    const newWorker = reg.installing;
    if (!newWorker) return;
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // Versi baru tersedia. Kamu bisa memunculkan toast/UI di sini.
        // console.log('[SW] Versi baru siap. Refresh untuk memperbarui.');
        dispatchSWUpdateEvent();
      }
    });
  });
}

function dispatchSWUpdateEvent() {
  window.dispatchEvent(new CustomEvent('sw:update', { detail: { updated: true } }));
}

/* ---------------- Contoh penggunaan otomatis ---------------- */
/*
import { registerSW } from './pwa/register-sw';
registerSW(); // atau registerSW('/8-Proyek-Pertama') untuk paksa base path tertentu
*/