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
    const staticRendererRef = useRef(null);
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
                let w = parent.clientWidth;
                let h = parent.clientHeight;

                // Fallback if parent has 0 size (e.g. collapsed or disconnected)
                if (w === 0 || h === 0) {
                    console.warn("Canvas Resize: Parent has 0 dimensions, using window fallback", { w, h });
                    w = Math.max(w, window.innerWidth);
                    h = Math.max(h, window.innerHeight);
                }

                console.log("Canvas Resize:", w, h);
                rendererRef.current.resize(w, h); // Resize Main

                // Resize Offscreen
                if (offscreenRef.current) {
                    const dpr = window.devicePixelRatio || 1;
                    offscreenRef.current.width = w * dpr;
                    offscreenRef.current.height = h * dpr;
                    offscreenRef.current.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);

                    if (!staticRendererRef.current) {
                        staticRendererRef.current = new CanvasRenderer(offscreenRef.current);
                    }
                    staticRendererRef.current.width = w;
                    staticRendererRef.current.height = h;

                    isDirtyRef.current = true; // Force redraw
                }
            } else {
                console.warn("Canvas Resize: Parent or Renderer missing", { parent, renderer: !!rendererRef.current });
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
            const dpr = window.devicePixelRatio || 1;
            offCtx.save();
            offCtx.setTransform(1, 0, 0, 1, 0, 0);
            offCtx.clearRect(0, 0, width, height);
            offCtx.restore();

            // Determine what is "Static"
            let staticShapes = shapesRef.current;
            const selectedIds = selectedIdsRef.current;

            // Helper: check if an arrow is bound to any selected shape
            const isBoundToSelected = (s) => {
                if (s.type !== "arrow" || !s.bindings) return false;
                const startId = s.bindings.start?.elementId;
                const endId = s.bindings.end?.elementId;
                return (startId && selectedIds.has(startId)) || (endId && selectedIds.has(endId));
            };

            // If dragging/resizing, exclude the active shapes AND their connected arrows from background
            if (isDraggingRef.current && selectedIds.size > 0) {
                staticShapes = staticShapes.filter(s => !selectedIds.has(s.id) && !isBoundToSelected(s));
            }
            if (editingShapeIdRef.current) {
                staticShapes = staticShapes.filter(s => s.id !== editingShapeIdRef.current);
            }

            // Draw Static to Offscreen using persistent renderer
            if (staticRendererRef.current) {
                staticRendererRef.current.render(staticShapes, {
                    selectedIds: new Set(), // No selection highlights on static
                    hoveredId: null
                }, viewportRef.current);
            }

            isDirtyRef.current = false;
        }

        // 2. Compose Main Canvas
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, width, height);

        // A. Draw Background (Static)
        ctx.drawImage(offscreenRef.current, 0, 0);
        ctx.restore();

        // B. Draw Active/Dynamic Elements
        if (isDraggingRef.current && selectedIdsRef.current.size > 0) {
            const selectedIds = selectedIdsRef.current;
            // Include selected shapes AND arrows bound to them in the dynamic layer
            const dynamicShapes = shapesRef.current.filter(s => {
                if (selectedIds.has(s.id)) return true;
                if (s.type === "arrow" && s.bindings) {
                    const startId = s.bindings.start?.elementId;
                    const endId = s.bindings.end?.elementId;
                    return (startId && selectedIds.has(startId)) || (endId && selectedIds.has(endId));
                }
                return false;
            });

            rendererRef.current.render(dynamicShapes, {
                hoveredId: null,
                selectedIds: selectedIdsRef.current, // Draw selection box around them
                selectionBox: null,
                editingShapeId: editingShapeIdRef.current
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

            rendererRef.current.render(shapesRef.current, {
                hoveredId: hoveredIdRef.current,
                selectedIds: selectedIdsRef.current,
                selectionBox: selectionBoxRef.current,
                editingShapeId: editingShapeIdRef.current
            }, viewportRef.current, { clear: false, drawShapes: false });
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
