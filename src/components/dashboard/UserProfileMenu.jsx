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
                align="end"
                className="w-64 p-2 bg-neutral-900/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200"
                sideOffset={8}
            >
                <div className="flex items-center gap-3 p-2 mb-1 rounded-xl bg-white/5 border border-white/5">
                    <Avatar className="h-10 w-10 border border-white/10 shadow-sm">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="bg-neutral-800 text-neutral-400 font-bold text-sm">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold text-sm text-white truncate flex items-center gap-2">
                            {displayName}
                            {isGuest ? (
                                <span className="text-[10px] bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded border border-white/10">LOCAL</span>
                            ) : (
                                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">CLOUD</span>
                            )}
                        </span>
                        <span className="text-xs text-neutral-400 truncate font-mono">
                            {displayEmail}
                        </span>
                    </div>
                </div>

                <DropdownMenuSeparator className="bg-white/10 my-1" />

                {/* Menu Items */}
                {isGuest ? (
                    <div className="space-y-0.5">
                        <DropdownMenuItem
                            onClick={() => navigate('/login')}
                            className="cursor-pointer rounded-lg text-sm font-medium text-indigo-400 focus:bg-indigo-500/20 focus:text-indigo-300 transition-colors gap-2 p-2"
                        >
                            <User className="w-4 h-4" />
                            Log In
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => navigate('/signup')}
                            className="cursor-pointer rounded-lg text-sm font-medium text-neutral-300 focus:bg-white/10 focus:text-white transition-colors gap-2 p-2"
                        >
                            <User className="w-4 h-4" />
                            Sign Up
                        </DropdownMenuItem>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        <DropdownMenuItem
                            onClick={() => navigate('/profile')}
                            className="cursor-pointer rounded-lg text-sm font-medium text-neutral-300 focus:bg-indigo-500/20 focus:text-indigo-300 transition-colors gap-2 p-2"
                        >
                            <User className="w-4 h-4 text-neutral-400" />
                            My Profile
                        </DropdownMenuItem>

                        <DropdownMenuItem
                            onClick={() => navigate('/profile')}
                            className="cursor-pointer rounded-lg text-sm font-medium text-neutral-300 focus:bg-indigo-500/20 focus:text-indigo-300 transition-colors gap-2 p-2"
                        >
                            <Settings className="w-4 h-4 text-neutral-400" />
                            Account Settings
                        </DropdownMenuItem>

                        <DropdownMenuItem className="cursor-pointer rounded-lg text-sm font-medium text-neutral-700 focus:bg-primary/5 focus:text-primary transition-colors gap-2 p-2">
                            <Settings className="w-4 h-4 text-neutral-400" />
                            Workspace Settings
                        </DropdownMenuItem>

                        <DropdownMenuItem className="cursor-pointer rounded-lg text-sm font-medium text-neutral-700 focus:bg-primary/5 focus:text-primary transition-colors gap-2 p-2">
                            <Keyboard className="w-4 h-4 text-neutral-400" />
                            Keyboard Shortcuts
                        </DropdownMenuItem>
                    </div>
                )}

                <DropdownMenuSeparator className="bg-neutral-200/50 my-1" />

                {!isGuest && (
                    <DropdownMenuItem
                        className="cursor-pointer rounded-lg text-sm font-medium text-red-600 focus:bg-red-50 focus:text-red-700 transition-colors gap-2 p-2"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </DropdownMenuItem>
                )}

            </DropdownMenuContent>
        </DropdownMenu>
    );
}
