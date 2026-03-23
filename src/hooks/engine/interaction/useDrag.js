import { useState, useCallback, useRef } from 'react';
import { updateConnectedArrows } from '@/engine/routing/smartArrow';

const SYNC_THROTTLE_MS = 50;

/**
 * useDrag
 * Manages shape dragging — tracking start positions, computing deltas,
 * updating shape positions each frame, and routing connected arrows.
 */
export function useDrag({ canvasRef, shapes, setShapes, selectedShapeIds, emitUpdate }) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartPos, setDragStartPos] = useState(null);
    const [initialShapePositions, setInitialShapePositions] = useState(new Map());
    const lastSyncTime = useRef(0);

    const startDrag = useCallback((worldX, worldY, e) => {
        setIsDragging(true);
        setDragStartPos({ x: worldX, y: worldY });

        const initPos = new Map();
        shapes.forEach(s => initPos.set(s.id, { x: s.position?.x || 0, y: s.position?.y || 0 }));
        setInitialShapePositions(initPos);

        if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
        if (canvasRef.current?.setPointerCapture) canvasRef.current.setPointerCapture(e.pointerId);
    }, [canvasRef, shapes]);

    const updateDrag = useCallback((worldX, worldY) => {
        if (!dragStartPos) return;
        const dx = worldX - dragStartPos.x;
        const dy = worldY - dragStartPos.y;

        setShapes(prev => {
            const moved = prev.map(s => {
                const init = initialShapePositions.get(s.id);
                if (!init || !selectedShapeIds.has(s.id)) return s;
                const newShape = { ...s, position: { ...s.position, x: init.x + dx, y: init.y + dy } };
                if (Date.now() - lastSyncTime.current > SYNC_THROTTLE_MS) {
                    emitUpdate(newShape);
                    lastSyncTime.current = Date.now();
                }
                return newShape;
            });
            return updateConnectedArrows(selectedShapeIds, moved);
        });
    }, [dragStartPos, initialShapePositions, selectedShapeIds, setShapes, emitUpdate]);

    const commitDrag = useCallback((saveState) => {
        saveState(); // Uses latest Ref-based state
        setIsDragging(false);
        setDragStartPos(null);
        setInitialShapePositions(new Map());
        if (canvasRef.current) canvasRef.current.style.cursor = 'default';
    }, [canvasRef, shapes]);

    const cancelDrag = useCallback(() => {
        setIsDragging(false);
        setDragStartPos(null);
    }, []);

    return {
        isDragging,
        setIsDragging,
        dragStartPos,
        initialShapePositions,
        startDrag,
        updateDrag,
        commitDrag,
        cancelDrag
    };
}
