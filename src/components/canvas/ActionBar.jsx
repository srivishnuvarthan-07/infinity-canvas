import { Undo2, Redo2, Trash2, Download, Image, ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

export function ActionBar({ canUndo, canRedo, onUndo, onRedo, onClear, onExport, onAddImage, onToggleGrid, layerActions }) {
    return (
        <div className="toolbar-container animate-fade-in">
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        className="tool-button"
                        onClick={onUndo}
                        disabled={!canUndo}
                        style={{ opacity: canUndo ? 1 : 0.4 }}
                    >
                        <Undo2 className="w-5 h-5" />
                    </button>
                </TooltipTrigger>

                <TooltipContent side="bottom" className="flex items-center gap-2">
                    <span>Undo</span>
                    <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded font-mono">⌘Z</kbd>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        className="tool-button"
                        onClick={onRedo}
                        disabled={!canRedo}
                        style={{ opacity: canRedo ? 1 : 0.4 }}
                    >
                        <Redo2 className="w-5 h-5" />
                    </button>
                </TooltipTrigger>

                <TooltipContent side="bottom" className="flex items-center gap-2">
                    <span>Redo</span>
                    <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded font-mono">⌘⇧Z</kbd>
                </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Layer Management */}
            {layerActions && (
                <>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="tool-button" onClick={layerActions.bringToFront}>
                                <ArrowUpToLine className="w-5 h-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Bring to Front</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="tool-button" onClick={layerActions.bringForward}>
                                <ArrowUp className="w-5 h-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Bring Forward</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="tool-button" onClick={layerActions.sendBackwards}>
                                <ArrowDown className="w-5 h-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Send Backward</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button className="tool-button" onClick={layerActions.sendToBack}>
                                <ArrowDownToLine className="w-5 h-5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">Send to Back</TooltipContent>
                    </Tooltip>

                    <Separator orientation="vertical" className="h-6 mx-1" />
                </>
            )}

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Tooltip>
                <TooltipTrigger asChild>
                    <button className="tool-button" onClick={onAddImage}>
                        <Image className="w-5 h-5" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Add Image</TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <button className="tool-button" onClick={onExport}>
                        <Download className="w-5 h-5" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Export PNG</TooltipContent>
            </Tooltip>



            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        className="tool-button text-destructive hover:text-destructive"
                        onClick={onClear}
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Clear Canvas</TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        className="tool-button text-destructive hover:text-destructive"
                        onClick={() => {
                            onToggleGrid((prev) => !prev)
                            console.log("onToggleGrid:", onToggleGrid);
                        }}
                    >
                        {/* <Trash2 className="w-5 h-5" /> */}
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">grid Toggle</TooltipContent>
            </Tooltip>
        </div>
    );
}
