import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

// Common text colors
const COLORS = ["#000000", "#ff4757", "#1e90ff", "#2ed573", "#ffa502"];
// Common font families
const FONTS = ["Inter", "Arial", "Times New Roman", "Courier New"];

export function TextStylePanel({ element, updateElement }) {
    // Derive state from element
    const color = element.fill || "#000000"; // Text color is 'fill' in Fabric
    const fontSize = element.fontSize || 20;
    const fontFamily = element.fontFamily || "Inter";

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold">Text Style</h4>
            <Separator />

            {/* Text Color */}
            <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Color</span>
                <div className="flex gap-2">
                    {COLORS.map((c) => (
                        <Button
                            key={c}
                            size="icon"
                            variant={color === c ? "default" : "outline"}
                            style={{ backgroundColor: c }}
                            onClick={() => updateElement({ fill: c })}
                        />
                    ))}
                </div>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Font Size ({fontSize}px)</span>
                <Slider
                    value={[fontSize]}
                    min={10}
                    max={100}
                    step={1}
                    onValueChange={([v]) => updateElement({ fontSize: v })}
                />
            </div>

            {/* Font Family */}
            <div className="space-y-2">
                <span className="text-xs text-muted-foreground">Font Family</span>
                <div className="flex flex-wrap gap-2">
                    {FONTS.map(font => (
                        <Button
                            key={font}
                            variant={fontFamily === font ? "default" : "outline"}
                            size="sm"
                            className="text-xs"
                            style={{ fontFamily: font }}
                            onClick={() => updateElement({ fontFamily: font })}
                        >
                            {font}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
