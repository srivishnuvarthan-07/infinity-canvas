import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'infinity_boards';

const createDefaultBoard = () => ({
    id: crypto.randomUUID(),
    name: 'Untitled Board',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    shapes: []
});

export function useBoardStore() {
    // State
    const [boards, setBoards] = useState({});
    const [activeBoardId, setActiveBoardId] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // 1. Load from LocalStorage on Mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                if (data.boards && data.activeBoardId) {
                    setBoards(data.boards);
                    setActiveBoardId(data.activeBoardId);
                    setIsLoaded(true);
                    return;
                }
            }
        } catch (err) {
            console.error('Failed to load boards:', err);
        }

        // Default: Create Initial Board
        const defaultBoard = createDefaultBoard();
        setBoards({ [defaultBoard.id]: defaultBoard });
        setActiveBoardId(defaultBoard.id);
        setIsLoaded(true);
    }, []);

    // 2. Persist to LocalStorage (Debounced? Or direct for now since updates are explicit)
    // We'll trust the caller (DrawingCanvas debounce) for shape updates, 
    // but metadata updates should be instant.
    useEffect(() => {
        if (!isLoaded) return;
        const state = { boards, activeBoardId };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [boards, activeBoardId, isLoaded]);

    // Actions
    const createBoard = useCallback(() => {
        const newBoard = createDefaultBoard();
        setBoards(prev => ({
            ...prev,
            [newBoard.id]: newBoard
        }));
        setActiveBoardId(newBoard.id);
        return newBoard.id;
    }, []);

    const deleteBoard = useCallback((boardId) => {
        setBoards(prev => {
            const next = { ...prev };
            delete next[boardId];

            // Prevent deleting last board
            if (Object.keys(next).length === 0) {
                return prev; // Or create new?
                // Better: Create new one immediately if empty
            }
            return next;
        });

        // Loop protection if active board is deleted
        setActiveBoardId(prev => {
            if (prev === boardId) {
                // Must pick another. We can't see the 'next' state here easily in callback pattern
                // so we might need a 2-step or Effect? 
                // Actually, let's handle it by reading current 'boards' which is stale in setBoards...
                // Easier: Do it in toggle logic or simple effect?
                // Let's do it right here with a functional update check? No, complex.
                // We will assume UI handles switching OR we use an effect to ensure activeBoardId is valid.
                return prev;
            }
            return prev;
        });
    }, []);

    // Safety Effect: If activeBoardId is invalid, pick one.
    useEffect(() => {
        if (!isLoaded) return;
        const ids = Object.keys(boards);
        if (ids.length === 0) {
            // Should theoretically trigger createBoard if we allowed empty
            const newBoard = createDefaultBoard();
            setBoards({ [newBoard.id]: newBoard });
            setActiveBoardId(newBoard.id);
        } else if (!boards[activeBoardId]) {
            setActiveBoardId(ids[0]);
        }
    }, [boards, activeBoardId, isLoaded]);


    const renameBoard = useCallback((boardId, newName) => {
        setBoards(prev => ({
            ...prev,
            [boardId]: { ...prev[boardId], name: newName, updatedAt: Date.now() }
        }));
    }, []);

    const updateBoardShapes = useCallback((boardId, shapes) => {
        setBoards(prev => {
            // Optimization: Only update if changed? 
            // Engine usually sends complete array.
            if (!prev[boardId]) return prev;

            return {
                ...prev,
                [boardId]: {
                    ...prev[boardId],
                    shapes,
                    updatedAt: Date.now()
                }
            };
        });
    }, []);

    return {
        boards,
        activeBoardId,
        activeBoard: boards[activeBoardId],
        isLoaded,
        createBoard,
        deleteBoard,
        renameBoard,
        setActiveBoardId,
        updateBoardShapes
    };
}
