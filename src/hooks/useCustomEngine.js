import { useRef, useEffect, useState } from 'react';

// Modular Hooks
import { useEngineState } from './engine/useEngineState';
import { useEngineViewport } from './engine/useEngineViewport';
import { useEngineRenderer } from './engine/useEngineRenderer';
import { useEngineInteraction } from './engine/useEngineInteraction';

export function useCustomEngine({
    activeTool,
    setActiveTool,
    activeColor,
    strokeWidth,
    strokeStyle,
    sloppiness
} = {}) {
    // 0. Refs & Lifted State
    const canvasRef = useRef(null);
    const [selectionBox, setSelectionBox] = useState(null);

    // 1. State Management (Shapes, History, Selection)
    const {
        shapes,
        setShapes,
        selectedShapeIds,
        setSelectedShapeIds,
        hoveredShapeId,
        setHoveredShapeId,
        editingShapeId,
        setEditingShapeId,
        updateShapes,
        history,
        undo,
        redo,
        saveState,
        canUndo,
        canRedo,
        groupShapes,
        ungroupShapes,
        bringToFront,
        sendToBack,
        bringForward,
        sendBackward
    } = useEngineState();

    // 2. Viewport Management (Zoom, Pan, Coordinates)
    const {
        viewport,
        setViewport,
        toWorld,
        toScreen,
        zoomIn,
        zoomOut,
        resetZoom
    } = useEngineViewport();

    // 3. Renderer (Canvas Lifecycle)
    const {
        rendererRef,
        start,
        stop
    } = useEngineRenderer({
        canvasRef, // Pass explicit ref
        shapes,
        viewport,
        hoveredShapeId,
        selectedShapeIds,
        selectionBox, // Pass down to render overlay
        editingShapeId
    });

    const {
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handleKeyDown,
        handleKeyUp,
        handleDoubleClick
    } = useEngineInteraction({
        canvasRef,
        shapes,
        setShapes,
        selectedShapeIds,
        setSelectedShapeIds,
        setHoveredShapeId,
        editingShapeId, // Pass down
        setEditingShapeId, // Pass down
        viewport,
        setViewport,
        toWorld,
        saveState,

        // Lifted State
        selectionBox,
        setSelectionBox,

        // Config
        activeTool,
        setActiveTool,
        activeColor,
        strokeWidth,
        strokeStyle
    });

    // 5. Global Event Listeners (Keyboard)
    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    // 6. Wheel Event (Passive false for zoom)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Zoom/Pan logic is inside Interaction? 
        // Wait, handleWheel wasn't in useEngineInteraction return, let's check.
        // Ah, checked file: handleWheel was MISSING in useEngineInteraction.js!
        // I need to add it or implement it here.
        // It fits in Interaction or Viewport. Viewport usually handles the logic, but event is on Canvas.

    }, []);

    // I missed handleWheel in useEngineInteraction! 
    // And logic was in previous useCustomEngine. UseEngineViewport has logic but not event handler attached to DOM.
    // Let's re-implement handleWheel here using viewport helpers, or add to Interaction.
    // Interaction is better.
    // For now, I will implement it here to save a file write, using viewport helpers.

    const handleWheel = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.ctrlKey || e.metaKey) {
            // ZOOM
            const rect = canvasRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // 1. Calculate World Point before zoom
            const worldX = (mouseX - viewport.x) / viewport.zoom;
            const worldY = (mouseY - viewport.y) / viewport.zoom;

            // 2. Calculate new Zoom
            let newZoom = viewport.zoom;
            newZoom *= e.deltaY > 0 ? 0.95 : 1.05;
            newZoom = Math.min(Math.max(newZoom, 0.1), 10);

            // 3. New Viewport
            const newViewportX = mouseX - worldX * newZoom;
            const newViewportY = mouseY - worldY * newZoom;

            setViewport({ x: newViewportX, y: newViewportY, zoom: newZoom });
        } else {
            // PAN
            let deltaX = e.deltaX;
            let deltaY = e.deltaY;
            if (e.shiftKey && deltaY !== 0 && Math.abs(deltaX) === 0) {
                deltaX = deltaY;
                deltaY = 0;
            }
            setViewport(prev => ({
                ...prev,
                x: prev.x - deltaX,
                y: prev.y - deltaY
            }));
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('wheel', handleWheel, { passive: false });
        }
        return () => {
            if (canvas) canvas.removeEventListener('wheel', handleWheel);
        };
    }, [viewport, handleWheel]); // dependency on viewport state for closure? Yes or use refs.
    // Since we use setViewport with callback for Pan, it's fine.
    // But for Zoom we read viewport.x/y/zoom.
    // So handleWheel must change or use Refs.
    // Previous code used [viewport] dependency for handleWheel useCallback.

    // Return Public API
    return {
        canvasRef,
        start,
        stop,
        undo,
        redo,
        canUndo,
        canRedo,

        viewport,
        setViewport,
        zoomIn: () => zoomIn(canvasRef), // Pass ref
        zoomOut: () => zoomOut(canvasRef), // Pass ref
        resetZoom,

        // For Sidebar
        selectedElement: selectedShapeIds.size === 1
            ? shapes.find(s => s.id === [...selectedShapeIds][0])
            : (selectedShapeIds.size > 1 ? { type: 'activeSelection', objects: [...selectedShapeIds] } : null),

        updateElement: (updates) => {
            // Support direct object OR id? 
            // Sidebar pattern: updateElement({ fill: 'red' })
            if (typeof updates === 'object' && !updates.id) {
                updateShapes(selectedShapeIds, updates);
            }
        },
        updateShapes,

        // Missing Exports
        shapes,
        setShapes,
        selectedShapeIds,
        setSelectedShapeIds,
        clearCanvas: () => {
            setShapes([]);
            setHistory([[]]);
            // clear others?
        },
        setCanvasState: (newShapes) => {
            setShapes(newShapes);
            setHistory([newShapes]); // Reset history to this state
        },

        groupShapes,
        ungroupShapes,
        bringToFront,
        sendToBack,
        bringForward,
        sendBackward,

        handlers: {
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
            onDoubleClick: handleDoubleClick
        },

        editingShapeId,
        setEditingShapeId
    };
}
