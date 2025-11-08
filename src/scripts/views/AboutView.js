import { getApiBaseUrl, setApiBaseUrl, getApiToken } from '../data/config';

// GANTI dengan VAPID public key valid (URL-safe Base64)
const VAPID_PUBLIC_KEY = 'BXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

async function getExistingSubscription() {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

async function subscribePushFlow(statusEl) {
  console.log('[PushFlow] start subscribe');
  statusEl.textContent = 'Mengaktifkan push...';
  const baseUrl = (getApiBaseUrl() || '').replace(/\/+$/, '');
  if (!baseUrl) throw new Error('Base URL kosong');
  const rawToken = getApiToken();
  if (!rawToken) throw new Error('Belum login');
  const authHeader = `Bearer ${rawToken}`;

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    console.log('[PushFlow] membuat subscription baru');
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  } else {
    console.log('[PushFlow] sudah ada subscription');
  }

  const rawKey = sub.getKey('p256dh');
  const rawAuth = sub.getKey('auth');
  const p256dh = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
  const auth = btoa(String.fromCharCode(...new Uint8Array(rawAuth)));

  console.log('[PushFlow] kirim ke server /notifications/subscribe');
  const res = await fetch(`${baseUrl}/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authHeader,
    },
    body: JSON.stringify({ endpoint: sub.endpoint, keys: { p256dh, auth } }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    console.error('[PushFlow] server respon gagal:', res.status, txt);
    throw new Error(`Server: ${res.status} ${txt}`);
  }
  console.log('[PushFlow] sukses subscribe server');
  statusEl.textContent = 'Subscribed ke server.';
  return sub;
}

async function unsubscribePushFlow(statusEl) {
  console.log('[PushFlow] start unsubscribe');
  statusEl.textContent = 'Menonaktifkan push...';
  const baseUrl = (getApiBaseUrl() || '').replace(/\/+$/, '');
  const rawToken = getApiToken();
  const authHeader = rawToken ? `Bearer ${rawToken}` : '';
  const sub = await getExistingSubscription();
  if (!sub) {
    statusEl.textContent = 'Tidak ada subscription.';
    return;
  }
  try {
    console.log('[PushFlow] kirim ke server /notifications/unsubscribe');
    if (baseUrl && authHeader) {
      const res = await fetch(`${baseUrl}/notifications/unsubscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        console.warn('[PushFlow] server unsubscribe gagal:', res.status, txt);
      } else {
        console.log('[PushFlow] server unsubscribe OK');
      }
    }
  } catch (e) {
    console.warn('[PushFlow] error unsubscribe server', e);
  }
  await sub.unsubscribe();
  statusEl.textContent = 'Push dinonaktifkan.';
}

export default class AboutView {
  async render() {
    return `
      <section class="page" data-route="about">
        <h1 class="page-title" data-page-title>Tentang</h1>
        <p>Aplikasi Berbagi Cerita dengan peta, PWA, dan notifikasi.</p>

        <section aria-labelledby="push-title">
          <h2 id="push-title">Push Notification</h2>
          <p id="push-status" role="status" aria-live="polite">Memeriksa status...</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" id="btn-push-enable">Enable Push</button>
            <button type="button" id="btn-push-disable" hidden>Disable Push</button>
            <button type="button" id="btn-push-local">Uji Notifikasi Lokal</button>
          </div>
          <small>Pastikan izin notifikasi telah diberikan di browser.</small>
        </section>

        <hr />

        <section aria-labelledby="api-config-title">
          <h2 id="api-config-title">Pengaturan API</h2>
          <form id="api-config-form">
            <label for="api-base-url">Base URL</label>
            <input id="api-base-url" name="api-base-url" type="url" required placeholder="https://story-api.dicoding.dev/v1" />
            <div style="margin-top:8px;display:flex;align-items:center;gap:12px">
              <button type="submit">Simpan Pengaturan</button>
              <span id="config-status" role="status" aria-live="polite"></span>
            </div>
          </form>
        </section>
      </section>
    `;
  }

  async afterRender() {
    console.log('[AboutView] afterRender start');

    const form = document.getElementById('api-config-form');
    const baseUrlInput = document.getElementById('api-base-url');
    const configStatus = document.getElementById('config-status');
    baseUrlInput.value = getApiBaseUrl() || 'https://story-api.dicoding.dev/v1';
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      setApiBaseUrl((baseUrlInput.value || '').trim());
      configStatus.textContent = 'Tersimpan.';
      setTimeout(() => (configStatus.textContent = ''), 2000);
    });

    const statusEl = document.getElementById('push-status');
    const enableBtn = document.getElementById('btn-push-enable');
    const disableBtn = document.getElementById('btn-push-disable');
    const localBtn = document.getElementById('btn-push-local');

    async function refreshUI() {
      const sub = await getExistingSubscription();
      const loggedIn = !!getApiToken();
      statusEl.textContent = `Izin: ${Notification.permission}. Status: ${sub ? 'Subscribed' : 'Not subscribed'}${loggedIn ? '' : ' (Belum login)'}`;
      enableBtn.hidden = !!sub;
      disableBtn.hidden = !sub;
    }

    enableBtn.addEventListener('click', async () => {
      console.log('[PushUI] enable clicked');
      try {
        await subscribePushFlow(statusEl);
      } catch (e) {
        console.error('[PushUI] enable error:', e);
        statusEl.textContent = `Gagal: ${e.message}`;
      } finally {
        refreshUI();
      }
    });

    disableBtn.addEventListener('click', async () => {
      console.log('[PushUI] disable clicked');
      try {
        await unsubscribePushFlow(statusEl);
      } catch (e) {
        console.error('[PushUI] disable error:', e);
        statusEl.textContent = `Gagal: ${e.message}`;
      } finally {
        refreshUI();
      }
    });

    localBtn.addEventListener('click', async () => {
      console.log('[PushUI] local notify clicked');
      try {
        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage({ type: 'local-notify', title: 'Tes Lokal', body: 'Notifikasi lokal.' });
        statusEl.textContent = 'Notifikasi lokal dikirim.';
      } catch (e) {
        statusEl.textContent = `Gagal notifikasi lokal: ${e.message}`;
      }
    });

    if (Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch {}
    }

    await refreshUI();
  }
}