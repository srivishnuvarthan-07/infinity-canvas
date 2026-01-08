import { useRef, useEffect } from "react";
import { Rect, Ellipse, Line } from "fabric";

export function useCanvasDrawing(
    fabricCanvas,
    activeTool,
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
                    // Diamond is just a rotated square/rect usually, but we need to handle bounding box
                    shape = new Rect({
                        left: pointer.x,
                        top: pointer.y,
                        width: 0,
                        height: 0,
                        angle: 45,
                        originX: 'center',
                        originY: 'center',
                        ...commonProps
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
                case "arrow":
                    shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
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
                    // Complex logic for diamond to feel right
                    // For now simply using rect logic but centered
                    const diagW = Math.abs(pointer.x - startX);
                    const diagH = Math.abs(pointer.y - startY);
                    // We set width/height such that the diamond usage feels natural
                    shape.set({
                        width: diagW,
                        height: diagH,
                        left: (startX + pointer.x) / 2,
                        top: (startY + pointer.y) / 2
                    });
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

                // Handle Arrow Head logic if needed
                if (activeTool === "arrow") {
                    const headLength = 15;
                    const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);
                    const arrowHead1 = new Line([
                        shape.x2, shape.y2,
                        shape.x2 - headLength * Math.cos(angle - Math.PI / 6),
                        shape.y2 - headLength * Math.sin(angle - Math.PI / 6)
                    ], { stroke: activeColor, strokeWidth: strokeWidth, strokeLineCap: 'round' });

                    const arrowHead2 = new Line([
                        shape.x2, shape.y2,
                        shape.x2 - headLength * Math.cos(angle + Math.PI / 6),
                        shape.y2 - headLength * Math.sin(angle + Math.PI / 6)
                    ], { stroke: activeColor, strokeWidth: strokeWidth, strokeLineCap: 'round' });

                    fabricCanvas.add(arrowHead1, arrowHead2);
                }

                if (saveState) saveState();
            }
            isDrawingShape.current = false;
            currentShape.current = null;
        };

        // Path created (Freehand)
        const handlePathCreated = () => {
            if (saveState) saveState();
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
