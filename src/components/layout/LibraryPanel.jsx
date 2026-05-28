import { useRef, useState, useMemo } from "react";
import { 
    Trash2, Grid, Box, UploadCloud, Lock, Sparkles, 
    Share2, User as UserIcon, Globe, Search, Layers, CheckCircle2,
    Compass, Heart, AlertCircle, FileJson, ArrowRight
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { convertExcalidrawLibrary } from "@/utils/excalidrawConverter";
import { useAuth } from "@/hooks/useAuth";
import { SignupModal } from "@/components/auth/SignupModal";
import { LibraryAIPrompt } from "./LibraryAIPrompt";
import { LibraryItemPreview } from "./LibraryItemPreview";

import { FEATURED_SHAPES } from "@/lib/constants/featuredShapes";

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
    const [selectedCategory, setSelectedCategory] = useState("featured"); // "featured", "community", "my-library"
    const fileInputRef = useRef(null);

    // AI presets helper
    const [aiPresetPrompt, setAiPresetPrompt] = useState("");

    const handleDragStart = (e, item) => {
        const dragData = JSON.stringify({
            type: 'LIBRARY_ITEM',
            itemId: item.id,
            item: item
        });
        e.dataTransfer.setData('application/infinity-canvas-library', dragData);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleFileUpload = (e) => {
        if (!user) {
            e.preventDefault();
            setIsSignupModalOpen(true);
            return;
        }
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
                let convertedItems = [];
                let type = "Excalidraw";

                convertedItems = convertExcalidrawLibrary(content);

                if (convertedItems.length === 0) {
                    toast.error(`No compatible shapes found in ${type} file.`);
                    return;
                }

                for (const item of convertedItems) {
                    await onAddItem(item.shapes, item.name, 'Excalidraw');
                }

                toast.success(`Imported ${convertedItems.length} items from ${type}!`);
            } catch (err) {
                console.error(`${type} parse failed:`, err);
                toast.error(`Import Failed: ${err.message || "Invalid file format"}`);
            }
        };

        reader.readAsText(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (user) setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (!user) {
            setIsSignupModalOpen(true);
            return;
        }

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.name.endsWith('.json') || file.name.endsWith('.excalidrawlib')) {
                    processFile(file);
                } else {
                    toast.error(`Unsupported file type: ${file.name}`);
                }
            }
        }
    };

    const handleImportClick = () => {
        if (!user) {
            setIsSignupModalOpen(true);
            return;
        }
        fileInputRef.current?.click();
    };

    const activeList = useMemo(() => {
        let list = [];
        if (selectedCategory === "featured") list = FEATURED_SHAPES;
        else if (selectedCategory === "community") list = communityItems;
        else if (selectedCategory === "my-library") list = libraryItems;

        const q = searchQuery.toLowerCase();
        return list.filter(item => !q || item.name.toLowerCase().includes(q));
    }, [selectedCategory, communityItems, libraryItems, searchQuery]);

    const renderGrid = (itemList, isReadOnly = false) => {
        if (!itemList || itemList.length === 0) {
            return (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-white/30 rounded-2xl border border-dashed border-neutral-200">
                    <AlertCircle className="w-8 h-8 text-neutral-400 mb-2" />
                    <p className="text-sm font-semibold text-neutral-700">No shapes found</p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-[200px]">
                        Try searching for something else or import templates.
                    </p>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {itemList.map((item, idx) => (
                    <div
                        key={item.id || idx}
                        className="group relative bg-white/90 backdrop-blur-md rounded-2xl border border-neutral-200 hover:border-indigo-400 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col cursor-grab active:cursor-grabbing overflow-hidden shadow-sm"
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                    >
                        {/* Preview Zone */}
                        <div className="w-full aspect-[4/3] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:10px_10px] relative overflow-hidden flex items-center justify-center p-4 border-b border-neutral-100 group-hover:bg-indigo-50/20 transition-colors">
                            <LibraryItemPreview shapes={item.shapes} />
                            
                            {/* Hover Overlay Help */}
                            <div className="absolute inset-0 bg-neutral-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <span className="px-2.5 py-1 bg-neutral-950 text-white rounded-lg text-[9px] font-bold shadow-md tracking-wider uppercase">
                                    Drag onto Canvas
                                </span>
                            </div>
                        </div>

                        {/* Description / Actions footer */}
                        <div className="p-3 flex items-center justify-between gap-2">
                            <div className="flex flex-col min-w-0">
                                <span className="text-[12px] font-bold text-neutral-800 truncate">
                                    {item.name}
                                </span>
                                <span className="text-[9.5px] text-neutral-400 font-semibold mt-0.5">
                                    {item.shapes.length} elements
                                </span>
                            </div>

                            {/* Options panel */}
                            <div className="flex items-center gap-1 shrink-0">
                                {!isReadOnly && (
                                    <>
                                        {!item.isPublic && onPublishItem && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 bg-neutral-50 text-neutral-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg shadow-sm border border-neutral-200/50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onPublishItem(item.id);
                                                    toast.success("Published to Community!");
                                                }}
                                                title="Publish to Community"
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 bg-neutral-50 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg shadow-sm border border-neutral-200/50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteItem(item.id);
                                            }}
                                            title="Delete from Library"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
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
            <div 
                className="w-full h-full flex flex-col bg-[#FAF9F5] overflow-hidden group/library relative"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Drag Drop Overlay */}
                {isDragging && (
                    <div className="absolute inset-4 z-[100] border-2 border-dashed border-indigo-400 bg-indigo-50/90 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center pointer-events-none transition-all animate-in fade-in zoom-in duration-200">
                        <div className="w-14 h-14 rounded-full bg-white shadow-lg border border-indigo-100 flex items-center justify-center mb-4">
                            <UploadCloud className="w-7 h-7 text-indigo-600 animate-bounce" />
                        </div>
                        <p className="text-md font-bold text-indigo-900">Drop Excalidraw files here</p>
                        <p className="text-[12px] text-indigo-600 mt-1">Accepts JSON or .excalidrawlib files</p>
                    </div>
                )}

                {/* Toolbar / Search Header */}
                <div className="p-5 border-b border-neutral-200/50 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white/20 shrink-0">
                    {/* Title section */}
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                            <Grid className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-[14px] font-bold text-neutral-900 leading-none">Template Library</h2>
                            <p className="text-[10px] text-neutral-400 font-semibold mt-1">Browse, generate, and import shape structures</p>
                        </div>
                    </div>

                    {/* Interactive Tab Segments */}
                    <div className="flex bg-neutral-200/50 backdrop-blur-sm p-1 rounded-xl border border-neutral-200/30 self-center">
                        <button
                            onClick={() => setSelectedCategory("featured")}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                selectedCategory === "featured"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-neutral-500 hover:text-neutral-950"
                            }`}
                        >
                            Curated Blueprints
                        </button>
                        <button
                            onClick={() => setSelectedCategory("community")}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                selectedCategory === "community"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-neutral-500 hover:text-neutral-950"
                            }`}
                        >
                            Community Assets
                        </button>
                        <button
                            onClick={() => setSelectedCategory("my-library")}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                selectedCategory === "my-library"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-neutral-500 hover:text-neutral-950"
                            }`}
                        >
                            {user ? "Custom Library" : "🔒 Custom Library"}
                        </button>
                    </div>

                    {/* Actions and Search */}
                    <div className="flex items-center gap-3 justify-between lg:justify-end">
                        <div className="relative w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                            <input 
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 text-[11px] bg-white border border-neutral-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-xl outline-none transition-all shadow-inner"
                            />
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".json,.excalidrawlib"
                            onChange={handleFileUpload}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-[30px] px-3 text-[11px] font-bold flex items-center gap-1.5 bg-white border-neutral-200 hover:bg-neutral-50 rounded-xl shadow-sm text-neutral-700"
                            onClick={handleImportClick}
                        >
                            <UploadCloud className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Import Lib</span>
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                        <div className="p-6 space-y-6">
                            
                            {/* AI Magic Generator Playground inside Dashboard */}
                            <div className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 rounded-3xl border border-indigo-100 p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_8px_30px_rgba(99,102,241,0.02)]">
                                <div className="space-y-2 max-w-sm shrink-0">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider">
                                        <Sparkles className="w-3 h-3 animate-spin" /> Next-gen Design
                                    </span>
                                    <h3 className="text-lg font-bold text-neutral-900 tracking-tight">AI Diagram Generator</h3>
                                    <p className="text-[12px] text-neutral-500 leading-relaxed">
                                        Type a text prompt (e.g. *"Create a binary tree with 12 nodes"* or *"Make a login flowchart"*) and watch the structure generate inside your templates automatically.
                                    </p>

                                    {/* Preset Prompt suggestion chips */}
                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                        <button 
                                            onClick={() => setAiPresetPrompt("Create database table schema for auth")}
                                            className="px-2 py-1 bg-white border border-neutral-200 hover:border-indigo-400 rounded-lg text-[10px] text-neutral-600 font-semibold transition-all"
                                        >
                                            + Database Schema
                                        </button>
                                        <button 
                                            onClick={() => setAiPresetPrompt("Make a decision flowchart process")}
                                            className="px-2 py-1 bg-white border border-neutral-200 hover:border-indigo-400 rounded-lg text-[10px] text-neutral-600 font-semibold transition-all"
                                        >
                                            + Flowchart
                                        </button>
                                        <button 
                                            onClick={() => setAiPresetPrompt("Draw a binary search tree model")}
                                            className="px-2 py-1 bg-white border border-neutral-200 hover:border-indigo-400 rounded-lg text-[10px] text-neutral-600 font-semibold transition-all"
                                        >
                                            + DSA Tree
                                        </button>
                                    </div>
                                </div>

                                {/* Generator input area */}
                                <div className="flex-1 w-full relative z-10 max-w-md">
                                    <LibraryAIPrompt 
                                        onGenerateSuccess={(shapes, name) => onAddItem?.(shapes, name)} 
                                        presetPrompt={aiPresetPrompt}
                                        onResetPreset={() => setAiPresetPrompt("")}
                                    />
                                </div>
                            </div>

                            {/* Shapes Explorer */}
                            <div>
                                <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-3 px-1 flex items-center justify-between">
                                    <span>{selectedCategory === "featured" ? "Curated Blueprints" : selectedCategory === "community" ? "Community Shares" : "Custom Shapes"}</span>
                                    <span className="bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full text-[10px] font-semibold">{activeList.length}</span>
                                </h3>

                                {selectedCategory === "my-library" && !user ? (
                                    /* Lock Panel */
                                    <div className="border border-neutral-200/80 bg-white/40 backdrop-blur-md rounded-3xl p-10 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner">
                                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808006_1px,transparent_1px),linear-gradient(to_bottom,#80808006_1px,transparent_1px)] bg-[size:16px_16px] opacity-75"></div>
                                        {/* Glow behind lock */}
                                        <div className="absolute w-24 h-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none -translate-y-4" />
                                        <div className="w-12 h-12 rounded-full bg-white shadow-md border border-neutral-200 flex items-center justify-center mb-4 relative z-10">
                                            <Lock className="w-5 h-5 text-indigo-500 animate-pulse" />
                                        </div>
                                        <h4 className="text-md font-bold text-neutral-800 relative z-10">Create Custom Library Collections</h4>
                                        <p className="text-[12px] text-neutral-500 mt-2.5 mb-6 max-w-[280px] leading-relaxed relative z-10">
                                            Keep templates, components, and design symbols close at hand. Sign up free to save vectors to your workspace.
                                        </p>
                                        <Button 
                                            onClick={() => setIsSignupModalOpen(true)}
                                            size="sm" 
                                            className="h-9 px-6 text-xs bg-indigo-600 hover:bg-indigo-700 text-white relative z-10 shadow-md font-bold rounded-xl"
                                        >
                                            Sign up free
                                        </Button>
                                    </div>
                                ) : (
                                    /* Grid renderer */
                                    renderGrid(activeList, selectedCategory !== "my-library")
                                )}
                            </div>

                        </div>
                    </ScrollArea>

                    <SignupModal isOpen={isSignupModalOpen} onOpenChange={setIsSignupModalOpen} />
            </div>
        );
    }

    // ── WORKSPACE COMPACT VIEW MODE (Default sidebar drawer on canvas) ────────
    return (
        <div 
            className="w-full h-full flex flex-col bg-transparent relative group/library"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag Overlay */}
            {isDragging && (
                <div className="absolute inset-2 z-[100] border-2 border-dashed border-indigo-400 bg-indigo-50/90 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center pointer-events-none transition-all animate-in fade-in zoom-in duration-200">
                    <div className="w-12 h-12 rounded-full bg-white shadow-md border border-indigo-100 flex items-center justify-center mb-4">
                        <UploadCloud className="w-6 h-6 text-indigo-600 animate-bounce" />
                    </div>
                    <p className="text-sm font-semibold text-indigo-900">Drop files to import</p>
                    <p className="text-[11px] text-indigo-600 mt-1">JSON or .excalidrawlib</p>
                </div>
            )}

            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                    <Grid className="w-4 h-4" />
                    Library
                </h2>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".json,.excalidrawlib"
                    onChange={handleFileUpload}
                />
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900"
                    onClick={handleImportClick}
                    title="Import Excalidraw Library"
                >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Import Lib
                </Button>
            </div>

            {/* AI Generation Form */}
            <LibraryAIPrompt onGenerateSuccess={(shapes, name) => onAddItem?.(shapes, name)} />

            <ScrollArea className="flex-1">
                <div className="p-4 flex flex-col gap-6">
                    {/* Featured Shapes Section */}
                    <div>
                        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
                            Featured Shapes
                            <span className="bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-full text-[9px]">{FEATURED_SHAPES.length}</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {FEATURED_SHAPES.map((item, idx) => (
                                <div
                                    key={item.id || idx}
                                    className="group relative aspect-square bg-white rounded-lg border border-neutral-200 hover:border-blue-300 hover:shadow-sm transition-all flex flex-col items-center justify-center cursor-grab active:cursor-grabbing p-2"
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, item)}
                                >
                                    <div className="w-full aspect-square mb-1 relative overflow-hidden rounded">
                                        <LibraryItemPreview shapes={item.shapes} />
                                    </div>
                                    <span className="text-[10px] text-neutral-600 font-medium truncate w-full text-center px-1">
                                        {item.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* My Library Section */}
                    <div className="relative">
                        <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
                            My Library
                            {user && <span className="bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-full text-[9px]">{libraryItems?.length || 0}</span>}
                        </h3>
                        
                        {!user ? (
                            <div className="border border-neutral-200/60 bg-neutral-50/50 rounded-xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:12px_12px] opacity-40"></div>
                                <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-neutral-200 flex items-center justify-center mb-3 relative z-10">
                                    <Lock className="w-5 h-5 text-neutral-400" />
                                </div>
                                <h4 className="text-sm font-semibold text-neutral-700 relative z-10">Create your own shapes</h4>
                                <p className="text-[11px] text-neutral-500 mt-1 mb-4 max-w-[180px] relative z-10">
                                    Sign up free to build and save custom shapes to your library
                                </p>
                                <Button 
                                    onClick={() => setIsSignupModalOpen(true)}
                                    size="sm" 
                                    className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white relative z-10 shadow-sm"
                                >
                                    Sign up free
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {libraryItems.map((item, idx) => (
                                    <div
                                        key={item.id || idx}
                                        className="group relative aspect-square bg-white rounded-lg border border-neutral-200 hover:border-indigo-300 hover:shadow-sm transition-all flex flex-col items-center justify-center cursor-grab active:cursor-grabbing p-2"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, item)}
                                    >
                                        <div className="w-full aspect-square mb-1 relative overflow-hidden rounded">
                                            <LibraryItemPreview shapes={item.shapes} />
                                        </div>
                                        <span className="text-[10px] text-neutral-600 font-medium truncate w-full text-center px-1">
                                            {item.name}
                                        </span>
                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 bg-white text-neutral-400 hover:bg-rose-50 hover:text-rose-600 shadow-sm border border-neutral-200/50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteItem(item.id);
                                                }}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>

            <SignupModal 
                isOpen={isSignupModalOpen} 
                onOpenChange={setIsSignupModalOpen} 
            />
        </div>
    );
}
