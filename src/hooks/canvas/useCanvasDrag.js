import { useRef, useEffect } from "react";
import { Point } from "fabric"; // In v6 Point is top-level import, or fabric.Point
import { getShapeAtPointer } from "../../canvas/utils/hitTest";

export function useCanvasDrag(fabricCanvas, activeTool) {
    const isDragging = useRef(false);
    const dragOffset = useRef(null);
    const activeObjectRef = useRef(null);

    useEffect(() => {
        if (!fabricCanvas) return;

        const handleMouseDown = (opt) => {
            if (activeTool !== 'select') return;

            const activeObject = fabricCanvas.getActiveObject();
            if (opt.target && opt.target === activeObject && opt.target.__corner) {
                return;
            }

            const pointer = fabricCanvas.getScenePoint(opt.e);

            // Use strict hit test
            const target = getShapeAtPointer(fabricCanvas, pointer);
            if (!target || !target.selectable) return;

            // Calculate Local Offset: InverseRotate(Pointer - Center)
            const center = target.getCenterPoint();
            const deltaX = pointer.x - center.x;
            const deltaY = pointer.y - center.y;
            const angleRad = -target.angle * (Math.PI / 180);

            const localX = deltaX * Math.cos(angleRad) - deltaY * Math.sin(angleRad);
            const localY = deltaX * Math.sin(angleRad) + deltaY * Math.cos(angleRad);

            dragOffset.current = { x: localX, y: localY };
            activeObjectRef.current = target;
            isDragging.current = true;

            // Lock native movement
            target.lockMovementX = true;
            target.lockMovementY = true;
        };

        const handleMouseMove = (opt) => {
            if (!isDragging.current || !activeObjectRef.current || activeTool !== 'select') return;

            const target = activeObjectRef.current;
            const pointer = fabricCanvas.getScenePoint(opt.e);

            // Calculate New Center: Pointer - Rotate(LocalOffset)
            const angleRad = target.angle * (Math.PI / 180);
            const local = dragOffset.current;

            const rotatedOffsetX = local.x * Math.cos(angleRad) - local.y * Math.sin(angleRad);
            const rotatedOffsetY = local.x * Math.sin(angleRad) + local.y * Math.cos(angleRad);

            const newCenterX = pointer.x - rotatedOffsetX;
            const newCenterY = pointer.y - rotatedOffsetY;

            target.setPositionByOrigin(new Point(newCenterX, newCenterY), 'center', 'center');
            target.setCoords();
            fabricCanvas.requestRenderAll();
        };

        const handleMouseUp = () => {
            if (isDragging.current && activeObjectRef.current) {
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
