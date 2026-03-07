import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/storage/db';
import libraryService from '@/services/library.service';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'infinity_library';

export function useLibraryStore() {
    const [items, setItems] = useState({});
    const [isLoaded, setIsLoaded] = useState(false);

    const { user } = useAuth();

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

    // 2. Cloud Sync
    useEffect(() => {
        if (!user || !isLoaded) return;

        const sync = async () => {
            try {
                const data = await libraryService.getLibraryItems();
                const cloudItems = data.data;

                setItems(prev => {
                    const next = { ...prev };
                    cloudItems.forEach(item => {
                        // Use _id from cloud
                        next[item._id] = {
                            id: item._id,
                            name: item.name,
                            shapes: item.elements,
                            createdAt: new Date(item.createdAt).getTime(),
                            isCloud: true
                        };
                    });
                    return next;
                });
            } catch (err) {
                console.error("Library sync failed", err);
            }
        };
        sync();
    }, [user, isLoaded]);


    // 3. Persist to IndexedDB
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

    const addItem = useCallback(async (shapes, name = 'Untitled Group') => {
        if (!shapes || shapes.length === 0) {
            return;
        }

        // ... (Normalization logic same as before, condensed for brevity or kept)
        // Re-implementing normalization logic to be safe since I'm replacing the block

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        shapes.forEach(s => {
            // simplified bounds check
            const hw = (s.size.width * s.scale.x) / 2;
            const hh = (s.size.height * s.scale.y) / 2;
            minX = Math.min(minX, s.position.x - hw);
            minY = Math.min(minY, s.position.y - hh);
            maxX = Math.max(maxX, s.position.x + hw);
            maxY = Math.max(maxY, s.position.y + hh);
        });

        const width = maxX - minX;
        const height = maxY - minY;
        const centerX = minX + width / 2;
        const centerY = minY + height / 2;

        const normalizedShapes = shapes.map(s => ({
            ...s,
            position: {
                x: s.position.x - centerX,
                y: s.position.y - centerY
            }
        }));

        const tempId = crypto.randomUUID();
        const newItem = {
            id: tempId,
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

        // Cloud Save
        if (user) {
            try {
                const res = await libraryService.createLibraryItem({
                    name,
                    elements: normalizedShapes
                });

                // Replace temp ID with cloud ID
                setItems(prev => {
                    const next = { ...prev };
                    delete next[tempId];
                    next[res.data._id] = {
                        ...newItem,
                        id: res.data._id,
                        isCloud: true
                    };
                    return next;
                });
            } catch (err) {
                console.error("Failed to save library item to cloud", err);
            }
        }
    }, [user]);

    const removeItem = useCallback(async (id) => {
        const item = items[id];

        setItems(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });

        if (user && item?.isCloud) {
            try {
                await libraryService.deleteLibraryItem(id);
            } catch (err) {
                console.error("Failed to delete library item from cloud", err);
            }
        }
    }, [user, items]);

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
