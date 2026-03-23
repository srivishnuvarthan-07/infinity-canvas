import { Button } from "@/components/ui/button";
import { UserProfileMenu } from "@/components/dashboard/UserProfileMenu";
import { Menu, Share2, MessageSquare, Clock } from "lucide-react";

export function CanvasHeader({ boardName, onRename, onBack, onShare, onToggleHistory, onToggleComments }) {
    return (
        <header className="absolute top-4 left-4 right-4 h-14 flex items-center justify-between pointer-events-none z-40">
            {/* Left: Menu & Board Info */}
            <div className="flex items-center gap-3 pointer-events-auto bg-white/80 backdrop-blur-md p-1.5 pr-4 rounded-xl shadow-sm border border-neutral-200/50">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-neutral-100" onClick={onBack}>
                    <Menu className="h-5 w-5 text-neutral-600" />
                </Button>
                <div className="flex flex-col">
                    <input
                        value={boardName}
                        onChange={(e) => onRename(e.target.value)}
                        className="text-sm font-semibold bg-transparent border-none outline-none text-neutral-900 placeholder:text-neutral-400 w-32 focus:w-48 transition-all p-0"
                        placeholder="Untitled Board"
                    />
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-medium text-neutral-500">Saved</span>
                    </div>
                </div>
            </div>

            {/* Right: Collaboration & Actions */}
            <div className="flex items-center gap-2 pointer-events-auto">
                {/* Presence pile rendered by DrawingCanvas via socket.remoteUsers */}

                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-xl shadow-sm border border-neutral-200/50">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-indigo-50 text-neutral-500 hover:text-indigo-600" onClick={onToggleComments}>
                        <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-indigo-50 text-neutral-500 hover:text-indigo-600" onClick={onToggleHistory}>
                        <Clock className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-5 bg-neutral-200 mx-1" />
                    <Button onClick={onShare} className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-lg px-3 text-xs font-medium">
                        Share
                    </Button>
                </div>
            </div>
        </header>
    );
}
