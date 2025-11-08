import { openDB } from 'idb';

const DB_NAME = 'stories-db';
const DB_VERSION = 1;
export const SAVED_STORE = 'savedStories';
export const OUTBOX_STORE = 'outboxStories';

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      console.log('[DB] upgrade triggered');
      if (!db.objectStoreNames.contains(SAVED_STORE)) {
        const s = db.createObjectStore(SAVED_STORE, { keyPath: 'id' });
        s.createIndex('createdAt', 'createdAt');
        s.createIndex('name', 'name');
      }
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        const o = db.createObjectStore(OUTBOX_STORE, { keyPath: 'localId' });
        o.createIndex('createdAt', 'createdAt');
        o.createIndex('status', 'status');
      }
    },
  });
}