import { getApiBaseUrl, setApiBaseUrl, getApiToken } from '../data/config';

// VAPID PUBLIC KEY (ganti dengan key asli dari modul Dicoding)
const VAPID_PUBLIC_KEY = 'BXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

async function getExistingSubscription() {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

async function subscribePush() {
  const token = getApiToken();
  if (!token) throw new Error('Belum login. Login dulu sebelum mengaktifkan push.');

  const baseUrl = (getApiBaseUrl() || '').replace(/\/+$/, '');
  if (!baseUrl) throw new Error('Base URL belum disetel.');

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Browser tidak mendukung Push API.');
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  // Ambil key p256dh & auth
  const rawKey = sub.getKey('p256dh');
  const rawAuth = sub.getKey('auth');
  const p256dh = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
  const auth = btoa(String.fromCharCode(...new Uint8Array(rawAuth)));

  // Kirim ke server (endpoint yang benar)
  const res = await fetch(`${baseUrl}/notifications/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      keys: { p256dh, auth },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`Gagal subscribe: ${res.status} ${txt}`);
  }
  return sub;
}

async function unsubscribePush() {
  const token = getApiToken();
  const baseUrl = (getApiBaseUrl() || '').replace(/\/+$/, '');
  const sub = await getExistingSubscription();
  if (!sub) return;

  try {
    if (baseUrl && token) {
      await fetch(`${baseUrl}/notifications/unsubscribe`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
    }
  } catch (e) {
    console.warn('[Push] Unsubscribe server gagal:', e);
  }
  await sub.unsubscribe();
}

export default class AboutView {
  async render() {
    return `
      <section class="page" data-route="about">
        <h1 class="page-title" data-page-title>Tentang</h1>
        <p>Aplikasi Berbagi Cerita dengan peta, PWA, dan notifikasi.</p>

        <section aria-labelledby="push-title" class="push-section">
          <h2 id="push-title">Push Notification</h2>
          <p id="push-status" role="status" aria-live="polite">Memeriksa status...</p>
          <div class="push-controls" style="display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" id="btn-push-enable">Enable Push</button>
            <button type="button" id="btn-push-disable" hidden>Disable Push</button>
            <button type="button" id="btn-push-local">Uji Notifikasi Lokal</button>
          </div>
          <small>Pastikan izin notifikasi telah diberikan di browser.</small>
        </section>

        <hr />

        <section aria-labelledby="api-config-title" class="config-panel">
          <h2 id="api-config-title">Pengaturan API</h2>
          <form id="api-config-form">
            <div class="form-field">
              <label for="api-base-url">Base URL</label>
              <input id="api-base-url" name="api-base-url" type="url" required placeholder="https://story-api.dicoding.dev/v1" />
            </div>
            <div class="form-actions" style="margin-top:8px;display:flex;align-items:center;gap:12px">
              <button type="submit">Simpan Pengaturan</button>
              <span id="config-status" role="status" aria-live="polite" class="status-text"></span>
            </div>
          </form>
        </section>
      </section>
    `;
  }

  async afterRender() {
    // API CONFIG
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

    // PUSH UI
    const statusEl = document.getElementById('push-status');
    const enableBtn = document.getElementById('btn-push-enable');
    const disableBtn = document.getElementById('btn-push-disable');
    const localBtn = document.getElementById('btn-push-local');

    async function refreshPushUI() {
      const permission = Notification.permission;
      const existing = await getExistingSubscription();
      const token = getApiToken();
      statusEl.textContent = `Izin: ${permission}. Status: ${existing ? 'Subscribed' : 'Not subscribed'}${token ? '' : ' (Belum login)'}`;
      enableBtn.hidden = !!existing;
      disableBtn.hidden = !existing;
    }

    enableBtn.addEventListener('click', async () => {
      statusEl.textContent = 'Mengaktifkan push...';
      try {
        await subscribePush();
        statusEl.textContent = 'Subscribed ke server.';
      } catch (e) {
        statusEl.textContent = `Gagal subscribe: ${e.message}`;
      } finally {
        refreshPushUI();
      }
    });

    disableBtn.addEventListener('click', async () => {
      statusEl.textContent = 'Menonaktifkan push...';
      try {
        await unsubscribePush();
        statusEl.textContent = 'Push dinonaktifkan.';
      } catch (e) {
        statusEl.textContent = `Gagal unsubscribe: ${e.message}`;
      } finally {
        refreshPushUI();
      }
    });

    localBtn.addEventListener('click', async () => {
      statusEl.textContent = 'Mengirim notifikasi lokal...';
      try {
        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage({
          type: 'local-notify',
          title: 'Tes Lokal',
          body: 'Ini notifikasi lokal.',
        });
        statusEl.textContent = 'Notifikasi lokal dikirim.';
      } catch (e) {
        statusEl.textContent = `Gagal notifikasi lokal: ${e.message}`;
      }
    });

    // Minta izin jika masih default
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch {}
    }

    await refreshPushUI();
  }
}