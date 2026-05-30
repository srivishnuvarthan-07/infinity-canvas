import { useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";

const STROKE_COLORS = ["#1a1a1a", "#ef4444", "#3b82f6", "#22c55e", "#f97316", "#8b5cf6", "#ec4899", "#f59e0b"];

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
        <button
            title="Custom color"
            onClick={() => ref.current?.click()}
            className={`relative w-6 h-6 rounded-full transition-all duration-150 hover:scale-110 active:scale-95 overflow-hidden border border-black/10 ${
                isActive ? "ring-2 ring-offset-1 ring-indigo-500 scale-110" : "hover:ring-1 hover:ring-neutral-300 hover:ring-offset-1"
            }`}
            style={isActive ? { backgroundColor: value } : { background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }}
        >
            <input ref={ref} type="color" value={value || "#000000"} onChange={e => onChange(e.target.value)} className="sr-only" tabIndex={-1} />
        </button>
    );
}

function Label({ children }) {
    return <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-2">{children}</span>;
}

// Visual stroke width preview
function StrokeWidthPicker({ value, onChange }) {
    const widths = [1, 2, 4, 8];
    return (
        <div className="flex gap-2 items-center">
            {widths.map(w => (
                <button
                    key={w}
                    onClick={() => onChange(w)}
                    title={`${w}px`}
                    className={`flex-1 flex items-center justify-center py-2 rounded-lg border transition-all duration-150 ${
                        value === w ? "border-indigo-400 bg-indigo-50" : "border-neutral-200 hover:border-neutral-300 bg-white"
                    }`}
                >
                    <div
                        className="rounded-full bg-neutral-700"
                        style={{ width: "100%", maxWidth: 28, height: Math.min(w, 6) + 1 }}
                    />
                </button>
            ))}
            <input
                type="number"
                min={1} max={20}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-10 h-8 rounded-lg border border-neutral-200 bg-neutral-50 text-center text-[11px] font-mono text-neutral-600 focus:outline-none focus:border-indigo-400"
            />
        </div>
    );
}

export function FreedrawStylePanel({ element, updateElement }) {
    const strokeColor = element.style?.stroke || "#1a1a1a";
    const strokeWidth = element.style?.strokeWidth ?? 2;
    const opacity = Math.round((element.style?.opacity ?? 1) * 100);
    const isPreset = STROKE_COLORS.includes(strokeColor);

    return (
        <div className="space-y-5">
            {/* Color */}
            <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {STROKE_COLORS.map(c => (
                        <ColorSwatch key={c} color={c} selected={strokeColor === c} onClick={() => updateElement({ style: { ...element.style, stroke: c } })} />
                    ))}
                    <CustomColorBtn value={strokeColor} onChange={c => updateElement({ style: { ...element.style, stroke: c } })} isActive={!isPreset} />
                    {/* Hex display */}
                    <span className="text-[10px] font-mono text-neutral-400 ml-1">{strokeColor}</span>
                </div>
            </div>

            {/* Width */}
            <div className="space-y-2">
                <Label>Width</Label>
                <StrokeWidthPicker value={strokeWidth} onChange={v => updateElement({ style: { ...element.style, strokeWidth: v } })} />
            </div>

            {/* Opacity */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] text-neutral-600 font-medium">Opacity</span>
                    <span className="text-[10px] font-mono bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">{opacity}%</span>
                </div>
                <Slider value={[opacity]} min={0} max={100} step={1} onValueChange={([v]) => updateElement({ style: { ...element.style, opacity: v / 100 } })} className="py-0.5" />
            </div>
        </div>
    );
}
