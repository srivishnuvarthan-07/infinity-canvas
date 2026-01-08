import { useState, useEffect } from "react";

export function useCanvasSelection(fabricCanvas) {
    const [selectedElement, setSelectedElement] = useState(null);

    useEffect(() => {
        if (!fabricCanvas) return;

        const updateSelection = () => {
            const activeObjects = fabricCanvas.getActiveObjects();
            if (activeObjects.length === 1) {
                setSelectedElement(activeObjects[0]);
            } else {
                // We don't support multi-selection styling in sidebar yet, or it handles it differently
                // For now, if multiple or none, set to null
                setSelectedElement(null);
            }
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
