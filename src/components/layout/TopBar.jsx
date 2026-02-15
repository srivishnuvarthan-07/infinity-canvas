import { Input } from "@/components/ui/input";
import { Check, Dot, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function TopBar({ boardName, isSaved, onRename, isSidebarOpen, onToggleSidebar }) {
    const [name, setName] = useState(boardName);

    useEffect(() => {
        setName(boardName);
    }, [boardName]);

    return (
        <div className="h-12 bg-neutral-900 border-b border-neutral-800 flex items-center px-4 justify-between select-none">

            <div className="flex items-center gap-3">
                {/* Sidebar Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-800"
                    onClick={onToggleSidebar}
                    title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
                >
                    {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                </Button>

                {/* Title Editor */}
                <div className="flex items-center gap-2">
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => {
                            if (name.trim() !== boardName) onRename(name);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        className="bg-transparent border-transparent hover:border-neutral-700 focus:border-blue-500 text-neutral-200 w-[300px] h-8 font-medium px-2 transition-all"
                    />
                </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2 text-xs text-neutral-500">
                {isSaved ? (
                    <div className="flex items-center gap-1 text-green-500/80">
                        <Check className="w-3 h-3" />
                        <span>Saved</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-yellow-500/80">
                        <Dot className="w-4 h-4 animate-pulse" />
                        <span>Saving...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
