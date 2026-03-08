import { openDB } from 'idb';

const DB_NAME = 'infinity-canvas-db';
const STORE_NAME = 'key-val-store';
const VERSION = 3;

/**
 * Initialize the Database
 */
const dbPromise = openDB(DB_NAME, VERSION, {
    upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
        }
    },
});

export const db = {
    async get(key) {
        return (await dbPromise).get(STORE_NAME, key);
    },
    async set(key, val) {
        return (await dbPromise).put(STORE_NAME, val, key);
    },
    async delete(key) {
        return (await dbPromise).delete(STORE_NAME, key);
    },
    async clear() {
        return (await dbPromise).clear(STORE_NAME);
    },
    async keys() {
        return (await dbPromise).getAllKeys(STORE_NAME);
    },
};
