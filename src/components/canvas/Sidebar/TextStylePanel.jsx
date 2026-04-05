import { useState, useRef, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight, ChevronDown } from "lucide-react";

const TEXT_COLORS = ["#000000", "#ef4444", "#3b82f6", "#22c55e", "#f97316", "#1e3a8a"];

const FONTS = [
  { name: "Inter",           label: "Inter" },
  { name: "Poppins",         label: "Poppins" },
  { name: "Roboto Slab",     label: "Roboto Slab" },
  { name: "JetBrains Mono",  label: "JetBrains Mono" },
  { name: "Caveat",          label: "Caveat" },
  { name: "Playfair Display",label: "Playfair Display" },
  { name: "Orbitron",        label: "Orbitron" },
  { name: "Impact",          label: "Impact" },
  { name: "Comic Sans MS",   label: "Comic Sans MS" },
  { name: "Georgia",         label: "Georgia" },
  { name: "Arial",           label: "Arial" },
  { name: "Courier New",     label: "Courier New" },
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full h-8 flex items-center justify-between px-2.5 rounded-md border border-neutral-200 bg-neutral-50 hover:border-neutral-300 text-[12px] text-neutral-700 transition-colors"
        style={{ fontFamily: selected.name }}
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown className={`h-3 w-3 text-neutral-400 ml-1 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto py-1">
            {FONTS.map(font => (
              <button
                key={font.name}
                type="button"
                onClick={() => { onChange(font.name); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors hover:bg-blue-50 hover:text-blue-700
                  ${font.name === value ? "bg-blue-50 text-blue-700 font-medium" : "text-neutral-700"}`}
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

function Swatch({ color, selected, onClick }) {
  return (
    <button onClick={onClick} title={color}
      className="relative flex items-center justify-center rounded-full"
      style={{ width: 22, height: 22 }}
    >
      <span
        className="rounded-full block"
        style={{
          width: 18, height: 18,
          background: color,
          border: selected ? `2px solid ${color}` : "1.5px solid rgba(0,0,0,0.12)",
          outline: selected ? "2px solid #3b82f6" : "none",
          outlineOffset: 1,
        }}
      />
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
        if (/^#[0-9a-fA-F]{6}$/.test(v)) { onChange(v); } else setLocal(value);
      }}
      onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
      className="mt-1 h-7 w-full rounded-md border border-neutral-200 bg-neutral-50 px-2 text-[11px] font-mono text-neutral-600 focus:outline-none focus:border-blue-400 transition-colors"
      placeholder="#000000" maxLength={7} spellCheck={false}
    />
  );
}

function SectionLabel({ children }) {
  return <span className="text-[11px] text-neutral-400 font-medium block mb-2">{children}</span>;
}

export function TextStylePanel({ element, updateElement }) {
  const color      = element.style?.stroke || element.style?.fill || "#000000";
  const fontSize   = element.font?.size || 20;
  const fontFamily = element.font?.family || "Inter";
  const textAlign  = element.font?.align || "left";
  const opacity    = Math.round((element.style?.opacity ?? 1) * 100);

  return (
    <div className="space-y-4">
      {/* Font family + alignment */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1.5">
          <SectionLabel>Font</SectionLabel>
          <ToggleGroup
            type="single" size="sm"
            value={textAlign}
            onValueChange={v => v && updateElement({ font: { ...element.font, align: v } })}
            className="gap-0.5"
          >
            {[
              { v: "left",   icon: <AlignLeft className="h-3 w-3" /> },
              { v: "center", icon: <AlignCenter className="h-3 w-3" /> },
              { v: "right",  icon: <AlignRight className="h-3 w-3" /> },
            ].map(a => (
              <ToggleGroupItem
                key={a.v} value={a.v}
                className="h-7 w-7 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600 rounded-md text-neutral-500"
              >
                {a.icon}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <FontDropdown
          value={fontFamily}
          onChange={name => updateElement({ font: { ...element.font, family: name } })}
        />
      </div>

      <div className="h-px bg-neutral-100" />

      {/* Size */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-neutral-600">Size</span>
          <span className="text-[11px] font-mono text-neutral-400">{fontSize}px</span>
        </div>
        <Slider
          value={[fontSize]} min={8} max={120} step={1}
          onValueChange={([v]) => updateElement({ font: { ...element.font, size: v } })}
          className="py-0.5"
        />
      </div>

      <div className="h-px bg-neutral-100" />

      {/* Color */}
      <div className="space-y-2">
        <SectionLabel>Color</SectionLabel>
        <div className="flex gap-1 flex-wrap">
          {TEXT_COLORS.map(c => (
            <Swatch
              key={c} color={c} selected={color === c}
              onClick={() => updateElement({ style: { ...element.style, stroke: c, fill: c } })}
            />
          ))}
        </div>
        <HexInput
          value={color}
          onChange={c => updateElement({ style: { ...element.style, stroke: c, fill: c } })}
        />
      </div>

      <div className="h-px bg-neutral-100" />

      {/* Opacity */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-neutral-600">Opacity</span>
          <span className="text-[11px] font-mono text-neutral-400">{opacity}%</span>
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
