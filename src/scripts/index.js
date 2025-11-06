import '../styles/styles.css';
import 'leaflet/dist/leaflet.css';

import App from './pages/app';
import { registerSW } from './pwa/register-sw';
import { syncOutbox } from './data/sync';

// PASS base path repo ke SW agar path-nya benar di GitHub Pages
registerSW('/8-Proyek-Pertama');

navigator.serviceWorker?.addEventListener('message', (evt) => {
  if (evt.data?.type === 'navigate' && evt.data.url) {
    window.location.hash = evt.data.url;
  }
});

function trySyncOutbox() {
  if (!navigator.onLine) return;
  setTimeout(() => { syncOutbox().catch(() => {}); }, 200);
}

if (navigator.onLine) trySyncOutbox();
window.addEventListener('online', trySyncOutbox);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && navigator.onLine) trySyncOutbox();
});

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });

  await app.renderPage();
  window.addEventListener('hashchange', () => app.renderPage());
});