import { LayoutGrid, Home, Shapes, Settings, Plus, User, Keyboard, LogOut, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
        { id: 'boards', label: 'All boards', icon: Home, to: '/dashboard/overview#boards' },
        { id: 'library', label: 'Library', icon: Shapes, to: '/dashboard/library' },
    ];

    const navItems = user ? authLinks : guestLinks;

    return (
        <aside className="relative z-20 w-[250px] m-4 mr-0 bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl h-[calc(100vh-32px)] flex flex-col justify-between flex-shrink-0 shadow-lg shadow-black/[0.02]">
            <div className="flex flex-col">
                {/* Logo Row */}
                <div className="p-6 flex items-center gap-3">
                    <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-md shadow-black/10 transform hover:rotate-6 transition-all duration-300 border border-slate-800">
                        <Box className="h-6 w-6 text-slate-100" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[18px] font-black tracking-tight text-neutral-900 leading-none">InfiniCanvas</span>
                        <span className="text-[11px] text-indigo-600 font-bold mt-1 tracking-wider uppercase">Pro Workspace</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="px-3 flex flex-col gap-1 mt-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={(e) => {
                                e.preventDefault();
                                if (item.id === 'boards') {
                                    if (window.location.pathname.includes('/dashboard/overview')) {
                                        const el = document.getElementById('boards');
                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                    } else {
                                        navigate('/dashboard/overview');
                                        setTimeout(() => {
                                            const el = document.getElementById('boards');
                                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                                        }, 150);
                                    }
                                } else {
                                    if (item.id === 'overview') {
                                        navigate(item.to);
                                        setTimeout(() => {
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }, 100);
                                    } else {
                                        navigate(item.to);
                                    }
                                }
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200",
                                (window.location.pathname === item.to || (item.id === 'boards' && window.location.pathname === '/dashboard/overview' && window.location.hash === '#boards')) && item.id !== 'boards'
                                    ? 'bg-white text-indigo-600 shadow-sm border border-neutral-200/50'
                                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50 border border-transparent'
                            )}
                        >
                            <item.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Bottom Section */}
            {user && (
                <div className="p-4 mt-auto">
                    <div className="bg-white/60 border border-neutral-200/50 rounded-2xl p-2 shadow-sm flex flex-col gap-1">
                        <div 
                            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/50 hover:shadow-sm border border-transparent hover:border-neutral-200/50 transition-colors cursor-pointer" 
                            onClick={() => navigate('/profile')}
                        >
                            <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-[12px] font-bold shrink-0 shadow-sm">
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-neutral-900 leading-tight">{user?.name}</span>
                                <span className="text-[10px] text-neutral-500 leading-tight mt-0.5">Manage profile</span>
                            </div>
                        </div>
                        <div className="h-[1px] w-full bg-neutral-200/50 my-1" />
                        <div 
                            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[#FCEBEB] hover:shadow-sm border border-transparent hover:border-[#FCEBEB] transition-colors cursor-pointer group" 
                            onClick={handleLogout}
                        >
                            <div className="h-8 w-8 bg-neutral-100 rounded-full flex items-center justify-center shrink-0 group-hover:bg-white transition-colors">
                                <LogOut className="h-4 w-4 text-[#E24B4A]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-[#E24B4A] leading-tight">Sign out</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <KeyboardShortcutsModal open={shortcutsModalOpen} onOpenChange={setShortcutsModalOpen} />
        </aside>
    );
}
