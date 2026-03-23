import { useCallback } from 'react';
import { hitTest } from '@/engine/physics/hitTest';
import { routeArrow } from '@/engine/routing/smartArrow';
import { SHAPE_TYPES } from '@/engine/schema';

/**
 * useArrowConnect
 * Handles arrow binding at creation time and when dragging arrow endpoints onto shapes.
 * Both cases use the same hit-test-on-release pattern.
 */
export function useArrowConnect({ shapes, viewport, toWorld, canvasRef, setShapes, saveState }) {

    /**
     * Called on arrow creation (pointer up): checks if start/end land on shapes.
     * @param {string} arrowId
     * @param {{ x, y }} startWorldPos
     * @param {MouseEvent} e
     */
    const bindCreatedArrow = useCallback((arrowId, startWorldPos, e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const worldEnd = toWorld(e.clientX - rect.left, e.clientY - rect.top);

        setShapes(prev => {
            let next = [...prev];
            let startHitId = null, endHitId = null;

            for (let i = next.length - 1; i >= 0; i--) {
                const target = next[i];
                if (target.id === arrowId) continue;
                if (!startHitId && hitTest(target, startWorldPos.x, startWorldPos.y, viewport.zoom)) startHitId = target.id;
                if (!endHitId && hitTest(target, worldEnd.x, worldEnd.y, viewport.zoom)) endHitId = target.id;
                if (startHitId && endHitId) break;
            }

            if (startHitId || endHitId) {
                next = next.map(s => {
                    if (s.id !== arrowId) return s;
                    return {
                        ...s,
                        bindings: {
                            start: startHitId ? { elementId: startHitId, anchor: 'center' } : null,
                            end: endHitId ? { elementId: endHitId, anchor: 'center' } : null
                        }
                    };
                });
            }

            saveState(next);
            return next;
        });
    }, [canvasRef, toWorld, viewport.zoom, setShapes, saveState]);

    /**
     * Called when an arrow endpoint-handle is released: re-binds to new target (or unbinds).
     * @param {string} arrowId
     * @param {'start'|'end'} handle
     * @param {MouseEvent} e
     */
    const rebindArrowEndpoint = useCallback((arrowId, handle, e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const worldPoint = toWorld(e.clientX - rect.left, e.clientY - rect.top);

        const resizedShape = shapes.find(s => s.id === arrowId);
        if (!resizedShape || resizedShape.type !== SHAPE_TYPES.ARROW) return;

        let hitId = null;
        for (let i = shapes.length - 1; i >= 0; i--) {
            const target = shapes[i];
            if (target.id === arrowId) continue;
            if (hitTest(target, worldPoint.x, worldPoint.y, viewport.zoom)) { hitId = target.id; break; }
        }

        const hadBinding = resizedShape.bindings?.[handle];
        if (!hitId && !hadBinding) {
            saveState(shapes);
            return;
        }

        setShapes(prev => {
            const updated = prev.map(s => {
                if (s.id !== arrowId) return s;
                return {
                    ...s,
                    bindings: {
                        start: s.bindings?.start ?? null,
                        end: s.bindings?.end ?? null,
                        [handle]: hitId ? { elementId: hitId, anchor: 'center' } : null
                    }
                };
            });

            const arrow = updated.find(s => s.id === arrowId);
            if (arrow?.bindings?.start && arrow?.bindings?.end) {
                const source = updated.find(s => s.id === arrow.bindings.start.elementId);
                const target = updated.find(s => s.id === arrow.bindings.end.elementId);
                if (source && target) {
                    const routed = routeArrow(arrow, source, target, 'orthogonal');
                    const final = updated.map(s => s.id === arrowId ? routed : s);
                    saveState(final);
                    return final;
                }
            }

            saveState(updated);
            return updated;
        });
    }, [canvasRef, toWorld, shapes, viewport.zoom, setShapes, saveState]);

    return { bindCreatedArrow, rebindArrowEndpoint };
}
