import { create } from 'zustand';
import storageFactory from '@/services/storage/storage.factory';
import { useWorkspaceStore } from '@/hooks/useWorkspaceStore';

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

            // Pass the workspace ID if available so we filter boards
            const { activeWorkspaceId } = useWorkspaceStore.getState();
            let list = await provider.getBoards();

            // Client-side fallback filtering if the backend doesn't filter perfectly yet
            // Or we just rely on backend. For now, since boards don't strictly have workspaceId yet in all old data, we just fetch all and filter client side if needed, or pass it to provider.
            // Let's rely on the provider returning what's ours.

            if (activeWorkspaceId) {
                // Temporary client-side filter until DB is fully migrated
                list = list.filter(b => b.workspaceId === activeWorkspaceId || (!b.workspaceId && activeWorkspaceId === useWorkspaceStore.getState().workspaces[0]?._id));
            }

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
                if (mode === 'cloud' && !isValidObjectId(boardId)) {
                    throw new Error('Local ID requested from cloud');
                }
                board = await provider.getBoard(boardId);
            } catch (err) {
                if (mode === 'cloud') {
                    try {
                        const localProvider = storageFactory.getProvider('local');
                        board = await localProvider.getBoard(boardId);
                    } catch (e) {
                        throw err;
                    }
                } else {
                    try {
                        const cloudProvider = storageFactory.getProvider('cloud');
                        board = await cloudProvider.getBoard(boardId);
                    } catch (e) {
                        throw err;
                    }
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
                if (mode === 'cloud' && !isValidObjectId(boardId)) {
                    throw new Error('Local ID requested from cloud');
                }
                data = await provider.getBoardData(boardId);
            } catch (err) {
                if (mode === 'cloud') {
                    try {
                        const localProvider = storageFactory.getProvider('local');
                        data = await localProvider.getBoardData(boardId);
                    } catch (e) {
                        throw err;
                    }
                } else {
                    try {
                        const cloudProvider = storageFactory.getProvider('cloud');
                        data = await cloudProvider.getBoardData(boardId);
                    } catch (e) {
                        throw err;
                    }
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

    createBoard: async (name, forceLocal = false) => {
        try {
            // Auto-generate a unique name if none provided
            const resolvedName = name ?? generateUntitledName(
                [...get().localBoards, ...get().cloudBoards]
            );

            const targetMode = forceLocal ? 'local' : get().mode;
            const provider = storageFactory.getProvider(targetMode);

            let newBoard;
            if (targetMode === 'cloud') {
                const { activeWorkspaceId } = useWorkspaceStore.getState();
                newBoard = await provider.createBoard(resolvedName, { workspaceId: activeWorkspaceId });
            } else {
                newBoard = await provider.createBoard(resolvedName);
            }

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

    toggleCollaboration: async (boardId, isLive) => {
        // Optimistic update
        set(state => ({
            cloudBoards: state.cloudBoards.map(b =>
                b.id === boardId ? { ...b, isLive } : b
            ),
        }));

        try {
            const provider = storageFactory.getProvider('cloud');
            await provider.updateBoard(boardId, { isLive });
        } catch (err) {
            console.error('toggleCollaboration failed:', err);
            // Revert on failure
            set(state => ({
                cloudBoards: state.cloudBoards.map(b =>
                    b.id === boardId ? { ...b, isLive: !isLive } : b
                ),
            }));
        }
    },

    updateBoardAccess: async (boardId, access) => {
        // Optimistic update
        set(state => ({
            cloudBoards: state.cloudBoards.map(b =>
                b.id === boardId ? { ...b, ...access } : b
            ),
        }));

        try {
            const provider = storageFactory.getProvider('cloud');
            // Can use the existing updateBoard for metadata
            await provider.updateBoard(boardId, access);
        } catch (err) {
            console.error('updateBoardAccess failed:', err);
            // We could revert on failure here if we kept previous state 
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

    addBoardMember: async (boardId, email, role) => {
        try {
            const provider = storageFactory.getProvider('cloud');
            const members = await provider.addMember(boardId, email, role);

            set(state => ({
                cloudBoards: state.cloudBoards.map(b =>
                    b.id === boardId ? { ...b, members } : b
                )
            }));
            return members;
        } catch (err) {
            console.error('addBoardMember failed:', err);
            throw err;
        }
    },

    removeBoardMember: async (boardId, userId) => {
        try {
            const provider = storageFactory.getProvider('cloud');
            const members = await provider.removeMember(boardId, userId);

            set(state => ({
                cloudBoards: state.cloudBoards.map(b =>
                    b.id === boardId ? { ...b, members } : b
                )
            }));
            return members;
        } catch (err) {
            console.error('removeBoardMember failed:', err);
            throw err;
        }
    },

    updateBoardShapes: async (boardId, shapes, thumbnail) => {
        // Optimistic cache update
        set(state => ({
            boardDataCache: {
                ...state.boardDataCache,
                [boardId]: { ...(state.boardDataCache[boardId] || {}), shapes },
            },
        }));

        if (thumbnail !== undefined) {
            set(state => ({
                localBoards: state.localBoards.map(b => b.id === boardId ? { ...b, thumbnail } : b),
                cloudBoards: state.cloudBoards.map(b => b.id === boardId ? { ...b, thumbnail } : b),
            }));
        }

        try {
            const isLocal = get().localBoards.some(b => b.id === boardId);
            if (!isLocal && !isValidObjectId(boardId)) return; // Don't try to save local ID to cloud

            const provider = storageFactory.getProvider(isLocal ? 'local' : 'cloud');
            await provider.saveBoardData(boardId, { shapes });

            if (thumbnail !== undefined) {
                await provider.updateBoard(boardId, { thumbnail });
            }
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

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

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
