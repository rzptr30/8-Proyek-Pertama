// Pastikan VAPID_PUBLIC_KEY kamu sesuai modul / dokumentasi kelas Dicoding.
// Biasanya bentuk Base64 URL-safe. Contoh placeholder:
const VAPID_PUBLIC_KEY = 'BExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const raw = atob(base64);
  const outputArray = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    outputArray[i] = raw.charCodeAt(i);
  }
  return outputArray;
}

// Ambil existing subscription (kalau ada)
export async function getExistingSubscription() {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

// Subscribe ke Push + kirim ke server
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

  // Kirim ke server
  const res = await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      keys: { p256dh, auth },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`Gagal subscribe server: ${res.status} ${txt}`);
  }

  return { sub };
}

// Unsubscribe (lokal + server)
export async function unsubscribePush() {
  const sub = await getExistingSubscription();
  if (!sub) return;

  // DELETE atau POST sesuai dokumentasi. Asumsi DELETE di sini:
  try {
    await fetch('https://story-api.dicoding.dev/v1/notifications/unsubscribe', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  } catch (e) {
    console.warn('[Push] Gagal kirim unsubscribe ke server:', e);
  }

  await sub.unsubscribe();
}

// Cek status tersubscribe di server (opsional jika ada endpoint verifikasi)
// export async function checkServerSubscription(endpoint) { ... }