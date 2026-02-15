import { useRef, useEffect, useCallback } from 'react';
import { CanvasRenderer } from '@/engine/render/CanvasRenderer';

export function useEngineRenderer({
    canvasRef, // <--- ACCEPT FROM PROP
    shapes,
    viewport,
    hoveredShapeId,
    selectedShapeIds,
    selectionBox,
    editingShapeId
}) {
    // const canvasRef = useRef(null); // REMOVE
    const rendererRef = useRef(null);
    const frameIdRef = useRef(null);

    // Refs for mutable state access in render loop without re-binding
    const shapesRef = useRef(shapes);
    const viewportRef = useRef(viewport);
    const hoveredIdRef = useRef(hoveredShapeId);
    const selectedIdsRef = useRef(selectedShapeIds);
    const selectionBoxRef = useRef(selectionBox);
    const editingShapeIdRef = useRef(editingShapeId);

    // Update refs when props change
    useEffect(() => { shapesRef.current = shapes; }, [shapes]);
    useEffect(() => { viewportRef.current = viewport; }, [viewport]);
    useEffect(() => { hoveredIdRef.current = hoveredShapeId; }, [hoveredShapeId]);
    useEffect(() => { selectedIdsRef.current = selectedShapeIds; }, [selectedShapeIds]);
    useEffect(() => { selectionBoxRef.current = selectionBox; }, [selectionBox]);
    useEffect(() => { editingShapeIdRef.current = editingShapeId; }, [editingShapeId]);

    // Initialize Renderer
    useEffect(() => {
        if (!canvasRef.current) return;
        rendererRef.current = new CanvasRenderer(canvasRef.current);
        console.log('[CustomEngine] Renderer initialized');

        // Initial resize
        const parent = canvasRef.current.parentElement;
        let resizeObserver;

        const handleResize = () => {
            if (parent && rendererRef.current) {
                rendererRef.current.resize(parent.clientWidth, parent.clientHeight);
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

    // Render Loop
    const render = useCallback(() => {
        if (!rendererRef.current) return;

        const shapesToRender = editingShapeIdRef.current
            ? shapesRef.current.filter(s => s.id !== editingShapeIdRef.current)
            : shapesRef.current;

        rendererRef.current.render(shapesToRender, {
            hoveredId: hoveredIdRef.current,
            selectedIds: selectedIdsRef.current,
            selectionBox: selectionBoxRef.current
        }, viewportRef.current);

        frameIdRef.current = requestAnimationFrame(render);
    }, []);

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
