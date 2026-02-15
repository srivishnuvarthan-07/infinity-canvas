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
    const color = element.fill || "#000000"; // Text color is 'fill' in Fabric
    const fontSize = element.fontSize || 20;
    const fontFamily = element.fontFamily || "Inter";
    const textAlign = element.textAlign || 'left';

    return (
        <div className="space-y-4">
            {/* <h4 className="text-sm font-semibold">Text Style</h4> */}

            {/* Font Family & Alignment Row */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Font</span>
                    {/* Alignment Icons */}
                    <ToggleGroup
                        type="single"
                        size="sm"
                        value={textAlign}
                        onValueChange={(v) => v && updateElement({ textAlign: v })}
                        className="scale-90 origin-right"
                    >
                        <ToggleGroupItem value="left"><AlignLeft className="h-3 w-3" /></ToggleGroupItem>
                        <ToggleGroupItem value="center"><AlignCenter className="h-3 w-3" /></ToggleGroupItem>
                        <ToggleGroupItem value="right"><AlignRight className="h-3 w-3" /></ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <div className="grid grid-cols-2 gap-1">
                    {FONTS.map(font => (
                        <Button
                            key={font}
                            variant={fontFamily === font ? "default" : "outline"}
                            size="sm"
                            className="text-xs h-7 justify-start px-2 overflow-hidden text-ellipsis whitespace-nowrap"
                            style={{ fontFamily: font }}
                            onClick={() => updateElement({ fontFamily: font })}
                        >
                            {font}
                        </Button>
                    ))}
                </div>
            </div>

            <Separator />

            {/* Font Size & Color */}
            <div className="space-y-4">
                {/* Size */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Type className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-mono text-muted-foreground">{fontSize}px</span>
                    </div>
                    <Slider
                        value={[fontSize]}
                        min={10}
                        max={100}
                        step={1}
                        onValueChange={([v]) => updateElement({ fontSize: v })}
                        className="py-1"
                    />
                </div>

                {/* Color */}
                <div className="flex gap-1 flex-wrap">
                    {COLORS.map((c) => (
                        <Button
                            key={c}
                            size="icon"
                            className="h-6 w-6 p-0 border border-border/50"
                            style={{ backgroundColor: c }}
                            onClick={() => updateElement({ fill: c })}
                        >
                            {color === c && <div className="w-1.5 h-1.5 rounded-full bg-white ring-1 ring-black/50" />}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
