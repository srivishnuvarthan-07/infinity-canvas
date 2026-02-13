import { FreeHandStylePanel } from "./FreeHandStylePanel";
import { ShapeStylePanel } from "./ShapeStylePanel";
import { TextStylePanel } from "./TextStylePanel";
import { ArrangementPanel } from "./ArrangementPanel";
import { Separator } from "@/components/ui/separator";

const SHAPE_TOOLS = ["rectangle", "diamond", "ellipse", "line", "arrow"];

export function Sidebar({
  selectedElement,
  updateElement,
  layerActions,
  groupActions
}) {
  if (!selectedElement) return null;

  const type = selectedElement.type;

  // Explicitly exclude text types from generic sidebar to avoid confusion
  // if (["i-text", "text", "textbox"].includes(type)) return null; // REMOVED

  const isFreehand = type === "path" || type === "pencil";
  const isText = ["i-text", "text", "textbox"].includes(type);
  const isShape = ["rect", "rectangle", "ellipse", "line", "triangle", "circle", "group", "diamond", "polygon", "arrow", "activeSelection"].includes(type);

  // If selection is neither (e.g. image or text), support might be added later
  if (!isFreehand && !isShape && !isText) return null;

  return (
    <div className="space-y-4">
      {/* STYLE PANEL */}
      {isFreehand && (
        <FreeHandStylePanel
          element={selectedElement}
          updateElement={updateElement}
        />
      )}

      {isText && (
        <>
          <TextStylePanel
            element={selectedElement}
            updateElement={updateElement}
          />
          <Separator className="my-2" />
          <ArrangementPanel
            selectedElement={selectedElement}
            layerActions={layerActions}
            groupActions={groupActions}
          />
        </>
      )}

      {isShape && (
        <>
          {/* Only show ShapeStylePanel for single, stylable shapes. Explicitly exclude activeSelection to prevent crashes. */}
          {!['activeSelection', 'group'].includes(type) && (
            <>
              <ShapeStylePanel
                element={selectedElement}
                updateElement={updateElement}
              />
              <Separator className="my-2" />
            </>
          )}
          <ArrangementPanel
            selectedElement={selectedElement}
            layerActions={layerActions}
            groupActions={groupActions}
          />
        </>
      )}
    </div>
  );
}
