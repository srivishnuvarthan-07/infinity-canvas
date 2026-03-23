import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { User, Settings, Keyboard, LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function UserProfileMenu() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/dashboard'); // Stay in app as guest — cloud boards disappear, local boards remain
    };

    const isGuest = !user;

    const initials = isGuest ? 'G' : (user?.name
        ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'U');

    const displayName = isGuest ? 'Guest User' : (user?.name || "User");
    const displayEmail = isGuest ? 'Local Mode' : user?.email;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="outline-none group">
                <div className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
                    <Avatar className="h-8 w-8 border border-white/20 shadow-sm transition-transform group-hover:scale-105">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className={isGuest ? "bg-neutral-700 text-neutral-400" : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium text-xs"}>
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:text-neutral-200 transition-colors" />
                </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="start"
                className="w-56 p-1 bg-white border border-black/5 shadow-lg rounded-xl animate-in fade-in zoom-in-95 duration-100"
                sideOffset={8}
            >
                <div className="p-1 space-y-0.5">
                    <DropdownMenuItem
                        onClick={() => navigate('/profile')}
                        className="flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium text-neutral-700 rounded-lg hover:bg-neutral-50 cursor-pointer outline-none transition-colors"
                    >
                        <User className="w-4 h-4 text-neutral-400" />
                        My profile
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => navigate('/dashboard/settings')}
                        className="flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium text-neutral-700 rounded-lg hover:bg-neutral-50 cursor-pointer outline-none transition-colors"
                    >
                        <Settings className="w-4 h-4 text-neutral-400" />
                        Settings
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => {/* Open shortcuts modal logic */}}
                        className="flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium text-neutral-700 rounded-lg hover:bg-neutral-50 cursor-pointer outline-none transition-colors"
                    >
                        <Keyboard className="w-4 h-4 text-neutral-400" />
                        Keyboard shortcuts
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="h-[0.5px] bg-black/5 my-0.5 mx-1.5" />

                <div className="p-1.5">
                    <DropdownMenuItem
                        className="flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium text-[#A32D2D] rounded-lg hover:bg-[#FCEBEB] cursor-pointer outline-none transition-colors group/logout"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4 text-[#E24B4A]" />
                        Sign out
                    </DropdownMenuItem>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
