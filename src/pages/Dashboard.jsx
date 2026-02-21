import { useState, useMemo } from 'react';
import { useBoardStore } from '@/hooks/useBoardStore';
import { useAuth } from '@/hooks/useAuth';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { BoardCard } from '@/components/dashboard/BoardCard';
import { UserProfileMenu } from '@/components/dashboard/UserProfileMenu';
import { InviteMembersDialog } from '@/components/dashboard/InviteMembersDialog';
import { MigrationDialog } from '@/components/dashboard/MigrationDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, Loader2, Bell, CloudOff, Cloud, HardDrive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const {
        localBoards,
        cloudBoards,
        cloudStatus,
        isLoaded,
        createBoard,
        deleteBoard,
        renameBoard,
        moveBoardToCloud,
    } = useBoardStore();

    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Sections-based derived state — never a flat list
    const sections = useMemo(() => {
        const q = searchQuery.toLowerCase();
        const filter = (list) =>
            list.filter(b => !q || b.name.toLowerCase().includes(q));

        return {
            cloud: filter(cloudBoards),
            local: filter(localBoards),
        };
    }, [cloudBoards, localBoards, searchQuery]);

    const handleCreateBoard = async () => {
        try {
            const id = await createBoard();
            toast.success('Board created');
            navigate(`/board/${id}`);
        } catch {
            toast.error('Failed to create board');
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this board?')) {
            await deleteBoard(id);
            toast.success('Board deleted');
        }
    };

    const handleRename = async (id) => {
        const newName = prompt('Enter new board name:');
        if (newName) {
            await renameBoard(id, newName);
            toast.success('Board renamed');
        }
    };

    const handleMoveToCloud = async (id) => {
        try {
            await moveBoardToCloud(id);
            toast.success('Board moved to cloud ☁');
        } catch {
            toast.error('Failed to move board to cloud');
        }
    };

    if (!isLoaded) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-neutral-950">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
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
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                            <Input
                                placeholder="Search boards..."
                                className="pl-9 bg-black/20 border-white/10 focus:bg-black/40 focus:border-indigo-500/50 transition-all rounded-lg h-9 text-sm text-neutral-300 placeholder:text-neutral-600"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="hidden md:flex">
                                <InviteMembersDialog>
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium hover:bg-indigo-500/20 cursor-pointer transition-colors">
                                        <Plus className="w-3 h-3" />
                                        Invite Members
                                    </span>
                                </InviteMembersDialog>
                            </div>
                        )}
                        <div className="h-8 w-8 rounded-full hover:bg-white/5 flex items-center justify-center cursor-pointer transition-colors">
                            <Bell className="w-4 h-4 text-neutral-400" />
                        </div>
                        <UserProfileMenu />
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-8 z-10">
                    <div className="max-w-6xl mx-auto space-y-10">

                        {/* Page Title + New Board */}
                        <div className="flex items-end justify-between border-b border-white/5 pb-6">
                            <div>
                                <h1 className="text-3xl font-semibold text-white tracking-tight mb-1">
                                    {user ? user.name : 'My Boards'}
                                </h1>
                                <p className="text-neutral-500 text-sm">
                                    {user ? user.email : 'Working offline — sign in to sync to cloud.'}
                                </p>
                            </div>
                            <Button
                                onClick={handleCreateBoard}
                                className="h-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 shadow-lg shadow-indigo-900/30"
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                New Board
                            </Button>
                        </div>

                        {/* ─── Cloud Section (signed in only) ─── */}
                        {user && (
                            <BoardSection
                                icon={<Cloud className="h-4 w-4 text-indigo-400" />}
                                label="Cloud Boards"
                                labelColor="text-indigo-400"
                                boards={sections.cloud}
                                status={cloudStatus}
                                onDelete={handleDelete}
                                onRename={handleRename}
                                emptyMessage="No cloud boards yet. Create one to get started."
                            />
                        )}

                        {/* ─── Local Section (always visible) ─── */}
                        <BoardSection
                            icon={<HardDrive className="h-4 w-4 text-amber-400" />}
                            label="Local Boards"
                            labelColor="text-amber-400"
                            boards={sections.local}
                            status="ok"
                            onDelete={handleDelete}
                            onRename={handleRename}
                            onMoveToCloud={handleMoveToCloud}
                            emptyMessage={user ? 'No local boards. Local boards are stored only on this device.' : 'No boards yet. Click "New Board" to create one.'}
                        />
                    </div>
                </div>
            </main>

            {/* Migration Prompt */}
            <MigrationDialog />
        </div>
    );
}

// ─── BoardSection Sub-Component ───────────────────────────────────────────────

function BoardSection({ icon, label, labelColor, boards, status, onDelete, onRename, onMoveToCloud, emptyMessage }) {
    return (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center gap-2">
                {icon}
                <h2 className={`text-sm font-semibold uppercase tracking-wider ${labelColor}`}>
                    {label}
                </h2>
                {status === 'loading' && (
                    <Loader2 className="h-3 w-3 animate-spin text-neutral-500 ml-1" />
                )}
                {boards.length > 0 && (
                    <span className="text-xs text-neutral-600 ml-1">({boards.length})</span>
                )}
            </div>

            {/* Cloud Unavailable Banner */}
            {status === 'error' && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 text-sm">
                    <CloudOff className="h-4 w-4 flex-shrink-0" />
                    <div>
                        <span className="font-medium">Cloud Unavailable</span>
                        <span className="text-red-400/70 ml-2">— You can still access your local boards.</span>
                    </div>
                </div>
            )}

            {/* Board Grid */}
            {status !== 'error' && boards.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-neutral-600 border border-dashed border-white/5 rounded-xl bg-white/[0.02] text-sm">
                    {status === 'loading' ? 'Loading...' : emptyMessage}
                </div>
            ) : (
                status !== 'error' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {boards.map(board => (
                            <BoardCard
                                key={board.id}
                                board={board}
                                onDelete={onDelete}
                                onRename={onRename}
                                onMoveToCloud={onMoveToCloud}
                            />
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
