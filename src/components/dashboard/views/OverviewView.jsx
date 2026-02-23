import { useBoardStore } from '@/hooks/useBoardStore';
import { useAuth } from '@/hooks/useAuth';
import { BoardCard } from '../BoardCard';
import { Button } from '@/components/ui/button';
import { Plus, Search, Cloud, HardDrive } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { UserProfileMenu } from '../UserProfileMenu';
import { NotificationBell } from '../NotificationBell';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function OverviewView() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const {
        localBoards,
        cloudBoards,
        createBoard,
        deleteBoard,
        renameBoard,
        moveBoardToCloud
    } = useBoardStore();
    const [searchQuery, setSearchQuery] = useState('');

    const recentBoards = [...localBoards, ...cloudBoards]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 4);

    const handleCreateBoard = async (forceLocal = false) => {
        try {
            const id = await createBoard(null, forceLocal);
            navigate(`/board/${id}`);
        } catch (e) {
            console.error('Failed to create board', e);
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
            toast.success('Board moved to cloud');
        } catch {
            toast.error('Failed to move board to cloud');
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Contextual Header */}
            <header className="h-20 flex items-center justify-between px-8 z-10 sticky top-0 bg-[#F6F5F3]/80 backdrop-blur-md border-b border-black/5">
                <div>
                    <h1 className="text-2xl font-semibold text-neutral-800 tracking-tight">
                        Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, {user ? user.name.split(' ')[0] : 'Guest'}
                    </h1>
                    <p className="text-neutral-500 text-sm">Welcome to your studio home.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative w-64 hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Search everything..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white border-black/5 focus:border-black/10 transition-all rounded-xl h-10 text-sm text-neutral-700 placeholder:text-neutral-400 shadow-sm"
                        />
                    </div>
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="h-10 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm px-5 shadow-md shadow-neutral-900/10 transition-all">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Board
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white border border-black/5 shadow-lg rounded-xl p-1">
                                <DropdownMenuItem onClick={() => handleCreateBoard(false)} className="cursor-pointer gap-2 rounded-lg text-sm focus:bg-indigo-50 text-indigo-700">
                                    <Cloud className="h-4 w-4" />
                                    Cloud Board
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCreateBoard(true)} className="cursor-pointer gap-2 rounded-lg text-sm text-neutral-600 focus:bg-neutral-100 focus:text-neutral-900">
                                    <HardDrive className="h-4 w-4" />
                                    Local Board (Offline)
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            onClick={() => handleCreateBoard(true)}
                            className="h-10 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm px-5 shadow-md shadow-neutral-900/10 transition-all"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Board
                        </Button>
                    )}
                    <NotificationBell />
                    <UserProfileMenu />
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-8 z-10">
                <div className="max-w-6xl mx-auto space-y-12">

                    {/* Recent Boards Section */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-medium text-neutral-800">Recent Boards</h2>
                        </div>
                        {recentBoards.length === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center text-neutral-500 border border-dashed border-black/10 rounded-2xl bg-white/50 text-sm">
                                No recent boards. Create one to get started!
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {recentBoards.map((board) => (
                                    <BoardCard
                                        key={board.id}
                                        board={board}
                                        onDelete={handleDelete}
                                        onRename={handleRename}
                                        onMoveToCloud={handleMoveToCloud}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Quick Activity / Stats Placeholder */}
                    <section>
                        <h2 className="text-lg font-medium text-neutral-800 mb-6">Activity</h2>
                        <div className="h-32 rounded-2xl bg-white border border-black/5 shadow-sm p-6 flex items-center justify-center text-neutral-400 text-sm">
                            Activity feed and stats will appear here.
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}
