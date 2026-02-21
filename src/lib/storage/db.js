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
        if (!db.objectStoreNames.contains('users')) {
            const userStore = db.createObjectStore('users', { keyPath: 'id' });
            userStore.createIndex('email', 'email', { unique: true });
        }
        if (!db.objectStoreNames.contains('boards')) {
            const boardStore = db.createObjectStore('boards', { keyPath: 'id' });
            boardStore.createIndex('ownerId', 'ownerId', { unique: false });
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
    // User Management
    async createUser(user) {
        return (await dbPromise).add('users', user);
    },
    async findUserByEmail(email) {
        return (await dbPromise).getFromIndex('users', 'email', email);
    },
    async updateUser(user) {
        return (await dbPromise).put('users', user);
    },

    // Board Management
    async getBoardsByOwner(ownerId) {
        return (await dbPromise).getAllFromIndex('boards', 'ownerId', ownerId);
    },
    async getBoard(id) {
        return (await dbPromise).get('boards', id);
    },
    async addBoard(board) {
        return (await dbPromise).add('boards', board);
    },
    async putBoard(board) {
        return (await dbPromise).put('boards', board);
    },
    async deleteBoard(id) {
        return (await dbPromise).delete('boards', id);
    }
};
