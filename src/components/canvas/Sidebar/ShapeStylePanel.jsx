import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Square,
  PenTool,
  Smile,
  Hash,
  Grid3X3,
  MoreHorizontal,
  Minus,
  Ban
} from "lucide-react";

const COLORS = ["#000000", "#ff4757", "#1e90ff", "#2ed573", "#ffa502"];

export function ShapeStylePanel({ element, updateElement }) {
  // Derive state from element
  const strokeColor = element.stroke || element.strokeColor || "#000000";
  const strokeWidth = element.strokeWidth || 2;

  // Determine stroke type from strokeDashArray OR strokeStyle
  let strokeStyle = element.strokeStyle || "solid";
  if (!element.strokeStyle && element.strokeDashArray) {
    if (element.strokeDashArray[0] > 5) strokeStyle = "dashed";
    else strokeStyle = "dotted";
  }

  return (
    <div className="space-y-4">
      {/* <h4 className="text-sm font-semibold">Shape Style</h4> */}
      {/* Removed Header to save space */}

      {/* Sloppiness & Stroke Type (Row 1) */}
      <div className="flex justify-between items-center gap-2">
        {/* Sloppiness */}
        <ToggleGroup
          type="single"
          size="sm"
          value={element.sloppiness || "architect"}
          onValueChange={(v) => v && updateElement({ sloppiness: v })}
        >
          <ToggleGroupItem value="architect" title="Architect (Clean)">
            <Square className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="artist" title="Artist (Sketchy)">
            <PenTool className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="cartoonist" title="Cartoonist">
            <Smile className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <Separator orientation="vertical" className="h-6" />

        {/* Stroke Type */}
        <ToggleGroup
          type="single"
          size="sm"
          value={strokeStyle}
          onValueChange={(v) => {
            if (!v) return;
            let dashArray = null;
            if (v === 'dashed') dashArray = [10, 5];
            if (v === 'dotted') dashArray = [2, 2];
            updateElement({ strokeDashArray: dashArray, strokeStyle: v });
          }}
        >
          <ToggleGroupItem value="solid" title="Solid">
            <Minus className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="dashed" title="Dashed">
            <Minus className="h-4 w-4 border-dashed border-b-2 border-current" />
            {/* Icon hack or use generic icon */}
            <div className="flex space-x-0.5">
              <div className="w-1 h-0.5 bg-current"></div>
              <div className="w-1 h-0.5 bg-current"></div>
              <div className="w-1 h-0.5 bg-current"></div>
            </div>
          </ToggleGroupItem>
          <ToggleGroupItem value="dotted" title="Dotted">
            <MoreHorizontal className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Separator />

      {/* Fill Color & Style (Compact) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-neutral-500">Fill</span>
          {/* Fill Style Icons */}
          <ToggleGroup
            type="single"
            size="sm"
            value={element.fillStyle || "solid"}
            onValueChange={(v) => v && updateElement({ fillStyle: v })}
            className="scale-90 origin-right" // Slightly smaller
          >
            <ToggleGroupItem value="solid" title="Solid"><Square className="h-3 w-3 fill-current" /></ToggleGroupItem>
            <ToggleGroupItem value="hachure" title="Hachure"><Hash className="h-3 w-3" /></ToggleGroupItem>
            <ToggleGroupItem value="cross-hatch" title="Cross-Hatch"><Grid3X3 className="h-3 w-3" /></ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Colors Row */}
        <div className="flex gap-1 flex-wrap">
          <Button
            size="icon"
            variant={element.fillColor === "transparent" ? "default" : "secondary"}
            className="h-6 w-6"
            onClick={() => updateElement({ fillColor: "transparent", fill: '' })}
            title="Transparent"
          >
            <Ban className="h-3 w-3 text-red-500" />
          </Button>
          {COLORS.map((color) => (
            <Button
              key={color}
              size="icon"
              className="h-6 w-6 p-0 border border-border/50"
              style={{ backgroundColor: color }}
              onClick={() => updateElement({ fillColor: color, fill: color })}
            >
              {element.fillColor === color && <div className="w-1.5 h-1.5 rounded-full bg-white ring-1 ring-black/50" />}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Stroke Color & Width */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-neutral-500">Stroke</span>
          <span className="text-xs font-mono text-neutral-500">{strokeWidth}px</span>
        </div>

        {/* Stroke Width Slider */}
        <Slider
          value={[strokeWidth]}
          min={1}
          max={10}
          step={1}
          onValueChange={([v]) => updateElement({ strokeWidth: v })}
          className="py-2"
        />

        {/* Colors Row */}
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
    </div>
  );
}
