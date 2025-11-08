import { isSubscribed, subscribePush, unsubscribePush, getPermissionState } from '../pwa/push-manager';

export default class AboutView {
  async render() {
    return `
      <section class="page" data-route="about">
        <h1 class="page-title" data-page-title>Tentang</h1>
        <p>Aplikasi Berbagi Cerita dengan peta, PWA, dan notifikasi.</p>

        <section aria-labelledby="push-title" style="margin-top:24px">
          <h2 id="push-title">Push Notification</h2>
          <div id="push-status" role="status" aria-live="polite"></div>
          <div style="display:flex;gap:12px;align-items:center;margin-top:8px">
            <button type="button" id="push-toggle" class="button">Periksa</button>
            <button type="button" id="push-test" class="button button--secondary">Uji Notifikasi Lokal</button>
          </div>
          <small>Pastikan telah mengizinkan notifikasi pada browser.</small>
        </section>
      </section>
    `;
  }

  async afterRender() {
    const statusEl = document.getElementById('push-status');
    const toggleBtn = document.getElementById('push-toggle');
    const testBtn = document.getElementById('push-test');

    const refreshUi = async () => {
      const perm = await getPermissionState();
      const sub = await isSubscribed();
      statusEl.textContent = `Izin: ${perm}. Status: ${sub ? 'Subscribed' : 'Not subscribed'}.`;
      toggleBtn.textContent = sub ? 'Disable Push' : 'Enable Push';
    };

    toggleBtn.addEventListener('click', async () => {
      toggleBtn.disabled = true;
      try {
        if (await isSubscribed()) {
          await unsubscribePush();
        } else {
          await subscribePush();
        }
      } catch (e) {
        statusEl.textContent = e?.message || 'Gagal mengubah langganan push.';
      } finally {
        await refreshUi();
        toggleBtn.disabled = false;
      }
    });

    testBtn.addEventListener('click', async () => {
      try {
        // 1) Coba kirim pesan ke SW (jika halaman sudah dikontrol SW)
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'local-notify',
            title: 'Tes Notifikasi',
            body: 'Ini notifikasi lokal dari halaman About.',
          });
          statusEl.textContent = 'Perintah notifikasi lokal dikirim via postMessage.';
          return;
        }
        // 2) Fallback: panggil reg.showNotification langsung
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) throw new Error('Service worker belum terdaftar.');
        await reg.showNotification('Tes Notifikasi', {
          body: 'Ini notifikasi lokal (fallback).',
          icon: '/images/icons/icon-192.png',
          data: { url: '#/' },
        });
        statusEl.textContent = 'Notifikasi lokal ditampilkan via Service Worker (fallback).';
      } catch (e) {
        statusEl.textContent = e?.message || 'Gagal menampilkan notifikasi lokal.';
      }
    });

    await refreshUi();
  }
}