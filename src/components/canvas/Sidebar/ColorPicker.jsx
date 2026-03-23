import { useRef, useState } from "react";
import { Pipette } from "lucide-react";

// 5 preset swatches always visible
const PRESETS = ["#000000", "#ef4444", "#3b82f6", "#22c55e", "#f59e0b"];

/**
 * ColorPicker — 5 preset swatches + a "multi-color" button that opens the
 * native color picker for full spectrum support.
 *
 * @param {{ value: string, onChange: (color: string) => void, allowTransparent?: boolean, label?: string }} props
 */
export function ColorPicker({ value, onChange, allowTransparent = false, label }) {
    const inputRef = useRef(null);
    const isTransparent = value === "transparent";

    const isPreset = PRESETS.includes(value);
    // value used for the native input — fallback to black if transparent
    const inputValue = isTransparent ? "#000000" : (value || "#000000");

    return (
        <div className="space-y-2">
            {label && (
                <span className="text-[13px] font-medium text-neutral-600">{label}</span>
            )}

            <div className="flex items-center gap-2 flex-wrap">
                {/* Transparent swatch */}
                {allowTransparent && (
                    <button
                        type="button"
                        onClick={() => onChange("transparent")}
                        title="Transparent"
                        className={`relative h-7 w-7 rounded-full border transition-all outline-none shrink-0 overflow-hidden
                            ${isTransparent
                                ? "ring-2 ring-offset-2 ring-indigo-500 scale-110"
                                : "border-neutral-200 hover:scale-105"
                            }`}
                    >
                        {/* Diagonal red "no" line */}
                        <span className="absolute inset-0 bg-white" />
                        <span
                            className="absolute inset-0"
                            style={{
                                background: "linear-gradient(135deg, transparent 43%, #ef4444 43%, #ef4444 57%, transparent 57%)"
                            }}
                        />
                    </button>
                )}

                {/* 5 preset swatches */}
                {PRESETS.map((preset) => {
                    const isActive = !isTransparent && value === preset;
                    return (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => onChange(preset)}
                            title={preset}
                            className={`h-7 w-7 rounded-full border border-black/10 shadow-sm transition-all outline-none shrink-0
                                ${isActive
                                    ? "ring-2 ring-offset-2 ring-indigo-500 scale-110"
                                    : "hover:scale-105"
                                }`}
                            style={{ backgroundColor: preset }}
                        />
                    );
                })}

                {/* Custom color button — shows current color if not a preset, otherwise shows a gradient */}
                <button
                    type="button"
                    title="Custom color"
                    onClick={() => inputRef.current?.click()}
                    className={`h-7 w-7 rounded-full border border-black/10 shadow-sm transition-all outline-none shrink-0 flex items-center justify-center overflow-hidden
                        ${!isTransparent && !isPreset
                            ? "ring-2 ring-offset-2 ring-indigo-500 scale-110"
                            : "hover:scale-105"
                        }`}
                    style={
                        !isTransparent && !isPreset
                            ? { backgroundColor: value }
                            : {
                                background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)"
                            }
                    }
                >
                    {/* hidden native input */}
                    <input
                        ref={inputRef}
                        type="color"
                        value={inputValue}
                        onChange={(e) => onChange(e.target.value)}
                        className="sr-only"
                        tabIndex={-1}
                    />
                    {/* Only show icon on the rainbow swatch */}
                    {(isTransparent || isPreset) && (
                        <Pipette className="h-3 w-3 text-white drop-shadow" />
                    )}
                </button>

                {/* Hex input */}
                {!isTransparent && (
                    <input
                        type="text"
                        value={value || ""}
                        onChange={(e) => {
                            const v = e.target.value;
                            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
                        }}
                        className="h-7 w-[5.5rem] text-xs px-2 border border-neutral-200 rounded-md font-mono text-neutral-600 outline-none focus:border-indigo-500 transition-colors"
                        placeholder="#000000"
                        maxLength={7}
                    />
                )}
            </div>
        </div>
    );
}
