import { useState, useCallback, useRef } from 'react';

export function useEngineState(initialShapes = []) {
    // Canvas State
    const [shapes, setShapes] = useState(initialShapes);
    const [selectedShapeIds, setSelectedShapeIds] = useState(new Set());
    const [hoveredShapeId, setHoveredShapeId] = useState(null);
    const [editingShapeId, setEditingShapeId] = useState(null);

    // History State
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // History Actions
    const saveState = useCallback((newShapes) => {
        const snapshot = JSON.parse(JSON.stringify(newShapes));
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(snapshot);
            // Limit history size?
            if (newHistory.length > 50) newHistory.shift();
            return newHistory;
        });
        setHistoryIndex(prev => {
            const nextIndex = historyIndex + 1;
            // Adjust index if we shifted
            return prev >= 49 ? 49 : nextIndex;
        });
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setShapes(history[historyIndex - 1]);
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setShapes(history[historyIndex + 1]);
        }
    }, [history, historyIndex]);

    // Helpers
    const updateShapes = useCallback((ids, updates) => {
        const idsSet = ids instanceof Set ? ids : new Set(Array.isArray(ids) ? ids : [ids]);
        if (idsSet.size === 0) return;

        setShapes(prev => {
            const newShapes = prev.map(shape => {
                if (idsSet.has(shape.id)) {
                    return { ...shape, ...updates };
                }
                return shape;
            });
            saveState(newShapes);
            return newShapes;
        });
    }, [saveState]);

    const groupShapes = useCallback(() => {
        if (selectedShapeIds.size < 2) return;

        setShapes(prev => {
            const selected = prev.filter(s => selectedShapeIds.has(s.id));
            if (selected.length < 2) return prev;

            // 1. Calculate Bounding Box
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            selected.forEach(s => {
                // Expanded bounds logic (simplified: center +/- half-dims)
                // Ideally should account for rotation, but for MVP we use AABB of centers + dims
                // Or better: use logic similar to selection box
                const hw = s.width / 2;
                const hh = s.height / 2;
                // We don't have perfect rotated bounds here without helper, 
                // but let's assume worst case (max dimension radius) or just raw centered box is mostly fine if not rotated much.
                // Let's use simple extents for now.
                minX = Math.min(minX, s.x - hw);
                minY = Math.min(minY, s.y - hh);
                maxX = Math.max(maxX, s.x + hw);
                maxY = Math.max(maxY, s.y + hh);
            });

            // Padding
            minX -= 10; minY -= 10; maxX += 10; maxY += 10;

            const width = maxX - minX;
            const height = maxY - minY;
            const x = minX + width / 2;
            const y = minY + height / 2;

            // 2. Create Group
            const groupId = crypto.randomUUID();
            const group = {
                id: groupId,
                type: 'group',
                x, y,
                width, height,
                rotation: 0,
                opacity: 1,
                strokeColor: 'transparent',
                strokeWidth: 0,
                strokeStyle: 'solid',
                sloppiness: 'architect',
                children: selected.map(s => ({
                    ...s,
                    // Convert to relative coordinates
                    // Relative to Group Center (0,0 is center)
                    x: s.x - x,
                    y: s.y - y,
                    // Rotation is additive (simplification)
                    // If group rotates, child rotation = child.localRot + group.Rot
                    // Here child.rotation remains local absolute value relative to unrotated group
                }))
            };

            // 3. Update State
            const idsToRemove = new Set(selected.map(s => s.id));
            const newShapes = prev.filter(s => !idsToRemove.has(s.id));
            newShapes.push(group);

            saveState(newShapes);
            setSelectedShapeIds(new Set([groupId]));
            return newShapes;
        });
    }, [selectedShapeIds, saveState]);

    const ungroupShapes = useCallback(() => {
        if (selectedShapeIds.size !== 1) return;

        setShapes(prev => {
            const groupId = [...selectedShapeIds][0];
            const group = prev.find(s => s.id === groupId);
            if (!group || group.type !== 'group' || !group.children) return prev;

            // 1. Convert Children to Absolute
            const children = group.children.map(child => {
                // Rotate child relative position by group rotation
                // newX = group.x + (cx * cos - cy * sin)
                // newY = group.y + (cx * sin + cy * cos)

                const rad = (group.rotation * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);

                const cx = child.x; // relative
                const cy = child.y; // relative

                const absX = group.x + (cx * cos - cy * sin);
                const absY = group.y + (cx * sin + cy * cos);

                return {
                    ...child,
                    x: absX,
                    y: absY,
                    rotation: (child.rotation || 0) + (group.rotation || 0)
                };
            });

            // 2. Update State
            const newShapes = prev.filter(s => s.id !== groupId);
            newShapes.push(...children);

            saveState(newShapes);
            setSelectedShapeIds(new Set(children.map(c => c.id)));
            return newShapes;
        });
    }, [selectedShapeIds, saveState]);

    // Layer Management
    const bringToFront = useCallback(() => {
        if (selectedShapeIds.size === 0) return;
        setShapes(prev => {
            const selected = [];
            const others = [];
            prev.forEach(s => {
                if (selectedShapeIds.has(s.id)) selected.push(s);
                else others.push(s);
            });
            if (others.length === prev.length) return prev; // No change
            const newShapes = [...others, ...selected];
            saveState(newShapes);
            return newShapes;
        });
    }, [selectedShapeIds, saveState]);

    const sendToBack = useCallback(() => {
        if (selectedShapeIds.size === 0) return;
        setShapes(prev => {
            const selected = [];
            const others = [];
            prev.forEach(s => {
                if (selectedShapeIds.has(s.id)) selected.push(s);
                else others.push(s);
            });
            if (others.length === prev.length) return prev;
            const newShapes = [...selected, ...others];
            saveState(newShapes);
            return newShapes;
        });
    }, [selectedShapeIds, saveState]);

    const bringForward = useCallback(() => {
        if (selectedShapeIds.size !== 1) return; // Only single selection for step-wise
        const id = [...selectedShapeIds][0];
        setShapes(prev => {
            const index = prev.findIndex(s => s.id === id);
            if (index === -1 || index === prev.length - 1) return prev;

            const newShapes = [...prev];
            // Swap with next
            [newShapes[index], newShapes[index + 1]] = [newShapes[index + 1], newShapes[index]];
            saveState(newShapes);
            return newShapes;
        });
    }, [selectedShapeIds, saveState]);

    const sendBackward = useCallback(() => {
        if (selectedShapeIds.size !== 1) return;
        const id = [...selectedShapeIds][0];
        setShapes(prev => {
            const index = prev.findIndex(s => s.id === id);
            if (index <= 0) return prev;

            const newShapes = [...prev];
            // Swap with prev
            [newShapes[index], newShapes[index - 1]] = [newShapes[index - 1], newShapes[index]];
            saveState(newShapes);
            return newShapes;
        });
    }, [selectedShapeIds, saveState]);

    const clearCanvas = useCallback(() => {
        setShapes([]);
        setHistory([[]]);
        setHistoryIndex(0);
        setSelectedShapeIds(new Set());
    }, []);

    return {
        shapes,
        setShapes,
        selectedShapeIds,
        setSelectedShapeIds,
        hoveredShapeId,
        setHoveredShapeId,
        editingShapeId,
        setEditingShapeId,

        // History
        history,
        historyIndex,
        saveState,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,

        // Actions
        updateShapes,
        clearCanvas,
        groupShapes,
        ungroupShapes,
        bringToFront,
        sendToBack,
        bringForward,
        sendBackward
    };
}
