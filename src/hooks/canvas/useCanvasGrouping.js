import { useCallback } from "react";
import { ActiveSelection } from "fabric";
import { CanvasObjectFactory } from "../../canvas/CanvasObjectFactory";
import { SHAPE_TYPES, BASE_SHAPE_PROPS } from "../../canvas/constants";

export function useCanvasGrouping(fabricCanvas, activeTool, saveState) {

    const groupSelection = useCallback(() => {
        if (!fabricCanvas) {
            console.error("[Grouping] Failed: No fabricCanvas instance.");
            return;
        }

        // 1. Validate Tool State
        console.log(`[Grouping] Tool Check. ActiveTool: '${activeTool}'`);

        if (activeTool !== 'select') {
            console.warn(`[Grouping] Failed: Grouping only allowed in 'select' mode. Current: ${activeTool}`);
            return;
        }

        const activeObject = fabricCanvas.getActiveObject();
        console.log("[Grouping] Triggered. Active Object Type:", activeObject?.type);
        console.log("[Grouping] Canvas Selection Enabled:", fabricCanvas.selection);

        if (!activeObject) {
            console.warn("[Grouping] Failed: No active object found (Selection cleared?).");
            return;
        }

        if (activeObject.type !== 'activeSelection') {
            console.warn(`[Grouping] Failed: Active object is '${activeObject.type}', expected 'activeSelection'.`);
            return;
        }

        // 1. Convert to Group
        // 'toGroup' automatically removes the activeSelection and adds the new Group to canvas
        const group = activeObject.toGroup();

        if (group && group.type === 'group') {
            console.log("[Grouping] Group created successfully.", group);

            // 2. Enforce Unified Properties & ID
            // We preserve existing ID if it was re-grouped, or generate new if fresh.
            // Usually valid groups need a stable ID.
            const groupId = group.id || crypto.randomUUID();

            group.set({
                ...BASE_SHAPE_PROPS,
                id: groupId,
                fill: 'transparent',
                stroke: null, // Groups shouldn't have a stroke themselves usually
                objectCaching: false, // Help with rendering artifacts
                subTargetCheck: true, // Allow selecting items inside if needed
                interactive: true
            });

            // 3. Update Canvas
            fabricCanvas.setActiveObject(group);
            fabricCanvas.requestRenderAll();
            saveState();
            console.log("[Grouping] Group finalized and active.", group.id);
        } else {
            console.error("[Grouping] 'toGroup' failed to return a valid Group object.");
        }

    }, [fabricCanvas, saveState]);

    const ungroupSelection = useCallback(() => {
        if (!fabricCanvas) return;
        const activeObject = fabricCanvas.getActiveObject();

        console.log("[Ungrouping] Attempting to ungroup. Active Object:", activeObject?.type);

        if (!activeObject || activeObject.type !== 'group') {
            console.warn("[Ungrouping] Failed: Selection is not a Group.");
            return;
        }

        // 1. Ungroup
        // 'toActiveSelection' explodes the group back into selected items
        const activeSelection = activeObject.toActiveSelection();

        if (activeSelection) {
            console.log("[Ungrouping] Success. Restored active selection.");

            // 2. Update Canvas
            fabricCanvas.requestRenderAll();
            saveState();
        } else {
            console.error("[Ungrouping] 'toActiveSelection' failed.");
        }

    }, [fabricCanvas, saveState]);

    return {
        groupSelection,
        ungroupSelection
    };
}
