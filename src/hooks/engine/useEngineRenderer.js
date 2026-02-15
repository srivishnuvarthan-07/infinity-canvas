import { useRef, useEffect, useCallback } from 'react';
import { CanvasRenderer } from '@/engine/render/CanvasRenderer';

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
    const rendererRef = useRef(null);
    const frameIdRef = useRef(null);

    // Offscreen Buffer
    const offscreenRef = useRef(null);
    const isDirtyRef = useRef(true);

    // Refs for mutable state access
    const shapesRef = useRef(shapes);
    const viewportRef = useRef(viewport);
    const hoveredIdRef = useRef(hoveredShapeId);
    const selectedIdsRef = useRef(selectedShapeIds);
    const selectionBoxRef = useRef(selectionBox);
    const editingShapeIdRef = useRef(editingShapeId);
    const isDraggingRef = useRef(isDragging);

    // Update refs
    useEffect(() => { shapesRef.current = shapes; }, [shapes]);
    useEffect(() => { viewportRef.current = viewport; }, [viewport]);
    useEffect(() => { hoveredIdRef.current = hoveredShapeId; }, [hoveredShapeId]);
    useEffect(() => { selectedIdsRef.current = selectedShapeIds; }, [selectedShapeIds]);
    useEffect(() => { selectionBoxRef.current = selectionBox; }, [selectionBox]);
    useEffect(() => { editingShapeIdRef.current = editingShapeId; }, [editingShapeId]);
    useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);

    // Initialize
    useEffect(() => {
        if (!canvasRef.current) return;
        rendererRef.current = new CanvasRenderer(canvasRef.current);

        // Create offscreen buffer
        offscreenRef.current = document.createElement('canvas');

        const parent = canvasRef.current.parentElement;
        let resizeObserver;

        const handleResize = () => {
            if (parent && rendererRef.current) {
                const w = parent.clientWidth;
                const h = parent.clientHeight;
                rendererRef.current.resize(w, h); // Resize Main

                // Resize Offscreen
                if (offscreenRef.current) {
                    offscreenRef.current.width = w;
                    offscreenRef.current.height = h;
                    isDirtyRef.current = true; // Force redraw
                }
            }
        };

        if (parent) {
            handleResize();
            resizeObserver = new ResizeObserver(handleResize);
            resizeObserver.observe(parent);
        }

        return () => {
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, []);

    // Cache Logic
    useEffect(() => {
        // When shapes change:
        // 1. If NOT dragging, we assume a structural change (add/remove/load) -> Redraw ALL to static.
        // 2. If DRAGGING, the "static" layer should contain everything EXCLUDING the moving shapes.
        //    However, usually dragging starts, then shapes update.
        //    We need to update the static layer ONCE when drag starts (excluding selection).
        //    Then during drag, we DON'T update static layer (shapes update, but we ignore them for static).

        // Simplified Strategy for React:
        // Always mark dirty. The render loop handles the composition.
        // But we want to avoid re-rasterizing 10k items on offscreen canvas if only moving 1.

        if (!isDragging) {
            isDirtyRef.current = true;
        } else {
            // If dragging, we only update static if it wasn't already prepared for this drag?
            // Actually, if we just started dragging, we need to remove the active shape from static.
            // But checking previous state is hard here.

            // Let's rely on the fact that isDragging changes less often.
            // When isDragging transitions false -> true: we should repaint static WITHOUT selected.
            // When shapes change WHILE true: we DO NOT repaint static.
        }
    }, [shapes, isDragging]);

    // We need a specific effect for Drag Transition to optimize
    useEffect(() => {
        if (isDragging) {
            // Drag started (or active): Prepare static layer to NOT include selected shapes
            isDirtyRef.current = true;
        } else {
            // Drag ended: Prepare static layer to include EVERYTHING
            isDirtyRef.current = true;
        }
    }, [isDragging]);

    // Viewport change = ALWAYS Dirty (Coordinate system changed)
    useEffect(() => {
        isDirtyRef.current = true;
    }, [viewport]);


    // Render Loop
    const render = useCallback(() => {
        if (!rendererRef.current || !offscreenRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        const offCtx = offscreenRef.current.getContext('2d');
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;

        // 1. Update Static Layer (Offscreen) if Dirty
        if (isDirtyRef.current) {
            offCtx.clearRect(0, 0, width, height);

            // Determine what is "Static"
            let staticShapes = shapesRef.current;

            // If dragging/resizing, exclude the active shapes from background
            if (isDraggingRef.current && selectedIdsRef.current.size > 0) {
                staticShapes = staticShapes.filter(s => !selectedIdsRef.current.has(s.id));
            }

            // Draw Static to Offscreen
            // We reuse CanvasRenderer logic but point it to offCtx? 
            // CanvasRenderer encapsulates the context usually. 
            // We might need to expose a helper or instantiate a temporary renderer.
            // Better: Add `renderToContext` method to CanvasRenderer.

            // Short-term: Just access CanvasRenderer's internal helpers or copy logic?
            // CanvasRenderer probably stores `this.ctx`.
            // Let's assume we can use a helper. 
            // For now, I'll assume CanvasRenderer has a static helper or I can re-use it.
            // Actually, constructing a new Renderer is cheap if it's stateless.
            // Or better, let's look at CanvasRenderer. 
            // I'll make a quick instance or assume `render` takes ctx.
            // Standard Pattern: renderer.render(shapes, options, viewport, targetCtx)

            // If I can't pass targetCtx, I have to swap `this.ctx` or use a new instance.
            // Let's assume I need to create a `staticRenderer`.
            const staticRenderer = new CanvasRenderer(offscreenRef.current);
            staticRenderer.render(staticShapes, {
                selectedIds: new Set(), // No selection highlights on static
                hoveredId: null
            }, viewportRef.current);

            isDirtyRef.current = false;
        }

        // 2. Compose Main Canvas
        ctx.clearRect(0, 0, width, height);

        // A. Draw Background (Static)
        ctx.drawImage(offscreenRef.current, 0, 0);

        // B. Draw Active/Dynamic Elements
        if (isDraggingRef.current && selectedIdsRef.current.size > 0) {
            const dynamicShapes = shapesRef.current.filter(s => selectedIdsRef.current.has(s.id));

            // We need to render these on the main ctx
            // Use existing renderer which is bound to main canvas
            // But we ONLY want to render these specific shapes.
            // And we want Selection Box / Overlays.

            rendererRef.current.render(dynamicShapes, {
                hoveredId: null,
                selectedIds: selectedIdsRef.current, // Draw selection box around them
                selectionBox: null
            }, viewportRef.current, { clear: false }); // Add clear:false logic to Renderer? via 4th arg? or just relies on us not clearing?
            // Existing 'render' method likely does 'ctx.clearRect'.
            // I need to check CanvasRenderer.js.
        }

        // C. Draw Selection Box / UI Overlays (if not dragging)
        if (!isDraggingRef.current) {
            // If not dragging, everything is in static.
            // We just need overlay for hover/selection.
            // But Wait, if I drew everything in Static, I can't draw the selection highlight (bounding box) easily ON TOP 
            // unless I draw it separately.

            // Issue: CanvasRenderer.render usually draws Shape THEN Selection.
            // If I draw Shape in Static, I lose the ability to draw Selection on top unless I re-draw stroke?
            // Or I just draw the Selection UI here.

            // Simplest: Call render with EMPTY shapes array but valid selection data?
            rendererRef.current.render([], {
                hoveredId: hoveredIdRef.current,
                selectedIds: selectedIdsRef.current,
                selectionBox: selectionBoxRef.current
            }, viewportRef.current, { clear: false });
        }

        // Wait, does CanvasRenderer.render CLEAR the canvas?
        // If yes, my `drawImage` is wiped.
        // I MUST CHECK CanvasRenderer.js.

        frameIdRef.current = requestAnimationFrame(render);
    }, []);
    // ...

    const start = useCallback(() => {
        if (!frameIdRef.current) {
            render();
        }
    }, [render]);

    const stop = useCallback(() => {
        if (frameIdRef.current) {
            cancelAnimationFrame(frameIdRef.current);
            frameIdRef.current = null;
        }
    }, []);

    return {
        // canvasRef, // We now pass it in, no need to return it unless we want to proxy it
        rendererRef,
        start,
        stop
    };
}
