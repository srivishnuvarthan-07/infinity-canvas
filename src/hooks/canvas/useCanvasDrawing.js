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
            const isShapeTool = Object.values(SHAPE_TYPES).includes(activeTool) && activeTool !== 'text' && activeTool !== 'image' && activeTool !== 'group' && activeTool !== 'path';
            if (!isShapeTool) return;

            const pointer = fabricCanvas.getScenePoint(opt.e);
            isDrawingShape.current = true;
            shapeStart.current = { x: pointer.x, y: pointer.y };

            // Create shape using factory
            // Note: We deliberately use activeTool as the type key. 
            // Ensure SHAPE_TYPES values match activeTool strings.
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
                    const w = Math.abs(pointer.x - startX);
                    const h = Math.abs(pointer.y - startY);
                    shape.set({
                        width: w,
                        height: h,
                        left: Math.min(pointer.x, startX),
                        top: Math.min(pointer.y, startY)
                    });
                    break;
                case SHAPE_TYPES.DIAMOND:
                    const left = Math.min(startX, pointer.x);
                    const top = Math.min(startY, pointer.y);
                    const width = Math.abs(pointer.x - startX);
                    const height = Math.abs(pointer.y - startY);

                    // Diamond points relative to the bounding box we just calculated?
                    // Actually, for a Polygon, it's easier to recreate because 'points' are static after init usually.
                    // BUT, to avoid thrashing, we can try replacing the whole object less frequently?
                    // No, smooth dragging needs frequent updates.

                    // Let's stick to recreation but OPTIMIZED.
                    // The previous issue might be "selectable: false" on the temporary shape not being propagated?
                    // We ensured that.

                    // Diamond: Recreate with points relative to 0,0, then position at left/top
                    const currentId = shape.id;



                    // Center is relative to the width/height box
                     const relCenterX = width / 2;
                     const relCenterY = height / 2;
                    
                    // Points relative to 0,0 origin of the new shape
        
                    const newPoints = [
                        { x: relCenterX, y: 0 },      // Top
                        { x: width, y: relCenterY },  // Right
                        { x: relCenterX, y: height }, // Bottom
                        { x: 0, y: relCenterY }       // Left
                    ];

                    // Remove old
                    fabricCanvas.remove(shape);

                    // Create new
                    // We pass { x: left, y: top } as the pointer to Factory, which sets the object's left/top.
                    // The points are relative to that origin.
                    const newDiamond = CanvasObjectFactory.create(SHAPE_TYPES.DIAMOND, { x: left, y: top }, {
                        ...shape.toObject(['stroke', 'strokeWidth', 'fill', 'opacity']),
                        id: currentId,
                        points: newPoints,
                        selectable: false,
                        evented: false,
                    });

                    fabricCanvas.add(newDiamond);
                    currentShape.current = newDiamond;
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
            // For freehand, we might want to apply unified props too
            // Fabric created the path object automatically.
            // We should find the last object and patch it.
            const objects = fabricCanvas.getObjects();
            const lastObject = objects[objects.length - 1];
            if (lastObject && lastObject.type === 'path') {
                // Patch ID and Type
                lastObject.set({
                    id: crypto.randomUUID(),
                    // ...BASE_SHAPE_PROPS // Optional: apply base props if needed
                });
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
