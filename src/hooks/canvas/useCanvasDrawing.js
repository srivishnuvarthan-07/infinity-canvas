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
                    const centerX = left + width / 2;
                    const centerY = top + height / 2;

                    const newPoints = [
                        { x: centerX, y: top },
                        { x: left + width, y: centerY },
                        { x: centerX, y: top + height },
                        { x: left, y: centerY }
                    ];

                    // For polygon, we might need to recreate or update points
                    // Fabric Polygon points are relative to center if cached? 
                    // Simpler to remove and re-add for complex polygons during drag if needed, 
                    // but for performance, let's try setting points if mutable, or recreate.
                    // Recreating is safer for correct bounding box updates.

                    const newDiamond = CanvasObjectFactory.create(SHAPE_TYPES.DIAMOND, { x: 0, y: 0 }, {
                        stroke: shape.stroke,
                        strokeWidth: shape.strokeWidth,
                        fill: shape.fill,
                        selectable: shape.selectable,
                        evented: shape.evented,
                        objectCaching: false,
                        id: shape.id // Keep ID
                    });

                    // Manually set points (Polygon constructor handles it, but factory default is center 0)
                    // We need to override the factory creation for this dynamic update
                    // Actually, let's just use the factory for the object properties but manually handle points

                    fabricCanvas.remove(shape);
                    // Update the new diamond with correct points
                    newDiamond.set("points", newPoints);
                    // And correct props that factory might have defaulted based on 0,0
                    // BUT Polygon constructor takes points as first arg. 
                    // Our factory handles it. We just need to call it with dummy and replace?
                    // No, let's just do what the previous code did but use factory logic style
                    // Actually, reusing the previous logic is fine, just wrapped.

                    // Let's stick to the previous recreation logic for Diamond for now, ensuring props match
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
