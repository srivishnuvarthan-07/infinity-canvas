import { useCallback } from "react";

export function useCanvasLayers(fabricCanvas, saveState) {

    // Normalization helper
    const normalizeLayers = useCallback(() => {
        if (!fabricCanvas) return;
        // In Fabric, object stack order determines rendering. Index 0 is bottom.
        // We can just ensure objects are properly sorted if we maintain a custom index property,
        // but typically Fabric's stack is sufficient index.
    }, [fabricCanvas]);

    const bringToFront = useCallback(() => {
        if (!fabricCanvas) return;
        const activeObject = fabricCanvas.getActiveObject();
        if (!activeObject) return;

        activeObject.bringToFront();
        fabricCanvas.requestRenderAll();
        saveState();
    }, [fabricCanvas, saveState]);

    const sendToBack = useCallback(() => {
        if (!fabricCanvas) return;
        const activeObject = fabricCanvas.getActiveObject();
        if (!activeObject) return;

        activeObject.sendToBack();
        fabricCanvas.requestRenderAll();
        saveState();
    }, [fabricCanvas, saveState]);

    const moveForward = useCallback(() => {
        if (!fabricCanvas) return;
        const activeObject = fabricCanvas.getActiveObject();
        if (!activeObject) return;

        activeObject.bringForward();
        fabricCanvas.requestRenderAll();
        saveState();
    }, [fabricCanvas, saveState]);

    const moveBackward = useCallback(() => {
        if (!fabricCanvas) return;
        const activeObject = fabricCanvas.getActiveObject();
        if (!activeObject) return;

        activeObject.sendBackwards();
        fabricCanvas.requestRenderAll();
        saveState();
    }, [fabricCanvas, saveState]);

    return {
        bringToFront,
        sendToBack,
        moveForward,
        moveBackward
    };
}
