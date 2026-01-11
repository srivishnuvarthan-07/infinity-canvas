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
            // Apply unified schema rules
            const unifiedGroup = CanvasObjectFactory.createGroup([], {
                id: crypto.randomUUID(), // Enforce new ID
                left: newGroup.left,
                top: newGroup.top
            });

            // Note: CanvasObjectFactory.createGroup creates a new instance.
            // But activeObject.toGroup() ALREADY transformed the selection into a group on the canvas.
            // We just need to PATCH the existing group with unified props.

            newGroup.set({
                id: unifiedGroup.id,
                ...unifiedGroup // Safety merge
            });

            // Enforce transparent fill/stroke for container
            newGroup.set({
                fill: 'transparent',
                stroke: null
            });

            fabricCanvas.requestRenderAll();
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
