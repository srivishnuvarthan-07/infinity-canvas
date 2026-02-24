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
  Ban,
  Activity,
  Ruler
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
    <div className="space-y-8">
      {/* APPEARANCE SECTION */}
      <div className="space-y-5">
        <h4 className="text-[11px] uppercase text-neutral-400 tracking-widest font-semibold">Appearance</h4>

        {/* Stroke Color & Width */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[13px] font-medium text-neutral-600">Stroke</span>
            <span className="text-xs font-mono text-neutral-400">{strokeWidth}px</span>
          </div>

          <Slider
            value={[strokeWidth]}
            min={1}
            max={10}
            step={1}
            onValueChange={([v]) => updateElement({ strokeWidth: v })}
            className="py-1"
          />

          <div className="flex gap-2 flex-wrap mt-2">
            {COLORS.map((color) => (
              <button
                key={color}
                className={`h-7 w-7 rounded-full shadow-sm border border-black/5 transition-all outline-none ${strokeColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: color }}
                onClick={() => updateElement({ stroke: color, strokeColor: color })}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Fill Color */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-[13px] font-medium text-neutral-600">Fill</span>
          </div>

          <div className="flex gap-2 flex-wrap mt-2">
            <button
              className={`h-7 w-7 rounded-full shadow-sm border border-black/5 flex items-center justify-center transition-all outline-none ${element.fillColor === "transparent" ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 bg-neutral-100' : 'bg-white hover:scale-105'}`}
              onClick={() => updateElement({ fillColor: "transparent", fill: '' })}
              title="Transparent"
            >
              <Ban className="h-3.5 w-3.5 text-red-500" />
            </button>
            {COLORS.map((color) => (
              <button
                key={color}
                className={`h-7 w-7 rounded-full shadow-sm border border-black/5 transition-all outline-none ${element.fillColor === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: color }}
                onClick={() => updateElement({ fillColor: color, fill: color })}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Opacity */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-[13px] font-medium text-neutral-600">Opacity</span>
            <span className="text-xs font-mono text-neutral-400">{Math.round((element.opacity ?? 1) * 100)}%</span>
          </div>
          <Slider
            value={[(element.opacity ?? 1) * 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={([v]) => updateElement({ opacity: v / 100 })}
            className="py-1"
          />
        </div>
      </div>

      {/* STYLE SECTION */}
      <div className="space-y-5">
        <h4 className="text-[11px] uppercase text-neutral-400 tracking-widest font-semibold">Style</h4>

        {/* Fill Style & Stroke Style */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-neutral-600">Pattern</span>
            <ToggleGroup
              type="single"
              size="sm"
              value={element.fillStyle || "solid"}
              onValueChange={(v) => v && updateElement({ fillStyle: v })}
            >
              <ToggleGroupItem value="solid" className="h-8 px-2.5" title="Solid"><Square className="h-3.5 w-3.5 fill-current" /></ToggleGroupItem>
              <ToggleGroupItem value="hachure" className="h-8 px-2.5" title="Hachure"><Hash className="h-3.5 w-3.5" /></ToggleGroupItem>
              <ToggleGroupItem value="cross-hatch" className="h-8 px-2.5" title="Cross-Hatch"><Grid3X3 className="h-3.5 w-3.5" /></ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-neutral-600">Edges</span>
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
              <ToggleGroupItem value="solid" className="h-8 px-2.5" title="Solid"><Minus className="h-3.5 w-3.5" /></ToggleGroupItem>
              <ToggleGroupItem value="dashed" className="h-8 px-2.5" title="Dashed">
                <div className="flex space-x-0.5">
                  <div className="w-1.5 h-0.5 bg-current"></div>
                  <div className="w-1.5 h-0.5 bg-current"></div>
                  <div className="w-1.5 h-0.5 bg-current"></div>
                </div>
              </ToggleGroupItem>
              <ToggleGroupItem value="dotted" className="h-8 px-2.5" title="Dotted"><MoreHorizontal className="h-3.5 w-3.5" /></ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-neutral-600">Sloppiness</span>
            <ToggleGroup
              type="single"
              size="sm"
              value={element.sloppiness || "architect"}
              onValueChange={(v) => v && updateElement({ sloppiness: v })}
            >
              <ToggleGroupItem value="architect" className="h-8 px-2.5" title="Architect"><Square className="h-3.5 w-3.5" /></ToggleGroupItem>
              <ToggleGroupItem value="artist" className="h-8 px-2.5" title="Artist"><PenTool className="h-3.5 w-3.5" /></ToggleGroupItem>
              <ToggleGroupItem value="cartoonist" className="h-8 px-2.5" title="Cartoonist"><Smile className="h-3.5 w-3.5" /></ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {element.type === 'connector' && (
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-neutral-600">Connection</span>
            <ToggleGroup
              type="single"
              size="sm"
              value={element.arrowType || "straight"}
              onValueChange={(v) => v && updateElement({ arrowType: v })}
            >
              <ToggleGroupItem value="straight" className="h-8 px-2.5" title="Straight"><Ruler className="h-3.5 w-3.5" /></ToggleGroupItem>
              <ToggleGroupItem value="curved" className="h-8 px-2.5" title="Curved"><Activity className="h-3.5 w-3.5" /></ToggleGroupItem>
            </ToggleGroup>
          </div>
        )}
      </div>
    </div>
  );
}
