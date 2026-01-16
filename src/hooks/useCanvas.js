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
// import { useCanvasGrouping } from "./canvas/useCanvasGrouping";
import { useCanvasDrag } from "./canvas/useCanvasDrag";
import { useCanvasText } from "./canvas/useCanvasText";
import { useCanvasEraser } from "./canvas/useCanvasEraser";

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

  /* ===================== INIT CANVAS ===================== */
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

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



  /* ===================== HOOKS COMPOSITION ===================== */

  // 1. History (Undo/Redo)
  const {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    history
  } = useCanvasHistory(fabricCanvas);

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
    handleAddImage
  } = useCanvasActions(fabricCanvas, saveState, resetHistory);

  // 6. Layers
  const layerActions = useCanvasLayers(fabricCanvas, saveState);

  // 7. Grouping (Removed per Flat Canvas Architecture)
  // const groupActions = useCanvasGrouping(fabricCanvas, activeTool, saveState);

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
      // Fabric JS often prefers key-value pairs, but .set(obj) should work.
      // For text, sometimes specific properties need handling.
      activeObject.set(updates);

      // If updating fill, ensure we dirty the object explicitly
      if (updates.fill) {
        if (activeObject.type === 'i-text' || activeObject.type === 'text' || activeObject.type === 'textbox') {
          // If text has styles (character-level colors), they override object fill.
          // We must clear them to ensure the new color applies to everything.
          if (activeObject.styles && Object.keys(activeObject.styles).length > 0) {
            activeObject.cleanStyle('fill'); // Custom helper or manual iteration
            // Manual iteration if cleanStyle not available:
            for (let line in activeObject.styles) {
              for (let char in activeObject.styles[line]) {
                delete activeObject.styles[line][char].fill;
              }
            }
          }
        }
        activeObject.dirty = true;
      }

      // If updating fill, ensure we dirty the object explicitly
      if (updates.fill || updates.stroke) {
        activeObject.setCoords();
      }
    }

    fabricCanvas.requestRenderAll();
    fabricCanvas.fire("selection:updated", { target: activeObject });
    saveState();
  };


  /* ===================== EXPORT API ===================== */
  return {
    canvasRef,
    containerRef,

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

    // Zoom
    zoom,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,

    // History
    history: useCanvasHistory(fabricCanvas).history, // Wait, I need to destructure it properly from the hook call above
    canUndo,
    canRedo,
    handleUndo: undo,
    handleRedo: redo,

    // Actions
    handleClear,
    handleExport,
    handleAddImage,
    addText, // Exposed for toolbar/sidebar if needed

    // Advanced Manipulation
    layerActions,
    // groupActions, (Removed)

    // Selection

    // Selection
    selectedElement,
    updateSelectedElement
  };
}
