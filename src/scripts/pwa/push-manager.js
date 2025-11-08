import apiClient from '../data/api-client';

const LS_PUSH_SUBSCRIBED = 'push_subscribed';
const DUMMY_VAPID = 'BElW8MMSlP8QV8Hgvb6O5Q_EArH0shB7tqQeE1IYQHqHk8Kq3xQzTQAZjODcJvQJc4Kx-0l9M3ikGkJ7A3Z4sY';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

async function getRegistration() {
  if (!('serviceWorker' in navigator)) throw new Error('Service worker tidak didukung.');
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) throw new Error('Service worker belum terdaftar.');
  return reg;
}

export async function getPermissionState() {
  return Notification?.permission || 'default';
}

export async function isSubscribed() {
  try {
    const reg = await getRegistration();
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}

export async function subscribePush() {
  if (!('Notification' in window)) throw new Error('Notifikasi tidak didukung browser.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Izin notifikasi ditolak.');

  let publicKey = '';
  try { publicKey = await apiClient.getVapidPublicKey(); } catch {}
  if (!publicKey) publicKey = DUMMY_VAPID;

  const reg = await getRegistration();
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  try { await apiClient.sendPushSubscription?.(sub.toJSON()); } catch {}
  localStorage.setItem(LS_PUSH_SUBSCRIBED, '1');
  return sub;
}

export async function unsubscribePush() {
  const reg = await getRegistration();
  const sub = await reg.pushManager.getSubscription();
  if (!sub) {
    localStorage.removeItem(LS_PUSH_SUBSCRIBED);
    return false;
  }
  try { await apiClient.removePushSubscription?.(sub.toJSON()); } catch {}
  const ok = await sub.unsubscribe();
  localStorage.removeItem(LS_PUSH_SUBSCRIBED);
  return ok;
}