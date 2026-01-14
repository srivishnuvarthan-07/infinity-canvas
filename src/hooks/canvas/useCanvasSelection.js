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
            setVersion(v => v + 1); // Always force update on selection events
        };

        const handleMouseDown = (opt) => {
            // Only run custom selection logic if we are in select mode
            if (fabricCanvas.isDrawingMode) return;
            if (fabricCanvas.activeTool && fabricCanvas.activeTool !== 'select') return;

            // Check if user is editing text (let Fabric handle caret/selection events)
            const activeObject = fabricCanvas.getActiveObject();
            if (activeObject && (activeObject.isEditing || (activeObject.type === 'i-text' && activeObject.isEditing))) {
                return;
            }

            // Check Control Interaction (let Fabric handle it - don't deselect)
            if (opt.target && opt.target === activeObject && opt.target.__corner) {
                return;
            }

            const pointer = fabricCanvas.getScenePoint(opt.e);
            const target = getShapeAtPointer(fabricCanvas, pointer);

            if (target) {
                // Check if already selected to avoid flicker, or just re-select
                if (fabricCanvas.getActiveObject() !== target) {
                    fabricCanvas.setActiveObject(target);
                    // Force update version managed in updateSelection via event
                    fabricCanvas.requestRenderAll();
                }
            } else {
                // Clicked on empty space -> Deselect
                if (fabricCanvas.getActiveObject()) {
                    fabricCanvas.discardActiveObject();
                    fabricCanvas.requestRenderAll();
                }
            }
        };

        const handleDoubleClick = (opt) => {
            const target = opt.target;
            if (target && (target.type === 'i-text' || target.type === 'textbox' || target.type === 'text')) {
                // Determine pointer position for cursor placement if needed, or just enter edit
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
