import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight, Type } from "lucide-react";

// Common text colors
const COLORS = ["#000000", "#ff4757", "#1e90ff", "#2ed573", "#ffa502"];
// Common font families
const FONTS = ["Inter", "Arial", "Times New Roman", "Courier New"];

export function TextStylePanel({ element, updateElement }) {
    // Derive state from element
    const color = element.style?.stroke || element.style?.fill || "#000000"; // Engine text uses strokeColor
    const fontSize = element.font?.size || 20;
    const fontFamily = element.font?.family || "Inter";
    const textAlign = element.font?.align || 'left';

    return (
        <div className="space-y-8">
            {/* TYPOGRAPHY SECTION */}
            <div className="space-y-5">
                <h4 className="text-[11px] uppercase text-neutral-400 tracking-widest font-semibold">Typography</h4>

                {/* Font Family & Alignment */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[13px] font-medium text-neutral-600">Font</span>
                        <ToggleGroup
                            type="single"
                            size="sm"
                            value={textAlign}
                            onValueChange={(v) => v && updateElement({ font: { ...element.font, align: v } })}
                            className="scale-90 origin-right"
                        >
                            <ToggleGroupItem value="left" title="Align Left"><AlignLeft className="h-3.5 w-3.5" /></ToggleGroupItem>
                            <ToggleGroupItem value="center" title="Align Center"><AlignCenter className="h-3.5 w-3.5" /></ToggleGroupItem>
                            <ToggleGroupItem value="right" title="Align Right"><AlignRight className="h-3.5 w-3.5" /></ToggleGroupItem>
                        </ToggleGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                        {FONTS.map(font => (
                            <Button
                                key={font}
                                variant={fontFamily === font ? "default" : "outline"}
                                size="sm"
                                className="text-[11px] h-8 justify-start px-3 overflow-hidden text-ellipsis whitespace-nowrap shadow-sm"
                                style={{ fontFamily: font }}
                                onClick={() => updateElement({ font: { ...element.font, family: font } })}
                            >
                                {font}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Font Size & Color */}
                <div className="space-y-4 pt-2">
                    {/* Size */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[13px] font-medium text-neutral-600 flex items-center gap-1.5"><Type className="h-3.5 w-3.5" /> Size</span>
                            <span className="text-xs font-mono text-neutral-400">{fontSize}px</span>
                        </div>
                        <Slider
                            value={[fontSize]}
                            min={10}
                            max={100}
                            step={1}
                            onValueChange={([v]) => updateElement({ font: { ...element.font, size: v } })}
                            className="py-1"
                        />
                    </div>

                    {/* Color */}
                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[13px] font-medium text-neutral-600">Color</span>
                        </div>
                        <div className="flex gap-2 flex-wrap mt-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    className={`h-7 w-7 rounded-full shadow-sm border border-black/5 transition-all outline-none ${color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => updateElement({ style: { ...element.style, stroke: c, fill: c } })}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Opacity */}
                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center">
                            <span className="text-[13px] font-medium text-neutral-600 flex items-center gap-1.5">Opacity</span>
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
            </div>
        </div>
    );
}
