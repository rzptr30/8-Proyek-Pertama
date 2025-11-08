import { getApiBaseUrl, getApiToken } from './config';

// Ganti ini dengan VAPID key dari modul Dicoding (bentuk URL-safe Base64)
const VAPID_PUBLIC_KEY = 'BXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export async function getExistingSubscription() {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function subscribePush() {
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

  const rawKey = sub.getKey('p256dh');
  const rawAuth = sub.getKey('auth');
  const p256dh = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
  const auth = btoa(String.fromCharCode(...new Uint8Array(rawAuth)));

  const baseUrl = (getApiBaseUrl() || '').replace(/\/+$/, '');
  if (!baseUrl) throw new Error('Base URL belum disetel di halaman Tentang.');

  const token = getApiToken();
  if (!token) throw new Error('Belum login. Silakan login sebelum mengaktifkan push.');

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

export async function unsubscribePush() {
  const sub = await getExistingSubscription();
  if (!sub) return;
  const baseUrl = (getApiBaseUrl() || '').replace(/\/+$/, '');
  const token = getApiToken();

  // Server mungkin meminta endpoint untuk unsubscribe.
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