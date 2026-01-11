import { useCallback } from "react";
import { ActiveSelection } from "fabric";
import { CanvasObjectFactory } from "../../canvas/CanvasObjectFactory";
import { SHAPE_TYPES } from "../../canvas/constants";

export function useCanvasGrouping(fabricCanvas, saveState) {

    const groupSelection = useCallback(() => {
        if (!fabricCanvas) return;
        const activeObject = fabricCanvas.getActiveObject();

        if (!activeObject || activeObject.type !== 'activeSelection') {
            return;
        }

        // ActiveSelection is a special type in Fabric.
        // We convert it to a formal Group.
        activeObject.toGroup();

        // Fabric creates a default group. We need to enforce our ID and Schema.
        // The `toGroup` method returns the new group but sets it as active object.
        const newGroup = fabricCanvas.getActiveObject();

        if (newGroup && newGroup.type === 'group') {
            // Setup Unified Group Properties
            const groupId = crypto.randomUUID();

            newGroup.set({
                ...SHAPE_TYPES.BASE_SHAPE_PROPS, // Ensure base props
                id: groupId,
                fill: 'transparent',
                stroke: null,
                subTargetCheck: true,
                interactive: true
            });

            fabricCanvas.requestRenderAll();
            // Important: Set this new group as the active object explicitly to trigger UI updates
            fabricCanvas.setActiveObject(newGroup);
            saveState();
        }

    }, [fabricCanvas, saveState]);

    const ungroupSelection = useCallback(() => {
        if (!fabricCanvas) return;
        const activeObject = fabricCanvas.getActiveObject();

        if (!activeObject || activeObject.type !== 'group') {
            return;
        }

        // Ungroup
        activeObject.toActiveSelection();
        fabricCanvas.requestRenderAll();
        saveState();

    }, [fabricCanvas, saveState]);

    return {
        groupSelection,
        ungroupSelection
    };
}
