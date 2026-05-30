import { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, ChevronDown } from "lucide-react";

const TEXT_COLORS = ["#1a1a1a", "#ef4444", "#3b82f6", "#22c55e", "#f97316", "#8b5cf6", "#ec4899", "#f59e0b"];

const FONTS = [
    { name: "Inter",             label: "Inter",            category: "Sans" },
    { name: "Poppins",           label: "Poppins",          category: "Sans" },
    { name: "Roboto Slab",       label: "Roboto Slab",      category: "Serif" },
    { name: "JetBrains Mono",    label: "JetBrains Mono",   category: "Mono" },
    { name: "Caveat",            label: "Caveat",           category: "Hand" },
    { name: "Playfair Display",  label: "Playfair Display", category: "Serif" },
    { name: "Orbitron",          label: "Orbitron",         category: "Display" },
    { name: "Impact",            label: "Impact",           category: "Display" },
    { name: "Comic Sans MS",     label: "Comic Sans MS",    category: "Hand" },
    { name: "Georgia",           label: "Georgia",          category: "Serif" },
    { name: "Arial",             label: "Arial",            category: "Sans" },
    { name: "Courier New",       label: "Courier New",      category: "Mono" },
];

const SYSTEM_FONTS = ["Impact", "Arial", "Georgia", "Comic Sans MS", "Courier New"];
const GFONT_URL = `https://fonts.googleapis.com/css2?family=${
    FONTS.filter(f => !SYSTEM_FONTS.includes(f.name))
        .map(f => f.name.replace(/ /g, "+")).join("&family=")
}&display=swap`;

function ensureFonts() {
    if (!document.getElementById("gf-font-picker")) {
        const link = document.createElement("link");
        link.id = "gf-font-picker";
        link.rel = "stylesheet";
        link.href = GFONT_URL;
        document.head.appendChild(link);
    }
}

function Label({ children }) {
    return <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-2">{children}</span>;
}

function FontDropdown({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => { ensureFonts(); }, []);
    useEffect(() => {
        if (!open) return;
        const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [open]);

    const selected = FONTS.find(f => f.name === value) || FONTS[0];

    // Category colors
    const catColor = { Sans: "text-blue-400", Serif: "text-amber-400", Mono: "text-green-400", Hand: "text-pink-400", Display: "text-purple-400" };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="w-full h-9 flex items-center justify-between px-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-white text-neutral-800 transition-all"
                style={{ fontFamily: selected.name }}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[8px] font-bold uppercase shrink-0 ${catColor[selected.category] || "text-neutral-400"}`}>
                        {selected.category}
                    </span>
                    <span className="text-[13px] truncate">{selected.label}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 ml-1 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute z-[999] mt-1 w-full bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden">
                    <div className="max-h-52 overflow-y-auto py-1">
                        {FONTS.map(font => (
                            <button
                                key={font.name}
                                type="button"
                                onClick={() => { onChange(font.name); setOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-indigo-50 ${font.name === value ? "bg-indigo-50 text-indigo-700" : "text-neutral-700"}`}
                                style={{ fontFamily: font.name }}
                            >
                                <span className={`text-[8px] font-bold uppercase w-10 shrink-0 ${catColor[font.category] || "text-neutral-400"}`}>
                                    {font.category}
                                </span>
                                <span className="text-[13px]">{font.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function ColorSwatch({ color, selected, onClick }) {
    return (
        <button
            onClick={onClick}
            title={color}
            className={`w-6 h-6 rounded-full transition-all duration-150 hover:scale-110 active:scale-95 ${
                selected ? "ring-2 ring-offset-1 ring-indigo-500 scale-110" : "hover:ring-1 hover:ring-neutral-300 hover:ring-offset-1"
            }`}
            style={{ backgroundColor: color, border: color === "#ffffff" ? "1px solid #e5e7eb" : "none" }}
        />
    );
}

function CustomColorBtn({ value, onChange, isActive }) {
    const ref = useRef(null);
    return (
        <button title="Custom color" onClick={() => ref.current?.click()}
            className={`relative w-6 h-6 rounded-full overflow-hidden border border-black/10 transition-all duration-150 hover:scale-110 active:scale-95 ${isActive ? "ring-2 ring-offset-1 ring-indigo-500 scale-110" : "hover:ring-1 hover:ring-neutral-300 hover:ring-offset-1"}`}
            style={isActive ? { backgroundColor: value } : { background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }}
        >
            <input ref={ref} type="color" value={value || "#000000"} onChange={e => onChange(e.target.value)} className="sr-only" tabIndex={-1} />
        </button>
    );
}

// Size quick-select buttons
const SIZE_PRESETS = [12, 16, 20, 28, 36, 48, 64, 96];

export function TextStylePanel({ element, updateElement }) {
    const color      = element.style?.stroke || element.style?.fill || "#1a1a1a";
    const fontSize   = element.font?.size || 20;
    const fontFamily = element.font?.family || "Inter";
    const textAlign  = element.font?.align || "left";
    const opacity    = Math.round((element.style?.opacity ?? 1) * 100);

    const isColorPreset = TEXT_COLORS.includes(color);

    return (
        <div className="space-y-5">

            {/* Font family */}
            <div className="space-y-2">
                <Label>Typeface</Label>
                <FontDropdown value={fontFamily} onChange={name => updateElement({ font: { ...element.font, family: name } })} />
            </div>

            {/* Size + alignment in one row */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>Size</Label>
                    {/* Alignment toggle inline */}
                    <div className="flex items-center bg-neutral-100 rounded-lg p-0.5 mb-2">
                        {[
                            { v: "left",   icon: AlignLeft },
                            { v: "center", icon: AlignCenter },
                            { v: "right",  icon: AlignRight },
                        ].map(({ v, icon: Icon }) => (
                            <button
                                key={v}
                                onClick={() => updateElement({ font: { ...element.font, align: v } })}
                                className={`w-7 h-6 flex items-center justify-center rounded-md transition-all duration-150 ${
                                    textAlign === v
                                        ? "bg-white text-indigo-600 shadow-sm"
                                        : "text-neutral-400 hover:text-neutral-600"
                                }`}
                            >
                                <Icon className="w-3 h-3" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Size slider + current value */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] text-neutral-500">Size</span>
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                min={8} max={200}
                                value={fontSize}
                                onChange={e => updateElement({ font: { ...element.font, size: Math.max(8, Math.min(200, Number(e.target.value))) } })}
                                className="w-12 h-6 text-center text-[11px] font-mono border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:border-indigo-400"
                            />
                            <span className="text-[10px] text-neutral-400">px</span>
                        </div>
                    </div>
                    <Slider
                        value={[fontSize]} min={8} max={120} step={1}
                        onValueChange={([v]) => updateElement({ font: { ...element.font, size: v } })}
                        className="py-0.5"
                    />
                </div>

                {/* Quick size presets */}
                <div className="flex gap-1 flex-wrap mt-1">
                    {SIZE_PRESETS.map(s => (
                        <button
                            key={s}
                            onClick={() => updateElement({ font: { ...element.font, size: s } })}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all duration-150 border ${
                                fontSize === s
                                    ? "bg-indigo-50 border-indigo-300 text-indigo-600"
                                    : "bg-white border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {TEXT_COLORS.map(c => (
                        <ColorSwatch key={c} color={c} selected={color === c} onClick={() => updateElement({ style: { ...element.style, stroke: c, fill: c } })} />
                    ))}
                    <CustomColorBtn value={color} onChange={c => updateElement({ style: { ...element.style, stroke: c, fill: c } })} isActive={!isColorPreset} />
                    {/* Hex display */}
                    <span className="text-[10px] font-mono text-neutral-400 ml-1">{color}</span>
                </div>
            </div>

            {/* Opacity */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-600 font-medium">Opacity</span>
                    <span className="text-[10px] font-mono bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">{opacity}%</span>
                </div>
                <Slider
                    value={[opacity]} min={0} max={100} step={1}
                    onValueChange={([v]) => updateElement({ style: { ...element.style, opacity: v / 100 } })}
                    className="py-0.5"
                />
            </div>
        </div>
    );
}
