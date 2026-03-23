import { useRef, useEffect, useCallback } from 'react';
import { CanvasEngine } from '@/engine/core/canvasEngine';

/**
 * useEngineRenderer
 * Manages the CanvasEngine lifecycle — init, resize, render loop, cleanup.
 * All rendering state is accessed via refs to avoid stale closures in the RAF loop.
 */
export function useEngineRenderer({
    canvasRef,
    shapes,
    viewport,
    hoveredShapeId,
    selectedShapeIds,
    selectionBox,
    editingShapeId,
    isDragging
}) {
    const engineRef = useRef(null);
    const isDirtyRef = useRef(true);

    // Mutable refs — updated each render so the RAF loop always reads fresh values
    const shapesRef = useRef(shapes);
    const viewportRef = useRef(viewport);
    const hoveredIdRef = useRef(hoveredShapeId);
    const selectedIdsRef = useRef(selectedShapeIds);
    const selectionBoxRef = useRef(selectionBox);
    const editingShapeIdRef = useRef(editingShapeId);
    const isDraggingRef = useRef(isDragging);

    useEffect(() => { shapesRef.current = shapes; }, [shapes]);
    useEffect(() => { viewportRef.current = viewport; }, [viewport]);
    useEffect(() => { hoveredIdRef.current = hoveredShapeId; }, [hoveredShapeId]);
    useEffect(() => { selectedIdsRef.current = selectedShapeIds; }, [selectedShapeIds]);
    useEffect(() => { selectionBoxRef.current = selectionBox; }, [selectionBox]);
    useEffect(() => { editingShapeIdRef.current = editingShapeId; }, [editingShapeId]);
    useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);

    // Mark static layer dirty when shapes change (skip if mid-drag)
    useEffect(() => {
        if (!isDragging) isDirtyRef.current = true;
    }, [shapes, isDragging]);

    // Always dirty on drag start/end (need to repaint static ± selected shapes)
    useEffect(() => { isDirtyRef.current = true; }, [isDragging]);

    // Always dirty on viewport change (coordinate system changed)
    useEffect(() => { isDirtyRef.current = true; }, [viewport]);

    // Initialize CanvasEngine and wire it up
    useEffect(() => {
        if (!canvasRef.current) return;

        const engine = new CanvasEngine(canvasRef.current);
        engineRef.current = engine;

        // Force dirty on resize
        engine.onResize = () => {
            isDirtyRef.current = true;
        };

        // Helper: is an arrow bound to any currently-selected shape?
        const isBoundToSelected = (s) => {
            if (s.type !== 'arrow' || !s.bindings) return false;
            const startId = s.bindings.start?.elementId;
            const endId = s.bindings.end?.elementId;
            const sel = selectedIdsRef.current;
            return (startId && sel.has(startId)) || (endId && sel.has(endId));
        };

        // Override the engine's internal _render with the full two-pass strategy
        engine._render = () => {
            const renderer = engine.renderer;
            const staticRenderer = engine.staticRenderer;
            const offscreen = engine.offscreen;

            if (!renderer || !offscreen) return;

            const ctx = canvasRef.current.getContext('2d');
            const width = canvasRef.current.width;
            const height = canvasRef.current.height;

            // Pass 1 — Update static (offscreen) layer if dirty
            if (isDirtyRef.current) {
                const offCtx = offscreen.getContext('2d');
                offCtx.save();
                offCtx.setTransform(1, 0, 0, 1, 0, 0);
                offCtx.clearRect(0, 0, width, height);
                offCtx.restore();

                let staticShapes = shapesRef.current;
                const selectedIds = selectedIdsRef.current;

                if (isDraggingRef.current && selectedIds.size > 0) {
                    staticShapes = staticShapes.filter(s => !selectedIds.has(s.id) && !isBoundToSelected(s));
                }
                if (editingShapeIdRef.current) {
                    staticShapes = staticShapes.filter(s => s.id !== editingShapeIdRef.current);
                }

                staticRenderer.render(staticShapes, { selectedIds: new Set(), hoveredId: null }, viewportRef.current);
                isDirtyRef.current = false;
            }

            // Pass 2 — Compose main canvas
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(offscreen, 0, 0);  // A. Static background
            ctx.restore();

            // B. Dynamic layer (selected shapes while dragging)
            if (isDraggingRef.current && selectedIdsRef.current.size > 0) {
                const selectedIds = selectedIdsRef.current;
                const dynamicShapes = shapesRef.current.filter(s => {
                    if (selectedIds.has(s.id)) return true;
                    if (s.type === 'arrow' && s.bindings) {
                        const startId = s.bindings.start?.elementId;
                        const endId = s.bindings.end?.elementId;
                        return (startId && selectedIds.has(startId)) || (endId && selectedIds.has(endId));
                    }
                    return false;
                });
                renderer.render(dynamicShapes, {
                    hoveredId: null,
                    selectedIds,
                    selectionBox: null,
                    editingShapeId: editingShapeIdRef.current
                }, viewportRef.current, { clear: false });
            }

            // C. Overlay (hover / selection / rubber-band) — shapes already in static
            if (!isDraggingRef.current) {
                renderer.render(shapesRef.current, {
                    hoveredId: hoveredIdRef.current,
                    selectedIds: selectedIdsRef.current,
                    selectionBox: selectionBoxRef.current,
                    editingShapeId: editingShapeIdRef.current
                }, viewportRef.current, { clear: false, drawShapes: false });
            }
        };

        // Start resize observation and render loop
        const parent = canvasRef.current.parentElement;
        if (parent) engine.observeResize(parent);

        return () => engine.destroy();
    }, []);

    const start = useCallback(() => {
        isDirtyRef.current = true; // Force repaint on start
        engineRef.current?.start();
    }, []);

    const stop = useCallback(() => {
        engineRef.current?.stop();
    }, []);

    return {
        rendererRef: { current: engineRef.current?.renderer ?? null },
        engineRef,
        start,
        stop
    };
}
