import { useState, useMemo } from 'react';
import { useBoardStore } from '@/hooks/useBoardStore';
import { useAuth } from '@/hooks/useAuth';
import { BoardCard } from '../BoardCard';
import { UserProfileMenu } from '../UserProfileMenu';
import { NotificationBell } from '../NotificationBell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Filter, AlertCircle, Cloud, HardDrive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AllBoardsView() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const {
        localBoards,
        cloudBoards,
        cloudStatus,
        createBoard,
        deleteBoard,
        renameBoard,
        moveBoardToCloud,
    } = useBoardStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'local', 'cloud'

    const filteredBoards = useMemo(() => {
        const q = searchQuery.toLowerCase();
        let list = [];
        if (filterType === 'all') {
            list = [...localBoards, ...cloudBoards];
        } else if (filterType === 'local') {
            list = localBoards;
        } else if (filterType === 'cloud') {
            list = cloudBoards;
        }

        return list.filter(b => !q || b.name.toLowerCase().includes(q))
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    }, [localBoards, cloudBoards, searchQuery, filterType]);

    const handleCreateBoard = async (forceLocal = false) => {
        try {
            const id = await createBoard(null, forceLocal);
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
            toast.success('Board moved to cloud');
        } catch {
            toast.error('Failed to move board to cloud');
        }
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Contextual Header */}
            <header className="h-20 flex items-center justify-between px-8 z-10 sticky top-0 bg-[#F6F5F3]/80 backdrop-blur-md border-b border-black/5">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-semibold text-neutral-800 tracking-tight">
                        All Boards
                    </h1>

                    <div className="h-6 w-px bg-black/10 mx-2 hidden md:block"></div>

                    <div className="relative w-64 hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Search boards..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white border-black/5 focus:border-black/10 transition-all rounded-xl h-10 text-sm text-neutral-700 placeholder:text-neutral-400 shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white rounded-xl border border-black/5 p-1 shadow-sm">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterType === 'all' ? 'bg-neutral-100 text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterType('local')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterType === 'local' ? 'bg-neutral-100 text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'}`}
                        >
                            Local
                        </button>
                        {user && (
                            <button
                                onClick={() => setFilterType('cloud')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${filterType === 'cloud' ? 'bg-neutral-100 text-neutral-800' : 'text-neutral-500 hover:text-neutral-700'}`}
                            >
                                Cloud
                            </button>
                        )}
                    </div>

                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="h-10 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm px-5 shadow-md shadow-neutral-900/10 transition-all ml-2">
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
                            className="h-10 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-sm px-5 shadow-md shadow-neutral-900/10 transition-all ml-2"
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
                <div className="max-w-6xl mx-auto">
                    {cloudStatus === 'error' && user && filterType !== 'local' && (
                        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 text-sm">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            <div>
                                <span className="font-medium">Cloud Sync Degraded</span>
                                <span className="opacity-80 ml-2">— You may only see your local boards right now.</span>
                            </div>
                        </div>
                    )}

                    {filteredBoards.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-neutral-500 border border-dashed border-black/10 rounded-2xl bg-white/30 text-sm mt-10">
                            No boards found. Click "New Board" to create one.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredBoards.map(board => (
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
                </div>
            </main>
        </div>
    );
}
