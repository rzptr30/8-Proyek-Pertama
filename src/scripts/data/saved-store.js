import { getDB, SAVED_STORE, OUTBOX_STORE } from './db';

// ---------- Helpers ----------
function toStringId(id) {
  if (id === undefined || id === null) return '';
  return String(id);
}
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    if (!blob) return resolve('');
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// ---------- Saved Stories ----------
export async function saveStory(story) {
  const db = await getDB();
  const id = toStringId(story.id);
  if (!id) throw new Error('ID cerita kosong, tidak dapat disimpan.');
  const data = {
    id,
    name: story.name || 'Tanpa Nama',
    description: story.description || '',
    photoUrl: story.photoUrl || '',
    lat: story.lat ?? null,
    lon: story.lon ?? null,
    createdAt: story.createdAt || new Date().toISOString(),
    savedAt: new Date().toISOString(),
  };
  await db.put(SAVED_STORE, data);
  console.log('[IDB] saveStory stored:', data);
  dispatchSavedChanged();
  return data;
}

export async function removeSavedStory(id) {
  const db = await getDB();
  const key = toStringId(id);
  await db.delete(SAVED_STORE, key);
  console.log('[IDB] removeSavedStory deleted:', key);
  dispatchSavedChanged();
}

export async function getSavedStory(id) {
  const db = await getDB();
  return db.get(SAVED_STORE, toStringId(id));
}

export async function getAllSavedStories() {
  const db = await getDB();
  const all = await db.getAll(SAVED_STORE);
  return all;
}

// ---------- Outbox (Offline Tambah Cerita) ----------
export async function addOutboxStory({ description, photoBlob, lat, lon }) {
  const db = await getDB();
  const localId = `outbox-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const photoBase64 = await blobToBase64(photoBlob);
  const entry = {
    localId,
    description,
    photoBase64,
    lat: lat ?? null,
    lon: lon ?? null,
    createdAt: new Date().toISOString(),
    status: 'pending',
    errorMessage: '',
  };
  await db.put(OUTBOX_STORE, entry);
  console.log('[IDB] addOutboxStory queued:', entry);
  dispatchSavedChanged(); // supaya halaman Saved ikut update (jumlah outbox)
  return entry;
}

export async function getOutboxStories() {
  const db = await getDB();
  return db.getAll(OUTBOX_STORE);
}

export async function updateOutboxStatus(localId, status, errorMessage = '') {
  const db = await getDB();
  const item = await db.get(OUTBOX_STORE, localId);
  if (!item) return;
  item.status = status;
  item.errorMessage = errorMessage;
  if (status === 'synced') item.syncedAt = new Date().toISOString();
  await db.put(OUTBOX_STORE, item);
  console.log('[IDB] updateOutboxStatus:', localId, status);
  dispatchSavedChanged();
  return item;
}

export async function deleteOutboxStory(localId) {
  const db = await getDB();
  await db.delete(OUTBOX_STORE, localId);
  console.log('[IDB] deleteOutboxStory:', localId);
  dispatchSavedChanged();
}

// ---------- Event Utility ----------
function dispatchSavedChanged() {
  window.dispatchEvent(new CustomEvent('saved:changed'));
}