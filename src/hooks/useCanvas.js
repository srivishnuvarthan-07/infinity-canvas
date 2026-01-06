import { useEffect, useRef, useState, useCallback } from "react";
import {
  Canvas as FabricCanvas,
  Rect,
  Ellipse,
  Line,
  IText,
  PencilBrush,
  FabricImage,
  Point,
} from "fabric";
import { DRAWING_COLORS } from "@/types/canvas";
import { toast } from "sonner";


export function useCanvas() {
  const GRID_SIZE = 50; // world units
  const MINOR_GRID = 25;   // small spacing
  const MAJOR_GRID = 100; // big spacing (multiple of minor)


  /* ===================== REFS ===================== */

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const isDrawingShape = useRef(false);
  const shapeStart = useRef({ x: 0, y: 0 });
  const currentShape = useRef(null);

  const isSpacePressed = useRef(false);
  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });

  /* ===================== STATE ===================== */
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const [activeTool, setActiveTool] = useState("select");
  const [activeColor, setActiveColor] = useState(DRAWING_COLORS[0].value);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokeStyle, setStrokeStyle] = useState("solid");
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState({ states: [], currentIndex: -1 });
  const [showgrid, setshowgrid] = useState(false);
  /* ===================== HISTORY ===================== */
  const saveState = useCallback((canvas) => {
    const json = JSON.stringify(canvas.toJSON());
    setHistory((prev) => {
      const states = prev.states.slice(0, prev.currentIndex + 1);
      states.push(json);
      if (states.length > 50) states.shift();
      return { states, currentIndex: states.length - 1 };
    });
  }, []);

  /* ===================== INIT CANVAS ===================== */
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: "transparent",
      selection: true,
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = activeColor;
    canvas.freeDrawingBrush.width = strokeWidth;

    setFabricCanvas(canvas);
    saveState(canvas);

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

  //this is handle shape
  useEffect(() => {
    if (!fabricCanvas)
      return;
    const handleMouseDown = (opt) => {
      if (!['rectangle', 'ellipse', 'line', 'arrow', 'diamond'].includes(activeTool))
        return;
      const pointer = fabricCanvas.getScenePoint(opt.e);
      isDrawingShape.current = true;
      shapeStart.current = { x: pointer.x, y: pointer.y };
      let shape = null;
      switch (activeTool) {
        case 'rectangle':
          shape = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: activeColor,
            strokeWidth: strokeWidth,
            rx: 4,
            ry: 4,
          });
          break;
        case 'ellipse':
          shape = new Ellipse({
            left: pointer.x,
            top: pointer.y,
            rx: 0,
            ry: 0,
            fill: 'transparent',
            stroke: activeColor,
            strokeWidth: strokeWidth,
          });
          break;
        case 'line':
        case 'arrow':
          shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: activeColor,
            strokeWidth: strokeWidth,
            strokeLineCap: 'round',
          });
          break;
        case 'diamond':
          shape = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: activeColor,
            strokeWidth: strokeWidth,
            angle: 45,
            originX: 'center',
            originY: 'center',
          });
          break;
      }
      if (shape) {
        currentShape.current = shape;
        applyShapeStyle(shape);
        fabricCanvas.add(shape);
      }
    };
    const handleMouseMove = (opt) => {
      if (!isDrawingShape.current || !currentShape.current)
        return;
      const pointer = fabricCanvas.getScenePoint(opt.e);
      const { x: startX, y: startY } = shapeStart.current;
      switch (activeTool) {
        case 'rectangle':
        case 'diamond': {
          const width = Math.abs(pointer.x - startX);
          const height = Math.abs(pointer.y - startY);
          currentShape.current.set({
            width,
            height,
            left: activeTool === 'diamond' ? (startX + pointer.x) / 2 : Math.min(startX, pointer.x),
            top: activeTool === 'diamond' ? (startY + pointer.y) / 2 : Math.min(startY, pointer.y),
          });
          break;
        }
        case 'ellipse':
          currentShape.current.set({
            rx: Math.abs(pointer.x - startX) / 2,
            ry: Math.abs(pointer.y - startY) / 2,
            left: (startX + pointer.x) / 2,
            top: (startY + pointer.y) / 2,
            originX: 'center',
            originY: 'center',
          });
          break;
        case 'line':
        case 'arrow':
          currentShape.current.set({
            x2: pointer.x,
            y2: pointer.y,
          });
          break;
      }
      fabricCanvas.renderAll();
    };
    const handleMouseUp = () => {
      if (isDrawingShape.current && currentShape.current) {
        if (activeTool === 'arrow') {
          const line = currentShape.current;
          const x1 = line.x1 || 0;
          const y1 = line.y1 || 0;
          const x2 = line.x2 || 0;
          const y2 = line.y2 || 0;
          const angle = Math.atan2(y2 - y1, x2 - x1);
          const headLength = 15;
          const arrowHead1 = new Line([
            x2,
            y2,
            x2 - headLength * Math.cos(angle - Math.PI / 6),
            y2 - headLength * Math.sin(angle - Math.PI / 6),
          ], {
            stroke: activeColor,
            strokeWidth: strokeWidth,
            strokeLineCap: 'round',
          });
          const arrowHead2 = new Line([
            x2,
            y2,
            x2 - headLength * Math.cos(angle + Math.PI / 6),
            y2 - headLength * Math.sin(angle + Math.PI / 6),
          ], {
            stroke: activeColor,
            strokeWidth: strokeWidth,
            strokeLineCap: 'round',
          });
          fabricCanvas.add(arrowHead1, arrowHead2);
        }
        saveState(fabricCanvas);
      }
      isDrawingShape.current = false;
      currentShape.current = null;
    };
    fabricCanvas.on('mouse:down', handleMouseDown);
    fabricCanvas.on('mouse:move', handleMouseMove);
    fabricCanvas.on('mouse:up', handleMouseUp);
    return () => {
      fabricCanvas.off('mouse:down', handleMouseDown);
      fabricCanvas.off('mouse:move', handleMouseMove);
      fabricCanvas.off('mouse:up', handleMouseUp);
    };
  }, [fabricCanvas, activeTool, activeColor, strokeWidth, saveState]);
  /* ===================== TOOL MODE ===================== */
  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "draw";
    fabricCanvas.selection = activeTool === "select";

    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = strokeWidth;
    }

    const cursors = {
      select: "default",
      hand: "grab",
      draw: "crosshair",
      rectangle: "crosshair",
      ellipse: "crosshair",
      line: "crosshair",
      arrow: "crosshair",
      diamond: "crosshair",
      text: "text",
      eraser: "crosshair",
    };

    fabricCanvas.defaultCursor = cursors[activeTool];
  }, [fabricCanvas, activeTool, activeColor, strokeWidth]);

  const applyShapeStyle = (obj) => {
    obj.set({
      stroke: activeColor,
      strokeWidth: strokeWidth,
      strokeDashArray:
        strokeStyle === "dashed"
          ? [8, 4]
          : strokeStyle === "dotted"
            ? [2, 4]
            : null,
    });
  };

  /* ===================== SPACEBAR ===================== */
  useEffect(() => {
    const down = (e) => {
      if (e.code === "Space") {
        isSpacePressed.current = true;
        e.preventDefault();
      }
    };

    const up = (e) => {
      if (e.code === "Space") {
        isSpacePressed.current = false;
        isPanning.current = false;
      }
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  /* ===================== PAN (SPACE / HAND) ===================== */
  useEffect(() => {
    if (!fabricCanvas) return;

    const down = (opt) => {
      if (!isSpacePressed.current && activeTool !== "hand") return;

      isPanning.current = true;
      lastPanPos.current = { x: opt.e.clientX, y: opt.e.clientY };
      fabricCanvas.defaultCursor = "grabbing";
    };

    const move = (opt) => {
      if (!isPanning.current) return;

      const dx = opt.e.clientX - lastPanPos.current.x;
      const dy = opt.e.clientY - lastPanPos.current.y;

      const vpt = fabricCanvas.viewportTransform;
      vpt[4] += dx;
      vpt[5] += dy;

      fabricCanvas.requestRenderAll();
      lastPanPos.current = { x: opt.e.clientX, y: opt.e.clientY };
    };

    const up = () => {
      isPanning.current = false;
      fabricCanvas.defaultCursor = isSpacePressed.current ? "grab" : "default";
    };

    fabricCanvas.on("mouse:down", down);
    fabricCanvas.on("mouse:move", move);
    fabricCanvas.on("mouse:up", up);

    return () => {
      fabricCanvas.off("mouse:down", down);
      fabricCanvas.off("mouse:move", move);
      fabricCanvas.off("mouse:up", up);
    };
  }, [fabricCanvas, activeTool]);

  /* ===================== ZOOM + TRACKPAD ===================== */
  useEffect(() => {
    if (!fabricCanvas) return;

    const wheel = (opt) => {
      opt.e.preventDefault();
      opt.e.stopPropagation();

      const e = opt.e;
      const vpt = fabricCanvas.viewportTransform;

      // Two-finger pan
      if (!e.ctrlKey) {
        vpt[4] -= e.deltaX;
        vpt[5] -= e.deltaY;
        fabricCanvas.requestRenderAll();
        return;
      }

      // Zoom
      let z = fabricCanvas.getZoom();
      z *= e.deltaY > 0 ? 0.95 : 1.05;
      z = Math.min(Math.max(z, 0.1), 5);

      const p = fabricCanvas.getPointer(e);
      fabricCanvas.zoomToPoint(new Point(p.x, p.y), z);
      fabricCanvas.requestRenderAll();
      setZoom(z);
    };

    fabricCanvas.on("mouse:wheel", wheel);
    return () => fabricCanvas.off("mouse:wheel", wheel);
  }, [fabricCanvas]);

  /* ===================== BUTTON ZOOM ===================== */
  const zoomToCenter = (z) => {
    if (!fabricCanvas) return;
    z = Math.min(Math.max(z, 0.1), 5);

    const c = fabricCanvas.getCenter();
    fabricCanvas.zoomToPoint(new Point(c.left, c.top), z);
    fabricCanvas.requestRenderAll();
    setZoom(z);
  };

  const handleZoomIn = () => zoomToCenter(zoom + 0.1);
  const handleZoomOut = () => zoomToCenter(zoom - 0.1);

  const handleZoomReset = () => {
    if (!fabricCanvas) return;
    setZoom(1);
    fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    fabricCanvas.requestRenderAll();
  };

  /* ===================== GRID ===================== */
  useEffect(() => {
    if (!fabricCanvas || !showgrid) return;

    const drawGrid = () => {

      const ctx = fabricCanvas.getContext(); // canvas drawing context
      const width = fabricCanvas.getWidth();
      const height = fabricCanvas.getHeight();
      const vpt = fabricCanvas.viewportTransform;

      ctx.save();


      console.log(vpt);
      ctx.strokeStyle = "#2a2a2a";
      ctx.lineWidth = 0.5;

      // Convert screen → world
      const zoom = vpt[0];
      const offsetX = vpt[4];
      const offsetY = vpt[5];

      // Visible world boundaries
      const startX = -offsetX / zoom;
      const startY = -offsetY / zoom;
      const endX = startX + width / zoom;
      const endY = startY + height / zoom;

      // Vertical grid lines
      for (
        let x = Math.floor(startX / MINOR_GRID) * MINOR_GRID;
        x < endX;
        x += MINOR_GRID
      ) {
        const isMajor = x % MAJOR_GRID === 0;

        ctx.beginPath();
        ctx.strokeStyle = isMajor
          ? "rgba(16, 14, 14, 0.15)" // major line
          : "rgba(30, 27, 27, 0.05)"; // minor line
        ctx.lineWidth = isMajor ? 1.2 : 1;

        const screenX = x * zoom + offsetX;
        ctx.moveTo(screenX, offsetY);
        ctx.lineTo(screenX, height + offsetY);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (
        let y = Math.floor(startY / MINOR_GRID) * MINOR_GRID;
        y < endY;
        y += MINOR_GRID
      ) {
        const isMajor = y % MAJOR_GRID === 0;

        ctx.beginPath();
        ctx.strokeStyle = isMajor
          ? "rgba(19, 18, 18, 0.15)"
          : "rgba(24, 22, 22, 0.05)";
        ctx.lineWidth = isMajor ? 1.2 : 1;

        const screenY = y * zoom + offsetY;
        ctx.moveTo(offsetX, screenY);
        ctx.lineTo(width + offsetX, screenY);
        ctx.stroke();
      }
      ctx.restore();
    };

    fabricCanvas.on("before:render", drawGrid);

    return () => {
      fabricCanvas.off("before:render", drawGrid);
    };
  }, [fabricCanvas, showgrid]);
  const cangrid = function () {
    if (showgrid) {
      setshowgrid(false);
    }
    else {
      setshowgrid(true);
    }
  }
  /* ===================== EXPORT API ===================== */
  return {
    canvasRef,
    containerRef,
    activeTool,
    setActiveTool,
    activeColor,
    setActiveColor,
    strokeWidth,
    setStrokeWidth,
    strokeStyle,
    setStrokeStyle,
    zoom,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    showgrid,
    setshowgrid,
  };
}
