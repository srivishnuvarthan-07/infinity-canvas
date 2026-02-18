import { useState, useMemo, useEffect } from 'react';
import { useBoardStore } from '@/hooks/useBoardStore';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { BoardCard } from '@/components/dashboard/BoardCard';
import { UserProfileMenu } from '@/components/dashboard/UserProfileMenu';
import { WorkspaceSwitcher } from '@/components/dashboard/WorkspaceSwitcher';
import { ActivityPanel } from '@/components/dashboard/ActivityPanel';
import { InviteMembersDialog } from '@/components/dashboard/InviteMembersDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, Loader2, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Dashboard() {
    const navigate = useNavigate();
    const { boards, createBoard, isLoaded, deleteBoard, renameBoard, fetchWorkspaces, workspaces, activeWorkspaceId } = useBoardStore();

    // Fetch workspaces on mount
    useEffect(() => {
        fetchWorkspaces();
    }, [fetchWorkspaces]);


    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Derived state for filtering
    const filteredBoards = useMemo(() => {
        if (!boards) return [];
        let result = Object.values(boards);

        // 1. Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(b => b.name.toLowerCase().includes(q));
        }

        // 2. Tab Filter
        if (activeTab === 'recent') {
            result.sort((a, b) => b.updatedAt - a.updatedAt);
        } else if (activeTab === 'starred') {
            // Future implementation
            result = [];
        } else if (activeTab === 'trash') {
            // Future implementation
            result = [];
        } else {
            // Default 'all' sort by updated
            result.sort((a, b) => b.updatedAt - a.updatedAt);
        }

        return result;
    }, [boards, searchQuery, activeTab]);

    const handleCreateBoard = async () => {
        try {
            const id = await createBoard();
            toast.success("Board created");
            navigate(`/board/${id}`);
        } catch (err) {
            toast.error("Failed to create board");
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this board?")) {
            await deleteBoard(id);
            toast.success("Board deleted");
        }
    };

    const handleRename = async (id) => {
        const newName = prompt("Enter new board name:");
        if (newName) {
            await renameBoard(id, newName);
            toast.success("Board renamed");
        }
    };

    if (!isLoaded) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-indigo-500/30">
            {/* Left Sidebar */}
            <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Dark Grid Background */}
                <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.05]"
                    style={{
                        backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`,
                        backgroundSize: '24px 24px'
                    }}
                />

                {/* Header */}
                <header className="h-16 flex items-center justify-between px-8 py-3 z-10 sticky top-0 border-b border-white/5 bg-neutral-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <WorkspaceSwitcher />
                        <div className="h-6 w-px bg-white/10 mx-2" />
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                            <Input
                                placeholder="Search..."
                                className="pl-9 bg-black/20 border-white/10 focus:bg-black/40 focus:border-indigo-500/50 transition-all rounded-lg h-9 text-sm text-neutral-300 placeholder:text-neutral-600"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex">
                            <InviteMembersDialog>
                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium hover:bg-indigo-500/20 cursor-pointer transition-colors">
                                    <Plus className="w-3 h-3" />
                                    Invite Members
                                </span>
                            </InviteMembersDialog>
                        </div>
                        <div className="h-8 w-8 rounded-full hover:bg-white/5 flex items-center justify-center cursor-pointer transition-colors">
                            <Bell className="w-4 h-4 text-neutral-400" />
                        </div>
                        <UserProfileMenu />
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 z-10">
                    <div className="max-w-6xl mx-auto space-y-10">
                        {/* Workspace Header */}
                        <div className="flex items-end justify-between border-b border-white/5 pb-6">
                            <div>
                                <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
                                    {workspaces.find(w => w._id === activeWorkspaceId)?.name || 'Loading...'}
                                </h1>
                                <p className="text-neutral-500 text-sm">Manage your boards, projects, and team members.</p>
                            </div>
                            <div className="flex items-center -space-x-2">
                                <div className="w-8 h-8 rounded-full border-2 border-neutral-900 bg-neutral-800 flex items-center justify-center text-xs text-neutral-400">
                                    VV
                                </div>
                                <div className="w-8 h-8 rounded-full border-2 border-neutral-900 bg-neutral-200 flex items-center justify-center">
                                    <Plus className="w-4 h-4 text-neutral-900" />
                                </div>
                            </div>
                        </div>

                        {/* Recent Boards */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
                                    {searchQuery ? 'Search Results' : 'Recent Boards'}
                                </h2>
                                <Button onClick={handleCreateBoard} className="h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 shadow-lg shadow-indigo-900/20">
                                    <Plus className="mr-1.5 h-3 w-3" />
                                    New Board
                                </Button>
                            </div>

                            {filteredBoards.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-neutral-500 border border-dashed border-white/10 rounded-xl bg-white/5">
                                    <p className="text-sm">No boards found</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                                    {filteredBoards.map(board => (
                                        <BoardCard
                                            key={board.id}
                                            board={board}
                                            onDelete={handleDelete}
                                            onRename={handleRename}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Right Activity Panel */}
            <ActivityPanel />
        </div>
    );
}
