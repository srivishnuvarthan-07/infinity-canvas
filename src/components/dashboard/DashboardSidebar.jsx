import { LayoutGrid, Clock, Star, Trash2, Settings, Box, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function DashboardSidebar({ activeTab, onTabChange }) {
    const navItems = [
        { id: 'all', label: 'All Boards', icon: LayoutGrid },
        { id: 'recent', label: 'Recent', icon: Clock },
        { id: 'starred', label: 'Starred', icon: Star },
        { id: 'trash', label: 'Trash', icon: Trash2 },
    ];

    return (
        <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl h-screen flex flex-col sticky top-0 z-20 text-neutral-400">
            <div className="p-6 flex items-center gap-2">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                    <Box className="h-5 w-5" />
                </div>
                <span className="font-bold text-lg tracking-tight">Infinity</span>
            </div>

            <nav className="flex-1 px-4 py-2 space-y-1">
                {navItems.map((item) => (
                    <Button
                        key={item.id}
                        variant="ghost" // The variant prop is no longer directly controlling the style, the className does.
                        className={cn(
                            `w-full flex items-center justify-start gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === item.id
                                ? 'bg-indigo-500/10 text-indigo-400'
                                : 'hover:bg-white/5 text-neutral-400 hover:text-neutral-200'
                            }`
                        )}
                        onClick={() => onTabChange(item.id)}
                    >
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        {item.label}
                    </Button>
                ))}
            </nav>

            {/* Workspaces Section */}
            <div className="px-4 py-2 mt-4">
                <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workspaces</span>
                    <Button variant="ghost" size="icon" className="h-4 w-4 hover:bg-neutral-200" title="Create Workspace">
                        <Plus className="h-3 w-3 text-muted-foreground" />
                    </Button>
                </div>
                <div className="space-y-1">
                    <Button
                        variant="secondary"
                        className="w-full justify-start gap-3 px-3 font-medium bg-secondary/50"
                    >
                        <div className="w-4 h-4 rounded bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                            P
                        </div>
                        Personal
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 px-3 font-normal opacity-50 cursor-not-allowed"
                        title="Team Workspaces (Coming Soon)"
                    >
                        <div className="w-4 h-4 rounded bg-neutral-200 text-neutral-500 flex items-center justify-center text-[10px] font-bold">
                            T
                        </div>
                        Team
                    </Button>
                </div>
            </div>

            <div className="p-4 border-t border-border">
                <Button variant="ghost" className="w-full justify-start gap-3">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Settings
                </Button>
            </div>
        </aside>
    );
}
