import { Settings2 } from "lucide-react";

export function InspectorPanel({ selectedElement }) {
    if (!selectedElement) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 p-4 text-center">
                <Settings2 className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">Select an element to inspect properties</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-4">Properties</h3>

            <div className="space-y-4">
                {/* Position */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs text-neutral-400">X</label>
                        <div className="text-sm font-mono bg-neutral-800 rounded px-2 py-1">{Math.round(selectedElement.x)}</div>
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400">Y</label>
                        <div className="text-sm font-mono bg-neutral-800 rounded px-2 py-1">{Math.round(selectedElement.y)}</div>
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400">Width</label>
                        <div className="text-sm font-mono bg-neutral-800 rounded px-2 py-1">{Math.round(selectedElement.width)}</div>
                    </div>
                    <div>
                        <label className="text-xs text-neutral-400">Height</label>
                        <div className="text-sm font-mono bg-neutral-800 rounded px-2 py-1">{Math.round(selectedElement.height)}</div>
                    </div>
                </div>

                {/* Debug Info */}
                <div className="pt-4 border-t border-neutral-800">
                    <label className="text-xs text-neutral-400">ID</label>
                    <div className="text-xs font-mono text-neutral-500 truncate">{selectedElement.id}</div>
                </div>

                <div className="pt-2">
                    <label className="text-xs text-neutral-400">Type</label>
                    <div className="text-sm capitalize">{selectedElement.type}</div>
                </div>
            </div>
        </div>
    );
}
