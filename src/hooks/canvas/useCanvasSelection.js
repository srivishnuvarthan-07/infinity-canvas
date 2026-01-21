import { useState, useEffect } from "react";
import { getShapeAtPointer } from "../../canvas/utils/hitTest";

export function useCanvasSelection(fabricCanvas) {
    const [selectedElement, setSelectedElement] = useState(null);
    const [_, setVersion] = useState(0); // Force re-render

    useEffect(() => {
        if (!fabricCanvas) return;

        const updateSelection = () => {
            const activeObject = fabricCanvas.getActiveObject();
            setSelectedElement(activeObject || null);
            setVersion(v => v + 1);
        };

        const handleMouseDown = (opt) => {
            // Only custom selection if active tool is select and not drawing mode
            if (fabricCanvas.isDrawingMode || (fabricCanvas.activeTool && fabricCanvas.activeTool !== 'select')) return;

            const activeObject = fabricCanvas.getActiveObject();
            // Let Fabric handle editing text
            if (activeObject && (activeObject.isEditing || (activeObject.type === 'i-text' && activeObject.isEditing))) {
                return;
            }

            // Let Fabric handle controls
            if (opt.target && opt.target === activeObject && opt.target.__corner) {
                return;
            }

            const pointer = fabricCanvas.getScenePoint(opt.e);
            const target = getShapeAtPointer(fabricCanvas, pointer);

            if (target) {
                if (fabricCanvas.getActiveObject() !== target) {
                    fabricCanvas.setActiveObject(target);
                    fabricCanvas.requestRenderAll();
                }
            } else {
                if (fabricCanvas.getActiveObject()) {
                    fabricCanvas.discardActiveObject();
                    fabricCanvas.requestRenderAll();
                }
            }
        };

        const handleDoubleClick = (opt) => {
            const target = opt.target;
            if (target && ['i-text', 'textbox', 'text'].includes(target.type)) {
                if (target.enterEditing) {
                    target.enterEditing();
                    fabricCanvas.requestRenderAll();
                }
            }
        };

        fabricCanvas.on("selection:created", updateSelection);
        fabricCanvas.on("selection:updated", updateSelection);
        fabricCanvas.on("selection:cleared", updateSelection);
        fabricCanvas.on("mouse:down", handleMouseDown);
        fabricCanvas.on("mouse:dblclick", handleDoubleClick);

        return () => {
            fabricCanvas.off("selection:created", updateSelection);
            fabricCanvas.off("selection:updated", updateSelection);
            fabricCanvas.off("selection:cleared", updateSelection);
            fabricCanvas.off("mouse:down", handleMouseDown);
            fabricCanvas.off("mouse:dblclick", handleDoubleClick);
        };
    }, [fabricCanvas]);

    return { selectedElement };
}
