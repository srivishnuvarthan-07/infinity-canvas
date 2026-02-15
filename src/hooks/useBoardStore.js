import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/storage/db';

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

    // 1. Load from IndexedDB on Mount
    useEffect(() => {
        const load = async () => {
            try {
                const data = await db.get(STORAGE_KEY);
                if (data && data.boards && data.activeBoardId) {
                    setBoards(data.boards);
                    setActiveBoardId(data.activeBoardId);
                    setIsLoaded(true);
                    return;
                }
            } catch (err) {
                console.error('Failed to load boards from DB:', err);
                // Fallback to localStorage migration? 
                // For now, just error or clean slate.
            }

            // Default: Create Initial Board
            const defaultBoard = createDefaultBoard();
            setBoards({ [defaultBoard.id]: defaultBoard });
            setActiveBoardId(defaultBoard.id);
            setIsLoaded(true);
        };
        load();
    }, []);

    // 2. Persist to IndexedDB
    useEffect(() => {
        if (!isLoaded) return;
        const save = async () => {
            const state = { boards, activeBoardId };
            try {
                await db.set(STORAGE_KEY, state);
            } catch (err) {
                console.error("Failed to save boards to DB:", err);
            }
        };
        save();
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

            if (Object.keys(next).length === 0) {
                return prev;
            }
            return next;
        });

        setActiveBoardId(prev => {
            if (prev === boardId) {
                return prev;
            }
            return prev;
        });
    }, []);

    // Safety Effect
    useEffect(() => {
        if (!isLoaded) return;
        const ids = Object.keys(boards);
        if (ids.length === 0) {
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
