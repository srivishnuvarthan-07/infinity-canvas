import { Cloud, Check, Loader2, MousePointer2 } from "lucide-react";

export function StatusBar({ isSaved, isSyncing, zoom, mousePos }) {
    return (
        <div className="h-6 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between px-3 text-[10px] text-neutral-400 select-none">
            {/* Left: Sync Status */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                    {isSyncing ? (
                        <>
                            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                            <span className="text-blue-500">Syncing...</span>
                        </>
                    ) : isSaved ? (
                        <>
                            <Cloud className="h-3 w-3 text-neutral-500" />
                            <span>Saved</span>
                        </>
                    ) : (
                        <>
                            <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                            <span className="text-yellow-500">Unsaved changes</span>
                        </>
                    )}
                </div>
            </div>

            {/* Right: Coordinates & Zoom */}
            <div className="flex items-center gap-4">
                {mousePos && (
                    <div className="flex items-center gap-1 min-w-[80px]">
                        <MousePointer2 className="h-3 w-3" />
                        <span>
                            {Math.round(mousePos.x)}, {Math.round(mousePos.y)}
                        </span>
                    </div>
                )}

                <div className="min-w-[50px] text-right">
                    {Math.round(zoom * 100)}%
                </div>
            </div>
        </div>
    );
}
