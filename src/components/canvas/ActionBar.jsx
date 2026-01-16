import { Undo2, Redo2, Trash2, Download, Image, Film } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

export function ActionBar({ canUndo, canRedo, onUndo, onRedo, onClear, onExport, onAddImage, onToggleGrid, onToggleAnimation }) {
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

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Tooltip>
                <TooltipTrigger asChild>
                    <button className="tool-button" onClick={onToggleAnimation}>
                        <Film className="w-5 h-5" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Animate</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

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
