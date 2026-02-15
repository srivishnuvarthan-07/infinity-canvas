import { Files, Grid, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function ActivityBar({ activeView, onViewChange }) {

    return (
        <div className="flex flex-col gap-4">
            <ActivityItem
                icon={Files}
                label="Boards"
                isActive={activeView === 'boards'}
                onClick={() => onViewChange('boards')}
            />
            <ActivityItem
                icon={Grid}
                label="Library"
                isActive={activeView === 'library'}
                onClick={() => onViewChange('library')}
            />

            <div className="grow" />

            {/* <ActivityItem 
                icon={Settings} 
                label="Settings" 
                isActive={activeView === 'settings'} 
                onClick={() => onViewChange('settings')} 
            /> */}
        </div>
    );
}

function ActivityItem({ icon: Icon, label, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            title={label}
            className={cn(
                "w-10 h-10 rounded-md flex items-center justify-center transition-all",
                isActive
                    ? "text-blue-400 bg-blue-500/10"
                    : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800"
            )}
        >
            <Icon className="w-5 h-5" />
        </button>
    );
}
