import { useEffect, useRef, useState, useMemo } from "react";
import { DRAWING_COLORS } from "@/types/canvas";
import { useCustomEngine } from "./useCustomEngine";
import { exportToPng } from "@/engine/utils/export";
import { saveToFile, loadFromFile } from "@/engine/utils/file";

/**
 * useCanvas Hook - Custom Engine Version
 * 
 * Simplified hook that serves as the bridge between the UI components 
 * and the Custom Rendering Engine.
 */
export function useCanvas() {
  /* ===================== REFS ===================== */
  const containerRef = useRef(null);

  /* ===================== STATE ===================== */
  const [activeTool, setActiveTool] = useState("select");
  const [activeColor, setActiveColor] = useState(DRAWING_COLORS[0].value);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeStyle, setStrokeStyle] = useState("solid");
  const [showgrid, setshowgrid] = useState(false);

  /* ===================== CUSTOM ENGINE ===================== */
  const {
    canvasRef,
    start,
    stop,
    undo,
    redo,
    canUndo,
    canRedo,
    updateShapes,
    editingShapeId,
    setEditingShapeId,

    shapes: customShapes,
    setShapes,
    clearCanvas,
    viewport: customViewport,
    selectedShapeIds,
    groupShapes,
    ungroupShapes,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    setCanvasState, // Destructure setCanvasState

    // Zoom
    zoomIn,
    zoomOut,
    resetZoom,
    handlers

  } = useCustomEngine({
    activeTool,
    setActiveTool,
    activeColor,
    strokeWidth,
    strokeStyle,
  });

  // Auto-Start Engine
  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);


  /* ===================== ADAPTERS FOR UI ===================== */

  // Selection Adapter
  const selectedElement = useMemo(() => {
    if (!customShapes || !selectedShapeIds || selectedShapeIds.size === 0) return null;

    if (selectedShapeIds.size === 1) {
      const id = [...selectedShapeIds][0];
      return customShapes.find(s => s.id === id) || null;
    } else {
      // Proxy for Multi-Selection
      const objects = customShapes.filter(s => selectedShapeIds.has(s.id));
      if (objects.length === 0) return null;

      return {
        id: 'selection-group',
        type: 'activeSelection',
        stroke: objects[0].strokeColor,
        strokeWidth: objects[0].strokeWidth,
        opacity: objects[0].opacity,
        sloppiness: objects[0].sloppiness,
        objects: objects
      };
    }
  }, [customShapes, selectedShapeIds]);

  const updateSelectedElement = (updates) => {
    if (selectedShapeIds && selectedShapeIds.size > 0) {
      updateShapes(selectedShapeIds, updates);
    }
  };

  // Action Adapters
  const handleClear = () => {
    if (confirm("Are you sure you want to clear the canvas?")) {
      clearCanvas();
    }
  };

  // Stubs for features not yet implemented or migrated
  const handleExport = () => {
    exportToPng(customShapes, 'infinity-canvas.png');
  };
  const handleSaveAs = () => {
    saveToFile(customShapes, 'infinity-canvas.json');
  };

  const handleAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target.result;
        const img = new Image();
        img.onload = () => {
          // Add to canvas
          const id = crypto.randomUUID();
          // Default to center of viewport
          const x = -customViewport.x / customViewport.zoom + (window.innerWidth / 2) / customViewport.zoom;
          const y = -customViewport.y / customViewport.zoom + (window.innerHeight / 2) / customViewport.zoom;

          // Clamp max size
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          const MAX_SIZE = 500;
          if (w > MAX_SIZE || h > MAX_SIZE) {
            const ratio = w / h;
            if (w > h) { w = MAX_SIZE; h = MAX_SIZE / ratio; }
            else { h = MAX_SIZE; w = MAX_SIZE * ratio; }
          }

          const newShape = {
            id,
            type: 'image',
            x,
            y,
            width: w,
            height: h,
            rotation: 0,
            opacity: 1,
            src: src,
            strokeColor: 'transparent',
            // Add other defaults to avoid crashes in generic utils
            strokeWidth: 0,
            strokeStyle: 'solid',
            sloppiness: 'architect'
          };

          setShapes(prev => [...prev, newShape]);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const shapes = await loadFromFile(file);
        setCanvasState(shapes);
      } catch (err) {
        alert('Failed to load file: ' + err.message);
      }
    };
    input.click();
  };

  // Group Actions Adapter
  const groupActions = useMemo(() => {
    const isGroup = selectedShapeIds && selectedShapeIds.size === 1 && customShapes.find(s => s.id === [...selectedShapeIds][0])?.type === 'group';
    return {
      group: groupShapes,
      ungroup: ungroupShapes,
      canGroup: selectedShapeIds && selectedShapeIds.size > 1,
      canUngroup: isGroup
    };
  }, [groupShapes, ungroupShapes, selectedShapeIds, customShapes]);

  // Layer Actions Adapter
  const layerActions = useMemo(() => ({
    bringForward: bringForward,
    sendBackwards: sendBackward, // Note name match: UI calls it sendBackwards, hook has sendBackward
    bringToFront: bringToFront,
    sendToBack: sendToBack,
  }), [bringForward, sendBackward, bringToFront, sendToBack]);

  return {
    // Refs
    containerRef,
    customCanvasRef: canvasRef, // Expose as customCanvasRef for compatibility

    // State
    activeTool,
    setActiveTool,
    activeColor,
    setActiveColor,
    strokeWidth,
    setStrokeWidth,
    strokeStyle,
    setStrokeStyle,
    showgrid,
    setshowgrid,

    // Viewport
    zoom: customViewport.zoom,
    handleZoomIn: zoomIn,
    handleZoomOut: zoomOut,
    handleZoomReset: resetZoom,
    viewport: customViewport,

    // History
    canUndo,
    canRedo,
    handleUndo: undo,
    handleRedo: redo,

    // Actions
    handleClear,
    handleExport,
    handleAddImage,
    handleSaveAs,
    handleLoad,

    // Selection
    selectedElement,
    updateSelectedElement,

    // Helpers
    layerActions,
    groupActions,

    // Engine Specifics
    customShapes,
    updateCustomShape: updateShapes,
    editingShapeId,
    setEditingShapeId,
    canvasHandlers: handlers
  };
}
