import { useBoardStore } from '@/hooks/useBoardStore';
import { useLibraryStore } from '@/hooks/useLibraryStore';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Pencil, Sparkles, PlusSquare, FileText, Compass, ArrowRight, LayoutDashboard, Database, Activity, Star } from 'lucide-react';
import { BoardCard } from '../BoardCard';
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
    const { libraryItems } = useLibraryStore();
    const [searchQuery, setSearchQuery] = useState('');

    // Live AI Flowchart drawing simulation loop for the Hero banner
    const [playStep, setPlayStep] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setPlayStep(prev => (prev + 1) % 6);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Real counts derived from live data
    const aiDiagramCount = useMemo(() => libraryItems.filter(i => i.source === 'AI').length, [libraryItems]);
    const libraryShapeCount = libraryItems.length;

    const allBoards = useMemo(() => [...localBoards, ...cloudBoards]
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)),
        [localBoards, cloudBoards]);
        
    const filteredBoards = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return allBoards.filter(b => !q || b.name.toLowerCase().includes(q));
    }, [allBoards, searchQuery]);

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
        <div className="relative flex flex-col h-full overflow-hidden bg-[#FAF9F5] font-sans selection:bg-indigo-100">
            {/* ── SPATIAL BACKDROP ─────────────────────────────────────────────── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#FAF9F5]">
                <div 
                    className="absolute inset-0 opacity-90"
                    style={{
                        backgroundImage: `
                            radial-gradient(circle at 15% 35%, rgba(99, 102, 241, 0.08) 0%, transparent 45%),
                            radial-gradient(circle at 85% 10%, rgba(16, 185, 129, 0.06) 0%, transparent 50%)
                        `
                    }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(#00000005_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-80" />
            </div>

            {/* ── TOPBAR ─────────────────────────────────────────────────────── */}
            <div className="relative z-10 shrink-0 mx-6 mt-4 p-3 bg-white/60 backdrop-blur-xl border border-white rounded-3xl flex items-center justify-between shadow-sm transition-all hover:shadow-md hover:bg-white/80">
                <div className="flex-1 max-w-md relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search your infinity..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/80 border border-neutral-200/80 rounded-2xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-100/50 transition-all shadow-inner"
                    />
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCreateBoard}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl py-2.5 px-6 text-[13px] font-bold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                    >
                        <Plus className="h-4 w-4" strokeWidth={3} />
                        New Board
                    </button>
                </div>
            </div>

            {/* ── SCROLLABLE CONTENT ─────────────────────────────────────────── */}
            <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-8">
                <div className="max-w-[1050px] mx-auto w-full space-y-8">
                    
                    {/* ── HERO BANNER ────────────────────────────────────────────── */}
                    <section className="relative w-full rounded-3xl overflow-hidden bg-white/50 backdrop-blur-md border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 group transition-all duration-500 hover:shadow-[0_8px_40px_rgba(99,102,241,0.06)] hover:border-indigo-100/50">
                        {/* Decorative background flare */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/10 blur-[80px] rounded-full pointer-events-none transition-transform duration-1000 group-hover:scale-150 group-hover:-translate-x-10" />

                        <div className="flex-1 space-y-4 relative z-10">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                                <Sparkles className="h-3 w-3" /> Welcome Back
                            </span>
                            <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                                Good morning,<br/>
                                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                                    {user?.name?.split(' ')[0] || 'Creator'}
                                </span>
                            </h1>
                            <p className="text-sm leading-relaxed text-neutral-500 max-w-sm font-medium">
                                You have {allBoards.length} active boards. Jump right back in or start a new adventure in the infinite canvas.
                            </p>
                            
                            {/* Quick Stats Mini */}
                            <div className="flex items-center gap-4 pt-2">
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-neutral-800 leading-none">{allBoards.length}</span>
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">Total Boards</span>
                                </div>
                                <div className="w-px h-8 bg-neutral-200/60" />
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-neutral-800 leading-none">{aiDiagramCount}</span>
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">AI Diagrams</span>
                                </div>
                                <div className="w-px h-8 bg-neutral-200/60" />
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-neutral-800 leading-none">{libraryShapeCount}</span>
                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mt-1">Saved Shapes</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Widget Area */}
                        <div className="w-full md:w-80 h-48 bg-white/60 border border-neutral-200/60 rounded-2xl p-4 shadow-inner relative overflow-hidden flex flex-col justify-center">
                            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px] opacity-50" />
                            <div className="relative z-10 flex flex-col gap-4 items-center">
                                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-neutral-100 animate-bounce">
                                    <Sparkles className="h-4 w-4 text-indigo-500" />
                                    <span className="text-xs font-bold text-neutral-700">Generate idea</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full bg-white shadow-sm border ${playStep % 2 === 0 ? 'border-indigo-200 scale-110' : 'border-neutral-100'} transition-all flex items-center justify-center`}>
                                        <Database className={`h-4 w-4 ${playStep % 2 === 0 ? 'text-indigo-500' : 'text-neutral-400'}`} />
                                    </div>
                                    <div className="w-16 h-0.5 bg-neutral-200 relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 h-full bg-indigo-500 w-full ${playStep % 2 === 0 ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-1000`} />
                                    </div>
                                    <div className={`h-10 w-10 rounded-full bg-white shadow-sm border ${playStep % 2 !== 0 ? 'border-emerald-200 scale-110' : 'border-neutral-100'} transition-all flex items-center justify-center`}>
                                        <Activity className={`h-4 w-4 ${playStep % 2 !== 0 ? 'text-emerald-500' : 'text-neutral-400'}`} />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleCreateBoard}
                                    className="px-6 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full text-xs font-bold transition-colors border border-indigo-100"
                                >
                                    Start drawing &rarr;
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* ── ALL BOARDS SECTION ──────────────────────────────────── */}
                    <section id="boards" className="space-y-4 scroll-mt-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                <LayoutDashboard className="h-4 w-4" /> All Boards
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                            {/* New Board Card Trigger */}
                            <button 
                                onClick={handleCreateBoard}
                                className="group flex flex-col items-center justify-center gap-3 h-[180px] rounded-3xl bg-white/40 hover:bg-white border-2 border-dashed border-neutral-200 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/[0.04] hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center border border-neutral-200 shadow-sm group-hover:scale-110 group-hover:border-indigo-100 group-hover:bg-indigo-50 group-hover:rotate-3 transition-all duration-300">
                                    <Plus className="h-6 w-6 text-neutral-400 group-hover:text-indigo-600 transition-colors" />
                                </div>
                                <div className="text-center">
                                    <span className="block text-[13px] font-extrabold text-neutral-800">New board</span>
                                    <span className="text-[11px] font-medium text-neutral-400 mt-1 block">Blank canvas</span>
                                </div>
                            </button>

                            {/* All Boards List */}
                            {filteredBoards.map((board) => (
                                <div key={board.id} className="h-auto group transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/[0.04]">
                                    <BoardCard
                                        board={board}
                                        onDelete={handleDelete}
                                        onRename={handleRename}
                                        onMoveToCloud={handleMoveToCloud}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* ── TWO COLUMN BOTTOM ──────────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        
                        {/* Left: Quick Start / Explore */}
                        <section className="space-y-4">
                            <h2 className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                <Star className="h-4 w-4" /> Quick Actions
                            </h2>
                            <div className="flex flex-col gap-3">
                                
                                <ActionCard 
                                    icon={<Sparkles className="h-5 w-5 text-indigo-500" />}
                                    bg="bg-indigo-50"
                                    title="Generate AI Diagram"
                                    desc="Describe what you want, and let AI build the flowchart instantly."
                                    onClick={handleCreateBoard}
                                />
                                
                                <ActionCard 
                                    icon={<FileText className="h-5 w-5 text-emerald-500" />}
                                    bg="bg-emerald-50"
                                    title="Browse Templates"
                                    desc="Start from a ready-made layout like mind maps or ERDs."
                                    onClick={() => {
                                        const el = document.getElementById('boards');
                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                />

                                <ActionCard 
                                    icon={<Compass className="h-5 w-5 text-blue-500" />}
                                    bg="bg-blue-50"
                                    title="Explore Community"
                                    desc="Get inspired by boards and shapes made by others."
                                    onClick={() => navigate('/dashboard/explore')}
                                />

                            </div>
                        </section>

                        {/* Right: Recent Activity */}
                        <section className="space-y-4">
                            <h2 className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="h-4 w-4" /> Activity Log
                            </h2>
                            <div className="flex flex-col gap-3">
                                {activityItems.length === 0 ? (
                                    <div className="p-8 text-center text-sm font-medium text-neutral-400 border-2 border-dashed border-neutral-200 rounded-3xl bg-white/40">
                                        No recent activity. Create a board to get started!
                                    </div>
                                ) : (
                                    activityItems.map((item) => (
                                        <div 
                                            key={item.id} 
                                            onClick={() => navigate(`/board/${item.id}`)} 
                                            className="group bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white hover:shadow-lg hover:shadow-black/[0.02] hover:-translate-y-0.5 hover:border-indigo-100 transition-all duration-300"
                                        >
                                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border border-white shadow-sm transition-transform group-hover:scale-105 ${
                                                item.type === 'ai' ? 'bg-indigo-50' : 
                                                item.type === 'new' ? 'bg-emerald-50' : 
                                                'bg-blue-50'
                                            }`}>
                                                {item.type === 'ai' ? <Sparkles className="w-5 h-5 text-indigo-500" /> : 
                                                 item.type === 'new' ? <PlusSquare className="w-5 h-5 text-emerald-500" /> : 
                                                 <Pencil className="w-5 h-5 text-blue-500" />}
                                            </div>
                                            
                                            <div className="flex-1 flex flex-col justify-center overflow-hidden">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                        item.type === 'ai' ? 'bg-indigo-100/50 text-indigo-700' : 
                                                        item.type === 'new' ? 'bg-emerald-100/50 text-emerald-700' : 
                                                        'bg-blue-100/50 text-blue-700'
                                                    }`}>
                                                        {item.type === 'ai' ? 'AI Gen' : item.type === 'new' ? 'Created' : 'Edited'}
                                                    </span>
                                                    <span className="text-[11px] font-medium text-neutral-400 truncate">
                                                        {formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-extrabold text-neutral-900 truncate group-hover:text-indigo-600 transition-colors">
                                                    {item.name}
                                                </span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors shrink-0">
                                                <ArrowRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}

// ── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function ActionCard({ icon, title, desc, bg, onClick }) {
    return (
        <div 
            onClick={onClick}
            className="group bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white hover:shadow-lg hover:shadow-black/[0.02] hover:-translate-y-0.5 hover:border-indigo-100 transition-all duration-300"
        >
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border border-white shadow-sm transition-transform group-hover:scale-105 ${bg}`}>
                {icon}
            </div>
            <div className="flex flex-col justify-center flex-1">
                <span className="text-[13px] font-extrabold text-neutral-900 group-hover:text-indigo-600 transition-colors leading-tight mb-1">{title}</span>
                <span className="text-[11px] font-medium text-neutral-500 leading-relaxed max-w-[250px]">{desc}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0 mr-2" />
        </div>
    );
}
