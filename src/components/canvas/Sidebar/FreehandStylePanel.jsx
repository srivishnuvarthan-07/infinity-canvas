import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

const COLORS = ["#ffffff", "#ff4757", "#1e90ff", "#2ed573", "#ffa502"];

export function FreeHandStylePanel({ element, updateElement }) {
  const strokeColor = element.stroke || "#000000";
  const strokeWidth = element.strokeWidth || 2;

  return (
    <div className="space-y-4">
      {/* <h4 className="text-sm font-semibold">Freehand Style</h4> */}
      {/* <Separator /> */}

      {/* Stroke Color */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Color</span>
        <div className="flex gap-1 flex-wrap">
          {COLORS.map((color) => (
            <Button
              key={color}
              size="icon"
              className="h-6 w-6 p-0 border border-border/50"
              style={{ backgroundColor: color }}
              onClick={() => updateElement({ stroke: color, strokeColor: color })}
            >
              {strokeColor === color && <div className="w-1.5 h-1.5 rounded-full bg-white ring-1 ring-black/50" />}
            </Button>
          ))}
        </div>
      </div>

      {/* Stroke Width */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Thickness</span>
          <span className="text-xs font-mono text-muted-foreground">{strokeWidth}px</span>
        </div>
        <Slider
          value={[strokeWidth]}
          min={1}
          max={20}
          step={1}
          onValueChange={([v]) => updateElement({ strokeWidth: v })}
          className="py-2"
        />
      </div>
    </div>
  );
}
