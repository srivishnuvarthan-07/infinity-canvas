import { useState } from "react";
import { Slider } from "@/components/ui/slider";

const STROKE_COLORS = ["#000000", "#ef4444", "#3b82f6", "#22c55e", "#f97316", "#1e3a8a"];

function Swatch({ color, selected, onClick, transparent }) {
  return (
    <button
      onClick={onClick}
      title={color}
      className="relative flex items-center justify-center rounded-full transition-all"
      style={{ width: 22, height: 22 }}
    >
      <span
        className="rounded-full block"
        style={{
          width: 18, height: 18,
          background: transparent ? "white" : color,
          border: selected ? `2px solid ${color === "#000000" ? "#555" : color}` : "1.5px solid rgba(0,0,0,0.12)",
          outline: selected ? "2px solid #3b82f6" : "none",
          outlineOffset: 1,
          position: "relative",
        }}
      >
        {transparent && (
          <svg viewBox="0 0 18 18" className="absolute inset-0 w-full h-full">
            <line x1="3" y1="15" x2="15" y2="3" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </span>
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
      onKeyDown={e => {
        if (e.key === "Enter") e.target.blur();
      }}
      className="mt-1 h-7 w-full rounded-md border border-neutral-200 bg-neutral-50 px-2 text-[11px] font-mono text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors"
      placeholder="#000000"
      maxLength={7}
      spellCheck={false}
    />
  );
}

function SectionLabel({ children }) {
  return <span className="text-[11px] text-neutral-400 font-medium block mb-2">{children}</span>;
}

function SliderRow({ label, value, unit, min, max, onChange }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-neutral-600">{label}</span>
        <span className="text-[11px] font-mono text-neutral-400">{value}{unit}</span>
      </div>
      <Slider
        value={[value]} min={min} max={max} step={1}
        onValueChange={([v]) => onChange(v)}
        className="py-0.5"
      />
    </div>
  );
}

export function FreedrawStylePanel({ element, updateElement }) {
  const strokeColor = element.style?.stroke || "#000000";
  const strokeWidth = element.style?.strokeWidth || 2;
  const opacity     = Math.round((element.style?.opacity ?? 1) * 100);

  return (
    <div className="space-y-4">
      {/* Stroke */}
      <div className="space-y-2">
        <SectionLabel>Stroke</SectionLabel>
        <SliderRow
          label="Width" value={strokeWidth} unit="px"
          min={1} max={20}
          onChange={v => updateElement({ style: { ...element.style, strokeWidth: v } })}
        />
        <div className="flex gap-1 mt-1 flex-wrap">
          {STROKE_COLORS.map(c => (
            <Swatch
              key={c} color={c}
              selected={strokeColor === c}
              onClick={() => updateElement({ style: { ...element.style, stroke: c } })}
            />
          ))}
        </div>
        <HexInput
          value={strokeColor}
          onChange={c => updateElement({ style: { ...element.style, stroke: c } })}
        />
      </div>

      <div className="h-px bg-neutral-100" />

      {/* Opacity */}
      <SliderRow
        label="Opacity" value={opacity} unit="%"
        min={0} max={100}
        onChange={v => updateElement({ style: { ...element.style, opacity: v / 100 } })}
      />
    </div>
  );
}
