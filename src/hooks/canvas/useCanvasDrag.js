import { useRef, useEffect } from "react";
import { Point } from "fabric"; // In v6 Point is top-level import, or fabric.Point
import { getShapeAtPointer } from "../../canvas/utils/hitTest";

export function useCanvasDrag(fabricCanvas, activeTool) {
    const isDragging = useRef(false);
    const dragOffset = useRef(null); // Local offset {x, y}
    const activeObjectRef = useRef(null);

    useEffect(() => {
        if (!fabricCanvas) return;

        // Helper: Rotate point around origin (inverse or normal)
        // Fabric Point (v6) has methods, or we can use util.
        // Let's stick to simple trig if needed, or Fabric's rotate method.
        // Fabric v6: fabric.util.rotatePoint(point, origin, radians)

        const handleMouseDown = (opt) => {
            if (activeTool !== 'select') return;

            // Check Control Interaction (let Fabric handle it)
            const activeObject = fabricCanvas.getActiveObject();
            if (opt.target && opt.target === activeObject && opt.target.__corner) {
                return;
            }

            const pointer = fabricCanvas.getScenePoint(opt.e);

            // USE STRICT HIT TEST
            const target = getShapeAtPointer(fabricCanvas, pointer);

            if (!target || !target.selectable) return;

            // 1. Calculate Local Offset
            // Local Offset = InverseRotate(Pointer - Center)
            // Actually, we can use target.toLocalPoint(pointer, 'center', 'center')?
            // Fabric v6 `toLocalPoint`. 

            // Let's implement the math explicitly to be safe and match user conceptual model.

            const center = target.getCenterPoint();
            const pointerPoint = new Point(pointer.x, pointer.y);

            // Vector from center to pointer
            const deltaX = pointer.x - center.x;
            const deltaY = pointer.y - center.y;

            // Rotate this vector by -angle (inverse rotation) to get local offset
            // We need angle in radians. target.angle is degrees usually.
            const angleRad = -target.angle * (Math.PI / 180);

            const localX = deltaX * Math.cos(angleRad) - deltaY * Math.sin(angleRad);
            const localY = deltaX * Math.sin(angleRad) + deltaY * Math.cos(angleRad);

            dragOffset.current = { x: localX, y: localY };
            activeObjectRef.current = target;
            isDragging.current = true;

            // Lock native movement so Fabric doesn't fight us
            target.lockMovementX = true;
            target.lockMovementY = true;
        };

        const handleMouseMove = (opt) => {
            if (!isDragging.current || !activeObjectRef.current) return;
            if (activeTool !== 'select') return;

            const target = activeObjectRef.current;
            const pointer = fabricCanvas.getScenePoint(opt.e);

            // 2. Calculate New Center
            // New Center = Pointer - Rotate(LocalOffset)

            // Rotate local offset by +angle
            const angleRad = target.angle * (Math.PI / 180);
            const local = dragOffset.current;

            const rotatedOffsetX = local.x * Math.cos(angleRad) - local.y * Math.sin(angleRad);
            const rotatedOffsetY = local.x * Math.sin(angleRad) + local.y * Math.cos(angleRad);

            const newCenterX = pointer.x - rotatedOffsetX;
            const newCenterY = pointer.y - rotatedOffsetY;

            // Update position
            target.setPositionByOrigin(new Point(newCenterX, newCenterY), 'center', 'center');
            target.setCoords();
            fabricCanvas.requestRenderAll();
        };

        const handleMouseUp = () => {
            if (isDragging.current && activeObjectRef.current) {
                // Unlock native movement (optional, but good for cleanliness)
                // activeObjectRef.current.lockMovementX = false;
                // activeObjectRef.current.lockMovementY = false;

                // Fire modified event so history works
                fabricCanvas.fire('object:modified', { target: activeObjectRef.current });

                isDragging.current = false;
                activeObjectRef.current = null;
                dragOffset.current = null;
            }
        };

        fabricCanvas.on("mouse:down", handleMouseDown);
        fabricCanvas.on("mouse:move", handleMouseMove);
        fabricCanvas.on("mouse:up", handleMouseUp);

        return () => {
            fabricCanvas.off("mouse:down", handleMouseDown);
            fabricCanvas.off("mouse:move", handleMouseMove);
            fabricCanvas.off("mouse:up", handleMouseUp);
        };
    }, [fabricCanvas, activeTool]);
}
