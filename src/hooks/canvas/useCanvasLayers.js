import { useCallback } from "react";

export function useCanvasLayers(fabricCanvas, saveState) {
    const layerAction = useCallback((action) => {
        if (!fabricCanvas) return;
        const activeObject = fabricCanvas.getActiveObject();
        if (!activeObject) return;

        // Perform the action using Canvas-level methods (Fabric v6/Safe)
        switch (action) {
            case "front":
                fabricCanvas.bringObjectToFront(activeObject);
                break;
            case "back":
                fabricCanvas.sendObjectToBack(activeObject);
                break;
            case "forward":
                fabricCanvas.bringObjectForward(activeObject);
                break;
            case "backward":
                fabricCanvas.sendObjectBackwards(activeObject);
                break;
        }

        // For ActiveSelection (multi-select), Fabric moves the selection group.
        // Upon deselect, the stack order is preserved.

        // Critical: Update primitives and render
        fabricCanvas.requestRenderAll();
        saveState();
    }, [fabricCanvas, saveState]);

    return {
        bringToFront: () => layerAction("front"),
        sendToBack: () => layerAction("back"),
        moveForward: () => layerAction("forward"),
        moveBackward: () => layerAction("backward")
    };
}
