import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

const COLORS = ["#ffffff", "#ff4757", "#1e90ff", "#2ed573", "#ffa502"];

export function FreeHandStylePanel({ element, updateElement }) {
  const strokeColor = element.stroke || "#000000";
  const strokeWidth = element.strokeWidth || 2;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Freehand Style</h4>
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
    </div>
  );
}
