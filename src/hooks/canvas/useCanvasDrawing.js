import { useRef, useEffect } from "react";
import { Rect, Ellipse, Line, Polygon } from "fabric";
import { Arrow } from "../../canvas/shapes/Arrow";


export function useCanvasDrawing(
    fabricCanvas,
    activeTool,
    setActiveTool,
    activeColor,
    strokeWidth,
    saveState // Required to save state after drawing
) {
    const isDrawingShape = useRef(false);
    const currentShape = useRef(null);
    const shapeStart = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!fabricCanvas) return;

        // Configure Free Drawing Brush
        if (fabricCanvas.freeDrawingBrush) {
            fabricCanvas.freeDrawingBrush.color = activeColor;
            fabricCanvas.freeDrawingBrush.width = strokeWidth;
        }

        // Set Drawing Mode
        fabricCanvas.isDrawingMode = activeTool === "draw";
        fabricCanvas.selection = activeTool === "select";

    }, [fabricCanvas, activeTool, activeColor, strokeWidth]);

    useEffect(() => {
        if (!fabricCanvas) return;

        const handleMouseDown = (opt) => {
            const isShapeTool = ["rectangle", "ellipse", "line", "arrow", "diamond"].includes(activeTool);
            if (!isShapeTool) return;

            const pointer = fabricCanvas.getScenePoint(opt.e);
            isDrawingShape.current = true;
            shapeStart.current = { x: pointer.x, y: pointer.y };

            let shape = null;
            const commonProps = {
                stroke: activeColor,
                strokeWidth: strokeWidth,
                fill: "transparent",
                selectable: false, // Make unselectable while drawing
                evented: false,
            };

            switch (activeTool) {
                case "rectangle":
                    shape = new Rect({
                        left: pointer.x,
                        top: pointer.y,
                        width: 0,
                        height: 0,
                        rx: 4, ry: 4,
                        ...commonProps
                    });
                    break;
                case "diamond":
                    // Diamond as Polygon
                    shape = new Polygon([
                        { x: pointer.x, y: pointer.y },
                        { x: pointer.x, y: pointer.y },
                        { x: pointer.x, y: pointer.y },
                        { x: pointer.x, y: pointer.y }
                    ], {
                        ...commonProps,
                        objectCaching: false // Dynamic updates
                    });
                    break;
                case "ellipse":
                    shape = new Ellipse({
                        left: pointer.x,
                        top: pointer.y,
                        rx: 0, ry: 0,
                        originX: 'center',
                        originY: 'center',
                        ...commonProps
                    });
                    break;
                case "line":
                    shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                        strokeLineCap: "round",
                        ...commonProps
                    });
                    break;
                case "arrow":
                    shape = new Arrow([pointer.x, pointer.y, pointer.x, pointer.y], {
                        strokeLineCap: "round",
                        ...commonProps
                    });
                    break;
            }

            if (shape) {
                currentShape.current = shape;
                fabricCanvas.add(shape);
            }
        };

        const handleMouseMove = (opt) => {
            if (!isDrawingShape.current || !currentShape.current) return;

            const pointer = fabricCanvas.getScenePoint(opt.e);
            const startX = shapeStart.current.x;
            const startY = shapeStart.current.y;
            const shape = currentShape.current;

            switch (activeTool) {
                case "rectangle":
                    const w = Math.abs(pointer.x - startX);
                    const h = Math.abs(pointer.y - startY);
                    shape.set({
                        width: w,
                        height: h,
                        left: Math.min(pointer.x, startX),
                        top: Math.min(pointer.y, startY)
                    });
                    break;
                case "diamond":
                    // Calculate diamond points based on bounding box style drag
                    const left = Math.min(startX, pointer.x);
                    const top = Math.min(startY, pointer.y);
                    const width = Math.abs(pointer.x - startX);
                    const height = Math.abs(pointer.y - startY);
                    const centerX = left + width / 2;
                    const centerY = top + height / 2;

                    // Top, Right, Bottom, Left
                    const newPoints = [
                        { x: centerX, y: top },
                        { x: left + width, y: centerY },
                        { x: centerX, y: top + height },
                        { x: left, y: centerY }
                    ];

                    // Recreate polygon to ensure correct dimensions/rendering
                    fabricCanvas.remove(shape);
                    const newDiamond = new Polygon(newPoints, {
                        stroke: shape.stroke,
                        strokeWidth: shape.strokeWidth,
                        fill: shape.fill,
                        selectable: shape.selectable,
                        evented: shape.evented,
                        objectCaching: false
                    });
                    fabricCanvas.add(newDiamond);
                    currentShape.current = newDiamond;
                    break;
                case "ellipse":
                    shape.set({
                        rx: Math.abs(pointer.x - startX) / 2,
                        ry: Math.abs(pointer.y - startY) / 2,
                        left: (startX + pointer.x) / 2,
                        top: (startY + pointer.y) / 2
                    });
                    break;
                case "line":
                case "arrow":
                    shape.set({ x2: pointer.x, y2: pointer.y });
                    break;
            }
            fabricCanvas.renderAll();
        };

        const handleMouseUp = () => {
            if (isDrawingShape.current && currentShape.current) {
                const shape = currentShape.current;
                shape.setCoords(); // Update coords
                shape.set({ selectable: true, evented: true }); // Make selectable again

                // Arrow head logic REMOVED - handled by Arrow class render

                if (saveState) saveState();

                // EXCALIDRAW UX: Auto-select and revert tool
                fabricCanvas.setActiveObject(shape);
                fabricCanvas.requestRenderAll();
                setActiveTool("select");
            }
            isDrawingShape.current = false;
            currentShape.current = null;
        };

        // Path created (Freehand)
        const handlePathCreated = () => {
            if (saveState) saveState();
            // EXCALIDRAW UX: Revert after freehand
            setActiveTool("select");
        }
        fabricCanvas.on("mouse:down", handleMouseDown);
        fabricCanvas.on("mouse:move", handleMouseMove);
        fabricCanvas.on("mouse:up", handleMouseUp);
        fabricCanvas.on("path:created", handlePathCreated); // Capture freehand drawing

        return () => {
            fabricCanvas.off("mouse:down", handleMouseDown);
            fabricCanvas.off("mouse:move", handleMouseMove);
            fabricCanvas.off("mouse:up", handleMouseUp);
            fabricCanvas.off("path:created", handlePathCreated);
        };
    }, [fabricCanvas, activeTool, activeColor, strokeWidth, saveState]);
}
