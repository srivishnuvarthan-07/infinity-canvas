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
        <div className="flex flex-col h-full overflow-hidden gap-4 p-4 bg-transparent">
            {/* Topbar */}
            <div className="flex items-center justify-between gap-[10px] px-[20px] py-[12px] bg-[#FAFAFA] border border-black/5 rounded-3xl shrink-0 shadow-sm">
                
                <div className="flex items-center gap-4 flex-1">
                    <h1 className="text-[14px] font-medium text-neutral-900 tracking-tight whitespace-nowrap hidden sm:block">
                        All Boards
                    </h1>

                    <div className="h-4 w-px bg-black/5 hidden md:block"></div>

                    <div className="max-w-[220px] w-full relative">
                        <Search className="absolute left-[14px] top-1/2 -translate-y-1/2 h-[12px] w-[12px] text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Search boards..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-black/5 rounded-full py-[7px] pl-[34px] pr-[14px] text-[12px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black/10 transition-colors shadow-sm"
                        />
                    </div>
                </div>

                <div className="ml-auto flex items-center gap-[12px]">
                    <div className="flex bg-white rounded-xl border border-black/5 p-1 shadow-sm hidden md:flex">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`px-3 py-1 text-[11px] font-medium rounded-lg transition-colors ${filterType === 'all' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterType('local')}
                            className={`px-3 py-1 text-[11px] font-medium rounded-lg transition-colors ${filterType === 'local' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                        >
                            Local
                        </button>
                        {user && (
                            <button
                                onClick={() => setFilterType('cloud')}
                                className={`px-3 py-1 text-[11px] font-medium rounded-lg transition-colors ${filterType === 'cloud' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                            >
                                Cloud
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => handleCreateBoard(!user)}
                        className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full py-[7px] px-[14px] text-[12px] font-medium transition-colors border-none cursor-pointer"
                    >
                        <Plus className="h-[11px] w-[11px]" strokeWidth={2.5} />
                        <span className="hidden sm:inline">New board</span>
                    </button>
                    <UserProfileMenu />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="p-[24px] overflow-auto flex-1 bg-white border border-black/5 rounded-3xl shadow-sm relative">
                <div className="max-w-[1200px] mx-auto pb-[24px]">
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
                        <div className="h-[200px] flex flex-col items-center justify-center text-neutral-500 border-[0.5px] border-dashed border-black/10 rounded-2xl bg-[#FAFAFA] text-[12px] mt-4">
                            No boards found. Click "New board" to create one.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[12px]">
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
            </div>
        </div>
    );
}
