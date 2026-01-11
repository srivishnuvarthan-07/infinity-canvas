import { FreeHandStylePanel } from "./FreeHandStylePanel";
import { ShapeStylePanel } from "./ShapeStylePanel";
import { ArrangementPanel } from "./ArrangementPanel";

const SHAPE_TOOLS = ["rectangle", "diamond", "ellipse", "line", "arrow"];

export function Sidebar({
  selectedElement,
  updateElement,
  layerActions,
  groupActions
}) {
  if (!selectedElement) return null;

  const type = selectedElement.type;
  const isFreehand = type === "path" || type === "pencil";
  const isShape = ["rect", "ellipse", "line", "triangle", "circle", "group", "diamond", "polygon", "arrow"].includes(type);

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
          <ShapeStylePanel
            element={selectedElement}
            updateElement={updateElement}
          />
          <ArrangementPanel
            selectedElement={selectedElement}
            layerActions={layerActions}
            groupActions={groupActions}
          />
        </>
      )}
    </aside>
  );
}
