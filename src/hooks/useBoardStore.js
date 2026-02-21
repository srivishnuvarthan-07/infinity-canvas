import { create } from 'zustand';
import storageFactory from '@/services/storage/storage.factory';

export const useBoardStore = create((set, get) => ({
    // --- Board Lists ---
    localBoards: [],   // BoardMeta[] — always from LocalProvider
    cloudBoards: [],   // BoardMeta[] — only when signed in

    // --- Board Data (shapes) cache, keyed by board id ---
    boardDataCache: {},

    // --- Status ---
    cloudStatus: 'idle',   // 'idle' | 'loading' | 'ok' | 'error'
    isLoaded: false,
    isLoading: false,
    error: null,

    // --- Navigation ---
    activeBoardId: null,

    // --- Auth ---
    user: null,
    mode: 'local', // 'local' | 'cloud'

    // ─────────────────────────────────────────
    // Auth
    // ─────────────────────────────────────────

    setUser: (user) => {
        const mode = user ? 'cloud' : 'local';
        set({ user, mode });
        get().fetchBoards();
    },

    // ─────────────────────────────────────────
    // Fetching
    // ─────────────────────────────────────────

    /**
     * Main entry: always fetches local boards.
     * Also fetches cloud boards if user is signed in.
     */
    fetchBoards: async () => {
        set({ isLoading: true });

        const { user } = get();

        // Always fetch local
        await get().fetchLocalBoards();

        // Fetch cloud only if signed in
        if (user) {
            await get().fetchCloudBoards();
        } else {
            set({ cloudBoards: [], cloudStatus: 'idle' });
        }

        set({ isLoading: false, isLoaded: true });
    },

    fetchLocalBoards: async () => {
        try {
            const provider = storageFactory.getProvider('local');
            const list = await provider.getBoards();
            set({ localBoards: list });
        } catch (err) {
            console.error('fetchLocalBoards failed:', err);
            set({ localBoards: [] });
        }
    },

    fetchCloudBoards: async () => {
        set({ cloudStatus: 'loading' });
        try {
            const provider = storageFactory.getProvider('cloud');
            const list = await provider.getBoards();
            set({ cloudBoards: list, cloudStatus: 'ok' });
        } catch (err) {
            console.error('fetchCloudBoards failed:', err);
            set({ cloudBoards: [], cloudStatus: 'error' });
        }
    },

    /**
     * Fetch a single board meta + data for the Workspace page.
     * Searches local first, then cloud. Falls back gracefully.
     */
    fetchBoard: async (boardId) => {
        set({ isLoading: true });
        try {
            const mode = get().mode;
            const provider = storageFactory.getProvider(mode);
            let board;

            try {
                board = await provider.getBoard(boardId);
            } catch (err) {
                // Cloud user fallback: check local
                if (mode === 'cloud') {
                    const localProvider = storageFactory.getProvider('local');
                    board = await localProvider.getBoard(boardId);
                } else {
                    throw err;
                }
            }

            // Merge into appropriate list
            if (board.isLocal) {
                set(state => ({
                    localBoards: upsertBoard(state.localBoards, board),
                }));
            } else {
                set(state => ({
                    cloudBoards: upsertBoard(state.cloudBoards, board),
                }));
            }

            // Also fetch data
            await get().fetchBoardData(boardId);
        } catch (err) {
            console.error('fetchBoard failed:', err);
            set({ error: err.message });
        } finally {
            set({ isLoading: false, isLoaded: true });
        }
    },

    fetchBoardData: async (boardId) => {
        if (!boardId) return;
        try {
            const mode = get().mode;
            const provider = storageFactory.getProvider(mode);
            let data;

            try {
                data = await provider.getBoardData(boardId);
            } catch (err) {
                if (mode === 'cloud') {
                    const localProvider = storageFactory.getProvider('local');
                    data = await localProvider.getBoardData(boardId);
                } else {
                    throw err;
                }
            }

            set(state => ({
                boardDataCache: {
                    ...state.boardDataCache,
                    [boardId]: data,
                },
            }));
        } catch (err) {
            console.error('fetchBoardData failed:', err);
        }
    },

    // ─────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────

    /**
     * Get full board object (meta + shapes) by id.
     * Checks local first, then cloud, merges with data cache.
     */
    getBoardById: (boardId) => {
        if (!boardId) return null;
        const { localBoards, cloudBoards, boardDataCache } = get();
        const meta = localBoards.find(b => b.id === boardId)
            || cloudBoards.find(b => b.id === boardId)
            || null;
        if (!meta) return null;
        const data = boardDataCache[boardId];
        return { ...meta, shapes: data?.shapes || [] };
    },

    // ─────────────────────────────────────────
    // Board CRUD
    // ─────────────────────────────────────────

    createBoard: async (name) => {
        try {
            // Auto-generate a unique name if none provided
            const resolvedName = name ?? generateUntitledName(
                [...get().localBoards, ...get().cloudBoards]
            );

            const provider = storageFactory.getProvider(get().mode);
            const newBoard = await provider.createBoard(resolvedName);

            if (newBoard.isLocal || get().mode === 'local') {
                set(state => ({ localBoards: [newBoard, ...state.localBoards] }));
            } else {
                set(state => ({ cloudBoards: [newBoard, ...state.cloudBoards] }));
            }

            return newBoard.id;
        } catch (err) {
            console.error('createBoard failed:', err);
            throw err;
        }
    },

    deleteBoard: async (boardId) => {
        try {
            const isLocal = get().localBoards.some(b => b.id === boardId);
            const provider = storageFactory.getProvider(isLocal ? 'local' : 'cloud');
            await provider.deleteBoard(boardId);

            set(state => ({
                localBoards: state.localBoards.filter(b => b.id !== boardId),
                cloudBoards: state.cloudBoards.filter(b => b.id !== boardId),
                boardDataCache: withoutKey(state.boardDataCache, boardId),
            }));
        } catch (err) {
            console.error('deleteBoard failed:', err);
            throw err;
        }
    },

    renameBoard: async (boardId, newName) => {
        // Optimistic update
        set(state => ({
            localBoards: state.localBoards.map(b =>
                b.id === boardId ? { ...b, name: newName } : b
            ),
            cloudBoards: state.cloudBoards.map(b =>
                b.id === boardId ? { ...b, name: newName } : b
            ),
        }));

        try {
            const isLocal = get().localBoards.some(b => b.id === boardId);
            const provider = storageFactory.getProvider(isLocal ? 'local' : 'cloud');
            await provider.updateBoard(boardId, { name: newName });
        } catch (err) {
            console.error('renameBoard failed:', err);
        }
    },

    updateBoardShapes: async (boardId, shapes) => {
        // Optimistic cache update
        set(state => ({
            boardDataCache: {
                ...state.boardDataCache,
                [boardId]: { ...(state.boardDataCache[boardId] || {}), shapes },
            },
        }));

        try {
            const isLocal = get().localBoards.some(b => b.id === boardId);
            const provider = storageFactory.getProvider(isLocal ? 'local' : 'cloud');
            await provider.saveBoardData(boardId, { shapes });
        } catch (err) {
            console.error('updateBoardShapes failed:', err);
        }
    },

    // ─────────────────────────────────────────
    // Migration helpers
    // ─────────────────────────────────────────

    checkMigration: async () => {
        const migrationService = (await import('@/services/storage/migration.service')).default;
        const count = await migrationService.getLocalBoardCount();
        const has = await migrationService.hasLocalBoards();
        return { hasLocalBoards: has, count };
    },

    moveBoardToCloud: async (boardId) => {
        const migrationService = (await import('@/services/storage/migration.service')).default;
        await migrationService.migrateBoard(boardId);
        // Refresh both lists so the board moves from local → cloud section
        await get().fetchBoards();
    },

    migrateLocalBoards: async (onProgress) => {
        const migrationService = (await import('@/services/storage/migration.service')).default;
        try {
            await migrationService.migrateAll(onProgress);
            await get().fetchBoards();
        } catch (err) {
            throw err;
        }
    },

    clearLocalBoards: async () => {
        const migrationService = (await import('@/services/storage/migration.service')).default;
        await migrationService.clearLocalBoards();
        set({ localBoards: [] });
    },

    // ─────────────────────────────────────────
    // Navigation
    // ─────────────────────────────────────────

    setActiveBoardId: (id) => set({ activeBoardId: id }),
}));


// ─────────────────────────────────────────
// Pure helpers (outside store)
// ─────────────────────────────────────────

function upsertBoard(list, board) {
    const exists = list.some(b => b.id === board.id);
    if (exists) return list.map(b => b.id === board.id ? board : b);
    return [board, ...list];
}

function withoutKey(obj, key) {
    const next = { ...obj };
    delete next[key];
    return next;
}

/**
 * Returns "Untitled Board" if unused, otherwise "Untitled Board 2", "Untitled Board 3", ...
 */
function generateUntitledName(allBoards) {
    const base = 'Untitled Board';
    const names = new Set(allBoards.map(b => b.name));
    if (!names.has(base)) return base;
    let n = 2;
    while (names.has(`${base} ${n}`)) n++;
    return `${base} ${n}`;
}
