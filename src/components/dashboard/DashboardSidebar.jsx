import { LayoutGrid, Home, Shapes, Settings, Compass, Plus, ChevronDown, User, Keyboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

export function DashboardSidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/dashboard');
    };

    const guestLinks = [
        { id: 'boards', label: 'Local Boards', icon: LayoutGrid, to: '/dashboard/boards' },
    ];

    const authLinks = [
        { id: 'overview', label: 'Overview', icon: LayoutGrid, to: '/dashboard/overview' },
        { id: 'boards', label: 'All boards', icon: Home, to: '/dashboard/boards' },
        { id: 'library', label: 'Library', icon: Shapes, to: '/dashboard/library' },
        { id: 'explore', label: 'Explore', icon: Compass, to: '/dashboard/explore' },
    ];

    const navItems = user ? authLinks : guestLinks;

    return (
        <aside className="w-[240px] flex flex-col bg-[#FAFAFA] border-r border-black/5 py-4 flex-shrink-0 z-20">
            {/* Logo Row */}
            <div className="px-4 pb-4 border-b border-black/5 mb-3">
                <div className="flex items-center gap-2.5 p-1 -m-1 rounded-xl">
                    <div className="h-7 w-7 bg-neutral-900 rounded-[7px] flex items-center justify-center text-white shrink-0">
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </div>
                    <span className="font-medium text-[14px] text-neutral-900 tracking-tight">Infinity</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="px-2.5 flex flex-col gap-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.id}
                        to={item.to}
                        className={({ isActive }) => cn(
                            "flex items-center gap-[9px] px-[10px] py-[7px] border border-transparent rounded-lg text-[13px] transition-colors",
                            isActive
                                ? 'bg-white text-neutral-900 font-medium shadow-sm border-black/5'
                                : 'text-neutral-500 hover:bg-white hover:text-neutral-900 border-transparent hover:border-black/5'
                        )}
                    >
                        <item.icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Section */}
            {user && (
                <div className="mt-auto px-2.5 pt-3 border-t border-black/5">
                    <NavLink
                        to="/dashboard/settings"
                        className={({ isActive }) => cn(
                            "flex items-center gap-[9px] px-[10px] py-[7px] border border-transparent rounded-lg text-[13px] transition-colors mb-2",
                            isActive
                                ? 'bg-white text-neutral-900 font-medium shadow-sm border-black/5'
                                : 'text-neutral-500 hover:bg-white hover:text-neutral-900 hover:border-black/5'
                        )}
                    >
                        <Settings className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                        Settings
                    </NavLink>
                    
                    <div className="flex items-center gap-[9px] p-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-black/5 transition-colors cursor-pointer" onClick={() => navigate('/profile')}>
                        <div className="h-[26px] w-[26px] bg-[#7F77DD] rounded-full flex items-center justify-center text-white text-[10px] font-medium shrink-0">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[12px] font-medium text-neutral-900 leading-tight">{user?.name}</span>
                            <span className="text-[10px] text-neutral-500 leading-tight">Pro plan</span>
                        </div>
                    </div>
                </div>
            )}
            
            <KeyboardShortcutsModal open={shortcutsModalOpen} onOpenChange={setShortcutsModalOpen} />
        </aside>
    );
}
