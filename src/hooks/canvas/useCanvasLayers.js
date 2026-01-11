import { useCallback } from "react";

export function useCanvasLayers(fabricCanvas, saveState) {
    const layerAction = useCallback((action) => {
        if (!fabricCanvas) return;
        const activeObject = fabricCanvas.getActiveObject();
        if (!activeObject) return;

        // Perform the action
        switch (action) {
            case "front":
                activeObject.bringToFront();
                break;
            case "back":
                activeObject.sendToBack();
                break;
            case "forward":
                activeObject.bringForward();
                break;
            case "backward":
                activeObject.sendBackwards();
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
