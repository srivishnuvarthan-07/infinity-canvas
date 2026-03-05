import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Menu, FolderOpen, Save, Download, RotateCcw,
    Cloud, ChevronRight, LogOut, HardDrive
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

export function FloatingMenu({
    boardName,
    onRename,
    isSaved,
    isLocal,
    onOpen,
    onSaveAs,
    onExport,
    onReset,
    onBack
}) {
    const [name, setName] = useState(boardName);
    const { user, logout } = useAuth();

    useEffect(() => {
        setName(boardName);
    }, [boardName]);

    return (
        <div className="flex items-center gap-2 p-1 bg-white/90 backdrop-blur-md border border-neutral-200 shadow-sm rounded-lg pointer-events-auto transition-all duration-300 hover:shadow-md hover:bg-white">

            {/* Main Menu Trigger */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-neutral-100">
                        <Menu className="h-4 w-4 text-neutral-700" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 ml-2">
                    {user && (
                        <>
                            <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1.5">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={user.avatarUrl} />
                                    <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{user.name}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                        </>
                    )}

                    <DropdownMenuItem onClick={onBack}>
                        <ChevronRight className="mr-2 h-4 w-4 rotate-180" />
                        Back to Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={onOpen}>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Open...
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onSaveAs}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Copy...
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export Image
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onReset} className="text-red-600 focus:text-red-600">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset Canvas
                    </DropdownMenuItem>

                    {user && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Divider */}
            <div className="w-[1px] h-4 bg-neutral-200" />

            {/* Title Editor */}
            <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => {
                    if (name.trim() !== boardName) onRename(name);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                }}
                className="border-none shadow-none bg-transparent h-7 w-[180px] px-2 font-medium text-neutral-800 hover:bg-neutral-100/50 focus-visible:ring-0 focus-visible:bg-white text-sm"
            />

            {/* Save Status & Sync */}
            <div className="flex items-center pr-2 text-neutral-400">
                {isSaved ? (
                    isLocal ? <HardDrive className="w-4 h-4 text-amber-500/80" /> : <Cloud className="w-4 h-4 text-green-500/80" />
                ) : (
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                )}
            </div>

        </div>
    );
}
