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
            if (opt.target && opt.target === fabricCanvas.getActiveObject() && opt.target.__corner) return;

            const pointer = fabricCanvas.getScenePoint(opt.e);
            const target = getShapeAtPointer(fabricCanvas, pointer);

            if (!target || !target.selectable) return;

            const center = target.getCenterPoint();
            const dx = pointer.x - center.x;
            const dy = pointer.y - center.y;

            const angleRad = -target.angle * (Math.PI / 180);
            const localX = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
            const localY = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);

            dragOffset.current = { x: localX, y: localY };
            activeObjectRef.current = target;
            isDragging.current = true;

            target.lockMovementX = true;
            target.lockMovementY = true;
        };

        const handleMouseMove = (opt) => {
            if (!isDragging.current || !activeObjectRef.current) return;

            const target = activeObjectRef.current;
            const pointer = fabricCanvas.getScenePoint(opt.e);

            const angleRad = target.angle * (Math.PI / 180);
            const { x: ox, y: oy } = dragOffset.current;

            const rotatedOffsetX = ox * Math.cos(angleRad) - oy * Math.sin(angleRad);
            const rotatedOffsetY = ox * Math.sin(angleRad) + oy * Math.cos(angleRad);

            const newLeft = pointer.x - rotatedOffsetX;
            const newTop = pointer.y - rotatedOffsetY;

            target.setPositionByOrigin(new Point(newLeft, newTop), 'center', 'center');
            target.setCoords();
            fabricCanvas.requestRenderAll();
        };

        const handleMouseUp = () => {
            if (isDragging.current && activeObjectRef.current) {
                const target = activeObjectRef.current;
                target.lockMovementX = false;
                target.lockMovementY = false;

                fabricCanvas.fire('object:modified', { target });
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
