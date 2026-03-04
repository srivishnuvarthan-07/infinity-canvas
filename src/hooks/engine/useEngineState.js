import { useState, useCallback, useRef, useEffect } from 'react';
import { SHAPE_TYPES } from '@/engine/schema';
import { getTextLayout } from '@/engine/utils/textUtils';


export function useEngineState(initialShapes = [], socket = null) {
    // Canvas State
    const [shapes, setShapes] = useState(initialShapes);
    const [selectedShapeIds, setSelectedShapeIds] = useState(new Set());
    const [hoveredShapeId, setHoveredShapeId] = useState(null);
    const [editingShapeId, setEditingShapeId] = useState(null);

    // History State
    const [history, setHistory] = useState([]); // Array of Command[] (Batch)
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Mutable access to current shapes for diffing
    const shapesRef = useRef(shapes);
    const lastSavedShapesRef = useRef(initialShapes); // Track last state pushed to history
    useEffect(() => { shapesRef.current = shapes; }, [shapes]);

    // Live Emit for Dragging/Drawing (Throttled)
    const emitUpdate = useCallback((shapeToUpdate) => {
        if (!socket || !shapeToUpdate) return;
        socket.emit('board-action', {
            action: {
                id: crypto.randomUUID(),
                type: 'UPDATE', // Overwrite shape
                payload: shapeToUpdate,
                timestamp: new Date()
            }
        });
    }, [socket]);

    // History Actions
    // Command Structure: { type: 'ADD'|'REMOVE'|'UPDATE', id: string, prev: Shape, next: Shape }

    const saveState = useCallback((newShapes) => {
        const prevShapes = lastSavedShapesRef.current;
        const nextShapes = newShapes;

        // Calculate Diff
        const prevMap = new Map(prevShapes.map(s => [s.id, s]));
        const nextMap = new Map(nextShapes.map(s => [s.id, s]));

        const commands = [];

        // 1. Check for Updates and Adds
        nextShapes.forEach(next => {
            const prev = prevMap.get(next.id);
            if (!prev) {
                commands.push({ type: 'ADD', id: next.id, next });
            } else if (JSON.stringify(prev) !== JSON.stringify(next)) {
                commands.push({ type: 'UPDATE', id: next.id, prev, next });
            }
        });

        // 2. Check for Removes
        prevShapes.forEach(prev => {
            if (!nextMap.has(prev.id)) {
                commands.push({ type: 'REMOVE', id: prev.id, prev });
            }
        });

        if (commands.length === 0) return; // No changes

        // Update Ref immediately so next call sees this as "prev"
        lastSavedShapesRef.current = nextShapes;

        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(commands);
            if (newHistory.length > 50) newHistory.shift();
            return newHistory;
        });

        setHistoryIndex(prev => {
            const nextIndex = prev + 1;
            return nextIndex >= 50 ? 49 : nextIndex;
        });

        // EMIT ACTIONS TO SOCKET
        if (socket) {
            console.log("EMITTING ACTIONS TO SOCKET", commands);
            commands.forEach(cmd => {
                socket.emit('board-action', {
                    action: {
                        id: crypto.randomUUID(),
                        type: cmd.type, // 'ADD', 'UPDATE', 'REMOVE'
                        payload: cmd.type === 'REMOVE' ? { id: cmd.id } : cmd.next,
                        timestamp: new Date()
                    }
                });
            });
        }

    }, [historyIndex, socket]);

    // Handle incoming Remote Actions
    useEffect(() => {
        if (!socket) return;

        const unsubscribe = socket.on('remote-action', (action) => {
            console.log("RECEIVED REMOTE ACTION", action);
            setShapes(current => {
                const nextMap = new Map(current.map(s => [s.id, s]));

                if (action.type === 'ADD' || action.type === 'UPDATE') {
                    nextMap.set(action.payload.id, action.payload);
                } else if (action.type === 'REMOVE' || action.type === 'DELETE') {
                    const deletedId = action.payload.id;
                    nextMap.delete(deletedId);


                }

                return Array.from(nextMap.values());
            });
        });

        return unsubscribe;
    }, [socket]);

    const undo = useCallback(() => {
        if (historyIndex < 0) return;

        const commands = history[historyIndex];
        setHistoryIndex(prev => prev - 1);

        setShapes(current => {
            const nextMap = new Map(current.map(s => [s.id, s]));

            // Apply Inverse Actions (Backwards)
            for (let i = commands.length - 1; i >= 0; i--) {
                const cmd = commands[i];
                let inverseAction = null;

                if (cmd.type === 'ADD') {
                    nextMap.delete(cmd.id);
                    inverseAction = { type: 'REMOVE', payload: { id: cmd.id } };
                } else if (cmd.type === 'REMOVE') {
                    nextMap.set(cmd.id, cmd.prev);
                    inverseAction = { type: 'ADD', payload: cmd.prev };
                } else if (cmd.type === 'UPDATE') {
                    nextMap.set(cmd.id, cmd.prev);
                    inverseAction = { type: 'UPDATE', payload: cmd.prev };
                }

                if (socket && inverseAction) {
                    socket.emit('board-action', {
                        action: {
                            id: crypto.randomUUID(),
                            ...inverseAction,
                            timestamp: new Date()
                        }
                    });
                }
            }
            const nextShapes = Array.from(nextMap.values());
            lastSavedShapesRef.current = nextShapes;
            return nextShapes;
        });
    }, [history, historyIndex, socket]);

    const redo = useCallback(() => {
        if (historyIndex >= history.length - 1) return;

        const commands = history[historyIndex + 1];
        setHistoryIndex(prev => prev + 1);

        setShapes(current => {
            const nextMap = new Map(current.map(s => [s.id, s]));

            // Apply Actions (Forwards)
            for (const cmd of commands) {
                let action = null;
                if (cmd.type === 'ADD') {
                    nextMap.set(cmd.id, cmd.next);
                    action = { type: 'ADD', payload: cmd.next };
                } else if (cmd.type === 'REMOVE') {
                    nextMap.delete(cmd.id);
                    action = { type: 'REMOVE', payload: { id: cmd.id } };
                } else if (cmd.type === 'UPDATE') {
                    nextMap.set(cmd.id, cmd.next);
                    action = { type: 'UPDATE', payload: cmd.next };
                }

                if (socket && action) {
                    socket.emit('board-action', {
                        action: {
                            id: crypto.randomUUID(),
                            ...action,
                            timestamp: new Date()
                        }
                    });
                }
            }
            const nextShapes = Array.from(nextMap.values());
            lastSavedShapesRef.current = nextShapes;
            return nextShapes;
        });
    }, [history, historyIndex, socket]);

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
        setHistory([]);
        setHistoryIndex(-1);
        setSelectedShapeIds(new Set());
    }, []);

    const resetHistory = useCallback((newShapes = []) => {
        setShapes(newShapes);
        setHistory([]);
        setHistoryIndex(-1);
        lastSavedShapesRef.current = newShapes;
        setSelectedShapeIds(new Set());
    }, []);

    // Helpers
    const updateShapes = useCallback((ids, updates) => {
        const idsSet = ids instanceof Set ? ids : new Set(Array.isArray(ids) ? ids : [ids]);
        if (idsSet.size === 0) return;

        setShapes(prev => {
            const newShapes = prev.map(shape => {
                if (idsSet.has(shape.id)) {
                    // ⚛️ Deep Merge for V2 Schema
                    const newShape = {
                        ...shape,
                        ...updates,
                        // Recursively merge known sub-objects
                        position: updates.position ? { ...shape.position, ...updates.position } : shape.position,
                        size: updates.size ? { ...shape.size, ...updates.size } : shape.size,
                        scale: updates.scale ? { ...shape.scale, ...updates.scale } : shape.scale,
                        style: updates.style ? { ...shape.style, ...updates.style } : shape.style,
                        font: updates.font ? { ...shape.font, ...updates.font } : shape.font,
                        revision: {
                            number: (shape.revision?.number || 0) + 1,
                            timestamp: Date.now()
                        }
                    };

                    // 1️⃣ Recalculate Text Bounds Immediately
                    if (newShape.type === SHAPE_TYPES.TEXT) {
                        const styleChanged = 'text' in updates || 'font' in updates;

                        if (styleChanged) {
                            try {
                                const layout = getTextLayout(null, newShape);
                                newShape.size = {
                                    ...newShape.size,
                                    width: layout.width,
                                    height: layout.height
                                };
                            } catch (e) {
                                console.warn('Failed to measure text during update', e);
                            }
                        }
                    }

                    return newShape;
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
                const hw = s.size.width / 2;
                const hh = s.size.height / 2;
                minX = Math.min(minX, s.position.x - hw);
                minY = Math.min(minY, s.position.y - hh);
                maxX = Math.max(maxX, s.position.x + hw);
                maxY = Math.max(maxY, s.position.y + hh);
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
                position: { x, y },
                size: { width, height },
                rotation: 0,
                style: {
                    opacity: 1,
                    stroke: 'transparent',
                    strokeWidth: 0,
                    strokeStyle: 'solid',
                    sloppiness: 'architect'
                },
                children: selected.map(s => ({
                    ...s,
                    position: {
                        x: s.position.x - x,
                        y: s.position.y - y
                    }
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
                const rad = (group.rotation * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);

                const cx = child.position.x; // relative
                const cy = child.position.y; // relative

                const absX = group.position.x + (cx * cos - cy * sin);
                const absY = group.position.y + (cx * sin + cy * cos);

                return {
                    ...child,
                    position: {
                        x: absX,
                        y: absY
                    },
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
        canUndo: historyIndex >= 0,
        canRedo: historyIndex < history.length - 1,

        // Actions
        updateShapes,
        clearCanvas,
        groupShapes,
        ungroupShapes,
        bringToFront,
        sendToBack,
        bringForward,
        sendBackward,
        emitUpdate,
        resetHistory
    };
}
