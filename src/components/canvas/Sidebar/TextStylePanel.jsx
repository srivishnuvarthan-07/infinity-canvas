import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight, Type, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ColorPicker } from "./ColorPicker";

// Common text colors
const COLORS = ["#000000", "#ff4757", "#1e90ff", "#2ed573", "#ffa502"];

// Curated font list — each name must match a valid Google/system font
const FONTS = [
    { name: "Inter", label: "Inter" },
    { name: "Poppins", label: "Poppins" },
    { name: "Roboto Slab", label: "Roboto Slab" },
    { name: "JetBrains Mono", label: "JetBrains Mono" },
    { name: "Caveat", label: "Caveat" },
    { name: "Playfair Display", label: "Playfair Display" },
    { name: "Orbitron", label: "Orbitron" },
    { name: "Impact", label: "Impact" },
    { name: "Comic Sans MS", label: "Comic Sans MS" },
    { name: "Georgia", label: "Georgia" },
    { name: "Arial", label: "Arial" },
    { name: "Courier New", label: "Courier New" },
];

// Load Google Fonts once on mount
const GOOGLE_FONTS_URL = `https://fonts.googleapis.com/css2?family=${FONTS.filter(f => !["Impact", "Arial", "Georgia", "Comic Sans MS", "Courier New"].includes(f.name))
        .map(f => f.name.replace(/ /g, "+"))
        .join("&family=")
    }&display=swap`;

function ensureGoogleFontsLoaded() {
    if (!document.getElementById("gf-font-picker")) {
        const link = document.createElement("link");
        link.id = "gf-font-picker";
        link.rel = "stylesheet";
        link.href = GOOGLE_FONTS_URL;
        document.head.appendChild(link);
    }
}

function FontDropdown({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => { ensureGoogleFontsLoaded(); }, []);

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const selected = FONTS.find(f => f.name === value) || FONTS[0];

    return (
        <div ref={ref} className="relative w-full">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full h-9 flex items-center justify-between px-3 border border-neutral-200 rounded-lg bg-white hover:border-indigo-400 transition-colors text-[13px] text-neutral-700 shadow-sm"
                style={{ fontFamily: selected.name }}
            >
                <span className="truncate">{selected.label}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-xl overflow-hidden">
                    <div className="max-h-56 overflow-y-auto py-1">
                        {FONTS.map(font => (
                            <button
                                key={font.name}
                                type="button"
                                onClick={() => { onChange(font.name); setOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-[13px] hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${font.name === value ? "bg-indigo-50 text-indigo-700 font-medium" : "text-neutral-700"}`}
                                style={{ fontFamily: font.name }}
                            >
                                {font.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function TextStylePanel({ element, updateElement }) {
    // Derive state from element
    const color = element.style?.stroke || element.style?.fill || "#000000";
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

                    <FontDropdown
                        value={fontFamily}
                        onChange={(name) => updateElement({ font: { ...element.font, family: name } })}
                    />
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
                        <ColorPicker
                            label="Color"
                            value={color}
                            onChange={(c) => updateElement({ style: { ...element.style, stroke: c, fill: c } })}
                        />
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
