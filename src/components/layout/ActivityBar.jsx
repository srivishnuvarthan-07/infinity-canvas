import { Files, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActivityBar({ activeView, onViewChange }) {
    return (
        <div className="flex flex-col items-center gap-1 mt-2">
            {/* Floating glass container */}
            <div className="flex flex-col items-center gap-1 bg-neutral-900/80 backdrop-blur-md border border-white/[0.06] rounded-xl p-1 shadow-lg">
                <ActivityItem
                    icon={Files}
                    label="Boards"
                    isActive={activeView === 'boards'}
                    onClick={() => onViewChange('boards')}
                />
                <ActivityItem
                    icon={BookOpen}
                    label="Library"
                    isActive={activeView === 'library'}
                    onClick={() => onViewChange('library')}
                />
            </div>
        </div>
    );
}

function ActivityItem({ icon: Icon, label, isActive, onClick }) {
    return (
        <div className="relative group/item">
            <button
                onClick={onClick}
                title={label}
                className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150",
                    isActive
                        ? "text-indigo-400 bg-indigo-500/15 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.07]"
                )}
            >
                <Icon className="w-4 h-4" />
            </button>
            {/* Tooltip */}
            <div className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150 z-[100]">
                <div className="bg-neutral-800 text-neutral-200 text-[11px] font-medium px-2 py-1 rounded-md whitespace-nowrap shadow-lg border border-white/[0.06]">
                    {label}
                </div>
            </div>
        </div>
    );
}
