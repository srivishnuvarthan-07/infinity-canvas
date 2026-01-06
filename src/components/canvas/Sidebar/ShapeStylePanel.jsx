import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const COLORS = ["#ffffff", "#ff4757", "#1e90ff", "#2ed573", "#ffa502"];

export function ShapeStylePanel({
  strokeColor,
  setStrokeColor,
  strokeWidth,
  setStrokeWidth,
  strokeStyle,
  setStrokeStyle,
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Shape Style</h4>
      <Separator />

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
              onClick={() => setStrokeColor(color)}
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
          onValueChange={([v]) => setStrokeWidth(v)}
        />
      </div>

      {/* Stroke Type */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Stroke Type</span>
        <ToggleGroup
          type="single"
          value={strokeStyle}
          onValueChange={(v) => v && setStrokeStyle(v)}
        >
          <ToggleGroupItem value="solid">Solid</ToggleGroupItem>
          <ToggleGroupItem value="dashed">Dashed</ToggleGroupItem>
          <ToggleGroupItem value="dotted">Dotted</ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
