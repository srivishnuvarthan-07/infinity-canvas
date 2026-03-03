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
  const strokeColor = element.style?.stroke || "#000000";
  const strokeWidth = element.style?.strokeWidth || 2;

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
            onValueChange={([v]) => updateElement({ style: { ...element.style, strokeWidth: v } })}
            className="py-1"
          />

          <div className="flex gap-2 items-center mt-2">
            <input
              type="color"
              className="h-8 w-8 rounded cursor-pointer p-0 border-0 outline-none"
              value={strokeColor}
              onChange={(e) => updateElement({ style: { ...element.style, stroke: e.target.value } })}
              title="Stroke Color"
            />
            <input
              type="text"
              className="h-8 text-sm px-2 w-20 border rounded font-mono text-neutral-600 outline-none focus:border-indigo-500"
              value={strokeColor}
              onChange={(e) => updateElement({ style: { ...element.style, stroke: e.target.value } })}
              placeholder="#000000"
              maxLength={7}
            />
          </div>
        </div>

        {/* Fill Color */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-[13px] font-medium text-neutral-600">Fill</span>
          </div>

          <div className="flex gap-2 flex-wrap mt-2">
            <button
              className={`h-7 w-7 rounded-full shadow-sm border border-black/5 flex items-center justify-center transition-all outline-none ${element.style?.fill === "transparent" ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 bg-neutral-100' : 'bg-white hover:scale-105'}`}
              onClick={() => updateElement({ style: { ...element.style, fill: "transparent" } })}
              title="Transparent"
            >
              <Ban className="h-3.5 w-3.5 text-red-500" />
            </button>
            {COLORS.map((color) => (
              <button
                key={color}
                className={`h-7 w-7 rounded-full shadow-sm border border-black/5 transition-all outline-none ${element.style?.fill === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                style={{ backgroundColor: color }}
                onClick={() => updateElement({ style: { ...element.style, fill: color } })}
                title={color}
              />
            ))}
          </div>
        </div>

        {/* Opacity */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-[13px] font-medium text-neutral-600">Opacity</span>
            <span className="text-xs font-mono text-neutral-400">{Math.round((element.style?.opacity ?? 1) * 100)}%</span>
          </div>
          <Slider
            value={[(element.style?.opacity ?? 1) * 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={([v]) => updateElement({ style: { ...element.style, opacity: v / 100 } })}
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
              value={element.style?.fillStyle || "solid"}
              onValueChange={(v) => v && updateElement({ style: { ...element.style, fillStyle: v } })}
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
                updateElement({ strokeDashArray: dashArray, style: { ...element.style, strokeStyle: v } });
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
              value={
                element.style?.roughness === 0 ? "architect" :
                  element.style?.roughness === 1.5 ? "artist" :
                    element.style?.roughness === 2.5 ? "cartoonist" :
                      (element.sloppiness || "architect")
              }
              onValueChange={(v) => {
                if (!v) return;
                let roughness = 0;
                if (v === 'artist') roughness = 1.5;
                if (v === 'cartoonist') roughness = 2.5;
                updateElement({
                  sloppiness: v,
                  style: { ...element.style, roughness }
                });
              }}
            >
              <ToggleGroupItem value="architect" className="h-8 px-2.5" title="Architect"><Square className="h-3.5 w-3.5" /></ToggleGroupItem>
              <ToggleGroupItem value="artist" className="h-8 px-2.5" title="Artist"><PenTool className="h-3.5 w-3.5" /></ToggleGroupItem>
              <ToggleGroupItem value="cartoonist" className="h-8 px-2.5" title="Cartoonist"><Smile className="h-3.5 w-3.5" /></ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>


      </div>
    </div>
  );
}
