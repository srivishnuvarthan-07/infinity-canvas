import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, Dot, PanelLeftClose, PanelLeftOpen, LogIn, User, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function TopBar({ boardName, isSaved, onRename, isSidebarOpen, onToggleSidebar, onBack }) {
    const { user, login, register, logout, loading: authLoading } = useAuth();
    const [name, setName] = useState(boardName);
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
    const [authOpen, setAuthOpen] = useState(false);

    // Auth Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setName(boardName);
    }, [boardName]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            if (authMode === 'login') {
                await login(email, password);
            } else {
                await register(username, email, password);
            }
            setAuthOpen(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-10 bg-neutral-900/50 backdrop-blur-md flex items-center px-4 justify-between select-none pointer-events-auto transition-all duration-300">

            <div className="flex items-center gap-3">
                {onBack && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-800"
                        onClick={onBack}
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                )}

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
                        className="bg-transparent border-transparent hover:border-neutral-700/50 focus:border-blue-500/50 text-neutral-200 w-[200px] h-7 font-medium px-2 transition-all text-sm"
                    />
                </div>
            </div>

            {/* Right Side: Status & Auth */}
            <div className="flex items-center gap-4">

                {/* Status Indicator */}
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                    {isSaved ? (
                        <div className="flex items-center gap-1 text-green-500/80">
                            <Check className="w-3 h-3" />
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-yellow-500/80">
                            <ClockIcon className="w-3 h-3 animate-pulse" />
                        </div>
                    )}
                </div>

                <div className="h-4 w-[1px] bg-neutral-800" />

                {/* Auth Section */}
                {authLoading ? (
                    <div className="w-8 h-8 rounded-full bg-neutral-800 animate-pulse" />
                ) : user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                    <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout}>
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Dialog open={authOpen} onOpenChange={setAuthOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-2 bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-700">
                                <LogIn className="w-3.5 h-3.5" />
                                Login
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>{authMode === 'login' ? 'Login' : 'Create account'}</DialogTitle>
                                <DialogDescription>
                                    {authMode === 'login'
                                        ? 'Enter your credentials to access your boards.'
                                        : 'Create an account to sync your boards across devices.'}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAuth} className="grid gap-4 py-4">
                                {authMode === 'register' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Name</Label>
                                        <Input id="name" value={username} onChange={e => setUsername(e.target.value)} required />
                                    </div>
                                )}
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                                </div>
                                {error && <p className="text-sm text-red-500">{error}</p>}
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                                    {authMode === 'login' ? 'Login' : 'Sign up'}
                                </Button>
                            </form>
                            <DialogFooter>
                                <Button variant="link" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                                    {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </div>
    );
}

function ClockIcon({ className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
