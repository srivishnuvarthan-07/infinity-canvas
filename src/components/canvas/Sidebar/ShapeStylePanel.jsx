import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const COLORS = ["#000000", "#ff4757", "#1e90ff", "#2ed573", "#ffa502"];

export function ShapeStylePanel({ element, updateElement }) {
  // Derive state from element
  const strokeColor = element.stroke || "#000000";
  const strokeWidth = element.strokeWidth || 2;

  // Determine stroke type from strokeDashArray
  let strokeStyle = "solid";
  if (element.strokeDashArray) {
    if (element.strokeDashArray[0] > 5) strokeStyle = "dashed";
    else strokeStyle = "dotted";
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Shape Style</h4>
      <Separator />

      {/* Fill Color */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Fill Color</span>
        <div className="flex gap-2">
          {COLORS.map((color) => (
            <Button
              key={color}
              size="icon"
              variant={element.fillColor === color ? "default" : "outline"}
              style={{ backgroundColor: color }}
              onClick={() => updateElement({ fillColor: color })}
            />
          ))}
          <Button
            size="icon"
            variant={element.fillColor === "transparent" ? "default" : "outline"}
            className="bg-transparent border border-dashed border-foreground"
            onClick={() => updateElement({ fillColor: "transparent" })}
            title="Transparent"
          />
        </div>
      </div>

      {/* Fill Style */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Fill Style</span>
        <ToggleGroup
          type="single"
          value={element.fillStyle || "solid"}
          onValueChange={(v) => {
            if (v) updateElement({ fillStyle: v });
          }}
        >
          <ToggleGroupItem value="solid">Solid</ToggleGroupItem>
          <ToggleGroupItem value="hachure">Hachure</ToggleGroupItem>
          <ToggleGroupItem value="cross-hatch">Cross-Hatch</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Stroke Color */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Stroke Color</span>
        <div className="flex gap-2">
          {COLORS.map((color) => (
            <Button
              key={color}
              size="icon"
              variant={strokeColor === color ? "default" : "outline"}
              style={{ backgroundColor: color }}
              onClick={() => updateElement({ stroke: color })}
            />
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Stroke Width</span>
        <Slider
          value={[strokeWidth]}
          min={1}
          max={10}
          step={1}
          onValueChange={([v]) => updateElement({ strokeWidth: v })}
        />
      </div>

      {/* Stroke Type */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Stroke Type</span>
        <ToggleGroup
          type="single"
          value={strokeStyle}
          onValueChange={(v) => {
            if (!v) return;
            let dashArray = null;
            if (v === 'dashed') dashArray = [10, 5];
            if (v === 'dotted') dashArray = [2, 2];
            updateElement({ strokeDashArray: dashArray });
          }}
        >
          <ToggleGroupItem value="solid">Solid</ToggleGroupItem>
          <ToggleGroupItem value="dashed">Dashed</ToggleGroupItem>
          <ToggleGroupItem value="dotted">Dotted</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
