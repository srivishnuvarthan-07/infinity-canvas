import { useState, useCallback, useRef, useEffect } from 'react';
import { SHAPE_TYPES } from '@/engine/schema';
import { getTextLayout } from '@/engine/utils/textUtils';
import { diffShapes, applyUndo, applyRedo, updateShapes } from '@/engine/core/stateManager';
import {
    groupShapes as groupShapesFn,
    ungroupShapes as ungroupShapesFn,
    bringToFront as bringToFrontFn,
    sendToBack as sendToBackFn,
    bringForward as bringForwardFn,
    sendBackward as sendBackwardFn
} from '@/engine/core/actionManager';

const MAX_HISTORY = 50;

export function useEngineState(initialShapes = [], socket = null, boardId = null) {
    const [shapes, _setShapes] = useState(initialShapes);
    const shapesRef = useRef(shapes);
    
    const setShapes = useCallback((val) => {
        _setShapes(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            shapesRef.current = next;
            return next;
        });
    }, []);

    const [selectedShapeIds, setSelectedShapeIds] = useState(new Set());
    const [hoveredShapeId, setHoveredShapeId] = useState(null);
    const [editingShapeId, setEditingShapeId] = useState(null);

    const [history, _setHistory] = useState([]);
    const historyRef = useRef([]);

    const setHistory = useCallback((val) => {
        _setHistory(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            historyRef.current = next;
            return next;
        });
    }, []);
    const [historyIndex, _setHistoryIndex] = useState(-1);
    const historyIndexRef = useRef(-1);

    const setHistoryIndex = useCallback((val) => {
        _setHistoryIndex(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            historyIndexRef.current = next;
            return next;
        });
    }, []);

    const lastSavedShapesRef = useRef(initialShapes);
    // useEffect(() => { shapesRef.current = shapes; }, [shapes]); // This is now handled by the custom setShapes

    // Sync shapes with initialShapes if they change (e.g. after async fetch)
    useEffect(() => {
        if (initialShapes && initialShapes.length > 0 && shapes.length === 0) {
            setShapes(initialShapes);
            lastSavedShapesRef.current = initialShapes;
        }
    }, [initialShapes]);

    // Live emit for dragging/drawing (low-latency, no history)
    const emitUpdate = useCallback((shape) => {
        if (!socket || !shape || !boardId) return;
        socket.emit('board-action', {
            boardId,
            action: { id: crypto.randomUUID(), type: 'UPDATE', payload: shape, timestamp: new Date() }
        });
    }, [socket, boardId]);

    // Commit current shapes to history and emit diffs to socket
    const saveState = useCallback((nextShapes) => {
        const targetShapes = nextShapes || shapesRef.current;
        const commands = diffShapes(lastSavedShapesRef.current, targetShapes);
        if (commands.length === 0) return;

        lastSavedShapesRef.current = targetShapes;

        setHistory(prev => {
            const currentIdx = historyIndexRef.current;
            const trimmed = prev.slice(0, currentIdx + 1);
            trimmed.push(commands);
            if (trimmed.length > MAX_HISTORY) trimmed.shift();
            return trimmed;
        });

        setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));

        // Sync to others
        if (socket && boardId) {
            commands.forEach(cmd => {
                socket.emit('board-action', {
                    boardId,
                    action: {
                        id: crypto.randomUUID(),
                        type: cmd.type,
                        payload: cmd.type === 'REMOVE' ? { id: cmd.id } : cmd.next,
                        timestamp: new Date()
                    }
                });
            });
        }
    }, [socket, boardId]);

    // Handle incoming remote actions
    useEffect(() => {
        if (!socket) return;
        const unsubscribe = socket.on('remote-action', (action) => {
            setShapes(current => {
                const nextMap = new Map(current.map(s => [s.id, s]));
                if (action.type === 'ADD' || action.type === 'UPDATE') {
                    nextMap.set(action.payload.id, action.payload);
                } else if (action.type === 'REMOVE' || action.type === 'DELETE') {
                    nextMap.delete(action.payload.id);
                }
                return Array.from(nextMap.values());
            });
        });
        return unsubscribe;
    }, [socket]);

    // ── History ──────────────────────────────────────────────────────────────

    const undo = useCallback(() => {
        const hIdx = historyIndexRef.current;
        if (hIdx < 0) return;
        
        const currentHistory = historyRef.current;
        const commands = currentHistory[hIdx];
        
        setHistoryIndex(prev => prev - 1);
        
        setShapes(current => {
            const next = applyUndo(current, commands);
            lastSavedShapesRef.current = next;
            if (socket) {
                // Sync Undo to others
                commands.slice().reverse().forEach(cmd => {
                    const inverseType = cmd.type === 'ADD' ? 'REMOVE' : cmd.type === 'REMOVE' ? 'ADD' : 'UPDATE';
                    const payload = inverseType === 'REMOVE' ? { id: cmd.id } : cmd.prev;
                    socket.emit('board-action', { 
                        boardId,
                        action: { id: crypto.randomUUID(), type: inverseType, payload, timestamp: new Date() } 
                    });
                });
            }
            return next;
        });
    }, [history, historyIndex, socket, boardId]);

    const redo = useCallback(() => {
        const hIdx = historyIndexRef.current;
        const currentHistory = historyRef.current;
        
        if (hIdx >= currentHistory.length - 1) return;
        
        const commands = currentHistory[hIdx + 1];
        setHistoryIndex(prev => prev + 1);
        
        setShapes(current => {
            const next = applyRedo(current, commands);
            lastSavedShapesRef.current = next;
            if (socket) {
                // Sync Redo to others
                commands.forEach(cmd => {
                    const payload = cmd.type === 'REMOVE' ? { id: cmd.id } : cmd.next;
                    socket.emit('board-action', { 
                        boardId,
                        action: { id: crypto.randomUUID(), type: cmd.type, payload, timestamp: new Date() } 
                    });
                });
            }
            return next;
        });
    }, [history, historyIndex, socket, boardId]);

    // ── Shape Mutations ───────────────────────────────────────────────────────

    const updateShapesById = useCallback((ids, updates) => {
        const idSet = ids instanceof Set ? ids : new Set(Array.isArray(ids) ? ids : [ids]);
        if (idSet.size === 0) return;

        setShapes(prev => {
            // Recalculate text bounds if text/font changed
            let next = updateShapes(prev, idSet, updates);
            if ('text' in updates || 'font' in updates) {
                next = next.map(s => {
                    if (!idSet.has(s.id) || s.type !== SHAPE_TYPES.TEXT) return s;
                    try {
                        const layout = getTextLayout(null, s);
                        return { ...s, size: { ...s.size, width: layout.width, height: layout.height } };
                    } catch {
                        return s;
                    }
                });
            }
            saveState(next);
            return next;
        });
    }, [saveState]);

    // ── Layer Actions (delegate to actionManager) ─────────────────────────────

    const groupShapes = useCallback(() => {
        setShapes(prev => {
            const result = groupShapesFn(prev, selectedShapeIds);
            if (!result) return prev;
            saveState(result.shapes);
            setSelectedShapeIds(new Set([result.groupId]));
            return result.shapes;
        });
    }, [selectedShapeIds, saveState]);

    const ungroupShapes = useCallback(() => {
        if (selectedShapeIds.size !== 1) return;
        const groupId = [...selectedShapeIds][0];
        setShapes(prev => {
            const result = ungroupShapesFn(prev, groupId);
            if (!result) return prev;
            saveState(result.shapes);
            setSelectedShapeIds(new Set(result.childIds));
            return result.shapes;
        });
    }, [selectedShapeIds, saveState]);

    const bringToFront = useCallback(() => {
        if (selectedShapeIds.size === 0) return;
        setShapes(prev => {
            const next = bringToFrontFn(prev, selectedShapeIds);
            saveState(next);
            return next;
        });
    }, [selectedShapeIds, saveState]);

    const sendToBack = useCallback(() => {
        if (selectedShapeIds.size === 0) return;
        setShapes(prev => {
            const next = sendToBackFn(prev, selectedShapeIds);
            saveState(next);
            return next;
        });
    }, [selectedShapeIds, saveState]);

    const bringForward = useCallback(() => {
        if (selectedShapeIds.size !== 1) return;
        const id = [...selectedShapeIds][0];
        setShapes(prev => {
            const next = bringForwardFn(prev, id);
            saveState(next);
            return next;
        });
    }, [selectedShapeIds, saveState]);

    const sendBackward = useCallback(() => {
        if (selectedShapeIds.size !== 1) return;
        const id = [...selectedShapeIds][0];
        setShapes(prev => {
            const next = sendBackwardFn(prev, id);
            saveState(next);
            return next;
        });
    }, [selectedShapeIds, saveState]);

    // ── Canvas Lifecycle ──────────────────────────────────────────────────────

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

    return {
        shapes,
        setShapes,
        selectedShapeIds,
        setSelectedShapeIds,
        hoveredShapeId,
        setHoveredShapeId,
        editingShapeId,
        setEditingShapeId,

        history,
        historyIndex,
        saveState,
        undo,
        redo,
        canUndo: historyIndex >= 0,
        canRedo: historyIndex < history.length - 1,

        updateShapes: updateShapesById,
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
