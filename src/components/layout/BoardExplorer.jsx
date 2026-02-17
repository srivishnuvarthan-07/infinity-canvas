import { Plus, Trash2, File, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function BoardExplorer({
    boards,
    activeBoardId,
    onSelectBoard,
    onCreateBoard,
    onDeleteBoard
}) {
    // Sort by updated desc
    const sortedBoards = Object.values(boards).sort((a, b) => b.updatedAt - a.updatedAt);

    return (
        <div className="w-64 h-full bg-transparent flex flex-col text-neutral-600">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-neutral-800">
                    <LayoutGrid className="w-5 h-5 text-blue-500" />
                    <span>Explorer</span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800"
                    onClick={onCreateBoard}
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>

            <Separator className="bg-neutral-200" />

            {/* List */}
            <ScrollArea className="flex-1">
                <div className="p-2 flex flex-col gap-1">
                    <div className="px-2 py-1 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Open Boards
                    </div>
                    {sortedBoards.map(board => (
                        <div
                            key={board.id}
                            className={cn(
                                "group flex items-center justify-between px-2 py-2 rounded-md cursor-pointer transition-colors text-sm",
                                activeBoardId === board.id
                                    ? "bg-blue-50 text-blue-600 font-medium"
                                    : "hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900"
                            )}
                            onClick={() => onSelectBoard(board.id)}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <File className={cn("w-4 h-4 shrink-0", activeBoardId === board.id ? "text-blue-500" : "text-neutral-400")} />
                                <span className="truncate">{board.name}</span>
                            </div>

                            {/* Actions (Visible on Hover or Active) */}
                            {Object.keys(boards).length > 1 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-neutral-400 hover:text-red-500",
                                        activeBoardId === board.id && "bg-transparent"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete "${board.name}"?`)) {
                                            onDeleteBoard(board.id);
                                        }
                                    }}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
