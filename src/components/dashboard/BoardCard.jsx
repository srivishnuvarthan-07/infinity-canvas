import { MoreHorizontal, Clock, Cloud, HardDrive, CloudUpload, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator as MenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function BoardCard({ board, onRename, onDelete, onMoveToCloud }) {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Show "Move to Cloud" only for local boards when signed in
    const canMoveToCloud = board.isLocal && !!user;

    return (
        <div
            className="group relative flex flex-col spatial-card cursor-pointer overflow-hidden h-full"
            onClick={() => navigate(`/board/${board.id}`)}
        >
            {/* Thumbnail Area */}
            <div className="aspect-[16/10] w-full bg-[#f8f8f8] flex items-center justify-center overflow-hidden relative">
                {board.thumbnail ? (
                    <>
                        <img src={board.thumbnail} alt={board.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-50/50 transition-transform duration-500 group-hover:scale-105">
                        <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Start creating...</span>
                    </div>
                )}

                {/* Storage Type Badge */}
                <div className="absolute top-3 right-3 z-10 transition-transform duration-300">
                    {board.isLocal ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-black/5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] text-neutral-600 text-[10px] font-semibold tracking-wide">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                            Local
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-black/5 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] text-neutral-600 text-[10px] font-semibold tracking-wide">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                            Cloud
                        </span>
                    )}
                </div>

                {/* Three-Dot Menu */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white hover:bg-neutral-50 text-neutral-700 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.1)] border border-black/5">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 bg-white border border-black/5 text-neutral-700 p-1 shadow-lg rounded-xl">

                            <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); onRename(board.id); }}
                                className="flex items-center gap-2 focus:bg-neutral-100 focus:text-neutral-900 cursor-pointer rounded-lg px-2 py-2 text-sm"
                            >
                                <Pencil className="h-4 w-4 text-neutral-400" />
                                Rename
                            </DropdownMenuItem>

                            {/* Move to Cloud — only local boards when signed in */}
                            {canMoveToCloud && (
                                <DropdownMenuItem
                                    onClick={(e) => { e.stopPropagation(); onMoveToCloud?.(board.id); }}
                                    className="flex items-center gap-2 focus:bg-indigo-50 focus:text-indigo-700 text-indigo-600 cursor-pointer rounded-lg px-2 py-2 text-sm"
                                >
                                    <CloudUpload className="h-4 w-4" />
                                    Move to Cloud
                                </DropdownMenuItem>
                            )}

                            <MenuSeparator className="bg-black/5 my-1" />

                            <DropdownMenuItem
                                className="flex items-center gap-2 text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer rounded-lg px-2 py-2 text-sm"
                                onClick={(e) => { e.stopPropagation(); onDelete(board.id); }}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Footer Info */}
            <div className="p-4 flex flex-col gap-1.5 border-t border-black/5 bg-white shrink-0">
                <h3 className="font-semibold text-neutral-800 tracking-tight truncate pr-2 group-hover:text-indigo-600 transition-colors text-sm">
                    {board.name}
                </h3>
                <div className="flex items-center text-xs text-neutral-500 gap-1.5 font-medium">
                    <Clock className="h-3 w-3 text-neutral-400" />
                    <span>
                        {board.updatedAt
                            ? formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true })
                            : 'Just now'}
                    </span>
                </div>
            </div>
        </div>
    );
}
