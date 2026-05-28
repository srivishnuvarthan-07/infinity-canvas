import { 
    Clock, CloudUpload, Pencil, Trash2, ArrowUpRight, FolderOpen,
    MoreHorizontal, Cloud, HardDrive
} from "lucide-react";
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

    const handleCardClick = () => {
        navigate(`/board/${board.id}`);
    };

    return (
        <div
            className="group relative flex flex-col bg-white/60 backdrop-blur-md border border-neutral-200/50 rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-1.5 hover:border-indigo-400 hover:shadow-[0_12px_24px_rgba(99,102,241,0.04)] transition-all duration-300 h-auto"
            onClick={handleCardClick}
        >
            {/* Thumbnail / Graphic Area */}
            <div className="h-[120px] w-full bg-neutral-50/50 flex items-center justify-center overflow-hidden relative border-b border-neutral-100">
                {board.thumbnail ? (
                    <>
                        <img 
                            src={board.thumbnail} 
                            alt={board.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        />
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                        {/* Dot grid pattern background */}
                        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1.2px,transparent_1.2px)] [background-size:12px_12px] opacity-75" />
                        
                        {/* Beautiful architectural diagram mockup */}
                        <svg 
                            className="w-24 h-24 text-indigo-500/10 absolute transition-transform duration-500 group-hover:scale-110 group-hover:rotate-1" 
                            viewBox="0 0 100 100" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="1.2"
                        >
                            {/* Blueprint components */}
                            <rect x="15" y="25" width="70" height="50" rx="4" strokeDasharray="3 3" />
                            <circle cx="35" cy="45" r="6" />
                            <rect x="60" y="40" width="12" height="10" rx="1.5" />
                            <path d="M 41 45 L 60 45" strokeWidth="1.5" strokeDasharray="2 2" />
                            <circle cx="66" cy="63" r="4" />
                            <path d="M 35 51 L 35 63 L 62 63" strokeWidth="1.2" />
                            <line x1="10" y1="80" x2="90" y2="80" strokeWidth="1.5" />
                        </svg>

                        {/* Subtle color highlight glow on hover */}
                        <div className="absolute -inset-10 bg-gradient-to-tr from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/[0.02] group-hover:to-purple-500/[0.02] transition-all duration-500" />
                    </div>
                )}

                {/* Storage Pill Badge */}
                <div className="absolute top-3 left-3 z-10">
                    {board.isLocal ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-wider border border-amber-200/50 shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Local
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-bold uppercase tracking-wider border border-indigo-200/50 shadow-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                            Cloud
                        </span>
                    )}
                </div>

                {/* Hover Quick Actions Overlay Bar */}
                <div className="absolute inset-0 bg-neutral-900/10 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 z-20">
                    {/* "Open Workspace" primary action button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white rounded-xl text-[11px] font-bold hover:bg-neutral-800 transition-all shadow-md transform hover:scale-[1.04] active:scale-95"
                    >
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span>Open</span>
                    </button>

                    {/* Quick options panel */}
                    <div className="flex bg-white/95 border border-neutral-200/50 rounded-xl p-1 shadow-md">
                        <button
                            onClick={(e) => { e.stopPropagation(); onRename(board.id); }}
                            className="p-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Rename board"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </button>

                        {canMoveToCloud && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onMoveToCloud?.(board.id); }}
                                className="p-1.5 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Move to Cloud"
                            >
                                <CloudUpload className="h-3.5 w-3.5" />
                            </button>
                        )}

                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(board.id); }}
                            className="p-1.5 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete board"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {/* backup Three-Dot dropdown for mobile/narrow viewports */}
                <div className="absolute top-2.5 right-2.5 z-10 md:hidden" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-white/90 hover:bg-white text-neutral-700 shadow-sm border border-neutral-200/50">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-white border border-neutral-200/60 text-neutral-700 p-1 shadow-lg rounded-xl">
                            <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); onRename(board.id); }}
                                className="flex items-center gap-2 focus:bg-neutral-50 focus:text-neutral-900 cursor-pointer rounded-lg px-2 py-1.5 text-[12px] font-medium"
                            >
                                <Pencil className="h-3.5 w-3.5 text-neutral-400" />
                                Rename
                            </DropdownMenuItem>

                            {canMoveToCloud && (
                                <DropdownMenuItem
                                    onClick={(e) => { e.stopPropagation(); onMoveToCloud?.(board.id); }}
                                    className="flex items-center gap-2 focus:bg-indigo-50 focus:text-indigo-700 text-indigo-600 cursor-pointer rounded-lg px-2 py-1.5 text-[12px] font-medium"
                                >
                                    <CloudUpload className="h-3.5 w-3.5" />
                                    Move to Cloud
                                </DropdownMenuItem>
                            )}

                            <MenuSeparator className="bg-neutral-100 my-1" />

                            <DropdownMenuItem
                                className="flex items-center gap-2 text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer rounded-lg px-2 py-1.5 text-[12px] font-medium"
                                onClick={(e) => { e.stopPropagation(); onDelete(board.id); }}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Footer / Meta Info */}
            <div className="p-4 flex flex-col bg-white shrink-0 transition-colors group-hover:bg-neutral-50/20">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-[13px] text-neutral-800 tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                        {board.name}
                    </h3>
                    <ArrowUpRight className="h-3.5 w-3.5 text-neutral-300 opacity-0 group-hover:opacity-100 group-hover:text-indigo-500 transition-all transform translate-y-0.5 group-hover:translate-y-0" />
                </div>
                <div className="flex items-center text-[10px] text-neutral-400 gap-1.5 mt-1 font-semibold">
                    <Clock className="h-3.5 w-3.5 text-neutral-300" />
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
