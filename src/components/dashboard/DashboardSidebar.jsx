import { LayoutGrid, Home, Users, Shapes, Settings, Box, HardDrive, Share2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceStore } from "@/hooks/useWorkspaceStore";
import { useEffect } from "react";

export function DashboardSidebar() {
    const { user } = useAuth();
    const { workspaces, activeWorkspaceId, fetchWorkspaces, setActiveWorkspaceId, createWorkspace } = useWorkspaceStore();

    useEffect(() => {
        if (user) {
            fetchWorkspaces();
        }
    }, [user, fetchWorkspaces]);

    // Guest Links
    const guestLinks = [
        { id: 'shared', label: 'Shared Boards', icon: Share2, to: '/dashboard/shared' },
        { id: 'boards', label: 'Local Boards', icon: HardDrive, to: '/dashboard/boards' },
    ];

    // Logged-in Links
    const authLinks = [
        { id: 'overview', label: 'Overview', icon: Home, to: '/dashboard/overview' },
        { id: 'boards', label: 'All Boards', icon: LayoutGrid, to: '/dashboard/boards' },
        { id: 'team', label: 'Team', icon: Users, to: '/dashboard/team' },
        { id: 'library', label: 'Library', icon: Shapes, to: '/dashboard/library' },
    ];

    const navItems = user ? authLinks : guestLinks;

    return (
        <aside className="w-64 border-r border-black/5 bg-[#F6F5F3]/50 backdrop-blur-xl h-screen flex flex-col sticky top-0 z-20 text-neutral-600">
            <div className="p-6 flex items-center gap-3">
                <div className="h-9 w-9 bg-neutral-900 rounded-xl flex items-center justify-center text-white shadow-md shadow-black/10">
                    <Box className="h-5 w-5" />
                </div>
                <span className="font-semibold text-lg text-neutral-900 tracking-tight">Studio</span>
            </div>

            <nav className="flex-1 px-4 py-2 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.id}
                        to={item.to}
                        className={({ isActive }) => cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                            isActive
                                ? 'bg-white text-neutral-900 shadow-sm border border-black/5'
                                : 'hover:bg-white/50 text-neutral-500 hover:text-neutral-800'
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-neutral-900" : "text-neutral-400 group-hover:text-neutral-600")} />
                                {item.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Workspaces Section (Logged in only) */}
            {user && (
                <div className="px-4 py-2 mt-4">
                    <div className="flex items-center justify-between px-2 mb-2">
                        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">Workspaces</span>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 hover:bg-black/5" 
                            title="Create Workspace"
                            onClick={() => {
                                const name = prompt("Enter Workspace Name:");
                                if (name) createWorkspace(name);
                            }}
                        >
                            <Plus className="h-3 w-3 text-neutral-500" />
                        </Button>
                    </div>
                    <div className="space-y-1">
                        {workspaces.map(ws => (
                            <Button
                                key={ws._id}
                                variant={activeWorkspaceId === ws._id ? "secondary" : "ghost"}
                                onClick={() => setActiveWorkspaceId(ws._id)}
                                className={cn(
                                    "w-full justify-start gap-3 px-3 font-medium rounded-xl",
                                    activeWorkspaceId === ws._id 
                                        ? "bg-white border border-black/5 shadow-sm text-neutral-800"
                                        : "hover:bg-black/5 text-neutral-500"
                                )}
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold",
                                    activeWorkspaceId === ws._id
                                        ? "bg-neutral-800 text-white"
                                        : "bg-neutral-200 text-neutral-500"
                                )}>
                                    {ws.name ? ws.name.charAt(0).toUpperCase() : 'W'}
                                </div>
                                <span className="truncate">{ws.name}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {user && (
                <div className="p-4 mt-auto">
                    <NavLink
                        to="/dashboard/settings"
                        className={({ isActive }) => cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                            isActive
                                ? 'bg-white text-neutral-900 shadow-sm border border-black/5'
                                : 'hover:bg-white/50 text-neutral-500 hover:text-neutral-800'
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <Settings className={cn("h-4 w-4 transition-colors", isActive ? "text-neutral-900" : "text-neutral-400 group-hover:text-neutral-600")} />
                                Settings
                            </>
                        )}
                    </NavLink>
                </div>
            )}
        </aside>
    );
}
