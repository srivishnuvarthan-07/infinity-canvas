import { Undo2, Redo2, Trash2, Download, Image, ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

export function ActionBar({ canUndo, canRedo, onUndo, onRedo, onClear, onExport, onAddImage }) {
    return (
        <div className="flex flex-col gap-2 p-1">
            <div className="grid grid-cols-2 gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="flex items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-40"
                            onClick={onUndo}
                            disabled={!canUndo}
                        >
                            <Undo2 className="w-5 h-5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Undo (⌘Z)</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="flex items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-40"
                            onClick={onRedo}
                            disabled={!canRedo}
                        >
                            <Redo2 className="w-5 h-5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Redo (⌘⇧Z)</TooltipContent>
                </Tooltip>
            </div>

            <Separator className="my-1" />

            <div className="flex flex-col gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="flex items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors" onClick={onAddImage}>
                            <Image className="w-5 h-5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Add Image</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <button className="flex items-center justify-center p-2 rounded-lg hover:bg-muted transition-colors" onClick={onExport}>
                            <Download className="w-5 h-5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Export PNG</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className="flex items-center justify-center p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                            onClick={onClear}
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Clear Canvas</TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}
