import { useState } from "react";
import { ShapeStylePanel } from "./ShapeStylePanel";
import { TextStylePanel } from "./TextStylePanel";
import { FreedrawStylePanel } from "./FreedrawStylePanel";
import { 
    BringToFront, SendToBack, ArrowUp, ArrowDown, BookMarked,
    ChevronDown, Layers, Palette, Type, Image, Pencil,
    Square, Group, Ungroup, MoveRight, MoveLeft, ArrowLeftRight
} from "lucide-react";

const TEXT_TYPES = ["i-text", "text", "textbox"];
function isTextType(type) { return TEXT_TYPES.includes(type); }
function isFreedrawType(type) { return type === 'pencil'; }
function isImageType(type) { return type === 'image'; }
function isArrowType(type) { return type === 'arrow'; }

// ── Collapsible section ──────────────────────────────────────────────────────
function Section({ title, icon: Icon, defaultOpen = true, children, badge }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-neutral-100 last:border-none">
            <button
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-neutral-50 transition-colors group"
                onClick={() => setOpen(v => !v)}
            >
                {Icon && <Icon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />}
                <span className="flex-1 text-left text-[11px] font-bold uppercase tracking-widest text-neutral-400 group-hover:text-neutral-600 transition-colors">
                    {title}
                </span>
                {badge && <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">{badge}</span>}
                <ChevronDown className={`w-3 h-3 text-neutral-300 transition-transform duration-200 ${open ? "" : "-rotate-90"}`} />
            </button>
            {open && (
                <div className="px-4 pb-4 pt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {children}
                </div>
            )}
        </div>
    );
}

// ── Layer order button ───────────────────────────────────────────────────────
function LayerBtn({ onClick, title, children }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="flex-1 h-8 flex flex-col items-center justify-center gap-0.5 rounded-lg bg-neutral-50 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-all duration-150 border border-neutral-200/60 active:scale-95"
        >
            {children}
        </button>
    );
}

// ── Arrow heads picker ────────────────────────────────────────────────────────
function ArrowHeadPicker({ element, updateElement }) {
    const isDouble = !!element.doubleArrow;
    return (
        <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">Arrowheads</span>
            <div className="flex gap-2">
                {/* Single-headed */}
                <button
                    onClick={() => updateElement({ doubleArrow: false })}
                    className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all duration-150 ${
                        !isDouble
                            ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                            : "border-neutral-200 bg-white text-neutral-400 hover:border-neutral-300"
                    }`}
                >
                    {/* SVG: line with one head on right */}
                    <svg width="52" height="18" viewBox="0 0 52 18">
                        <line x1="4" y1="9" x2="44" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <polyline points="36,3 44,9 36,15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[10px] font-bold">One Head</span>
                </button>
                {/* Double-headed */}
                <button
                    onClick={() => updateElement({ doubleArrow: true })}
                    className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all duration-150 ${
                        isDouble
                            ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                            : "border-neutral-200 bg-white text-neutral-400 hover:border-neutral-300"
                    }`}
                >
                    {/* SVG: line with heads on both ends */}
                    <svg width="52" height="18" viewBox="0 0 52 18">
                        <line x1="8" y1="9" x2="44" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <polyline points="16,3 8,9 16,15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="36,3 44,9 36,15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[10px] font-bold">Two Heads</span>
                </button>
            </div>
        </div>
    );
}

// ── Element type badge ────────────────────────────────────────────────────────
function TypeBadge({ type }) {
    const labels = {
        rectangle: { label: "Rectangle", color: "bg-blue-50 text-blue-600" },
        ellipse:   { label: "Ellipse",   color: "bg-purple-50 text-purple-600" },
        diamond:   { label: "Diamond",   color: "bg-pink-50 text-pink-600" },
        line:      { label: "Line",      color: "bg-neutral-100 text-neutral-600" },
        arrow:     { label: "Arrow",     color: "bg-orange-50 text-orange-600" },
        text:      { label: "Text",      color: "bg-green-50 text-green-600" },
        "i-text":  { label: "Text",      color: "bg-green-50 text-green-600" },
        textbox:   { label: "Text",      color: "bg-green-50 text-green-600" },
        pencil:    { label: "Draw",      color: "bg-indigo-50 text-indigo-600" },
        image:     { label: "Image",     color: "bg-amber-50 text-amber-600" },
        activeSelection: { label: "Multi", color: "bg-violet-50 text-violet-600" },
    };
    const info = labels[type] || { label: type, color: "bg-neutral-100 text-neutral-600" };
    return (
        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${info.color}`}>
            {info.label}
        </span>
    );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export function Sidebar({ selectedElement, updateElement, layerActions, groupActions, onAddToLibrary }) {
    if (!selectedElement) return null;

    const isToolMode = !selectedElement.id && selectedElement.type === 'pencil';
    const isMulti = selectedElement.type === 'activeSelection' && Array.isArray(selectedElement.objects);
    const objects = isMulti ? selectedElement.objects : [selectedElement];

    const hasText    = objects.some(o => isTextType(o.type));
    const hasShape   = objects.some(o => !isTextType(o.type) && !isImageType(o.type));
    const hasImage   = objects.some(o => isImageType(o.type));
    const hasArrow   = !isMulti && isArrowType(selectedElement.type);

    const isOnlyFreedraw = hasShape && !hasText && objects.every(o => isFreedrawType(o.type));
    const isOnlyImage    = hasImage && !hasText && !hasShape;
    const mixedSelection = hasText && hasShape;

    const shapeEl = isMulti ? (objects.find(o => !isTextType(o.type)) || selectedElement) : selectedElement;
    const textEl  = isMulti ? (objects.find(o => isTextType(o.type)) || selectedElement) : selectedElement;

    return (
        <div className="w-[250px] flex flex-col bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-xl text-neutral-900 select-none">

            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 bg-neutral-50/80">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isToolMode ? (
                        <Pencil className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    ) : isOnlyImage ? (
                        <Image className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    ) : hasText && !hasShape ? (
                        <Type className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    ) : hasArrow ? (
                        <MoveRight className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    ) : (
                        <Square className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    )}
                    <span className="text-[12px] font-bold text-neutral-700 truncate">
                        {isToolMode ? "Pencil Tool" : isMulti ? `${objects.length} Selected` : (selectedElement.name || "Properties")}
                    </span>
                </div>
                {!isToolMode && <TypeBadge type={selectedElement.type} />}
            </div>

            <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 580 }}>

                {/* ── Arrow heads (only for arrow type) ─────────── */}
                {hasArrow && (
                    <Section title="Arrow" icon={MoveRight}>
                        <ArrowHeadPicker element={selectedElement} updateElement={updateElement} />
                    </Section>
                )}

                {/* ── Image properties ──────────────────────────── */}
                {isOnlyImage && (
                    <Section title="Image" icon={Image}>
                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-neutral-500">Opacity</span>
                                    <span className="text-[11px] font-mono text-neutral-400">{Math.round((shapeEl.style?.opacity ?? 1) * 100)}%</span>
                                </div>
                                <input
                                    type="range" min={0} max={1} step={0.01}
                                    value={shapeEl.style?.opacity ?? 1}
                                    onChange={e => updateElement({ style: { opacity: parseFloat(e.target.value) } })}
                                    className="w-full h-1.5 rounded-full appearance-none bg-neutral-200 accent-indigo-600 cursor-pointer"
                                />
                            </div>
                        </div>
                    </Section>
                )}

                {/* ── Shape / stroke style ──────────────────────── */}
                {hasShape && (
                    <Section title={mixedSelection ? "Shape" : isOnlyFreedraw ? "Stroke" : "Style"} icon={Palette}>
                        {isOnlyFreedraw ? (
                            <FreedrawStylePanel element={shapeEl} updateElement={updateElement} />
                        ) : (
                            <ShapeStylePanel element={shapeEl} updateElement={updateElement} />
                        )}
                    </Section>
                )}

                {/* ── Text style ────────────────────────────────── */}
                {hasText && (
                    <Section title="Text" icon={Type} defaultOpen={!hasShape}>
                        <TextStylePanel element={textEl} updateElement={updateElement} />
                    </Section>
                )}

                {/* ── Layer order ───────────────────────────────── */}
                {!isToolMode && layerActions && (
                    <Section title="Order" icon={Layers} defaultOpen={false}>
                        <div className="grid grid-cols-4 gap-1.5">
                            <LayerBtn onClick={layerActions?.bringToFront} title="Bring to Front">
                                <BringToFront className="w-3.5 h-3.5" />
                                <span className="text-[8px] font-semibold">Front</span>
                            </LayerBtn>
                            <LayerBtn onClick={layerActions?.bringForward} title="Bring Forward">
                                <ArrowUp className="w-3.5 h-3.5" />
                                <span className="text-[8px] font-semibold">Fwd</span>
                            </LayerBtn>
                            <LayerBtn onClick={layerActions?.sendBackwards} title="Send Backward">
                                <ArrowDown className="w-3.5 h-3.5" />
                                <span className="text-[8px] font-semibold">Back</span>
                            </LayerBtn>
                            <LayerBtn onClick={layerActions?.sendToBack} title="Send to Back">
                                <SendToBack className="w-3.5 h-3.5" />
                                <span className="text-[8px] font-semibold">End</span>
                            </LayerBtn>
                        </div>
                    </Section>
                )}

                {/* ── Group actions ─────────────────────────────── */}
                {!isToolMode && groupActions && (groupActions.canGroup || groupActions.canUngroup) && (
                    <Section title="Group" icon={Group} defaultOpen={false}>
                        <div className="flex gap-2">
                            {groupActions.canGroup && (
                                <button onClick={groupActions.group} onMouseDown={e => e.preventDefault()}
                                    className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors border border-indigo-100">
                                    <Group className="w-3 h-3" /> Group
                                </button>
                            )}
                            {groupActions.canUngroup && (
                                <button onClick={groupActions.ungroup} onMouseDown={e => e.preventDefault()}
                                    className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold bg-neutral-50 hover:bg-neutral-100 text-neutral-600 transition-colors border border-neutral-200">
                                    <Ungroup className="w-3 h-3" /> Ungroup
                                </button>
                            )}
                        </div>
                    </Section>
                )}

                {/* ── Save to library ───────────────────────────── */}
                {!isToolMode && onAddToLibrary && (
                    <div className="px-4 py-3">
                        <button onClick={onAddToLibrary}
                            className="w-full h-9 flex items-center justify-center gap-2 rounded-xl text-[12px] font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-100 active:scale-[0.98]">
                            <BookMarked className="w-3.5 h-3.5" />
                            Save to Library
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
