import { getDB, stores } from './db';

export async function saveStory(story) {
  const db = await getDB();
  const data = {
    id: story.id,
    name: story.name || 'Tanpa Nama',
    description: story.description || '',
    photoUrl: story.photoUrl || '',
    lat: story.lat ?? null,
    lon: story.lon ?? null,
    createdAt: story.createdAt || new Date().toISOString(),
    savedAt: new Date().toISOString(),
  };
  await db.put(stores.SAVED_STORE, data);
  return data;
}

export async function removeSavedStory(id) {
  const db = await getDB();
  await db.delete(stores.SAVED_STORE, id);
}

export async function getSavedStory(id) {
  const db = await getDB();
  return db.get(stores.SAVED_STORE, id);
}

export async function getAllSavedStories() {
  const db = await getDB();
  return db.getAll(stores.SAVED_STORE);
}

/* -------- Outbox (offline create) -------- */

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export async function addOutboxStory({ description, photoBlob, lat, lon }) {
  const db = await getDB();
  const localId = `outbox-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const photoBase64 = photoBlob ? await blobToBase64(photoBlob) : '';
  const entry = {
    localId,
    description,
    photoBase64,
    lat: lat ?? null,
    lon: lon ?? null,
    createdAt: new Date().toISOString(),
    status: 'pending', // pending | sending | error | synced
    errorMessage: '',
  };
  await db.put(stores.OUTBOX_STORE, entry);
  return entry;
}

export async function getOutboxStories() {
  const db = await getDB();
  return db.getAll(stores.OUTBOX_STORE);
}

export async function updateOutboxStatus(localId, status, errorMessage = '') {
  const db = await getDB();
  const item = await db.get(stores.OUTBOX_STORE, localId);
  if (!item) return;
  item.status = status;
  item.errorMessage = errorMessage;
  if (status === 'synced') item.syncedAt = new Date().toISOString();
  await db.put(stores.OUTBOX_STORE, item);
  return item;
}

export async function deleteOutboxStory(localId) {
  const db = await getDB();
  await db.delete(stores.OUTBOX_STORE, localId);
}