import { FreehandStylePanel } from "./FreehandStylePanel";
import { ShapeStylePanel } from "./ShapeStylePanel";

const SHAPE_TOOLS = ["rectangle", "ellipse", "line", "arrow"];

export function Sidebar({
  activeTool,
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  strokeStyle,
  setStrokeStyle,
}) {
  const showSidebar = activeTool === "draw" || SHAPE_TOOLS.includes(activeTool);

  if (!showSidebar) return null;

  return (
    <aside className="w-56 rounded-xl bg-card shadow-lg p-4 space-y-4">
      {/* STYLE PANEL */}
      {activeTool === "draw" && (
        <FreehandStylePanel
          strokeColor={strokeColor}
          setStrokeColor={setStrokeColor}
          strokeWidth={strokeWidth}
          setStrokeWidth={setStrokeWidth}
        />
      )}

      {SHAPE_TOOLS.includes(activeTool) && (
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
