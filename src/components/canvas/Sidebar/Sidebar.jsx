import { FreeHandStylePanel } from "./FreehandStylePanel";
import { ShapeStylePanel } from "./ShapeStylePanel";
import { TextStylePanel } from "./TextStylePanel";
import { ArrangementPanel } from "./ArrangementPanel";

const SHAPE_TOOLS = ["rectangle", "diamond", "ellipse", "line", "arrow"];

export function Sidebar({
  selectedElement,
  updateElement,
  layerActions,
  groupActions,
  onAddToLibrary
}) {
  if (!selectedElement) return null;

  const type = selectedElement.type;

  const isFreehand = type === "path" || type === "pencil";
  const isText = ["i-text", "text", "textbox"].includes(type);
  const isShape = ["rect", "rectangle", "ellipse", "line", "triangle", "circle", "group", "diamond", "polygon", "arrow", "activeSelection"].includes(type);

  if (!isFreehand && !isShape && !isText) return null;

  return (
    <div className="space-y-8 bg-white/95 backdrop-blur-2xl rounded-2xl p-6 text-neutral-900 shadow-xl border border-black/5">

      {isFreehand && (
        <FreeHandStylePanel
          element={selectedElement}
          updateElement={updateElement}
        />
      )}

      {isFreehand && (
        <ArrangementPanel
          selectedElement={selectedElement}
          layerActions={layerActions}
          groupActions={groupActions}
          onAddToLibrary={onAddToLibrary}
        />
      )}

      {isText && (
        <>
          <TextStylePanel
            element={selectedElement}
            updateElement={updateElement}
          />
          <ArrangementPanel
            selectedElement={selectedElement}
            layerActions={layerActions}
            groupActions={groupActions}
            onAddToLibrary={onAddToLibrary}
          />
        </>
      )}

      {isShape && (
        <>
          {!['activeSelection', 'group'].includes(type) && (
            <ShapeStylePanel
              element={selectedElement}
              updateElement={updateElement}
            />
          )}
          <ArrangementPanel
            selectedElement={selectedElement}
            layerActions={layerActions}
            groupActions={groupActions}
            onAddToLibrary={onAddToLibrary}
          />
        </>
      )}
    </div>
  );
}
