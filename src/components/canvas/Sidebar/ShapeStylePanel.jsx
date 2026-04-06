import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Minus, Hash, Grid3X3, Square, PenTool, Smile } from "lucide-react";

const STROKE_COLORS = ["#000000", "#ef4444", "#3b82f6", "#22c55e", "#f97316", "#1e3a8a"];
const FILL_COLORS   = ["#ffffff", "#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca"];

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

function ToggleRow({ label, value, onChange, options }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-neutral-600">{label}</span>
      <ToggleGroup
        type="single"
        size="sm"
        value={value}
        onValueChange={v => v && onChange(v)}
        className="gap-0.5"
      >
        {options.map(opt => (
          <ToggleGroupItem
            key={opt.value}
            value={opt.value}
            title={opt.label}
            className="h-7 w-8 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600 rounded-md text-neutral-500"
          >
            {opt.icon}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

export function ShapeStylePanel({ element, updateElement }) {
  const strokeColor = element.style?.stroke || "#000000";
  const strokeWidth = element.style?.strokeWidth || 2;
  const fillColor   = element.style?.fill || "transparent";
  const opacity     = Math.round((element.style?.opacity ?? 1) * 100);

  let strokeStyle = element.strokeStyle || "solid";
  if (!element.strokeStyle && element.strokeDashArray) {
    strokeStyle = element.strokeDashArray[0] > 5 ? "dashed" : "dotted";
  }

  const sloppinessVal =
    element.style?.roughness === 0 ? "clean" :
    element.style?.roughness === 1.5 ? "rough" : "sketchy";

  const fillStyle = element.style?.fillStyle || "solid";

  return (
    <div className="space-y-4">
      {/* Stroke */}
      <div className="space-y-2">
        <SectionLabel>Stroke</SectionLabel>
        <SliderRow
          label="Width" value={strokeWidth} unit="px"
          min={0} max={20}
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

      {/* Fill */}
      <div className="space-y-2">
        <SectionLabel>Fill</SectionLabel>
        <div className="flex gap-1 flex-wrap">
          <Swatch
            color="transparent" transparent
            selected={fillColor === "transparent" || fillColor === "none"}
            onClick={() => updateElement({ style: { ...element.style, fill: "transparent" } })}
          />
          {FILL_COLORS.map(c => (
            <Swatch
              key={c} color={c}
              selected={fillColor === c}
              onClick={() => updateElement({ style: { ...element.style, fill: c } })}
            />
          ))}
        </div>
      </div>

      <div className="h-px bg-neutral-100" />

      {/* Opacity */}
      <SliderRow
        label="Opacity" value={opacity} unit="%"
        min={0} max={100}
        onChange={v => updateElement({ style: { ...element.style, opacity: v / 100 } })}
      />

      <div className="h-px bg-neutral-100" />

      {/* Style toggles */}
      <div className="space-y-2.5">
        <SectionLabel>Style</SectionLabel>
        <ToggleRow
          label="Pattern"
          value={fillStyle}
          onChange={v => updateElement({ style: { ...element.style, fillStyle: v } })}
          options={[
            { value: "solid",      label: "Solid",      icon: <Square className="h-3 w-3 fill-current" /> },
            { value: "hachure",    label: "Hachure",    icon: <Hash className="h-3 w-3" /> },
            { value: "cross-hatch",label: "Cross-hatch", icon: <Grid3X3 className="h-3 w-3" /> },
          ]}
        />
        <ToggleRow
          label="Edge"
          value={strokeStyle}
          onChange={v => {
            let dashArray = null;
            if (v === "dashed") dashArray = [10, 5];
            if (v === "dotted") dashArray = [2, 2];
            updateElement({ strokeDashArray: dashArray, style: { ...element.style, strokeStyle: v } });
          }}
          options={[
            { value: "solid",  label: "Solid",  icon: <Minus className="h-3 w-3" /> },
            { value: "dashed", label: "Dashed", icon: <span className="flex gap-px"><span className="w-1.5 h-px bg-current mt-1.5 block" /><span className="w-1.5 h-px bg-current mt-1.5 block" /></span> },
            { value: "dotted", label: "Dotted", icon: <span className="flex gap-px"><span className="w-1 h-1 rounded-full bg-current block" /><span className="w-1 h-1 rounded-full bg-current block" /></span> },
          ]}
        />
        <ToggleRow
          label="Sloppiness"
          value={sloppinessVal}
          onChange={v => {
            const roughness = v === "clean" ? 0 : v === "rough" ? 1.5 : 2.5;
            updateElement({ sloppiness: v, style: { ...element.style, roughness } });
          }}
          options={[
            { value: "clean",   label: "Clean",   icon: <Square className="h-3 w-3" /> },
            { value: "rough",   label: "Rough",   icon: <PenTool className="h-3 w-3" /> },
            { value: "sketchy", label: "Sketchy", icon: <Smile className="h-3 w-3" /> },
          ]}
        />
      </div>
    </div>
  );
}
