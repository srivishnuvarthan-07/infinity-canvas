import { useState, useEffect } from "react";

export function useCanvasSelection(fabricCanvas) {
    const [selectedElement, setSelectedElement] = useState(null);

    useEffect(() => {
        if (!fabricCanvas) return;

        const updateSelection = () => {
            const activeObject = fabricCanvas.getActiveObject();
            setSelectedElement(activeObject || null);
        };

        fabricCanvas.on("selection:created", updateSelection);
        fabricCanvas.on("selection:updated", updateSelection);
        fabricCanvas.on("selection:cleared", updateSelection);

        return () => {
            fabricCanvas.off("selection:created", updateSelection);
            fabricCanvas.off("selection:updated", updateSelection);
            fabricCanvas.off("selection:cleared", updateSelection);
        };
    }, [fabricCanvas]);

    return { selectedElement };
}
