import { useEffect, useRef } from "react";

export function useCanvasEraser(fabricCanvas, activeTool, saveState) {
    const isErasing = useRef(false);

    useEffect(() => {
        if (!fabricCanvas) return;

        const handleMouseDown = (opt) => {
            if (activeTool !== 'eraser') return;
            isErasing.current = true;

            // Explicitly find target since skipTargetFind is true
            const target = fabricCanvas.findTarget(opt.e, false);
            if (target) {
                fabricCanvas.remove(target);
                fabricCanvas.requestRenderAll();
                saveState();
            }
        };

        const handleMouseMove = (opt) => {
            if (activeTool !== 'eraser' || !isErasing.current) return;

            const target = fabricCanvas.findTarget(opt.e, false);
            if (target) {
                fabricCanvas.remove(target);
                fabricCanvas.requestRenderAll();
                // Debounce saveState here if needed for performance, 
                // but direct call is safer for now.
                // We might want to saveState only on mouseUp for drag-erase to avoid spamming history?
                // Let's safe update on mouse up actually.
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
