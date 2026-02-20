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
            className="group relative flex flex-col rounded-2xl bg-black/40 border border-white/5 shadow-sm transition-all hover:shadow-lg hover:shadow-indigo-500/10 hover:border-white/10 hover:-translate-y-1 cursor-pointer overflow-hidden"
            onClick={() => navigate(`/board/${board.id}`)}
        >
            {/* Thumbnail Area */}
            <div className="aspect-[16/10] w-full bg-neutral-900/50 flex items-center justify-center overflow-hidden relative">
                {board.thumbnail ? (
                    <img src={board.thumbnail} alt={board.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                    <div className="text-neutral-700">
                        <div className="w-16 h-16 rounded-xl border-2 border-dashed border-current flex items-center justify-center opacity-50">
                            <span className="text-[10px] font-medium uppercase tracking-wider">Preview</span>
                        </div>
                    </div>
                )}

                {/* Storage Type Badge */}
                <div className="absolute top-2.5 left-2.5">
                    {board.isLocal ? (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[10px] font-medium">
                            <HardDrive className="h-2.5 w-2.5" />
                            Local
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-[10px] font-medium">
                            <Cloud className="h-2.5 w-2.5" />
                            Cloud
                        </span>
                    )}
                </div>

                {/* Three-Dot Menu */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm border border-white/10">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 bg-neutral-900 border-white/10 text-neutral-300 p-1">

                            <DropdownMenuItem
                                onClick={() => onRename(board.id)}
                                className="flex items-center gap-2 focus:bg-white/10 focus:text-white cursor-pointer rounded-md px-2 py-1.5 text-sm"
                            >
                                <Pencil className="h-3.5 w-3.5 text-neutral-400" />
                                Rename
                            </DropdownMenuItem>

                            {/* Move to Cloud — only local boards when signed in */}
                            {canMoveToCloud && (
                                <DropdownMenuItem
                                    onClick={() => onMoveToCloud?.(board.id)}
                                    className="flex items-center gap-2 focus:bg-indigo-500/20 focus:text-indigo-300 text-indigo-400 cursor-pointer rounded-md px-2 py-1.5 text-sm"
                                >
                                    <CloudUpload className="h-3.5 w-3.5" />
                                    Move to Cloud
                                </DropdownMenuItem>
                            )}

                            <MenuSeparator className="bg-white/10 my-1" />

                            <DropdownMenuItem
                                className="flex items-center gap-2 text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer rounded-md px-2 py-1.5 text-sm"
                                onClick={() => onDelete(board.id)}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Footer Info */}
            <div className="p-3.5 flex flex-col gap-1">
                <h3 className="font-medium text-neutral-200 tracking-tight truncate pr-2 group-hover:text-white transition-colors text-sm">
                    {board.name}
                </h3>
                <div className="flex items-center text-[11px] text-neutral-600 gap-1.5">
                    <Clock className="h-3 w-3" />
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
