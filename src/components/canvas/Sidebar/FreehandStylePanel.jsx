import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

const COLORS = ["#ffffff", "#ff4757", "#1e90ff", "#2ed573", "#ffa502"];

export function FreeHandStylePanel({ element, updateElement }) {
  const strokeColor = element.stroke || "#000000";
  const strokeWidth = element.strokeWidth || 2;

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
            max={20}
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
    </div>
  );
}
