import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'infinity_library';

/**
 * @typedef {Object} LibraryItem
 * @property {string} id
 * @property {string} name
 * @property {number} createdAt
 * @property {Array} shapes - Normalized shapes
 * @property {number} width - Bounding box width
 * @property {number} height - Bounding box height
 */

export function useLibraryStore() {
    const [items, setItems] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);

    // 1. Load from LocalStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                setItems(data);
            }
        } catch (err) {
            console.error('Failed to load library:', err);
        }
        setIsLoaded(true);
    }, []);

    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    // 2. Persist to LocalStorage
    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items, isLoaded]);

    /**
     * Adds a group of shapes to the library
     * @param {Array} shapes - The shapes to save (absolute coordinates)
     * @param {string} name - Name of the item
     */
    const addItem = useCallback((shapes, name = 'Untitled Group') => {
        console.log("useLibraryStore: addItem called", shapes, name);
        if (!shapes || shapes.length === 0) {
            console.error("useLibraryStore: No shapes provided");
            return;
        }

        // 1. Calculate Bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        shapes.forEach(s => {
            // Simplified bounds (center +/- half size)
            // Ideally should account for rotation, but this is sufficient for normalization
            const hw = (s.width * (s.scaleX || 1)) / 2;
            const hh = (s.height * (s.scaleY || 1)) / 2;
            minX = Math.min(minX, s.x - hw);
            minY = Math.min(minY, s.y - hh);
            maxX = Math.max(maxX, s.x + hw);
            maxY = Math.max(maxY, s.y + hh);
        });

        console.log("useLibraryStore: Calculated bounds", { minX, minY, maxX, maxY });

        // Add padding?
        // minX -= 10; minY -= 10; maxX += 10; maxY += 10;

        const width = maxX - minX;
        const height = maxY - minY;
        const centerX = minX + width / 2;
        const centerY = minY + height / 2;

        // 2. Normalize Shapes (Make relative to center 0,0)
        const normalizedShapes = shapes.map(s => ({
            ...s,
            // Convert to relative
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

        console.log("useLibraryStore: Creating new item", newItem);

        setItems(prev => {
            const next = {
                ...prev,
                [newItem.id]: newItem
            };
            console.log("useLibraryStore: Updated items", next);
            return next;
        });
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
