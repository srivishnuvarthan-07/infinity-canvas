import { useBoardStore } from '@/hooks/useBoardStore';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Search, Plus, Pencil, Sparkles, PlusSquare, FileText, Compass } from 'lucide-react';
import { BoardCard } from '../BoardCard';
import { UserProfileMenu } from '../UserProfileMenu';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

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

    const allBoards = useMemo(() => [...localBoards, ...cloudBoards]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)),
        [localBoards, cloudBoards]);
        
    const recentBoards = useMemo(() => allBoards.slice(0, 3), [allBoards]);

    const activityItems = useMemo(() => {
        return allBoards.slice(0, 5).map(board => {
            const isAi = board.description?.includes('AI') || board.name.includes('Flowchart') || board.name.includes('Mind Map');
            const isNew = new Date(board.createdAt).getTime() === new Date(board.updatedAt || board.createdAt).getTime();
            const type = isAi ? 'ai' : isNew ? 'new' : 'edit';
            
            return {
                id: board.id,
                name: board.name,
                time: board.updatedAt || board.createdAt,
                type: type,
            };
        });
    }, [allBoards]);

    const handleCreateBoard = async () => {
        try {
            const id = await createBoard(null, false); // Default cloud from overview
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
        <div className="flex flex-col h-full overflow-hidden gap-4 p-4 bg-transparent">
            {/* Topbar */}
            <div className="flex items-center gap-[10px] px-[20px] py-[12px] bg-[#FAFAFA] border border-black/5 rounded-3xl shrink-0 shadow-sm">
                <div className="flex-1 max-w-[220px] relative">
                    <Search className="absolute left-[14px] top-1/2 -translate-y-1/2 h-[12px] w-[12px] text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search everything..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#FAFAFA] border border-black/5 rounded-full py-[7px] pl-[34px] pr-[14px] text-[12px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black/10 transition-colors"
                    />
                </div>
                
                <div className="ml-auto flex items-center gap-[8px]">
                    <button
                        onClick={handleCreateBoard}
                        className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full py-[7px] px-[14px] text-[12px] font-medium transition-colors border-none cursor-pointer hidden md:flex"
                    >
                        <Plus className="h-[11px] w-[11px]" strokeWidth={2.5} />
                        New board
                    </button>
                    <UserProfileMenu />
                </div>
            </div>

            {/* Content Area */}
            <div className="p-[24px] overflow-auto flex-1 bg-[#FAFAFA] border border-black/5 rounded-3xl shadow-sm relative">
                <div className="max-w-[1000px] mx-auto pb-[24px]">
                    
                    {/* Greeting Row */}
                    <div className="flex items-center justify-between mb-[24px]">
                        <div>
                            <h1 className="text-[20px] font-medium text-neutral-900 leading-[1.2]">
                                Good morning, {user?.name?.split(' ')[0] || 'User'}
                            </h1>
                            <p className="text-[12px] text-neutral-500 mt-[4px]">
                                Monday, March 23 · {allBoards.length} boards created
                            </p>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-[12px] mb-[28px]">
                        <div className="bg-white border-[0.5px] border-black/5 rounded-[12px] p-[18px_20px] hover:-translate-y-[2px] hover:border-black/10 transition-all duration-[180ms] ease-out">
                            <div className="text-[24px] font-medium text-neutral-900 leading-none">{allBoards.length}</div>
                            <div className="text-[12px] text-neutral-500 mt-[4px]">Total boards</div>
                        </div>
                        <div className="bg-white border-[0.5px] border-black/5 rounded-[12px] p-[18px_20px] hover:-translate-y-[2px] hover:border-black/10 transition-all duration-[180ms] ease-out">
                            <div className="text-[24px] font-medium text-neutral-900 leading-none">12</div>
                            <div className="text-[12px] text-neutral-500 mt-[4px]">AI diagrams generated</div>
                        </div>
                        <div className="bg-white border-[0.5px] border-black/5 rounded-[12px] p-[18px_20px] hover:-translate-y-[2px] hover:border-black/10 transition-all duration-[180ms] ease-out">
                            <div className="text-[24px] font-medium text-neutral-900 leading-none">0</div>
                            <div className="text-[12px] text-neutral-500 mt-[4px]">Library shapes</div>
                        </div>
                    </div>

                    {/* Recent Boards Section */}
                    <div className="flex items-center justify-between mb-[14px]">
                        <h2 className="text-[13px] font-medium text-neutral-900">Recent boards</h2>
                        <span onClick={() => navigate('/dashboard/boards')} className="text-[11px] text-neutral-500 cursor-pointer hover:text-neutral-900 transition-colors">
                            View all →
                        </span>
                    </div>

                    <div className="grid grid-cols-4 gap-[12px] mb-[28px]">
                        
                        {recentBoards.map((board) => (
                            <BoardCard
                                key={board.id}
                                board={board}
                                onDelete={handleDelete}
                                onRename={handleRename}
                                onMoveToCloud={handleMoveToCloud}
                            />
                        ))}

                        {/* New Board Card - Fills remaining slots up to 4, or just adds 1 at end */}
                        <div 
                            onClick={handleCreateBoard}
                            className="border-[0.5px] border-dashed border-black/20 hover:border-solid hover:border-black/30 rounded-[12px] cursor-pointer hover:bg-[#FAFAFA] hover:-translate-y-[3px] transition-all duration-[200ms] ease-out bg-transparent flex flex-col items-center justify-center min-h-[160px] gap-[8px] group active:translate-y-[0px]"
                        >
                            <div className="h-[22px] w-[22px] rounded-full border border-black/20 flex items-center justify-center group-hover:bg-white group-hover:border-black/30 transition-all">
                                <Plus className="w-[12px] h-[12px] text-neutral-500" strokeWidth={1.8} />
                            </div>
                            <span className="text-[11px] text-neutral-500 group-hover:text-neutral-600 transition-colors">New board</span>
                        </div>
                    </div>

                    {/* Two Column Bottom Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                        
                        {/* Left: Recent Activity */}
                        <div>
                            <h2 className="text-[13px] font-medium text-neutral-900 mb-[14px]">Recent activity</h2>
                            <div className="flex flex-col gap-[8px]">
                                {activityItems.length === 0 && (
                                    <div className="p-8 text-center text-[12px] text-neutral-400 border-[0.5px] border-dashed border-black/10 rounded-[10px] bg-[#FAFAFA]">
                                        No recent activity. Create a board to get started!
                                    </div>
                                )}
                                {activityItems.map((item) => (
                                    <div key={item.id} onClick={() => navigate(`/board/${item.id}`)} className="bg-white border-[0.5px] border-black/5 rounded-[10px] p-[12px_14px] flex items-center gap-[12px] cursor-pointer hover:-translate-y-[2px] hover:border-black/10 transition-all duration-[180ms] ease-out active:translate-y-[0px]">
                                        <div className={`h-[30px] w-[30px] rounded-[8px] flex items-center justify-center shrink-0 ${
                                            item.type === 'ai' ? 'bg-[#EEEDFE]' : 
                                            item.type === 'new' ? 'bg-[#EAF3DE]' : 
                                            'bg-[#E6F1FB]'
                                        }`}>
                                            {item.type === 'ai' ? <Sparkles className="w-[13px] h-[13px] text-[#534AB7]" strokeWidth={2} /> : 
                                             item.type === 'new' ? <PlusSquare className="w-[13px] h-[13px] text-[#3B6D11]" strokeWidth={2} /> : 
                                             <Pencil className="w-[13px] h-[13px] text-[#185FA5]" strokeWidth={2} />}
                                        </div>
                                        
                                        <div className="flex-1 text-[13px] flex items-center gap-[3px] truncate">
                                            <span className="text-[13px] text-neutral-500">{item.type === 'ai' ? 'AI generated' : item.type === 'new' ? 'Created' : 'Edited'}</span>
                                            <span className="font-medium text-neutral-900 truncate">{item.name}</span>
                                        </div>

                                        <div className="flex items-center gap-[10px] shrink-0">
                                            <span className={`text-[10px] font-medium px-[8px] py-[3px] rounded-[99px] ${
                                                item.type === 'ai' ? 'bg-[#EEEDFE] text-[#534AB7]' : 
                                                item.type === 'new' ? 'bg-[#EAF3DE] text-[#3B6D11]' : 
                                                'bg-[#E6F1FB] text-[#185FA5]'
                                            }`}>
                                                {item.type === 'ai' ? 'AI' : item.type === 'new' ? 'New' : 'Edit'}
                                            </span>
                                            <span className="text-[11px] text-neutral-400 whitespace-nowrap">
                                                {formatDistanceToNow(new Date(item.time), { addSuffix: true }).replace('about ', '')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right: Quick Start */}
                        <div>
                            <h2 className="text-[13px] font-medium text-neutral-900 mb-[14px]">Quick start</h2>
                            <div className="flex flex-col gap-[8px]">
                                
                                <div className="bg-white border-[0.5px] border-black/5 rounded-[10px] p-[14px_16px] flex items-center gap-[14px] cursor-pointer hover:-translate-y-[2px] hover:border-black/10 transition-all duration-[180ms] ease-out active:translate-y-[0px]">
                                    <div className="h-[36px] w-[36px] rounded-[9px] bg-[#EEEDFE] flex items-center justify-center shrink-0">
                                        <Sparkles className="w-[15px] h-[15px] text-[#534AB7]" strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="text-[13px] font-medium text-neutral-900">Generate AI diagram</div>
                                        <div className="text-[11px] text-neutral-500 mt-[2px] leading-[1.4]">Describe and create instantly</div>
                                    </div>
                                </div>

                                <div className="bg-white border-[0.5px] border-black/5 rounded-[10px] p-[14px_16px] flex items-center gap-[14px] cursor-pointer hover:-translate-y-[2px] hover:border-black/10 transition-all duration-[180ms] ease-out active:translate-y-[0px]">
                                    <div className="h-[36px] w-[36px] rounded-[9px] bg-[#E1F5EE] flex items-center justify-center shrink-0">
                                        <FileText className="w-[15px] h-[15px] text-[#0F6E56]" strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="text-[13px] font-medium text-neutral-900">Browse templates</div>
                                        <div className="text-[11px] text-neutral-500 mt-[2px] leading-[1.4]">Start from a ready-made layout</div>
                                    </div>
                                </div>

                                <div className="bg-white border-[0.5px] border-black/5 rounded-[10px] p-[14px_16px] flex items-center gap-[14px] cursor-pointer hover:-translate-y-[2px] hover:border-black/10 transition-all duration-[180ms] ease-out active:translate-y-[0px]">
                                    <div className="h-[36px] w-[36px] rounded-[9px] bg-[#E6F1FB] flex items-center justify-center shrink-0">
                                        <Compass className="w-[15px] h-[15px] text-[#185FA5]" strokeWidth={2} />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <div className="text-[13px] font-medium text-neutral-900">Explore community boards</div>
                                        <div className="text-[11px] text-neutral-500 mt-[2px] leading-[1.4]">Get inspired by others</div>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}
