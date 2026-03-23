import { useState, useCallback } from 'react';
import { hitTest } from '@/engine/physics/hitTest';

/**
 * useSelection
 * Manages rubber-band drag selection (marquee select).
 * Hit-tests all shapes against the drawn box on pointer-up.
 */
export function useSelection({ canvasRef, shapes, toWorld, setSelectedShapeIds, setSelectionBox }) {
    const [isDragSelecting, setIsDragSelecting] = useState(false);

    const startDragSelect = useCallback((worldX, worldY, e) => {
        setIsDragSelecting(true);
        setSelectionBox({ startX: worldX, startY: worldY, currentX: worldX, currentY: worldY });
        if (canvasRef.current?.setPointerCapture) canvasRef.current.setPointerCapture(e.pointerId);
    }, [canvasRef, setSelectionBox]);

    const updateDragSelect = useCallback((worldX, worldY) => {
        setSelectionBox(prev => prev ? { ...prev, currentX: worldX, currentY: worldY } : null);
    }, [setSelectionBox]);

    const commitDragSelect = useCallback((selectionBox) => {
        if (!selectionBox) return;
        const { startX, startY, currentX, currentY } = selectionBox;
        const x1 = Math.min(startX, currentX);
        const x2 = Math.max(startX, currentX);
        const y1 = Math.min(startY, currentY);
        const y2 = Math.max(startY, currentY);

        const hitIds = new Set();
        shapes.forEach(s => {
            const w = s.size?.width || 0;
            const h = s.size?.height || 0;
            const sx1 = (s.position?.x || 0) - w / 2;
            const sx2 = (s.position?.x || 0) + w / 2;
            const sy1 = (s.position?.y || 0) - h / 2;
            const sy2 = (s.position?.y || 0) + h / 2;
            if (sx1 < x2 && sx2 > x1 && sy1 < y2 && sy2 > y1) hitIds.add(s.id);
        });

        setSelectedShapeIds(hitIds);
        setIsDragSelecting(false);
        setSelectionBox(null);
    }, [shapes, setSelectedShapeIds, setSelectionBox]);

    const cancelDragSelect = useCallback(() => {
        setIsDragSelecting(false);
        setSelectionBox(null);
    }, [setSelectionBox]);

    return {
        isDragSelecting,
        setIsDragSelecting,
        startDragSelect,
        updateDragSelect,
        commitDragSelect,
        cancelDragSelect
    };
}
