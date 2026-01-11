import { useCallback, useEffect } from "react";
import { CanvasObjectFactory } from "../../canvas/CanvasObjectFactory";
import { SHAPE_TYPES } from "../../canvas/constants";

export function useCanvasText(fabricCanvas, activeTool, setActiveTool, activeColor, saveState) {

    const addText = useCallback((pointer) => {
        if (!fabricCanvas) return;

        const textObject = CanvasObjectFactory.create(SHAPE_TYPES.TEXT, pointer, {
            fill: activeColor
        });

        fabricCanvas.add(textObject);
        fabricCanvas.setActiveObject(textObject);

        // Enter editing mode immediately
        textObject.enterEditing();
        textObject.selectAll();

        fabricCanvas.requestRenderAll();

        // Reset tool to select
        setActiveTool("select");
        saveState();

    }, [fabricCanvas, activeColor, setActiveTool, saveState]);

    useEffect(() => {
        if (!fabricCanvas) return;

        const handleMouseDown = (opt) => {
            if (activeTool !== 'text') return;

            const pointer = fabricCanvas.getScenePoint(opt.e);
            addText(pointer);
        };

        fabricCanvas.on("mouse:down", handleMouseDown);

        return () => {
            fabricCanvas.off("mouse:down", handleMouseDown);
        };
    }, [fabricCanvas, activeTool, addText]);

    return {
        addText
    };
}
