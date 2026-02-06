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
        clearCanvas
    };
}
