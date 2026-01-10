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

  // 1. History (Undo/Redo)
  const {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory
  } = useCanvasHistory(fabricCanvas);

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

  // 6. Selection
  const { selectedElement } = useCanvasSelection(fabricCanvas);

  const updateSelectedElement = (updates) => {
    if (!fabricCanvas) return;
    const activeObject = fabricCanvas.getActiveObject();
    if (!activeObject) return;

    activeObject.set(updates);
    if (updates.stroke && activeObject.type === 'arrow') {
      // Force update for custom arrow caching issues if any
    }

    fabricCanvas.requestRenderAll();
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
    canUndo,
    canRedo,
    handleUndo: undo,
    handleRedo: redo,

    // Actions
    handleClear,
    handleExport,
    handleAddImage,

    // Selection
    selectedElement,
    updateSelectedElement
  };
}
