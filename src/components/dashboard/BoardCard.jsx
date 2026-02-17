import { MoreHorizontal, Clock, Cloud } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function BoardCard({ board, onRename, onDelete }) {
    const navigate = useNavigate();

    return (
        <div
            className="group relative flex flex-col rounded-2xl bg-white border border-neutral-200 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer overflow-hidden"
            onClick={() => navigate(`/board/${board.id}`)}
        >
            {/* Thumbnail Area */}
            <div className="aspect-[16/10] w-full bg-neutral-50 flex items-center justify-center overflow-hidden relative">
                {board.thumbnail ? (
                    <img src={board.thumbnail} alt={board.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="text-neutral-300">
                        <div className="w-16 h-16 rounded-xl border-2 border-dashed border-current flex items-center justify-center opacity-50">
                            <span className="text-[10px] font-medium uppercase tracking-wider">Preview</span>
                        </div>
                    </div>
                )}

                {/* Overlay Actions */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-sm bg-white/90 hover:bg-white backdrop-blur-sm">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onRename(board.id)}>Rename</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(board.id)}>
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Footer Info */}
            <div className="p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <h3 className="font-medium text-neutral-900 tracking-tight truncate pr-2">{board.name}</h3>
                    {board.cloudId && (
                        <Cloud className="h-3 w-3 text-sky-500 flex-shrink-0" />
                    )}
                </div>
                <div className="flex items-center text-[11px] text-neutral-400 gap-2">
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
