import { Link, useNavigate } from "react-router-dom";
import { 
    Plus, Search, Box, LayoutDashboard, Folder, Shapes, 
    Sparkles, Share2, Database, Lock, Cloud, Cpu, Layers,
    ArrowUpRight, ArrowRight, HelpCircle, Check, CheckCircle2, AlertCircle,
    Activity, Play, ChevronRight
} from "lucide-react";
import { useBoardStore } from "@/hooks/useBoardStore";
import { toast } from "sonner";
import { useMemo, useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";

import { BoardCard } from "../BoardCard";
import { LibraryPanel } from "@/components/layout/LibraryPanel";
import { useLibraryStore } from "@/hooks/useLibraryStore";

export default function GuestDashboardView() {
    const navigate = useNavigate();
    const { localBoards, createBoard, renameBoard, deleteBoard } = useBoardStore();
    const { 
        items, 
        removeItem, 
        addItem, 
        libraryItems, 
        communityItems 
    } = useLibraryStore();
    const [activeTab, setActiveTab] = useState('overview');

    // Live AI Flowchart drawing simulation loop
    const mainContainerRef = useRef(null);
    const localBoardsRef = useRef(null);
    const [boardSearchQuery, setBoardSearchQuery] = useState("");

    // Sort and filter boards by search query
    const filteredLocalBoards = useMemo(() => {
        const q = boardSearchQuery.toLowerCase();
        return [...localBoards]
            .filter(b => !q || b.name.toLowerCase().includes(q))
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    }, [localBoards, boardSearchQuery]);

    // Handle scroll spy to highlight nav items as we scroll down to local boards
    useEffect(() => {
        const container = mainContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            if (!localBoardsRef.current) return;
            const boardsTop = localBoardsRef.current.offsetTop;
            const containerScroll = container.scrollTop;
            const targetTab = containerScroll >= boardsTop - 240 ? 'boards' : 'overview';

            setActiveTab(prev => {
                if (prev === 'library' || prev === targetTab) return prev;
                return targetTab;
            });
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavOverview = () => {
        if (activeTab === 'library') {
            setActiveTab('overview');
            setTimeout(() => {
                mainContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        } else {
            mainContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setActiveTab('overview');
    };

    const handleNavBoards = () => {
        if (activeTab === 'library') {
            setActiveTab('overview');
            setTimeout(() => {
                localBoardsRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            localBoardsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        setActiveTab('boards');
    };

    const handleCreateBoard = async () => {
        try {
            const id = await createBoard(null, true); // Force local
            navigate(`/board/${id}`);
        } catch {
            toast.error('Failed to create local board');
        }
    };

    const handleRename = async (id) => {
        const newName = prompt('Enter new board name:');
        if (newName) {
            await renameBoard(id, newName);
            toast.success('Board renamed');
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this board?')) {
            await deleteBoard(id);
            toast.success('Board deleted');
        }
    };

    return (
        <div className="relative flex h-screen w-full bg-[#FAF9F5] font-sans text-neutral-800 selection:bg-indigo-100 overflow-hidden">
            {/* ── SPATIAL BACKDROP ─────────────────────────────────────────────── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#FAF9F5]">
                {/* Indigo and Emerald Radial Gradient Spotlights (optimized for 60fps scrolling) */}
                <div 
                    className="absolute inset-0 opacity-90"
                    style={{
                        backgroundImage: `
                            radial-gradient(circle at 35% 15%, rgba(99, 102, 241, 0.07) 0%, transparent 45%),
                            radial-gradient(circle at 85% 80%, rgba(16, 185, 129, 0.06) 0%, transparent 50%)
                        `
                    }}
                />
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#00000004_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-75" />
            </div>

            {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
            <aside className="relative z-10 w-[250px] m-4 mr-0 bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl h-[calc(100vh-32px)] flex flex-col justify-between flex-shrink-0 shadow-lg shadow-black/[0.02]">
                <div className="flex flex-col">
                    {/* Logo & Version */}
                    <div className="p-6 flex items-center gap-3">
                        <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-md shadow-black/10 transform hover:rotate-6 transition-all duration-300 border border-slate-800">
                            <Box className="h-6 w-6 animate-pulse text-slate-100" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[18px] font-black tracking-tight text-neutral-900 leading-none">InfiniCanvas</span>
                            <span className="text-[11px] text-neutral-400 font-medium mt-1">Local v2.4.0</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="px-3 space-y-1 mt-2">
                        <button 
                            onClick={handleNavOverview}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200 ${
                                activeTab === 'overview' 
                                ? 'bg-white text-indigo-600 shadow-sm border border-neutral-200/50' 
                                : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50 border border-transparent'
                            }`}
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Overview
                        </button>
                        <button 
                            onClick={handleNavBoards}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200 ${
                                activeTab === 'boards' 
                                ? 'bg-white text-indigo-600 shadow-sm border border-neutral-200/50' 
                                : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50 border border-transparent'
                            }`}
                        >
                            <Folder className="h-4 w-4" />
                            All boards
                        </button>
                        <button 
                            onClick={() => setActiveTab('library')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200 ${
                                activeTab === 'library' 
                                ? 'bg-white text-indigo-600 shadow-sm border border-neutral-200/50' 
                                : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50 border border-transparent'
                            }`}
                        >
                            <Shapes className="h-4 w-4" />
                            Library
                        </button>
                    </nav>
                </div>

                {/* Conversion Upsell Card */}
                <div className="p-4">
                    <div className="relative overflow-hidden bg-white/60 border border-neutral-200/50 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
                        {/* Decorative background flare */}
                        <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-indigo-500/5 blur-xl pointer-events-none" />
                        
                        <div className="space-y-1.5 relative z-10">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[9px] font-bold tracking-wider uppercase border border-indigo-100/50">
                                <Sparkles className="h-2 w-2" /> Upgrade
                            </span>
                            <h3 className="text-[13px] font-extrabold text-neutral-900 tracking-tight">Save work to Cloud</h3>
                            <p className="text-[11px] leading-relaxed text-neutral-500">
                                Sign up free to unlock infinite cloud syncing and live collaborative co-editing.
                            </p>
                        </div>

                        {/* Bullets */}
                        <div className="space-y-1 text-[10px] text-neutral-600 relative z-10 font-bold">
                            <div className="flex items-center gap-2">
                                <Check className="h-3.5 w-3.5 text-indigo-600" />
                                <span>Unlimited shared boards</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="h-3.5 w-3.5 text-indigo-600" />
                                <span>Realtime team cursor sync</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="h-3.5 w-3.5 text-indigo-600" />
                                <span>Export HD PDF / Vector SVGs</span>
                            </div>
                        </div>

                        <Link 
                            to="/signup" 
                            className="group/signup w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold text-white bg-neutral-900 hover:bg-neutral-950 border border-neutral-800 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 duration-200 relative z-10"
                        >
                            <span>Sign up free</span>
                            <ArrowRight className="h-3.5 w-3.5 text-neutral-400 group-hover/signup:text-white group-hover/signup:translate-x-0.5 transition-all" />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
            <main ref={mainContainerRef} className="relative z-10 flex-1 flex flex-col min-w-0 overflow-y-auto">
                
                {/* Floating Header */}
                {activeTab !== 'library' && (
                    <header className="mx-6 mt-4 py-5 px-8 bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl flex items-center justify-between shadow-sm flex-shrink-0">
                        <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
                            <span>Welcome to InfiniStudio</span>
                            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-semibold border border-indigo-100">Guest</span>
                        </h1>
                        <div className="flex items-center gap-4">
                            <div className="relative w-64 hidden sm:block">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                                <input 
                                    type="text"
                                    placeholder="Search templates…"
                                    className="w-full pl-9 pr-3 py-1.5 text-[12px] bg-white/80 border border-neutral-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none transition-all shadow-inner"
                                />
                            </div>
                            <button 
                                onClick={handleCreateBoard}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-[12px] font-semibold hover:from-indigo-700 hover:to-purple-700 hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-indigo-600/10"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Free whiteboard</span>
                            </button>
                            
                            <div className="h-5 w-px bg-neutral-200 mx-1"></div>
                            <Link 
                                to="/login"
                                className="flex items-center gap-2 px-5 py-2 bg-neutral-900 text-white rounded-xl text-[13px] font-bold hover:bg-neutral-800 hover:-translate-y-0.5 transition-all shadow-md active:scale-95"
                            >
                                <span>Sign In</span>
                            </Link>
                        </div>
                    </header>
                )}

                {activeTab === 'library' ? (
                    <div className="flex-1 h-[calc(100vh-100px)] overflow-hidden">
                        <LibraryPanel
                            isDashboardMode={true}
                            items={items}
                            onDeleteItem={removeItem}
                            onAddItem={addItem}
                            libraryItems={libraryItems}
                            communityItems={communityItems}
                        />
                    </div>
                ) : (
                    <div className="p-6 max-w-5xl mx-auto w-full space-y-8 pb-20">
                        <>
                                {/* ── HERO PLAYGROUND BANNER ─────────────────────────────── */}
                                <section className="w-full flex flex-col md:flex-row items-stretch rounded-3xl overflow-hidden bg-white/50 backdrop-blur-md border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all">
                                    {/* Text Block */}
                                    <div className="p-8 md:p-10 flex-1 flex flex-col justify-center gap-5">
                                        <div className="space-y-3">
                                            <span 
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100"
                                            >
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                                Local First Workspaces
                                            </span>
                                            <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight leading-tight">
                                                A canvas that <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">thinks with you</span>
                                            </h1>
                                            <p className="text-[13px] leading-relaxed text-neutral-500 max-w-[420px]">
                                                Sketch flowcharts, organize mind maps, and draw freely. Generate structures automatically with AI integration. All saved locally on your device by default.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={handleCreateBoard}
                                                className="px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-[13px] font-bold hover:bg-neutral-800 transition-all hover:-translate-y-0.5 shadow-md active:scale-95"
                                            >
                                                Start drawing
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('library')}
                                                className="px-5 py-2.5 bg-white border border-neutral-200 text-neutral-700 rounded-xl text-[13px] font-bold hover:bg-neutral-50 hover:-translate-y-0.5 transition-all active:scale-95"
                                            >
                                                Explore library
                                            </button>
                                        </div>
                                    </div>

                                    {/* Visual Playground (Animated Flowchart Creation) */}
                                    <VisualPlayground />
                                </section>

                                {/* ── FEATURE HIGHLIGHTS ──────────────────────────────────── */}
                                <section className="flex flex-wrap items-center justify-center gap-3">
                                    <FeatureChip 
                                        icon={<Sparkles className="h-3.5 w-3.5" />} 
                                        label="AI Generation" 
                                        desc="Convert ideas to nodes"
                                        glowColor="rgba(99,102,241,0.15)"
                                        borderColor="border-indigo-100 hover:border-indigo-300"
                                    />
                                    <FeatureChip 
                                        icon={<Share2 className="h-3.5 w-3.5" />} 
                                        label="Cloud Collab" 
                                        desc="Team co-edit, cursor sync"
                                        glowColor="rgba(16,185,129,0.15)"
                                        borderColor="border-emerald-100 hover:border-emerald-300"
                                    />
                                    <FeatureChip 
                                        icon={<Database className="h-3.5 w-3.5" />} 
                                        label="Offline-First" 
                                        desc="Full offline IndexDB engine"
                                        glowColor="rgba(59,130,246,0.15)"
                                        borderColor="border-blue-100 hover:border-blue-300"
                                    />
                                    <FeatureChip 
                                        icon={<Layers className="h-3.5 w-3.5" />} 
                                        label="Custom Library" 
                                        desc="Create reusable shapes"
                                        glowColor="rgba(249,115,22,0.15)"
                                        borderColor="border-orange-100 hover:border-orange-300"
                                    />
                                </section>

                                {/* ── TEMPLATE SELECTION ──────────────────────────────────── */}
                                <section className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">
                                            Start with a template blueprint
                                        </h2>
                                        <span className="text-[11px] text-indigo-600 font-semibold cursor-pointer hover:underline flex items-center gap-0.5">
                                            All templates <ChevronRight className="h-3.5 w-3.5" />
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                        <TemplateCard 
                                            name="Flowchart" 
                                            desc="Logic paths" 
                                            color="bg-purple-50/70"
                                            accentColor="#a855f7" 
                                            onClick={handleCreateBoard} 
                                            illustration={
                                                <svg viewBox="0 0 100 60" className="w-full h-full opacity-60">
                                                    <rect x="10" y="20" width="22" height="14" rx="3" fill="none" stroke="#a855f7" strokeWidth="1.5" />
                                                    <polygon points="58,27 70,20 82,27 70,34" fill="none" stroke="#a855f7" strokeWidth="1.5" />
                                                    <line x1="32" y1="27" x2="58" y2="27" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 3" />
                                                </svg>
                                            }
                                        />
                                        <TemplateCard 
                                            name="Mind Map" 
                                            desc="Brainstorm" 
                                            color="bg-emerald-50/70" 
                                            accentColor="#10b981" 
                                            onClick={handleCreateBoard}
                                            illustration={
                                                <svg viewBox="0 0 100 60" className="w-full h-full opacity-60">
                                                    <circle cx="50" cy="30" r="8" fill="none" stroke="#10b981" strokeWidth="1.5" />
                                                    <circle cx="20" cy="18" r="5" fill="none" stroke="#10b981" strokeWidth="1.5" />
                                                    <circle cx="24" cy="42" r="5" fill="none" stroke="#10b981" strokeWidth="1.5" />
                                                    <circle cx="80" cy="22" r="5" fill="none" stroke="#10b981" strokeWidth="1.5" />
                                                    <path d="M 42 30 C 30 30, 30 20, 25 18 M 42 30 C 30 30, 32 40, 29 42 M 58 30 C 70 30, 70 24, 75 22" fill="none" stroke="#10b981" strokeWidth="1.5" />
                                                </svg>
                                            }
                                        />
                                        <TemplateCard 
                                            name="Comparison" 
                                            desc="Pros & cons" 
                                            color="bg-blue-50/70" 
                                            accentColor="#3b82f6" 
                                            onClick={handleCreateBoard}
                                            illustration={
                                                <svg viewBox="0 0 100 60" className="w-full h-full opacity-60">
                                                    <line x1="50" y1="10" x2="50" y2="50" stroke="#3b82f6" strokeWidth="1.5" />
                                                    <rect x="15" y="15" width="20" height="4" rx="1" fill="#3b82f6" opacity="0.6" />
                                                    <rect x="15" y="25" width="25" height="4" rx="1" fill="#3b82f6" opacity="0.6" />
                                                    <rect x="60" y="15" width="25" height="4" rx="1" fill="#3b82f6" opacity="0.6" />
                                                    <rect x="60" y="25" width="20" height="4" rx="1" fill="#3b82f6" opacity="0.6" />
                                                </svg>
                                            }
                                        />
                                        <TemplateCard 
                                            name="ERD Table" 
                                            desc="Schemas" 
                                            color="bg-rose-50/70" 
                                            accentColor="#f43f5e" 
                                            onClick={handleCreateBoard}
                                            illustration={
                                                <svg viewBox="0 0 100 60" className="w-full h-full opacity-60">
                                                    <rect x="12" y="10" width="26" height="36" rx="2" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                                                    <rect x="62" y="14" width="26" height="30" rx="2" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                                                    <line x1="12" y1="20" x2="38" y2="20" stroke="#f43f5e" strokeWidth="1" />
                                                    <line x1="62" y1="24" x2="88" y2="24" stroke="#f43f5e" strokeWidth="1" />
                                                    <path d="M 38 28 C 50 28, 50 32, 62 32" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
                                                </svg>
                                            }
                                        />
                                        <TemplateCard 
                                            name="DSA Tree" 
                                            desc="Structures" 
                                            color="bg-amber-50/70" 
                                            accentColor="#f59e0b" 
                                            onClick={handleCreateBoard}
                                            illustration={
                                                <svg viewBox="0 0 100 60" className="w-full h-full opacity-60">
                                                    <circle cx="50" cy="15" r="5" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                                                    <circle cx="32" cy="32" r="5" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                                                    <circle cx="68" cy="32" r="5" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                                                    <line x1="47" y1="19" x2="35" y2="28" stroke="#f59e0b" strokeWidth="1.2" />
                                                    <line x1="53" y1="19" x2="65" y2="28" stroke="#f59e0b" strokeWidth="1.2" />
                                                </svg>
                                            }
                                        />
                                    </div>
                                </section>

                                {/* ── LOCAL BOARDS SECTION ────────────────────────────────── */}
                                <section ref={localBoardsRef} className="space-y-4 scroll-mt-6">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">
                                            Your local boards
                                        </h2>
                                        {/* Board Search */}
                                        <div className="relative w-48">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-400" />
                                            <input 
                                                type="text"
                                                placeholder="Search boards..."
                                                value={boardSearchQuery}
                                                onChange={(e) => setBoardSearchQuery(e.target.value)}
                                                className="w-full pl-8 pr-3 py-1 text-[11px] bg-white/80 border border-neutral-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                        {/* New Board Card Trigger */}
                                        <button 
                                            onClick={handleCreateBoard}
                                            className="group flex flex-col items-center justify-center gap-3 h-[180px] rounded-2xl bg-white/40 hover:bg-white border-2 border-dashed border-neutral-300 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/[0.02] hover:-translate-y-1 transition-all duration-300"
                                        >
                                            <div className="h-11 w-11 rounded-full bg-white flex items-center justify-center border border-neutral-200/60 shadow-sm group-hover:scale-110 group-hover:border-indigo-100 group-hover:bg-indigo-50 transition-all duration-300">
                                                <Plus className="h-5 w-5 text-neutral-400 group-hover:text-indigo-600 transition-colors" />
                                            </div>
                                            <div className="text-center">
                                                <span className="block text-[13px] font-bold text-neutral-800">New board</span>
                                                <span className="text-[11px] text-neutral-400 mt-0.5 block">Create empty canvas</span>
                                            </div>
                                        </button>

                                        {/* Existing Local Board list */}
                                        {filteredLocalBoards.length > 0 ? (
                                            filteredLocalBoards.map(board => (
                                                <div key={board.id} className="h-auto">
                                                    <BoardCard 
                                                        board={board} 
                                                        onRename={handleRename}
                                                        onDelete={handleDelete}
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="col-span-1 sm:col-span-2 rounded-2xl bg-white/30 backdrop-blur-md border border-dashed border-neutral-300 flex flex-col items-center justify-center p-6 text-center h-[180px]">
                                                {/* Cute Sketchy Placeholder */}
                                                <svg viewBox="0 0 100 80" className="h-14 w-14 mb-3 text-neutral-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <rect x="20" y="20" width="60" height="40" rx="4" />
                                                    <line x1="30" y1="32" x2="70" y2="32" />
                                                    <line x1="30" y1="40" x2="55" y2="40" />
                                                    <line x1="30" y1="48" x2="45" y2="48" />
                                                    <circle cx="70" cy="48" r="4" className="stroke-indigo-400 fill-indigo-50" />
                                                </svg>
                                                <p className="text-[12px] text-neutral-400 font-semibold leading-relaxed">
                                                    No local boards yet.<br/>
                                                    <span className="text-indigo-600 cursor-pointer hover:underline font-bold" onClick={handleCreateBoard}>Create a board</span> to start drawing!
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </>
                    </div>
                )}
            </main>
        </div>
    );
}

// ── SUBCOMPONENTS ────────────────────────────────────────────────────────────

function FeatureChip({ icon, label, desc, glowColor, borderColor }) {
    return (
        <div 
            style={{ '--glow-color': glowColor }}
            className={`flex items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-white border transition-all duration-300 shadow-sm cursor-default hover:bg-neutral-50/50 hover:shadow-md hover:-translate-y-0.5 ${borderColor}`}
        >
            <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div className="flex flex-col">
                <span className="text-[12.5px] font-extrabold text-neutral-800 leading-none">{label}</span>
                <span className="text-[10px] text-neutral-400 mt-1 font-medium leading-none">{desc}</span>
            </div>
        </div>
    );
}

function TemplateCard({ name, desc, color, accentColor, onClick, illustration }) {
    return (
        <div 
            onClick={onClick}
            className="group rounded-2xl overflow-hidden bg-white border border-neutral-200/80 cursor-pointer hover:-translate-y-1 hover:border-neutral-300 transition-all hover:shadow-lg flex flex-col h-[145px]"
        >
            <div className={`h-[85px] w-full flex items-center justify-center relative overflow-hidden transition-colors ${color}`}>
                {/* Custom Template Illustration */}
                <div className="w-[80px] h-[50px] relative z-10 transition-transform duration-500 group-hover:scale-105">
                    {illustration}
                </div>
                {/* Decorative glowing gradient blur */}
                <div 
                    className="absolute top-0 right-0 w-12 h-12 rounded-full blur-xl opacity-30 group-hover:opacity-40 transition-opacity" 
                    style={{ backgroundColor: accentColor }}
                />
            </div>
            <div className="px-4 py-3 border-t border-neutral-100 flex-1 flex flex-col justify-center bg-white z-10">
                <span className="text-[13px] font-extrabold text-neutral-900 leading-tight group-hover:text-indigo-600 transition-colors">
                    {name}
                </span>
                <span className="text-[11px] font-medium text-neutral-400 mt-0.5">
                    {desc}
                </span>
            </div>
        </div>
    );
}

function VisualPlayground() {
    const [playStep, setPlayStep] = useState(0);
    const [typedPrompt, setTypedPrompt] = useState("");
    const [cursorCoords, setCursorCoords] = useState({ x: 20, y: 150 });

    useEffect(() => {
        const textToType = "Create responsive auth diagram...";
        let stepTimer;
        let typingInterval;

        if (playStep === 0) {
            setTypedPrompt("");
            let index = 0;
            typingInterval = setInterval(() => {
                if (index < textToType.length) {
                    setTypedPrompt(prev => prev + textToType.charAt(index));
                    index++;
                } else {
                    clearInterval(typingInterval);
                    stepTimer = setTimeout(() => setPlayStep(1), 1000); // go to AI Thinking
                }
            }, 50);
        } else if (playStep === 1) {
            stepTimer = setTimeout(() => setPlayStep(2), 1500); // Node 1 reveal
        } else if (playStep === 2) {
            stepTimer = setTimeout(() => setPlayStep(3), 1000); // Node 2 reveal + Path 1
        } else if (playStep === 3) {
            stepTimer = setTimeout(() => setPlayStep(4), 1200); // Node 3 reveal + Path 2
        } else if (playStep === 4) {
            stepTimer = setTimeout(() => setPlayStep(5), 1200); // Node 4 reveal + Path 3
        } else if (playStep === 5) {
            stepTimer = setTimeout(() => {
                setPlayStep(0);
            }, 4000);
        }

        return () => {
            clearInterval(typingInterval);
            clearTimeout(stepTimer);
        };
    }, [playStep]);

    useEffect(() => {
        if (playStep === 0) {
            setCursorCoords({ x: 20, y: 150 });
        } else if (playStep === 1) {
            setCursorCoords({ x: 60, y: 55 });
        } else if (playStep === 2) {
            setCursorCoords({ x: 130, y: 55 });
        } else if (playStep === 3) {
            setCursorCoords({ x: 250, y: 55 });
        } else if (playStep === 4) {
            setCursorCoords({ x: 175, y: 110 });
        } else if (playStep === 5) {
            setCursorCoords({ x: 200, y: 60 });
        }
    }, [playStep]);

    return (
        <div className="w-full md:w-[380px] bg-neutral-50/50 border-t md:border-t-0 md:border-l border-neutral-100 flex items-center justify-center p-6 relative overflow-hidden select-none">
            {/* Mock Editor Canvas Wrapper */}
            <div className="relative w-full h-[230px] bg-white border border-neutral-200/80 rounded-2xl shadow-lg flex flex-col justify-between overflow-hidden">
                
                {/* Mock Header Controls */}
                <div className="flex items-center justify-between px-3 py-2 bg-neutral-50 border-b border-neutral-100 shrink-0">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-neutral-200/50 text-[9px] text-neutral-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                        <span>{playStep === 0 ? "Typing prompt" : playStep === 1 ? "AI Thinking" : "Drawing"}</span>
                    </div>
                </div>

                {/* Mock Workspace area */}
                <div className="relative flex-1 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:12px_12px] overflow-hidden">
                    
                    {/* SVG layer for connecting lines */}
                    <svg viewBox="0 0 340 180" className="absolute inset-0 w-full h-full pointer-events-none">
                        {/* Path 1: Node 1 -> Node 2 */}
                        {playStep >= 3 && (
                            <path 
                                d="M 95 65 C 115 65, 115 45, 135 45" 
                                stroke="#818cf8" 
                                strokeWidth="2" 
                                fill="none" 
                                strokeDasharray="100" 
                                strokeDashoffset={playStep === 3 ? "100" : "0"} 
                                className={playStep === 3 ? "animate-draw-path" : "transition-all"}
                            />
                        )}
                        {/* Path 2: Node 2 -> Node 3 */}
                        {playStep >= 4 && (
                            <path 
                                d="M 215 45 C 235 45, 235 65, 255 65" 
                                stroke="#34d399" 
                                strokeWidth="2" 
                                fill="none" 
                                strokeDasharray="100" 
                                strokeDashoffset={playStep === 4 ? "100" : "0"} 
                                className={playStep === 4 ? "animate-draw-path" : "transition-all"}
                            />
                        )}
                        {/* Path 3: Node 2 -> Node 4 */}
                        {playStep >= 5 && (
                            <path 
                                d="M 175 65 L 175 110" 
                                stroke="#f87171" 
                                strokeWidth="2" 
                                fill="none" 
                                strokeDasharray="100" 
                                strokeDashoffset={playStep === 5 ? "100" : "0"} 
                                className={playStep === 5 ? "animate-draw-path" : "transition-all"}
                            />
                        )}

                        {/* Interactive/Collaborative Cursor */}
                        <g transform={`translate(${cursorCoords.x - 5}, ${cursorCoords.y - 5})`} className="transition-all duration-700 ease-out">
                            {/* Cursor arrow */}
                            <path d="M 0 0 L 12 12 L 8 4 Z" fill="#6366f1" stroke="#ffffff" strokeWidth="1" />
                            {/* Cursor label */}
                            <foreignObject x="10" y="10" width="70" height="20">
                                <span className="inline-block bg-indigo-600 text-white font-bold text-[8px] px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                                    Studio AI
                                </span>
                            </foreignObject>
                        </g>
                    </svg>

                    {/* Node HTML blocks rendered absolute over the grid */}
                    {/* Node 1 (Login Box) */}
                    <div 
                        style={{ left: "20px", top: "45px" }} 
                        className={`absolute w-[75px] bg-white border rounded-lg p-1.5 shadow-sm transition-all duration-500 flex flex-col gap-0.5 ${
                            playStep >= 2 ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-2'
                        } ${playStep === 2 ? 'border-indigo-500 shadow-indigo-100 ring-2 ring-indigo-50' : 'border-neutral-200'}`}
                    >
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span className="text-[7px] font-bold text-neutral-800">Login Form</span>
                        </div>
                        <div className="w-full h-1 bg-neutral-100 rounded" />
                        <div className="w-full h-1 bg-neutral-100 rounded" />
                    </div>

                    {/* Node 2 (Verification gateway) */}
                    <div 
                        style={{ left: "135px", top: "25px" }} 
                        className={`absolute w-[80px] bg-white border rounded-lg p-1.5 shadow-sm transition-all duration-500 flex flex-col gap-0.5 ${
                            playStep >= 3 ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-2'
                        } ${playStep === 3 ? 'border-indigo-500 shadow-indigo-100 ring-2 ring-indigo-50' : 'border-neutral-200'}`}
                    >
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span className="text-[7px] font-bold text-neutral-800">Verify Credentials</span>
                        </div>
                        <div className="w-full h-1 bg-neutral-100 rounded" />
                    </div>

                    {/* Node 3 (Success landing) */}
                    <div 
                        style={{ left: "250px", top: "45px" }} 
                        className={`absolute w-[75px] bg-emerald-50/70 border border-emerald-200 rounded-lg p-1.5 shadow-sm transition-all duration-500 flex flex-col gap-0.5 ${
                            playStep >= 4 ? 'scale-100 opacity-100 translate-y-0 animate-pulse-glow' : 'scale-75 opacity-0 translate-y-2'
                        }`}
                    >
                        <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-2 w-2 text-emerald-500" />
                            <span className="text-[7px] font-bold text-emerald-950">Success Page</span>
                        </div>
                    </div>

                    {/* Node 4 (Fail landing) */}
                    <div 
                        style={{ left: "135px", top: "110px" }} 
                        className={`absolute w-[80px] bg-rose-50/70 border border-rose-200 rounded-lg p-1.5 shadow-sm transition-all duration-500 flex flex-col gap-0.5 ${
                            playStep >= 5 ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-2'
                        }`}
                    >
                        <div className="flex items-center gap-1">
                            <AlertCircle className="h-2 w-2 text-rose-500" />
                            <span className="text-[7px] font-bold text-rose-950">Show Alert</span>
                        </div>
                    </div>
                </div>

                {/* Mock AI Prompt Input Area */}
                <div className="p-2 px-3 bg-neutral-50 border-t border-neutral-100 flex items-center gap-2 shrink-0">
                    <div className="h-5 w-5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-md flex items-center justify-center text-white text-[8px] font-bold">
                        AI
                    </div>
                    <div className="flex-1 bg-white border border-neutral-200 rounded-md px-2 py-0.5 text-[8.5px] text-neutral-700 flex items-center justify-between min-h-[18px]">
                        <span>{typedPrompt}</span>
                        {playStep === 0 && <span className="w-[1.5px] h-3 bg-neutral-900 animate-pulse" />}
                    </div>
                </div>

            </div>
        </div>
    );
}
