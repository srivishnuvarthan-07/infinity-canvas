import { useRef, useEffect } from "react";
import { CanvasObjectFactory } from "../../canvas/CanvasObjectFactory";
import { SHAPE_TYPES } from "../../canvas/constants";

export function useCanvasDrawing(
    fabricCanvas,
    activeTool,
    setActiveTool,
    activeColor,
    strokeWidth,
    saveState
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
            const isShapeTool = Object.values(SHAPE_TYPES).includes(activeTool) &&
                !['text', 'image', 'group', 'path'].includes(activeTool);

            if (!isShapeTool) return;

            const pointer = fabricCanvas.getScenePoint(opt.e);
            isDrawingShape.current = true;
            shapeStart.current = { x: pointer.x, y: pointer.y };

            const shape = CanvasObjectFactory.create(activeTool, pointer, {
                stroke: activeColor,
                strokeWidth: strokeWidth,
                selectable: false,
                evented: false
            });

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
                case SHAPE_TYPES.RECT:
                    shape.set({
                        width: Math.abs(pointer.x - startX),
                        height: Math.abs(pointer.y - startY),
                        left: Math.min(pointer.x, startX),
                        top: Math.min(pointer.y, startY)
                    });
                    break;
                case SHAPE_TYPES.DIAMOND:
                    const size = Math.max(Math.abs(pointer.x - startX), Math.abs(pointer.y - startY));
                    const sideLength = size / Math.sqrt(2);
                    shape.set({
                        width: sideLength,
                        height: sideLength,
                        left: (startX + pointer.x) / 2,
                        top: (startY + pointer.y) / 2,
                    });
                    shape.setCoords();
                    break;
                case SHAPE_TYPES.ELLIPSE:
                    shape.set({
                        rx: Math.abs(pointer.x - startX) / 2,
                        ry: Math.abs(pointer.y - startY) / 2,
                        left: (startX + pointer.x) / 2,
                        top: (startY + pointer.y) / 2
                    });
                    break;
                case SHAPE_TYPES.LINE:
                case SHAPE_TYPES.ARROW:
                    shape.set({ x2: pointer.x, y2: pointer.y });
                    break;
                case SHAPE_TYPES.CIRCLE:
                    const radius = Math.sqrt(Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2));
                    shape.set({ radius: radius });
                    break;
            }
            fabricCanvas.renderAll();
        };

        const handleMouseUp = () => {
            if (isDrawingShape.current && currentShape.current) {
                const shape = currentShape.current;
                shape.setCoords();
                shape.set({ selectable: true, evented: true });

                if (saveState) saveState();

                fabricCanvas.setActiveObject(shape);
                fabricCanvas.requestRenderAll();
                setActiveTool("select");
            }
            isDrawingShape.current = false;
            currentShape.current = null;
        };

        const handlePathCreated = () => {
            const objects = fabricCanvas.getObjects();
            const lastObject = objects[objects.length - 1];
            if (lastObject && lastObject.type === 'path') {
                lastObject.set({ id: crypto.randomUUID() });
            }

            if (saveState) saveState();
            setActiveTool("select");
        }

        fabricCanvas.on("mouse:down", handleMouseDown);
        fabricCanvas.on("mouse:move", handleMouseMove);
        fabricCanvas.on("mouse:up", handleMouseUp);
        fabricCanvas.on("path:created", handlePathCreated);

        return () => {
            fabricCanvas.off("mouse:down", handleMouseDown);
            fabricCanvas.off("mouse:move", handleMouseMove);
            fabricCanvas.off("mouse:up", handleMouseUp);
            fabricCanvas.off("path:created", handlePathCreated);
        };
    }, [fabricCanvas, activeTool, activeColor, strokeWidth, saveState]);
}
