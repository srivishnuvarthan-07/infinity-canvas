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
            className="group relative flex flex-col bg-white border-[0.5px] border-black/5 rounded-[12px] overflow-hidden cursor-pointer hover:-translate-y-[3px] hover:border-black/10 transition-all duration-200 ease-out h-[auto]"
            onClick={() => navigate(`/board/${board.id}`)}
        >
            {/* Thumbnail Area */}
            <div className="h-[100px] w-full bg-[#FAFAFA] flex items-center justify-center overflow-hidden relative">
                {board.thumbnail ? (
                    <>
                        <img src={board.thumbnail} alt={board.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                    </>
                ) : (
                    <div className="absolute inset-0">
                        <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <pattern id="dotGrid" width="12" height="12" patternUnits="userSpaceOnUse">
                                    <circle cx="2" cy="2" r="1.5" fill="#000" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#dotGrid)" />
                        </svg>
                    </div>
                )}

                {/* Storage Type Badge */}
                <div className="absolute top-[8px] right-[8px] z-10">
                    {board.isLocal ? (
                        <span className="flex items-center gap-[4px] px-[8px] py-[2px] rounded-[99px] bg-[#FAEEDA] text-[#854F0B] text-[10px] font-medium shadow-sm">
                            <span className="h-[5px] w-[5px] rounded-full bg-[#854F0B]"></span>
                            Local
                        </span>
                    ) : (
                        <span className="flex items-center gap-[4px] px-[8px] py-[2px] rounded-[99px] bg-[#E6F1FB] text-[#185FA5] text-[10px] font-medium shadow-sm">
                            <span className="h-[5px] w-[5px] rounded-full bg-[#185FA5]"></span>
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
            <div className="p-[12px_14px] flex flex-col border-t-[0.5px] border-black/5 bg-white shrink-0">
                <h3 className="font-medium text-[13px] text-neutral-900 tracking-tight truncate pr-2 group-hover:text-indigo-600 transition-colors">
                    {board.name}
                </h3>
                <div className="flex items-center text-[11px] text-neutral-500 gap-[4px] mt-[3px]">
                    <Clock className="h-[10px] w-[10px] text-neutral-400" />
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
