import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, PencilBrush } from "fabric";
import { DRAWING_COLORS } from "@/types/canvas";

// Import modular hooks
import { useCanvasHistory } from "./canvas/useCanvasHistory";
import { useCanvasZoom } from "./canvas/useCanvasZoom";
import { useCanvasDrawing } from "./canvas/useCanvasDrawing";
import { useCanvasGrid } from "./canvas/useCanvasGrid";
import { useCanvasActions } from "./canvas/useCanvasActions";
import { useCanvasSelection } from "./canvas/useCanvasSelection";
import { useCanvasLayers } from "./canvas/useCanvasLayers";
import { useCanvasDrag } from "./canvas/useCanvasDrag";
import { useCanvasText } from "./canvas/useCanvasText";
import { useCanvasEraser } from "./canvas/useCanvasEraser";
import { useCustomEngine } from "./useCustomEngine";


export function useCanvas() {
  /* ===================== REFS ===================== */
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  /* ===================== STATE ===================== */
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [activeTool, setActiveTool] = useState("select");
  const [activeColor, setActiveColor] = useState(DRAWING_COLORS[0].value);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeStyle, setStrokeStyle] = useState("solid");
  const [showgrid, setshowgrid] = useState(false);

  /* ===================== HISTORY HOOK (MOVED UP) ===================== */
  // Initialize history early to avoid ReferenceError (TDZ)
  const {
    saveState = () => { },
    undo = () => { },
    redo = () => { },
    canUndo = false,
    canRedo = false,
    resetHistory = () => { },
    history = []
  } = useCanvasHistory(fabricCanvas) || {};

  /* ===================== INIT CANVAS ===================== */
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // ===========================================
    // ⚠️ LEGACY CODE - MIGRATION IN PROGRESS ⚠️
    // DO NOT MODIFY THIS CONFIGURATION
    // See MIGRATION.md for details
    // ===========================================
    const canvas = new FabricCanvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: "transparent",
      selection: true,
      preserveObjectStacking: true, // Better for editing
    });

    setFabricCanvas(canvas);

    const resize = () => {
      canvas.setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
      canvas.requestRenderAll();
    };

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      canvas.dispose();
    };
  }, []);

  /* ===================== UPDATING CURSOR & BRUSH ===================== */
  useEffect(() => {
    if (!fabricCanvas) return;

    // Fallback enforcement
    if (!activeTool) setActiveTool("select");

    // Update Brush if exists
    if (!fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
    }
    fabricCanvas.freeDrawingBrush.color = activeColor;
    fabricCanvas.freeDrawingBrush.width = strokeWidth;

    // Update Selection Mode or Drawing Mode
    const isDrawing = activeTool === "draw";
    fabricCanvas.isDrawingMode = isDrawing;
    fabricCanvas.selection = activeTool === "select";

    // Auto-deselect when switching tools (EXCALIDRAW UX)
    if (activeTool !== "select") {
      fabricCanvas.discardActiveObject();
      fabricCanvas.requestRenderAll();
    }

    // Allow drawing on top of other objects (ignore object events when drawing)
    fabricCanvas.skipTargetFind = activeTool !== "select";

    // Update Cursor
    const cursors = {
      select: "default",
      hand: "grab",
      draw: "crosshair",
      rectangle: "crosshair",
      ellipse: "crosshair",
      diamond: "crosshair",
      line: "crosshair",
      arrow: "crosshair",
      text: "text",
      eraser: "crosshair",
    };
    fabricCanvas.defaultCursor = cursors[activeTool] || "default";
    fabricCanvas.requestRenderAll();

  }, [fabricCanvas, activeTool, activeColor, strokeWidth]);

  // Save state on object modification (move, resize, rotate)
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleModification = () => {
      saveState();
    };

    fabricCanvas.on("object:modified", handleModification);
    return () => {
      fabricCanvas.off("object:modified", handleModification);
    };
  }, [fabricCanvas, saveState]);


  /* ===================== HOOKS COMPOSITION ===================== */

  // 2. Zoom & Pan
  const {
    zoom,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset
  } = useCanvasZoom(fabricCanvas, activeTool, setActiveTool);

  // 3. Drawing Logic (Shapes)
  useCanvasDrawing(fabricCanvas, activeTool, setActiveTool, activeColor, strokeWidth, saveState);

  // 4. Grid System
  useCanvasGrid(fabricCanvas, showgrid);

  // 5. Actions (Export, Clear, Image)
  const {
    handleExport,
    handleClear,
    handleAddImage,
    handleSaveAs,
    handleLoad
  } = useCanvasActions(fabricCanvas, saveState, resetHistory);

  // 6. Layers
  const layerActions = useCanvasLayers(fabricCanvas, saveState);

  // 7. Grouping (Removed per Flat Canvas Architecture)

  // 8. Text
  const { addText } = useCanvasText(fabricCanvas, activeTool, setActiveTool, activeColor, saveState);

  // 9. Selection (Priority handling)
  const { selectedElement } = useCanvasSelection(fabricCanvas);

  // 10. Manual Drag (Rotated Shape Fix)
  useCanvasDrag(fabricCanvas, activeTool);

  // 11. Eraser
  useCanvasEraser(fabricCanvas, activeTool, saveState);

  const updateSelectedElement = (updates) => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) return;

    if (activeObject.type === 'activeSelection') {
      activeObject.getObjects().forEach(obj => {
        obj.set(updates);
      });
    } else {
      // Check for fill related updates
      const currentFillColor = updates.fillColor !== undefined ? updates.fillColor : activeObject.fillColor;
      const currentFillStyle = updates.fillStyle !== undefined ? updates.fillStyle : activeObject.fillStyle;

      if (updates.fillColor || updates.fillStyle) {
        if (currentFillColor && currentFillStyle) {
          import("@/utils/canvas/patterns").then(({ getPattern }) => {
            const pattern = getPattern(currentFillColor, currentFillStyle);
            activeObject.set("fill", pattern);
            activeObject.set("fillColor", currentFillColor);
            activeObject.set("fillStyle", currentFillStyle);
            fabricCanvas.requestRenderAll();
            saveState();
          });
        }
      }

      // Handle Fill Styles
      if (updates.fillColor !== undefined) {
        activeObject.set("fillColor", updates.fillColor);
        // Ensure standard fill is updated for non-artist modes
        if (activeObject.sloppiness !== 'artist') {
          // For non-artist, we set standard fill
          activeObject.set("fill", updates.fillColor === 'transparent' ? '' : updates.fillColor);
        }
      }

      if (updates.fillStyle !== undefined) {
        activeObject.set("fillStyle", updates.fillStyle);
      }

      // Fabric JS often prefers key-value pairs, but .set(obj) should work.
      activeObject.set(updates);

      // If updating fill, ensure we dirty the object explicitly
      if (updates.fill) {
        if (['i-text', 'text', 'textbox'].includes(activeObject.type) && activeObject.styles) {
          activeObject.cleanStyle('fill');
        }
        activeObject.dirty = true;
      }

      if (updates.fill || updates.stroke) {
        activeObject.setCoords();
      }
    }

    fabricCanvas.requestRenderAll();
    fabricCanvas.fire("selection:updated", { target: activeObject });
    saveState();
  };


  /* ===================== MIGRATION: DUAL RENDER MODE ===================== */
  const [renderMode, setRenderMode] = useState("fabric"); // 'fabric' | 'custom'
  const {
    customCanvasRef,
    start: startCustom,
    stop: stopCustom,
    syncFromFabric,
    syncToFabric,
    undo: customUndo,
    redo: customRedo,
    canUndo: canCustomUndo,
    canRedo: canCustomRedo
  } = useCustomEngine(fabricCanvas, {
    activeTool,
    setActiveTool, // Pass it down
    activeColor,
    strokeWidth,
    strokeStyle,
  });

  // Toggle Mode
  const toggleRenderMode = () => {
    if (renderMode === 'fabric') {
      // Switch to Custom
      syncFromFabric();
      startCustom();
      setRenderMode('custom');
    } else {
      // Switch to Fabric
      stopCustom();
      syncToFabric();
      setRenderMode('fabric');
    }
  };

  /* ===================== EXPORT API ===================== */

  // History Wrapper
  const handleUndoWrapper = () => {
    if (renderMode === 'custom') {
      customUndo();
    } else {
      undo();
    }
  };

  const handleRedoWrapper = () => {
    if (renderMode === 'custom') {
      customRedo();
    } else {
      redo();
    }
  };

  return {
    canvasRef,
    containerRef,

    // Migration: Custom Engine
    customCanvasRef,
    renderMode,
    toggleRenderMode,

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
    fabricCanvas, // Expose Fabric Instance

    // Zoom
    zoom,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,

    // History
    history, // Use destructured history
    canUndo: renderMode === 'custom' ? canCustomUndo : canUndo,
    canRedo: renderMode === 'custom' ? canCustomRedo : canRedo,
    handleUndo: handleUndoWrapper,
    handleRedo: handleRedoWrapper,

    // Actions
    handleClear,
    handleExport: () => {
      if (renderMode === 'custom') {
        syncToFabric(); // Sync first so export works
        // Small delay might be needed if sync is async (it's not currently)
      }
      handleExport();
    },
    handleAddImage,
    handleSaveAs,
    handleLoad,
    addText, // Exposed for toolbar/sidebar if needed

    // Advanced Manipulation
    layerActions,

    // Selection
    selectedElement,
    updateSelectedElement
  };
}
