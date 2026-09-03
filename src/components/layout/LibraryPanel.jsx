import { useRef, useState, useMemo } from "react";
import { 
    Trash2, Grid, UploadCloud, Lock, 
    Share2, User as UserIcon, Search, AlertCircle,
    BookOpen, Star, Globe
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { convertExcalidrawLibrary } from "@/utils/excalidrawConverter";
import { useAuth } from "@/hooks/useAuth";
import { SignupModal } from "@/components/auth/SignupModal";
import { LibraryAIPrompt } from "./LibraryAIPrompt";
import { LibraryItemPreview } from "./LibraryItemPreview";

import { QUICK_ACCESS_SHAPES } from "@/lib/constants/featuredShapes";

export function LibraryPanel({ 
    items, 
    onDeleteItem, 
    onAddItem, 
    libraryItems = [], 
    communityItems = [], 
    onPublishItem,
    isDashboardMode = false
}) {
    const { user } = useAuth();
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("featured");
    const [aiPresetPrompt, setAiPresetPrompt] = useState("");
    const fileInputRef = useRef(null);

    const handleDragStart = (e, item) => {
        const dragData = JSON.stringify({ type: 'LIBRARY_ITEM', itemId: item.id, item });
        e.dataTransfer.setData('application/infinity-canvas-library', dragData);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleFileUpload = (e) => {
        if (!user) { e.preventDefault(); setIsSignupModalOpen(true); return; }
        const file = e.target.files?.[0];
        if (!file) return;
        processFile(file);
        e.target.value = null;
    };

    const processFile = (file) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target.result;
                const convertedItems = convertExcalidrawLibrary(content);
                if (convertedItems.length === 0) { toast.error("No compatible shapes found."); return; }
                for (const item of convertedItems) {
                    await onAddItem(item.shapes, item.name, 'Excalidraw');
                }
                toast.success(`Imported ${convertedItems.length} items!`);
            } catch (err) {
                toast.error(`Import Failed: ${err.message || "Invalid file format"}`);
            }
        };
        reader.readAsText(file);
    };

    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); if (user) setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (!user) { setIsSignupModalOpen(true); return; }
        const files = e.dataTransfer.files;
        if (files?.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.name.endsWith('.json') || file.name.endsWith('.excalidrawlib')) processFile(file);
                else toast.error(`Unsupported: ${file.name}`);
            }
        }
    };

    const handleImportClick = () => {
        if (!user) { setIsSignupModalOpen(true); return; }
        fileInputRef.current?.click();
    };

    const activeList = useMemo(() => {
        let list = [];
        if (selectedCategory === "featured") list = QUICK_ACCESS_SHAPES;
        else if (selectedCategory === "community") list = communityItems;
        else if (selectedCategory === "my-library") list = libraryItems;
        const q = searchQuery.toLowerCase();
        return list.filter(item => !q || item.name.toLowerCase().includes(q));
    }, [selectedCategory, communityItems, libraryItems, searchQuery]);

    // Compact grid renderer for canvas sidebar
    const renderCompactGrid = (itemList, isReadOnly = false) => {
        if (!itemList || itemList.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <AlertCircle className="w-6 h-6 text-neutral-300 mb-2" />
                    <p className="text-xs font-medium text-neutral-400">No shapes found</p>
                    {searchQuery && <p className="text-[10px] text-neutral-300 mt-1">Try a different search</p>}
                </div>
            );
        }
        return (
            <div className="grid grid-cols-2 gap-2">
                {itemList.map((item, idx) => (
                    <div
                        key={item.id || idx}
                        className="group relative bg-white rounded-xl border border-neutral-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col cursor-grab active:cursor-grabbing overflow-hidden"
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                    >
                        <div className="w-full aspect-square bg-neutral-50 relative overflow-hidden flex items-center justify-center p-2">
                            <LibraryItemPreview shapes={item.shapes} />
                            <div className="absolute inset-0 bg-indigo-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-[9px] font-bold tracking-wider uppercase">Drag to Canvas</span>
                            </div>
                        </div>
                        <div className="px-2 py-1.5 flex items-center justify-between gap-1 border-t border-neutral-100">
                            <span className="text-[10px] font-semibold text-neutral-700 truncate">{item.name}</span>
                            {!isReadOnly && (
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {!item.isPublic && onPublishItem && (
                                        <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-indigo-50 text-neutral-300 hover:text-indigo-500 transition-colors" onClick={(e) => { e.stopPropagation(); onPublishItem(item.id); toast.success("Published!"); }} title="Publish">
                                            <Share2 className="w-2.5 h-2.5" />
                                        </button>
                                    )}
                                    <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-50 text-neutral-300 hover:text-red-400 transition-colors" onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }} title="Delete">
                                        <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                </div>
                            )}
                            {isReadOnly && item.userName && (
                                <div className="flex items-center gap-0.5 text-[8px] text-neutral-300">
                                    <UserIcon className="w-2 h-2" />
                                    <span className="truncate max-w-[35px]">{item.userName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Full-size grid renderer for dashboard
    const renderFullGrid = (itemList, isReadOnly = false) => {
        if (!itemList || itemList.length === 0) {
            return (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-white/30 rounded-2xl border border-dashed border-neutral-200">
                    <AlertCircle className="w-8 h-8 text-neutral-400 mb-2" />
                    <p className="text-sm font-semibold text-neutral-700">No shapes found</p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-[200px]">Try searching for something else or import templates.</p>
                </div>
            );
        }
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {itemList.map((item, idx) => (
                    <div key={item.id || idx} className="group relative bg-white/90 backdrop-blur-md rounded-2xl border border-neutral-200 hover:border-indigo-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col cursor-grab active:cursor-grabbing overflow-hidden shadow-sm" draggable onDragStart={(e) => handleDragStart(e, item)}>
                        <div className="w-full aspect-[4/3] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:10px_10px] relative overflow-hidden flex items-center justify-center p-4 border-b border-neutral-100 group-hover:bg-indigo-50/20 transition-colors">
                            <LibraryItemPreview shapes={item.shapes} />
                            <div className="absolute inset-0 bg-neutral-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <span className="px-2.5 py-1 bg-neutral-950 text-white rounded-lg text-[9px] font-bold shadow-md tracking-wider uppercase">Drag onto Canvas</span>
                            </div>
                        </div>
                        <div className="p-3 flex items-center justify-between gap-2">
                            <div className="flex flex-col min-w-0">
                                <span className="text-[12px] font-bold text-neutral-800 truncate">{item.name}</span>
                                <span className="text-[9.5px] text-neutral-400 font-semibold mt-0.5">{item.shapes.length} elements</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {!isReadOnly && (
                                    <>
                                        {!item.isPublic && onPublishItem && (
                                            <Button variant="ghost" size="icon" className="h-7 w-7 bg-neutral-50 text-neutral-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg shadow-sm border border-neutral-200/50" onClick={(e) => { e.stopPropagation(); onPublishItem(item.id); toast.success("Published to Community!"); }} title="Publish to Community"><Share2 className="w-3.5 h-3.5" /></Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-7 w-7 bg-neutral-50 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg shadow-sm border border-neutral-200/50" onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }} title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                                    </>
                                )}
                                {isReadOnly && item.userName && (
                                    <div className="flex items-center gap-1 bg-neutral-50 px-1.5 py-0.5 rounded text-[8.5px] text-neutral-400 font-bold border border-neutral-200/30">
                                        <UserIcon className="w-2.5 h-2.5 text-neutral-300" />
                                        <span className="truncate max-w-[50px]">{item.userName}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // ── DASHBOARD VIEW MODE ──────────────────────────────────────────────────
    if (isDashboardMode) {
        return (
            <div className="w-full h-full flex flex-col bg-[#FAF9F5] overflow-hidden relative" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                {isDragging && (
                    <div className="absolute inset-4 z-[100] border-2 border-dashed border-indigo-400 bg-indigo-50/90 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-200">
                        <UploadCloud className="w-7 h-7 text-indigo-600 animate-bounce mb-3" />
                        <p className="text-md font-bold text-indigo-900">Drop Excalidraw files here</p>
                        <p className="text-[12px] text-indigo-600 mt-1">Accepts JSON or .excalidrawlib</p>
                    </div>
                )}
                <div className="p-5 border-b border-neutral-200/50 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white/20 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center text-white"><Grid className="w-4 h-4" /></div>
                        <div>
                            <h2 className="text-[14px] font-bold text-neutral-900 leading-none">Template Library</h2>
                            <p className="text-[10px] text-neutral-400 font-semibold mt-1">Browse and import shape structures</p>
                        </div>
                    </div>
                    <div className="flex bg-neutral-200/50 backdrop-blur-sm p-1 rounded-xl border border-neutral-200/30 self-center">
                        {[
                            { id: "featured", label: "Curated Blueprints" },
                            { id: "community", label: "Community Assets" },
                            { id: "my-library", label: user ? "Custom Library" : "🔒 Custom Library" },
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setSelectedCategory(tab.id)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${selectedCategory === tab.id ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500 hover:text-neutral-950"}`}>{tab.label}</button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 justify-between lg:justify-end">
                        <div className="relative w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-[11px] bg-white border border-neutral-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none transition-all" />
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json,.excalidrawlib" onChange={handleFileUpload} />
                        <Button variant="outline" size="sm" className="h-[30px] px-3 text-[11px] font-bold flex items-center gap-1.5 bg-white border-neutral-200 hover:bg-neutral-50 rounded-xl shadow-sm text-neutral-700" onClick={handleImportClick}>
                            <UploadCloud className="w-3.5 h-3.5 text-neutral-400" /><span>Import Lib</span>
                        </Button>
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-6">
                        <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                            <span>{selectedCategory === "featured" ? "Curated Blueprints" : selectedCategory === "community" ? "Community Shares" : "Custom Shapes"}</span>
                            <span className="bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full text-[10px] font-semibold">{activeList.length}</span>
                        </h3>
                        {selectedCategory === "my-library" && !user ? (
                            <div className="border border-neutral-200/80 bg-white/40 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 rounded-full bg-white shadow-md border border-neutral-200 flex items-center justify-center mb-4">
                                    <Lock className="w-5 h-5 text-indigo-500 animate-pulse" />
                                </div>
                                <h4 className="text-md font-bold text-neutral-800">Create Custom Library Collections</h4>
                                <p className="text-[12px] text-neutral-500 mt-2.5 mb-6 max-w-[280px] leading-relaxed">Keep templates and design symbols close at hand. Sign up free.</p>
                                <Button onClick={() => setIsSignupModalOpen(true)} size="sm" className="h-9 px-6 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-bold rounded-xl">Sign up free</Button>
                            </div>
                        ) : renderFullGrid(activeList, selectedCategory !== "my-library")}
                    </div>
                </ScrollArea>
                <SignupModal isOpen={isSignupModalOpen} onOpenChange={setIsSignupModalOpen} />
            </div>
        );
    }

    // ── CANVAS COMPACT SIDEBAR MODE ──────────────────────────────────────────
    return (
        <div className="w-full h-full flex flex-col bg-transparent relative" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            {isDragging && (
                <div className="absolute inset-2 z-[100] border-2 border-dashed border-indigo-400 bg-indigo-50/90 rounded-2xl flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-200">
                    <UploadCloud className="w-6 h-6 text-indigo-600 animate-bounce mb-2" />
                    <p className="text-xs font-semibold text-indigo-900">Drop to import</p>
                </div>
            )}

            {/* Header */}
            <div className="px-3 pt-3 pb-2 border-b border-neutral-100 shrink-0">
                <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-semibold text-neutral-800">Library</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json,.excalidrawlib" onChange={handleFileUpload} />
                        <button onClick={handleImportClick} className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Import Excalidraw Library">
                            <UploadCloud className="w-3 h-3" />
                            Import
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-2.5">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" />
                    <input type="text" placeholder="Search shapes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-7 pr-3 py-1.5 text-[11px] bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:border-indigo-400 focus:bg-white transition-all placeholder:text-neutral-300" />
                </div>

                {/* Category tabs */}
                <div className="flex gap-0.5 bg-neutral-100 p-0.5 rounded-lg">
                    {[
                        { id: "featured", icon: Star, label: "Featured" },
                        { id: "my-library", icon: BookOpen, label: "Mine" },
                        { id: "community", icon: Globe, label: "Community" },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedCategory(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-md text-[10px] font-semibold transition-all ${
                                selectedCategory === tab.id ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-400 hover:text-neutral-600"
                            }`}
                        >
                            <tab.icon className="w-2.5 h-2.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                            {selectedCategory === "featured" ? "Curated" : selectedCategory === "my-library" ? "Saved" : "Community"}
                        </span>
                        <span className="text-[9px] text-neutral-300 font-semibold">{activeList.length} items</span>
                    </div>

                    {selectedCategory === "my-library" && !user ? (
                        <div className="flex flex-col items-center text-center py-8 px-3">
                            <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
                                <Lock className="w-4 h-4 text-neutral-400" />
                            </div>
                            <p className="text-xs font-semibold text-neutral-600 mb-1">Sign in to save shapes</p>
                            <p className="text-[10px] text-neutral-400 mb-3">Build your personal library by selecting shapes on the canvas</p>
                            <button onClick={() => setIsSignupModalOpen(true)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold rounded-lg transition-colors">
                                Sign up free
                            </button>
                        </div>
                    ) : (
                        renderCompactGrid(activeList, selectedCategory !== "my-library")
                    )}
                </div>
            </ScrollArea>

            <SignupModal isOpen={isSignupModalOpen} onOpenChange={setIsSignupModalOpen} />
        </div>
    );
}
