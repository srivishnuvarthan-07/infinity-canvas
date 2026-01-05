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
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState({ states: [], currentIndex: -1 });
  const [showgrid,setshowgrid] = useState(false);
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
          let x = Math.floor(startX / GRID_SIZE) * GRID_SIZE;
          x < endX;
          x += GRID_SIZE
        ) {
          ctx.beginPath();
          ctx.moveTo(x * zoom + offsetX, offsetY);
          ctx.lineTo(x * zoom + offsetX, height + offsetY);
          ctx.stroke();
        }

        // Horizontal grid lines
        for (
          let y = Math.floor(startY / GRID_SIZE) * GRID_SIZE;
          y < endY;
          y += GRID_SIZE
        ) {
          ctx.beginPath();
          ctx.moveTo(offsetX, y * zoom + offsetY);
          ctx.lineTo(width + offsetX, y * zoom + offsetY);
          ctx.stroke();
        }

        ctx.restore();
      };

      fabricCanvas.on("before:render", drawGrid);

      return () => {
        fabricCanvas.off("before:render", drawGrid);
      };
    }, [fabricCanvas,showgrid]);
    const cangrid = function(){
      if(showgrid){
        setshowgrid(false);
      }
      else{
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
    zoom,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    showgrid,
    setshowgrid,
  };
}
