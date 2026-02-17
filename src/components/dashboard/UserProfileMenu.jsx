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
import { User, Settings, CreditCard, Keyboard, LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function UserProfileMenu() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'U';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="outline-none group">
                <div className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-white/50 transition-colors border border-transparent hover:border-neutral-200/50">
                    <Avatar className="h-8 w-8 border border-neutral-200 shadow-sm transition-transform group-hover:scale-105">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium text-xs">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-3 h-3 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-64 p-2 bg-white/80 backdrop-blur-xl border border-neutral-200 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200"
                sideOffset={8}
            >
                {/* User Header */}
                <div className="flex items-center gap-3 p-2 mb-1 rounded-xl bg-neutral-50/50 border border-neutral-100">
                    <Avatar className="h-10 w-10 border border-white shadow-sm">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="bg-neutral-200 text-neutral-600 font-bold text-sm">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold text-sm text-neutral-900 truncate">
                            {user?.name || "User"}
                        </span>
                        <span className="text-xs text-neutral-500 truncate font-mono">
                            {user?.email}
                        </span>
                    </div>
                </div>

                <DropdownMenuSeparator className="bg-neutral-200/50 my-1" />

                {/* Menu Items */}
                <div className="space-y-0.5">
                    <DropdownMenuItem className="cursor-pointer rounded-lg text-sm font-medium text-neutral-700 focus:bg-primary/5 focus:text-primary transition-colors gap-2 p-2">
                        <User className="w-4 h-4 text-neutral-400" />
                        My Profile
                    </DropdownMenuItem>

                    <DropdownMenuItem className="cursor-pointer rounded-lg text-sm font-medium text-neutral-700 focus:bg-primary/5 focus:text-primary transition-colors gap-2 p-2">
                        <Settings className="w-4 h-4 text-neutral-400" />
                        Account Settings
                    </DropdownMenuItem>

                    <DropdownMenuItem className="cursor-pointer rounded-lg text-sm font-medium text-neutral-700 focus:bg-primary/5 focus:text-primary transition-colors gap-2 p-2">
                        <Settings className="w-4 h-4 text-neutral-400" />
                        Workspace Settings
                    </DropdownMenuItem>

                    <DropdownMenuItem className="cursor-pointer rounded-lg text-sm font-medium text-neutral-700 focus:bg-primary/5 focus:text-primary transition-colors gap-2 p-2 opacity-50" disabled>
                        <CreditCard className="w-4 h-4 text-neutral-400" />
                        Billing & Plans
                        <span className="ml-auto text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">SOON</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem className="cursor-pointer rounded-lg text-sm font-medium text-neutral-700 focus:bg-primary/5 focus:text-primary transition-colors gap-2 p-2">
                        <Keyboard className="w-4 h-4 text-neutral-400" />
                        Keyboard Shortcuts
                    </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="bg-neutral-200/50 my-1" />

                <DropdownMenuItem
                    className="cursor-pointer rounded-lg text-sm font-medium text-red-600 focus:bg-red-50 focus:text-red-700 transition-colors gap-2 p-2"
                    onClick={handleLogout}
                >
                    <LogOut className="w-4 h-4" />
                    Log Out
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
    );
}
