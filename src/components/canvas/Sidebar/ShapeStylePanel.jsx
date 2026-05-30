import { useState, useRef } from "react";
import { Slider } from "@/components/ui/slider";

const STROKE_COLORS = ["#1a1a1a", "#ef4444", "#3b82f6", "#22c55e", "#f97316", "#8b5cf6", "#ec4899", "#f59e0b"];
const FILL_COLORS = ["#ffffff", "#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff", "#fce7f3", "#fed7aa"];

function ColorSwatch({ color, selected, onClick, transparent }) {
    return (
        <button
            onClick={onClick}
            title={transparent ? "None" : color}
            className={`relative w-6 h-6 rounded-full transition-all duration-150 hover:scale-110 active:scale-95 ${
                selected ? "ring-2 ring-offset-1 ring-indigo-500 scale-110" : "hover:ring-1 hover:ring-neutral-300 hover:ring-offset-1"
            }`}
            style={transparent ? {} : { backgroundColor: color, border: color === "#ffffff" ? "1px solid #e5e7eb" : "none" }}
        >
            {transparent ? (
                <span className="absolute inset-0 rounded-full bg-white border border-neutral-200 flex items-center justify-center overflow-hidden">
                    <svg viewBox="0 0 24 24" className="w-full h-full">
                        <line x1="4" y1="20" x2="20" y2="4" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </span>
            ) : null}
        </button>
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

function HexInput({ value, onChange }) {
    const [local, setLocal] = useState(value);
    return (
        <input
            type="text"
            value={local}
            onChange={e => setLocal(e.target.value)}
            onBlur={() => {
                const v = local.startsWith("#") ? local : `#${local}`;
                if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
                else setLocal(value);
            }}
            onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
            className="h-7 w-[5rem] rounded-md border border-neutral-200 bg-neutral-50 px-2 text-[10px] font-mono text-neutral-600 focus:outline-none focus:border-indigo-400 transition-colors"
            placeholder="#000000"
            maxLength={7}
            spellCheck={false}
        />
    );
}

function Label({ children }) {
    return <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block mb-2">{children}</span>;
}

function SliderRow({ label, value, unit, min, max, onChange }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-600 font-medium">{label}</span>
                <span className="text-[10px] font-mono bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded">{value}{unit}</span>
            </div>
            <Slider value={[value]} min={min} max={max} step={1} onValueChange={([v]) => onChange(v)} className="py-0.5" />
        </div>
    );
}

// Visual stroke width preview buttons
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
                min={0} max={20}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-10 h-8 rounded-lg border border-neutral-200 bg-neutral-50 text-center text-[11px] font-mono text-neutral-600 focus:outline-none focus:border-indigo-400"
            />
        </div>
    );
}

// Stroke style (solid / dashed / dotted)
function StrokeStylePicker({ value, onChange }) {
    const styles = [
        { id: "solid", label: "Solid", preview: <div className="w-10 h-px bg-neutral-700" /> },
        { id: "dashed", label: "Dashed", preview: <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2.5 h-px bg-neutral-700" />)}</div> },
        { id: "dotted", label: "Dotted", preview: <div className="flex gap-1">{[0,1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-neutral-700" />)}</div> },
    ];
    return (
        <div className="flex gap-1.5">
            {styles.map(s => (
                <button
                    key={s.id}
                    onClick={() => onChange(s.id)}
                    title={s.label}
                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-lg border text-[9px] font-bold transition-all duration-150 ${
                        value === s.id ? "border-indigo-400 bg-indigo-50 text-indigo-600" : "border-neutral-200 hover:border-neutral-300 bg-white text-neutral-400"
                    }`}
                >
                    {s.preview}
                    {s.label}
                </button>
            ))}
        </div>
    );
}

// Fill style (solid / hachure / cross-hatch)
function FillStylePicker({ value, onChange }) {
    const styles = [
        { id: "solid", label: "Solid", preview: <div className="w-8 h-5 rounded bg-neutral-300" /> },
        { id: "hachure", label: "Lines", preview: (
            <svg width="32" height="20" className="overflow-hidden rounded">
                {[0,4,8,12,16,20,24,28,32].map((x,i) => <line key={i} x1={x} y1="0" x2={x-8} y2="20" stroke="#9ca3af" strokeWidth="1.5" />)}
            </svg>
        )},
        { id: "cross-hatch", label: "Cross", preview: (
            <svg width="32" height="20" className="overflow-hidden rounded">
                {[0,8,16,24,32].map((x,i) => <line key={`v${i}`} x1={x} y1="0" x2={x-6} y2="20" stroke="#9ca3af" strokeWidth="1.5" />)}
                {[0,8,16,24,32].map((x,i) => <line key={`r${i}`} x1={x} y1="0" x2={x+6} y2="20" stroke="#9ca3af" strokeWidth="1.5" />)}
            </svg>
        )},
    ];
    return (
        <div className="flex gap-1.5">
            {styles.map(s => (
                <button
                    key={s.id}
                    onClick={() => onChange(s.id)}
                    title={s.label}
                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2 rounded-lg border text-[9px] font-bold transition-all duration-150 overflow-hidden ${
                        value === s.id ? "border-indigo-400 bg-indigo-50 text-indigo-600" : "border-neutral-200 hover:border-neutral-300 bg-white text-neutral-400"
                    }`}
                >
                    {s.preview}
                    {s.label}
                </button>
            ))}
        </div>
    );
}

export function ShapeStylePanel({ element, updateElement }) {
    const strokeColor = element.style?.stroke || "#1a1a1a";
    const strokeWidth = element.style?.strokeWidth ?? 2;
    const fillColor = element.style?.fill || "transparent";
    const opacity = Math.round((element.style?.opacity ?? 1) * 100);

    let strokeStyle = element.strokeStyle || "solid";
    if (!element.strokeStyle && element.strokeDashArray) {
        strokeStyle = element.strokeDashArray[0] > 5 ? "dashed" : "dotted";
    }

    const fillStyle = element.style?.fillStyle || "solid";

    const isStrokePreset = STROKE_COLORS.includes(strokeColor);
    const isFillPreset = FILL_COLORS.includes(fillColor);
    const isFillTransparent = fillColor === "transparent" || fillColor === "none";

    return (
        <div className="space-y-5">
            {/* Stroke color */}
            <div className="space-y-2">
                <Label>Stroke</Label>
                <div className="flex items-center gap-1.5 flex-wrap">
                    {STROKE_COLORS.map(c => (
                        <ColorSwatch key={c} color={c} selected={strokeColor === c} onClick={() => updateElement({ style: { ...element.style, stroke: c } })} />
                    ))}
                    <CustomColorBtn value={strokeColor} onChange={c => updateElement({ style: { ...element.style, stroke: c } })} isActive={!isStrokePreset} />
                    <HexInput value={strokeColor} onChange={c => updateElement({ style: { ...element.style, stroke: c } })} />
                </div>
            </div>

            {/* Stroke width */}
            <div className="space-y-2">
                <Label>Width</Label>
                <StrokeWidthPicker value={strokeWidth} onChange={v => updateElement({ style: { ...element.style, strokeWidth: v } })} />
            </div>

            {/* Stroke style */}
            <div className="space-y-2">
                <Label>Edge</Label>
                <StrokeStylePicker
                    value={strokeStyle}
                    onChange={v => {
                        let dashArray = null;
                        if (v === "dashed") dashArray = [10, 5];
                        if (v === "dotted") dashArray = [2, 2];
                        updateElement({ strokeDashArray: dashArray, style: { ...element.style, strokeStyle: v } });
                    }}
                />
            </div>

            {/* Fill color */}
            <div className="space-y-2">
                <Label>Fill</Label>
                <div className="flex items-center gap-1.5 flex-wrap">
                    <ColorSwatch transparent selected={isFillTransparent} onClick={() => updateElement({ style: { ...element.style, fill: "transparent" } })} />
                    {FILL_COLORS.map(c => (
                        <ColorSwatch key={c} color={c} selected={fillColor === c} onClick={() => updateElement({ style: { ...element.style, fill: c } })} />
                    ))}
                    <CustomColorBtn value={isFillTransparent ? "#ffffff" : fillColor} onChange={c => updateElement({ style: { ...element.style, fill: c } })} isActive={!isFillTransparent && !isFillPreset} />
                    {!isFillTransparent && <HexInput value={fillColor} onChange={c => updateElement({ style: { ...element.style, fill: c } })} />}
                </div>
            </div>

            {/* Fill style */}
            {!isFillTransparent && (
                <div className="space-y-2">
                    <Label>Fill Style</Label>
                    <FillStylePicker value={fillStyle} onChange={v => updateElement({ style: { ...element.style, fillStyle: v } })} />
                </div>
            )}

            {/* Opacity */}
            <SliderRow
                label="Opacity" value={opacity} unit="%"
                min={0} max={100}
                onChange={v => updateElement({ style: { ...element.style, opacity: v / 100 } })}
            />
        </div>
    );
}
