import { Plus, Trash2, File, Cloud, HardDrive, MoreHorizontal, Search, LayoutGrid } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function BoardExplorer({
    boards,
    activeBoardId,
    onSelectBoard,
    onCreateBoard,
    onDeleteBoard
}) {
    const [search, setSearch] = useState("");
    const [hovered, setHovered] = useState(null);

    const sortedBoards = [...boards]
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        .filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()));

    const localBoards = sortedBoards.filter(b => b.isLocal);
    const cloudBoards = sortedBoards.filter(b => !b.isLocal);

    return (
        <div className="w-64 h-full flex flex-col bg-transparent select-none">
            {/* Header */}
            <div className="px-3 pt-3 pb-2 border-b border-neutral-100 shrink-0">
                <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold text-neutral-800">Boards</span>
                    </div>
                    <button
                        onClick={onCreateBoard}
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-indigo-50 text-neutral-400 hover:text-indigo-600 transition-all duration-150 active:scale-90"
                        title="New Board"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search boards..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 text-[11px] bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-neutral-300"
                    />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2 flex flex-col gap-4">

                    {/* Cloud Boards */}
                    {cloudBoards.length > 0 && (
                        <div>
                            <div className="flex items-center gap-1.5 px-2 py-1 mb-1">
                                <Cloud className="w-2.5 h-2.5 text-neutral-400" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Cloud</span>
                                <span className="ml-auto text-[9px] text-neutral-300">{cloudBoards.length}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                {cloudBoards.map(board => (
                                    <BoardItem
                                        key={board.id}
                                        board={board}
                                        isActive={activeBoardId === board.id}
                                        isHovered={hovered === board.id}
                                        onHover={setHovered}
                                        onSelect={onSelectBoard}
                                        onDelete={boards.length > 1 ? onDeleteBoard : null}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Local Boards */}
                    {localBoards.length > 0 && (
                        <div>
                            <div className="flex items-center gap-1.5 px-2 py-1 mb-1">
                                <HardDrive className="w-2.5 h-2.5 text-amber-500" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Local</span>
                                <span className="ml-auto text-[9px] text-neutral-300">{localBoards.length}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                {localBoards.map(board => (
                                    <BoardItem
                                        key={board.id}
                                        board={board}
                                        isActive={activeBoardId === board.id}
                                        isHovered={hovered === board.id}
                                        onHover={setHovered}
                                        onSelect={onSelectBoard}
                                        onDelete={boards.length > 1 ? onDeleteBoard : null}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {sortedBoards.length === 0 && (
                        <div className="flex flex-col items-center py-8 text-center">
                            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                                <Search className="w-4 h-4 text-neutral-400" />
                            </div>
                            <p className="text-xs font-medium text-neutral-500">No boards found</p>
                            {search && <p className="text-[10px] text-neutral-400 mt-0.5">Try a different search</p>}
                        </div>
                    )}

                    {/* New Board CTA */}
                    <button
                        onClick={onCreateBoard}
                        className="group w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-neutral-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-neutral-400 hover:text-indigo-600 transition-all duration-200 text-[11px] font-semibold"
                    >
                        <div className="w-5 h-5 rounded-md bg-neutral-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                            <Plus className="w-3 h-3" />
                        </div>
                        New Board
                    </button>
                </div>
            </ScrollArea>
        </div>
    );
}

function BoardItem({ board, isActive, onSelect, onDelete }) {
    const [showMenu, setShowMenu] = useState(false);

    const timeLabel = (() => {
        if (!board.updatedAt) return "";
        const diff = Date.now() - board.updatedAt;
        if (diff < 60000) return "just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return `${Math.floor(diff / 86400000)}d ago`;
    })();

    return (
        <div
            className={cn(
                "group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all duration-150",
                isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            )}
            onClick={() => onSelect(board.id)}
        >
            {/* Icon */}
            <div className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors",
                isActive ? "bg-blue-100" : "bg-neutral-100 group-hover:bg-neutral-200"
            )}>
                <File className={cn("w-3.5 h-3.5", isActive ? "text-blue-600" : "text-neutral-500")} />
            </div>

            {/* Name + time */}
            <div className="flex-1 min-w-0">
                <p className={cn("text-[12px] font-semibold truncate", isActive ? "text-blue-700" : "text-neutral-700")}>
                    {board.name || "Untitled Board"}
                </p>
                {timeLabel && (
                    <p className="text-[9px] text-neutral-400 mt-0.5">{timeLabel}</p>
                )}
            </div>

            {/* Active indicator */}
            {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            )}

            {/* Delete on hover */}
            {onDelete && (
                <button
                    className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-red-50 text-neutral-400 hover:text-red-400 transition-all shrink-0"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${board.name}"?`)) onDelete(board.id);
                    }}
                    title="Delete board"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}
