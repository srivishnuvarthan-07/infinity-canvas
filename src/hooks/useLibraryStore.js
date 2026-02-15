import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/storage/db';

const STORAGE_KEY = 'infinity_library';

export function useLibraryStore() {
    const [items, setItems] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);

    // 1. Load from IndexedDB
    useEffect(() => {
        const load = async () => {
            try {
                const data = await db.get(STORAGE_KEY);
                if (data) {
                    setItems(data);
                }
            } catch (err) {
                console.error('Failed to load library:', err);
            }
            setIsLoaded(true);
        };
        load();
    }, []);

    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    // 2. Persist to IndexedDB
    useEffect(() => {
        if (!isLoaded) return;
        const save = async () => {
            try {
                await db.set(STORAGE_KEY, items);
            } catch (err) {
                console.error('Failed to save library:', err);
            }
        };
        save();
    }, [items, isLoaded]);

    const addItem = useCallback((shapes, name = 'Untitled Group') => {
        if (!shapes || shapes.length === 0) {
            return;
        }

        // 1. Calculate Bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        shapes.forEach(s => {
            const hw = (s.width * (s.scaleX || 1)) / 2;
            const hh = (s.height * (s.scaleY || 1)) / 2;
            minX = Math.min(minX, s.x - hw);
            minY = Math.min(minY, s.y - hh);
            maxX = Math.max(maxX, s.x + hw);
            maxY = Math.max(maxY, s.y + hh);
        });

        const width = maxX - minX;
        const height = maxY - minY;
        const centerX = minX + width / 2;
        const centerY = minY + height / 2;

        // 2. Normalize Shapes
        const normalizedShapes = shapes.map(s => ({
            ...s,
            x: s.x - centerX,
            y: s.y - centerY,
        }));

        // 3. Create Item
        const newItem = {
            id: generateId(),
            name,
            createdAt: Date.now(),
            shapes: normalizedShapes,
            width,
            height
        };

        setItems(prev => ({
            ...prev,
            [newItem.id]: newItem
        }));
    }, []);

    const removeItem = useCallback((id) => {
        setItems(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }, []);

    const clearLibrary = useCallback(() => {
        setItems({});
    }, []);

    return {
        items,
        isLoaded,
        addItem,
        removeItem,
        clearLibrary
    };
}
