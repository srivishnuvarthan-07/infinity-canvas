import { useEffect, useRef } from "react";

export function useCanvasEraser(fabricCanvas, activeTool, saveState) {
    const isErasing = useRef(false);

    useEffect(() => {
        if (!fabricCanvas) return;

        const handleMouseDown = (opt) => {
            if (activeTool !== 'eraser') return;
            isErasing.current = true;

            const pointer = fabricCanvas.getScenePoint(opt.e);

            // Iterate objects reversely to find top-most
            const objects = fabricCanvas.getObjects();
            let target = null;

            for (let i = objects.length - 1; i >= 0; i--) {
                const obj = objects[i];
                if (obj.containsPoint(pointer)) {
                    target = obj;
                    break;
                }
            }

            if (target) {
                fabricCanvas.remove(target);
                fabricCanvas.requestRenderAll();
                saveState();
            }
        };

        const handleMouseMove = (opt) => {
            if (activeTool !== 'eraser' || !isErasing.current) return;

            const pointer = fabricCanvas.getScenePoint(opt.e);

            // Iterate objects reversely to find top-most
            const objects = fabricCanvas.getObjects();
            let target = null;

            for (let i = objects.length - 1; i >= 0; i--) {
                const obj = objects[i];
                if (obj.containsPoint(pointer)) {
                    target = obj;
                    break;
                }
            }

            if (target) {
                fabricCanvas.remove(target);
                fabricCanvas.requestRenderAll();
            }
        };

        const handleMouseUp = () => {
            if (isErasing.current) {
                isErasing.current = false;
                if (activeTool === 'eraser') {
                    saveState(); // Save state once after erasing session
                }
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
    }, [fabricCanvas, activeTool, saveState]);
}
