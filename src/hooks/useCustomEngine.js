import { useRef, useEffect, useState } from 'react';

// Modular Hooks
import { useEngineState } from './engine/useEngineState';
import { useEngineViewport } from './engine/useEngineViewport';
import { useEngineRenderer } from './engine/useEngineRenderer';
import { useEngineInteraction } from './engine/useEngineInteraction';

export function useCustomEngine({
    initialShapes = [],
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
    } = useEngineState(initialShapes);

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

    const {
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handleKeyDown,
        handleKeyUp,
        handleDoubleClick,
        handleWheel,
        isDragging // Get this
    } = useEngineInteraction({
        canvasRef,
        shapes,
        setShapes,
        selectedShapeIds,
        setSelectedShapeIds,
        setHoveredShapeId,
        editingShapeId,
        setEditingShapeId,
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

    // 3. Renderer (Canvas Lifecycle)
    const {
        rendererRef,
        start,
        stop
    } = useEngineRenderer({
        canvasRef,
        shapes,
        viewport,
        hoveredShapeId,
        selectedShapeIds,
        selectionBox,
        editingShapeId,
        isDragging // Pass to renderer
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
        if (canvas) {
            canvas.addEventListener('wheel', handleWheel, { passive: false });
        }
        return () => {
            if (canvas) canvas.removeEventListener('wheel', handleWheel);
        };
    }, [handleWheel]);

    // Return Public API
    return {
        canvasRef,
        start,
        stop,
        undo,
        redo,
        canUndo,
        canUndo,
        canRedo,
        saveState, // Add this export

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
