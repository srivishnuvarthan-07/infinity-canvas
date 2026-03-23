import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Box, LayoutDashboard, Folder, Shapes, Settings } from "lucide-react";
import { useBoardStore } from "@/hooks/useBoardStore";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { UserProfileMenu } from "../UserProfileMenu";
import { NotificationBell } from "../NotificationBell";
import { BoardCard } from "../BoardCard";
import AllBoardsView from "./AllBoardsView";
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

    // Sort boards by most recent
    const latestBoards = useMemo(() => {
        return [...localBoards]
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    }, [localBoards]);

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
        <div className="flex h-screen w-full bg-[#FAFAFA] font-sans text-neutral-800 selection:bg-neutral-200 overflow-hidden">
            {/* ── SIDEBAR (220px) ──────────────────────────────────────────────── */}
            <aside className="w-[240px] m-4 mr-0 bg-[#F6F5F3]/80 backdrop-blur-xl border border-black/5 rounded-3xl h-[calc(100vh-32px)] flex flex-col sticky top-4 z-20 flex-shrink-0 shadow-sm">
                {/* Logo */}
                <div className="p-8 flex items-center gap-3">
                    <div className="h-10 w-10 bg-neutral-900 rounded-xl flex items-center justify-center text-white shadow-md shadow-black/10">
                        <Box className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-neutral-900">Studio</span>
                </div>

                {/* Navigation */}
                <nav className="px-3 flex-1 space-y-1">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium rounded-xl transition-all ${
                            activeTab === 'overview' 
                            ? 'bg-white text-neutral-900 shadow-sm border border-black/5' 
                            : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/50 border border-transparent'
                        }`}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('boards')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium rounded-xl transition-all ${
                            activeTab === 'boards' 
                            ? 'bg-white text-neutral-900 shadow-sm border border-black/5' 
                            : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/50 border border-transparent'
                        }`}
                    >
                        <Folder className="h-4 w-4" />
                        All boards
                    </button>
                    <button 
                        onClick={() => setActiveTab('library')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium rounded-xl transition-all ${
                            activeTab === 'library' 
                            ? 'bg-white text-neutral-900 shadow-sm border border-black/5' 
                            : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/50 border border-transparent'
                        }`}
                    >
                        <Shapes className="h-4 w-4" />
                        Library
                    </button>
                </nav>

                {/* Conversion Upsell Card */}
                <div className="p-4 pt-2">
                    <div className="p-4 rounded-2xl flex flex-col gap-3 bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100/50 shadow-sm">
                        <div className="space-y-1">
                            <h3 className="text-[12px] font-semibold text-indigo-900">Save your work</h3>
                            <p className="text-[11px] leading-relaxed text-indigo-700/80">
                                Sign up free to sync boards to the cloud and collaborate.
                            </p>
                        </div>
                        <Link 
                            to="/signup" 
                            className="w-full text-center py-2 rounded-xl text-[12px] font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all hover:shadow transition-colors"
                        >
                            Sign up free
                        </Link>
                    </div>
                </div>
            </aside>

            {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA] overflow-y-auto">
                {activeTab !== 'boards' && (
                    <header className="h-24 px-10 flex items-center justify-between sticky top-4 m-4 bg-[#FAFAFA]/80 backdrop-blur-md z-10 border border-black/5 rounded-3xl shadow-sm">
                    <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Welcome to Studio</h1>
                    <div className="flex items-center gap-4">
                        <div className="relative w-64 hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <input 
                                type="text"
                                placeholder="Search templates…"
                                className="w-full pl-9 pr-3 py-2 text-[13px] bg-white border border-black/5 hover:border-black/10 focus:border-black/15 focus:ring-0 rounded-xl outline-none transition-all shadow-sm"
                            />
                        </div>
                        <button 
                            onClick={handleCreateBoard}
                            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white rounded-xl text-[13px] font-medium hover:bg-neutral-800 transition-all shadow-sm"
                        >
                            <Plus className="h-4 w-4" />
                            <span>New board</span>
                        </button>
                        
                        <div className="h-6 w-px bg-black/10 mx-1"></div>
                        <NotificationBell />
                        <UserProfileMenu />
                    </div>
                </header>
                )}

                {activeTab === 'boards' ? (
                    <AllBoardsView />
                ) : (
                <div className="p-8 pb-20 max-w-5xl mx-auto w-full space-y-10">
                    {activeTab === 'overview' ? (
                        <>
                            {/* 1. Hero Banner */}
                            <section className="w-full flex items-stretch rounded-2xl overflow-hidden bg-white border border-black/5 shadow-sm">
                        {/* Text Col */}
                        <div className="p-10 flex-1 flex flex-col justify-center gap-5">
                            <div>
                                <span 
                                    className="inline-flex items-center px-2 py-0.5 rounded-[99px] text-[11px] font-medium mb-4"
                                    style={{ backgroundColor: "#EAF3DE", color: "#3B6D11", border: "0.5px solid rgba(59,109,17,0.1)" }}
                                >
                                    ● No sign up required
                                </span>
                                <h1 className="text-[18px] font-medium text-black mb-2">A canvas that thinks with you</h1>
                                <p className="text-[13px] leading-[1.6] text-neutral-500 max-w-[340px]">
                                    Draw, diagram, and collaborate with AI. Generate flowcharts, ERDs, mind maps in seconds. Your boards, local or cloud.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handleCreateBoard}
                                    className="px-4 py-2 bg-black text-white rounded-[8px] text-[13px] font-medium hover:bg-neutral-800 transition-transform hover:-translate-y-[1px]"
                                >
                                    Start drawing
                                </button>
                                <button 
                                    onClick={() => setActiveTab('library')}
                                    className="px-4 py-2 bg-white text-black rounded-[8px] text-[13px] font-medium hover:bg-neutral-50 transition-transform hover:-translate-y-[1px]"
                                    style={{ border: "0.5px solid rgba(0,0,0,0.15)" }}
                                >
                                    View library
                                </button>
                            </div>
                        </div>
                        {/* Graphic Col */}
                        <div className="w-[320px] bg-white/50 border-l border-black/5 flex items-center justify-center p-6 relative overflow-hidden">
                            <svg width="240" height="200" viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute opacity-80 mix-blend-multiply">
                                {/* Dashed lines */}
                                <path d="M70 80 C 100 80, 100 130, 140 130" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                                <path d="M120 60 C 140 60, 150 90, 180 90" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" fill="none" />
                                
                                {/* Purple Card */}
                                <rect x="30" y="50" width="46" height="34" rx="4" fill="#F3E8FF" stroke="#A855F7" strokeWidth="1.5" />
                                <rect x="38" y="58" width="20" height="4" rx="2" fill="#D8B4FE" />
                                <circle cx="42" cy="72" r="4" fill="#D8B4FE" />
                                
                                {/* Green Card */}
                                <rect x="130" y="110" width="56" height="40" rx="4" fill="#DCFCE7" stroke="#22C55E" strokeWidth="1.5" />
                                <rect x="140" y="120" width="16" height="4" rx="2" fill="#86EFAC" />
                                <rect x="140" y="130" width="36" height="4" rx="2" fill="#86EFAC" />
                                
                                {/* Blue Card */}
                                <rect x="90" y="20" width="50" height="40" rx="4" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5" />
                                <circle cx="115" cy="40" r="10" fill="#93C5FD" />
                                
                                {/* Coral Card */}
                                <rect x="170" y="70" width="40" height="40" rx="20" fill="#FFE4E6" stroke="#F43F5E" strokeWidth="1.5" />
                            </svg>
                        </div>
                    </section>

                    {/* 2. Feature Chips Row */}
                    <section className="flex flex-wrap items-center gap-3">
                        <FeatureChip dotColor="#A855F7" label="AI diagram generation" />
                        <FeatureChip dotColor="#22C55E" label="Real-time collaboration" />
                        <FeatureChip dotColor="#3B82F6" label="Multi-board support" />
                        <FeatureChip dotColor="#F97316" label="Custom shape library" />
                        <FeatureChip dotColor="#EAB308" label="Local + cloud storage" />
                    </section>

                    {/* 3. Template Section */}
                    <section>
                        <h2 className="text-[13px] font-semibold text-neutral-500 mb-4 uppercase tracking-wider">Start with a template</h2>
                        <div className="grid grid-cols-5 gap-4">
                            <TemplateCard name="Flowchart" desc="Process paths" color="#F3E8FF" iconColor="#A855F7" onClick={handleCreateBoard} />
                            <TemplateCard name="Mind Map" desc="Brainstorming" color="#DCFCE7" iconColor="#22C55E" onClick={handleCreateBoard} />
                            <TemplateCard name="Comparison" desc="Pros & cons" color="#DBEAFE" iconColor="#3B82F6" onClick={handleCreateBoard} />
                            <TemplateCard name="ERD Diagram" desc="Database schemas" color="#FFE4E6" iconColor="#F43F5E" onClick={handleCreateBoard} />
                            <TemplateCard name="DSA Tree" desc="Data structures" color="#FEF3C7" iconColor="#F59E0B" onClick={handleCreateBoard} />
                        </div>
                    </section>

                    {/* 4. Local Boards Section */}
                    <section>
                        <h2 className="text-[13px] font-semibold text-neutral-500 mb-4 uppercase tracking-wider">Your local boards</h2>
                        <div className="grid grid-cols-3 gap-5">
                            {/* New Board Card */}
                            <button 
                                onClick={handleCreateBoard}
                                className="group flex flex-col items-center justify-center gap-3 h-[180px] rounded-2xl bg-white hover:bg-neutral-50 border-2 border-dashed border-black/10 transition-all hover:-translate-y-1 hover:shadow-sm"
                            >
                                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border border-black/5 shadow-sm group-hover:scale-110 transition-transform">
                                    <Plus className="h-5 w-5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                                </div>
                                <span className="text-[14px] font-medium text-neutral-500 group-hover:text-neutral-900 transition-colors">New board</span>
                            </button>

                            {/* Existing Local Board */}
                            {latestBoards.length > 0 ? (
                                latestBoards.map(board => (
                                    <div key={board.id} className="h-[210px]">
                                        <BoardCard 
                                            board={board} 
                                            onRename={handleRename}
                                            onDelete={handleDelete}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-2xl bg-white border border-black/5 border-dashed flex flex-col items-center justify-center p-6 text-center h-[180px]">
                                    <div className="w-2 h-2 rounded-full bg-orange-500 mb-3 opacity-50"></div>
                                    <p className="text-[13px] text-neutral-500 font-medium">No local boards yet.<br/>Create one to start!</p>
                                </div>
                                )}
                            </div>
                        </section>
                    </>
                    ) : activeTab === 'library' ? (
                        <div className="h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                            <LibraryPanel
                                items={items}
                                onDeleteItem={removeItem}
                                onAddItem={addItem}
                                libraryItems={libraryItems}
                                communityItems={communityItems}
                            />
                        </div>
                    ) : null}
                </div>
                )}
            </main>
        </div>
    );
}

// ── Components ──────────────────────────────────────────────────────────────

function FeatureChip({ dotColor, label }) {
    return (
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/5 shadow-sm text-neutral-700 cursor-default hover:bg-neutral-50 transition-colors">
            <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: dotColor }}></div>
            <span className="text-[13px] font-medium">{label}</span>
        </div>
    );
}

function TemplateCard({ name, desc, color, iconColor, onClick }) {
    return (
        <div 
            onClick={onClick}
            className="rounded-2xl overflow-hidden bg-white cursor-pointer hover:-translate-y-1 transition-all group border border-black/5 hover:border-black/10 hover:shadow-md flex flex-col h-[130px]"
        >
            <div className="h-[76px] w-full flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: color }}>
                {/* Generic template SVG */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90 group-hover:scale-110 transition-transform duration-300 relative z-10">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                </svg>
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-xl opacity-30 mix-blend-multiply mr-[-20px] mt-[-20px]" style={{ backgroundColor: iconColor }}></div>
            </div>
            <div className="px-4 py-2.5 border-t border-black/5 flex-1 flex flex-col justify-center bg-white z-10">
                <span className="text-[13px] font-bold text-neutral-900 leading-tight">{name}</span>
                <span className="text-[11px] font-medium text-neutral-500 mt-0.5">{desc}</span>
            </div>
        </div>
    );
}
