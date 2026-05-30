import { useEffect, useRef, useState, useMemo } from "react";
import { DRAWING_COLORS } from "@/types/canvas";
import { useCustomEngine } from "./useCustomEngine";
import { exportToPng } from "@/engine/utils/export";
import { saveToFile, loadFromFile, loadImageFromFile } from "@/engine/utils/file";

import { SHAPE_TYPES, createImage } from "@/engine/schema";

/**
 * useCanvas Hook - Custom Engine Version
 * 
 * Simplified hook that serves as the bridge between the UI components 
 * and the Custom Rendering Engine.
 */
export function useCanvas({ initialShapes = [], socket, boardId, readonly = false } = {}) {
  /* ===================== REFS ===================== */
  const containerRef = useRef(null);

  /* ===================== STATE ===================== */
  const [activeTool, setActiveTool] = useState("select");
  const prevStrokeWidthRef = useRef(2);
  
  // Handle tool changes
  const handleToolChange = (tool) => {
    if (tool === 'image') {
      handleAddImage();
      return;
    }
    // Pencil/draw tool: use ink brush width (8px)
    if ((tool === 'pencil' || tool === 'draw') && activeTool !== 'pencil' && activeTool !== 'draw') {
      prevStrokeWidthRef.current = strokeWidth;
      setStrokeWidth(8);
    } else if (tool !== 'pencil' && tool !== 'draw' && (activeTool === 'pencil' || activeTool === 'draw')) {
      setStrokeWidth(prevStrokeWidthRef.current);
    }
    setActiveTool(tool);
  };
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
    setSelectedShapeIds,
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
    handlers,
    saveState // Add this

  } = useCustomEngine({
    initialShapes,
    socket,
    activeTool,
    setActiveTool,
    activeColor,
    strokeWidth,
    strokeStyle,
    boardId,
    readonly
  });

  // Auto-Start Engine
  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);


  /* ===================== ADAPTERS FOR UI ===================== */

  const insertShapes = (newShapes) => {
    if (!newShapes || newShapes.length === 0) return;
    setShapes(prev => {
      const next = [...prev, ...newShapes];
      saveState(next);
      return next;
    });
  };

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
        stroke: objects[0].style?.stroke,
        strokeWidth: objects[0].style?.strokeWidth,
        opacity: objects[0].style?.opacity,
        sloppiness: objects[0].style?.sloppiness,
        objects: objects
      };
    }
  }, [customShapes, selectedShapeIds]);

  const updateSelectedElement = (updates) => {
    if (selectedShapeIds && selectedShapeIds.size > 0) {
      updateShapes(selectedShapeIds, updates);

      // Sync global tool state with selection changes ("Pick up style")
      if (updates.style?.stroke || updates.color) {
        setActiveColor(updates.style?.stroke || updates.color);
      }
      if (updates.style?.strokeWidth) {
        setStrokeWidth(updates.style?.strokeWidth);
      }
      if (updates.style?.strokeStyle) {
        setStrokeStyle(updates.style?.strokeStyle);
      }
    }
  };

  // Action Adapters
  const deleteSelected = () => {
    if (!selectedShapeIds || selectedShapeIds.size === 0) return;

    const shapeMap = {};
    customShapes.forEach(s => shapeMap[s.id] = s);

    const newShapes = customShapes.filter(s => !selectedShapeIds.has(s.id));

    setShapes(newShapes);
    saveState(newShapes); // Add to history
    // Clear selection
    setSelectedShapeIds(new Set());
  };

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

  const handleAddImage = async (droppedFile = null, dropX = null, dropY = null) => {
    const processFile = async (file) => {
      const isSvg = file.type === 'image/svg+xml' || file.name.endsWith('.svg');

      try {
        let src, naturalW, naturalH;

        if (isSvg) {
          // Read SVG as text → parse + fix dimensions → Blob URL
          const text = await new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = ev => res(ev.target.result);
            r.onerror = () => rej(new Error('Failed to read SVG'));
            r.readAsText(file);
          });

          // Parse the SVG to read/set explicit width + height
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(text, 'image/svg+xml');
          const svgEl  = svgDoc.querySelector('svg');

          if (!svgEl) throw new Error('Invalid SVG: no <svg> root');

          let w = parseFloat(svgEl.getAttribute('width'))  || 0;
          let h = parseFloat(svgEl.getAttribute('height')) || 0;

          // Fall back to viewBox
          if ((!w || !h) && svgEl.getAttribute('viewBox')) {
            const vb = svgEl.getAttribute('viewBox').split(/[\s,]+/).map(Number);
            if (vb.length === 4) { w = w || vb[2]; h = h || vb[3]; }
          }

          naturalW = w || 200;
          naturalH = h || 200;

          // Force explicit width/height onto the root so img.naturalWidth is non-zero
          svgEl.setAttribute('width',  naturalW);
          svgEl.setAttribute('height', naturalH);

          // Serialize back and create a Blob URL (more reliable than base64 for canvas)
          const serializer = new XMLSerializer();
          const fixedSvg = serializer.serializeToString(svgDoc);
          const blob = new Blob([fixedSvg], { type: 'image/svg+xml;charset=utf-8' });
          src = URL.createObjectURL(blob);
          // Note: blob URL persists for the session — acceptable for canvas shapes

        } else {
          // Raster image — load as data URL and get natural size
          src = await loadImageFromFile(file);
          const dims = await new Promise(res => {
            const img = new Image();
            img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
            img.onerror = () => res({ w: 200, h: 200 });
            img.src = src;
          });
          naturalW = dims.w;
          naturalH = dims.h;
        }

        // Clamp max size
        let w = naturalW;
        let h = naturalH;
        const MAX_SIZE = 500;
        if (w > MAX_SIZE || h > MAX_SIZE) {
          const ratio = w / h;
          if (w > h) { w = MAX_SIZE; h = MAX_SIZE / ratio; }
          else { h = MAX_SIZE; w = MAX_SIZE * ratio; }
        }

        // Place at drop position or viewport center
        const x = dropX !== null ? dropX : (-customViewport.x / customViewport.zoom + (window.innerWidth / 2) / customViewport.zoom);
        const y = dropY !== null ? dropY : (-customViewport.y / customViewport.zoom + (window.innerHeight / 2) / customViewport.zoom);

        const newShape = createImage(crypto.randomUUID(), x, y, src, w, h);
        newShape.style = {
          opacity: 1,
          stroke: 'transparent',
          strokeWidth: 0,
          strokeStyle: 'solid',
        };

        setShapes(prev => {
          const next = [...prev, newShape];
          saveState(next);
          return next;
        });

      } catch (err) {
        console.error('Failed to load image/SVG', err);
      }
    };

    if (droppedFile) {
      await processFile(droppedFile);
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.svg';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        await processFile(file);
      };
      input.click();
    }
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
    setActiveTool: handleToolChange,
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
    deleteSelected,
    handleExport,
    handleAddImage,
    handleSaveAs,
    handleLoad,
    insertShapes,

    // Selection
    selectedElement,
    updateSelectedElement,

    // Helpers
    layerActions,
    groupActions,

    // Engine Specifics
    customShapes,
    setShapes,
    updateCustomShape: updateShapes,
    editingShapeId,
    setEditingShapeId,
    canvasHandlers: handlers
  };
}
