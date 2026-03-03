import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight, Type } from "lucide-react";

// Common text colors
const COLORS = ["#000000", "#ff4757", "#1e90ff", "#2ed573", "#ffa502"];
// Common font families
const FONTS = ["Inter", "Poppins", "Roboto Slab", "JetBrains Mono", "Caveat", "Playfair Display", "Orbitron", "Impact", "Comic Sans MS"];

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

                    <div className="flex flex-col gap-1">
                        <input
                            type="text"
                            list="font-list"
                            className="h-8 w-full border rounded text-[13px] px-2 outline-none focus:border-indigo-500 bg-white cursor-pointer"
                            placeholder="e.g. Inter, Arial"
                            value={fontFamily}
                            onChange={(e) => updateElement({ font: { ...element.font, family: e.target.value } })}
                        />
                        <datalist id="font-list">
                            {FONTS.map(font => (
                                <option key={font} value={font} />
                            ))}
                        </datalist>
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
                        <div className="flex gap-2 items-center mt-2">
                            <input
                                type="color"
                                className="h-8 w-8 rounded cursor-pointer p-0 border-0 outline-none"
                                value={color}
                                onChange={(e) => updateElement({ style: { ...element.style, stroke: e.target.value, fill: e.target.value } })}
                                title="Text Color"
                            />
                            <input
                                type="text"
                                className="h-8 text-sm px-2 w-20 border rounded font-mono text-neutral-600 outline-none focus:border-indigo-500"
                                value={color}
                                onChange={(e) => updateElement({ style: { ...element.style, stroke: e.target.value, fill: e.target.value } })}
                                placeholder="#000000"
                                maxLength={7}
                            />
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
