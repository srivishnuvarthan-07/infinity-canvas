import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/storage/db';
import libraryService from '@/services/library.service';
import { useAuth } from '@/hooks/useAuth';
import { getBounds } from '@/engine/geometry/geometry';
import { CanvasRenderer } from '@/engine/render/CanvasRenderer';

const STORAGE_KEY = 'infinity_library';

export function useLibraryStore() {
    const { user } = useAuth();
    const [items, setItems] = useState({});
    const [communityItems, setCommunityItems] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    
    // Dynamic storage key based on user ID
    const currentStorageKey = `infinity_library_${user?._id || 'guest'}`;

    // 1. Load from IndexedDB whenever the storage key changes
    useEffect(() => {
        const load = async () => {
            setIsLoaded(false);
            setItems({}); // Clear previous user's items
            try {
                const data = await db.get(currentStorageKey);
                if (data) {
                    setItems(data);
                }
            } catch (err) {
                console.error('Failed to load library:', err);
            }
            setIsLoaded(true);
        };
        load();
    }, [currentStorageKey]);

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
                            preview: item.preview || '',
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

    // 2.5 Fetch Community Items
    const fetchCommunityItems = useCallback(async () => {
        try {
            const data = await libraryService.getPublicLibraryItems();
            const publicItems = data.data.map(item => ({
                id: item._id,
                name: item.name,
                shapes: item.elements,
                preview: item.preview || '',
                createdAt: new Date(item.createdAt).getTime(),
                isCloud: true,
                isPublic: true,
                userId: item.user?._id || item.user,
                userName: item.user?.name || 'Community Member'
            }));
            setCommunityItems(publicItems);
        } catch (err) {
            console.error("Failed to fetch community items", err);
        }
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        fetchCommunityItems();
    }, [isLoaded, fetchCommunityItems]);


    // 3. Persist to IndexedDB
    useEffect(() => {
        if (!isLoaded || !currentStorageKey) return;
        const save = async () => {
            try {
                await db.set(currentStorageKey, items);
            } catch (err) {
                console.error('Failed to save library:', err);
            }
        };
        save();
    }, [items, isLoaded, currentStorageKey]);

    const addItem = useCallback(async (shapes, name = 'Untitled Group') => {
        if (!user) {
            console.warn("Guests cannot add items to the library.");
            return;
        }

        if (!shapes || shapes.length === 0) {
            return;
        }

        // ... (Normalization logic same as before, condensed for brevity or kept)
        // Re-implementing normalization logic to be safe since I'm replacing the block

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        shapes.forEach(shape => {
            const bounds = getBounds(shape);
            if (bounds.minX < minX) minX = bounds.minX;
            if (bounds.minY < minY) minY = bounds.minY;
            if (bounds.maxX > maxX) maxX = bounds.maxX;
            if (bounds.maxY > maxY) maxY = bounds.maxY;
        });

        const width = maxX === -Infinity ? 0 : maxX - minX;
        const height = maxY === -Infinity ? 0 : maxY - minY;
        const centerX = minX + width / 2;
        const centerY = minY + height / 2;

        const normalizedShapes = shapes.map(s => ({
            ...s,
            position: {
                x: (s.position?.x || 0) - centerX,
                y: (s.position?.y || 0) - centerY
            }
        }));

        let preview = '';
        if (width > 0 && height > 0) {
            try {
                const THUMBNAIL_SIZE = 100;
                const PADDING_FACTOR = 0.85;
                const canvas = document.createElement('canvas');
                canvas.width = THUMBNAIL_SIZE;
                canvas.height = THUMBNAIL_SIZE;

                const renderer = new CanvasRenderer(canvas);
                renderer.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE);

                const scaleX = (THUMBNAIL_SIZE * PADDING_FACTOR) / width;
                const scaleY = (THUMBNAIL_SIZE * PADDING_FACTOR) / height;
                const zoom = Math.min(scaleX, scaleY);

                // Render normalized shapes perfectly centered
                const viewportX = THUMBNAIL_SIZE / 2;
                const viewportY = THUMBNAIL_SIZE / 2;

                renderer.render(normalizedShapes, {}, { x: viewportX, y: viewportY, zoom }, { clear: true, drawShapes: true });
                preview = canvas.toDataURL('image/png');
            } catch (err) {
                console.error("Failed to generate base64 preview for library item", err);
            }
        }

        const tempId = crypto.randomUUID();
        const newItem = {
            id: tempId,
            name,
            createdAt: Date.now(),
            shapes: normalizedShapes,
            width,
            height,
            preview
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
                    elements: normalizedShapes,
                    preview
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

    const updateItemDetails = useCallback(async (id, updates) => {
        const item = items[id];
        if (!item) return;

        setItems(prev => {
            const next = { ...prev };
            next[id] = { ...item, ...updates };
            return next;
        });

        if (user && item.isCloud) {
            try {
                await libraryService.updateLibraryItem(id, updates);
            } catch (err) {
                console.error("Failed to update library item on cloud", err);
            }
        }
    }, [items, user]);

    const publishToCommunity = useCallback(async (id) => {
        const item = items[id];
        if (!item || !user) return;

        try {
            await libraryService.updateLibraryItem(id, { isPublic: true });
            
            // Update local state
            setItems(prev => ({
                ...prev,
                [id]: { ...prev[id], isPublic: true }
            }));
            
            // Refresh community list
            fetchCommunityItems();
        } catch (err) {
            console.error("Failed to publish item", err);
            throw err;
        }
    }, [items, user, fetchCommunityItems]);

    const libraryItems = Object.values(items).sort((a, b) => b.createdAt - a.createdAt);

    return {
        items,
        isLoaded,
        addItem,
        removeItem,
        clearLibrary,
        updateItemDetails,
        libraryItems,
        communityItems,
        publishToCommunity,
        refreshCommunity: fetchCommunityItems
    };
}
