import { ChevronsUpDown, Check, Plus, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBoardStore } from "@/hooks/useBoardStore";
import { toast } from "sonner";

export function WorkspaceSwitcher() {
    const { workspaces, activeWorkspaceId, setActiveWorkspace, createWorkspace } = useBoardStore();

    const activeWorkspace = workspaces.find(w => w._id === activeWorkspaceId);

    const handleCreateWorkspace = async () => {
        const name = prompt("Enter workspace name:");
        if (name) {
            try {
                await createWorkspace(name);
                toast.success("Workspace created");
            } catch (err) {
                toast.error("Failed to create workspace");
            }
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-800 transition-colors border border-transparent hover:border-neutral-700">
                    <div className="h-6 w-6 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                        {/* Simple icon logic: first is User, others Building */}
                        {workspaces.indexOf(activeWorkspace) === 0 ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                    </div>
                    <span className="text-sm font-medium text-neutral-200 hidden md:block">
                        {activeWorkspace?.name || "Select Workspace"}
                    </span>
                    <ChevronsUpDown className="h-3 w-3 text-neutral-500 ml-1" />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                className="w-64 bg-neutral-900/90 backdrop-blur-xl border border-white/10 text-neutral-300 shadow-2xl p-2 rounded-xl"
            >
                <DropdownMenuLabel className="text-xs font-normal text-neutral-500 uppercase tracking-wider px-2">Workspaces</DropdownMenuLabel>
                {workspaces.map((ws, index) => (
                    <DropdownMenuItem
                        key={ws._id}
                        onClick={() => setActiveWorkspace(ws._id)}
                        className="flex items-center gap-2 p-2 rounded-lg focus:bg-white/5 focus:text-white cursor-pointer"
                    >
                        <div className="h-8 w-8 rounded bg-neutral-800 flex items-center justify-center border border-white/5">
                            {index === 0 ? <User className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-medium text-neutral-200">{ws.name}</div>
                            <div className="text-[10px] text-neutral-500">{index === 0 ? "Personal Plan" : "Free Plan"}</div>
                        </div>
                        {activeWorkspaceId === ws._id && <Check className="h-4 w-4 text-indigo-400" />}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-white/10 my-2" />
                <DropdownMenuItem
                    onClick={handleCreateWorkspace}
                    className="p-2 rounded-lg focus:bg-white/5 focus:text-white cursor-pointer group"
                >
                    <div className="h-8 w-8 rounded border border-dashed border-neutral-600 flex items-center justify-center text-neutral-400 group-hover:text-neutral-200 group-hover:border-neutral-400 transition-colors">
                        <Plus className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-neutral-400 group-hover:text-neutral-200 ml-2">Create Workspace</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
