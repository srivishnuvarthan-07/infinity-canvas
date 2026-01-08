import { FreeHandStylePanel } from "./FreeHandStylePanel";
import { ShapeStylePanel } from "./ShapeStylePanel";

const SHAPE_TOOLS = ["rectangle", "diamond", "ellipse", "line", "arrow"];

export function Sidebar({
  selectedElement, // Updated prop
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  strokeStyle,
  setStrokeStyle,
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
          strokeColor={strokeColor}
          setStrokeColor={setStrokeColor}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
        />
      )}

      {isShape && (
        <ShapeStylePanel
          strokeColor={strokeColor}
          setStrokeColor={setStrokeColor}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
          strokeStyle={strokeStyle}
          setStrokeStyle={setStrokeStyle}
        />
      )}
    </aside>
  );
}
