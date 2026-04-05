import { ShapeStylePanel } from "./ShapeStylePanel";
import { TextStylePanel } from "./TextStylePanel";
import { FreedrawStylePanel } from "./FreedrawStylePanel";
import { BringToFront, SendToBack, ArrowUp, ArrowDown, BookMarked } from "lucide-react";

const TEXT_TYPES = ["i-text", "text", "textbox"];

function isTextType(type) {
  return TEXT_TYPES.includes(type);
}

function isFreedrawType(type) {
  return type === 'pencil';
}

function IconBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex-1 h-8 flex items-center justify-center rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 transition-colors"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-neutral-100 my-1" />;
}

function SectionHeader({ children }) {
  return (
    <div className="px-4 pt-3 pb-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">{children}</span>
    </div>
  );
}

export function Sidebar({ selectedElement, updateElement, layerActions, groupActions, onAddToLibrary }) {
  if (!selectedElement) return null;

  // Tool-mode: synthetic element passed when the pencil tool is active with no selection
  const isToolMode = !selectedElement.id && selectedElement.type === 'pencil';
  // Determine what types are in the selection
  const isMulti = selectedElement.type === 'activeSelection' && Array.isArray(selectedElement.objects);
  const objects  = isMulti ? selectedElement.objects : [selectedElement];

  const hasText  = objects.some(o => isTextType(o.type));
  const hasShape = objects.some(o => !isTextType(o.type));

  // Check if selection is exclusively freedraw (pencil)
  const isOnlyFreedraw = hasShape && !hasText && objects.every(o => isFreedrawType(o.type));

  const mixedSelection = hasText && hasShape;

  // For single element or homogeneous multi-select, use first element for reading props
  const shapeEl = isMulti ? (objects.find(o => !isTextType(o.type)) || selectedElement) : selectedElement;
  const textEl  = isMulti ? (objects.find(o =>  isTextType(o.type)) || selectedElement) : selectedElement;

  return (
    <div
      style={{ width: 250 }}
      className="flex flex-col bg-white border border-neutral-200 rounded-xl overflow-hidden text-neutral-900 select-none"
    >


      <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 550 }}>

        {/* ── Shape properties ──────────────────────────────────────────── */}
        {hasShape && (
          <>
            {mixedSelection && <SectionHeader>Shape</SectionHeader>}
            <div className="px-4 py-3">
              {isOnlyFreedraw ? (
                <FreedrawStylePanel element={shapeEl} updateElement={updateElement} />
              ) : (
                <ShapeStylePanel element={shapeEl} updateElement={updateElement} />
              )}
            </div>
          </>
        )}

        {/* ── Text properties ───────────────────────────────────────────── */}
        {hasText && (
          <>
            <Divider />
            {mixedSelection && <SectionHeader>Text</SectionHeader>}
            <div className="px-4 py-3">
              <TextStylePanel element={textEl} updateElement={updateElement} />
            </div>
          </>
        )}

        <Divider />

        {/* ── Order ──────────────────────────────────────────────────── */}
        <div className="px-4 py-3 space-y-2">
          <span className="text-[11px] text-neutral-400 font-medium">Order</span>
          <div className="flex gap-1.5">
            <IconBtn onClick={layerActions?.bringToFront}  title="Bring to front"><BringToFront className="h-3.5 w-3.5" /></IconBtn>
            <IconBtn onClick={layerActions?.bringForward}  title="Bring forward"><ArrowUp      className="h-3.5 w-3.5" /></IconBtn>
            <IconBtn onClick={layerActions?.sendBackwards} title="Send backward"><ArrowDown    className="h-3.5 w-3.5" /></IconBtn>
            <IconBtn onClick={layerActions?.sendToBack}    title="Send to back"><SendToBack    className="h-3.5 w-3.5" /></IconBtn>
          </div>
        </div>

        {/* ── Group and Library — hidden in tool mode ─────────────────── */}
        {!isToolMode && (
          <>
            {groupActions && (groupActions.canGroup || groupActions.canUngroup) && (
              <>
                <Divider />
                <div className="px-4 py-3 space-y-2">
                  <span className="text-[11px] text-neutral-400 font-medium">Group</span>
                  <div className="flex gap-1.5">
                    {groupActions.canGroup && (
                      <button onClick={groupActions.group} onMouseDown={e => e.preventDefault()}
                        className="flex-1 h-8 rounded-md text-[12px] font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors">
                        Group
                      </button>
                    )}
                    {groupActions.canUngroup && (
                      <button onClick={groupActions.ungroup} onMouseDown={e => e.preventDefault()}
                        className="flex-1 h-8 rounded-md text-[12px] font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors">
                        Ungroup
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {onAddToLibrary && (
              <>
                <Divider />
                <div className="px-4 py-3">
                  <button onClick={onAddToLibrary}
                    className="w-full h-8 flex items-center justify-center gap-2 rounded-md text-[12px] font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
                    <BookMarked className="h-3.5 w-3.5" />
                    Add to Library
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
