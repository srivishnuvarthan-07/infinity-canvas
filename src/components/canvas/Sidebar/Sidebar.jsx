import { FreeHandStylePanel } from "./FreeHandStylePanel";
import { ShapeStylePanel } from "./ShapeStylePanel";
import { ArrangementPanel } from "./ArrangementPanel";
import { Separator } from "@/components/ui/separator";

const SHAPE_TOOLS = ["rectangle", "diamond", "ellipse", "line", "arrow"];

export function Sidebar({
  selectedElement,
  updateElement,
  layerActions
}) {
  if (!selectedElement) return null;

  const type = selectedElement.type;

  // Explicitly exclude text types from generic sidebar to avoid confusion
  if (["i-text", "text", "textbox"].includes(type)) return null;

  const isFreehand = type === "path" || type === "pencil";
  const isShape = ["rect", "ellipse", "line", "triangle", "circle", "group", "diamond", "polygon", "arrow", "activeSelection"].includes(type);

  // If selection is neither (e.g. image or text), support might be added later
  if (!isFreehand && !isShape) return null;

  return (
    <aside className="w-56 rounded-xl bg-card shadow-lg p-4 space-y-4">
      {/* STYLE PANEL */}
      {isFreehand && (
        <FreeHandStylePanel
          element={selectedElement}
          updateElement={updateElement}
        />
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
          />
        </>
      )}
    </aside>
  );
}
