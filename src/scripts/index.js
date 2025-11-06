import '../styles/styles.css';
import 'leaflet/dist/leaflet.css';

import App from './pages/app';
import { registerSW } from './pwa/register-sw';
import { syncOutbox } from './data/sync';

// Daftarkan Service Worker
registerSW();

// Terima instruksi navigasi dari SW (mis. saat notificationclick)
navigator.serviceWorker?.addEventListener('message', (evt) => {
  if (evt.data?.type === 'navigate' && evt.data.url) {
    window.location.hash = evt.data.url;
  }
});

// Fungsi bantu: coba sync outbox ketika online
function trySyncOutbox() {
  if (!navigator.onLine) return;
  // Sedikit delay agar SW/halaman siap
  setTimeout(() => {
    syncOutbox().catch(() => {
      // Biarkan silent; akan dicoba lagi saat online berikutnya/visibilitychange
    });
  }, 200);
}

// Sync saat startup jika online
if (navigator.onLine) trySyncOutbox();

// Sync setiap kembali online
window.addEventListener('online', trySyncOutbox);

// Sync saat tab kembali terlihat dan online
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && navigator.onLine) {
    trySyncOutbox();
  }
});

// Inisialisasi SPA
document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });

  await app.renderPage();

  window.addEventListener('hashchange', () => app.renderPage());
});