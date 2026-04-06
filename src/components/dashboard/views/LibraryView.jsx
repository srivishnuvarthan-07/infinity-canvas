import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLibraryStore } from '@/hooks/useLibraryStore';
import { useBoardStore } from '@/hooks/useBoardStore';
import { useNavigate } from 'react-router-dom';
import { UserProfileMenu } from '../UserProfileMenu';
import { SignupModal } from '@/components/auth/SignupModal';
import { LibraryItemPreview } from '@/components/layout/LibraryItemPreview';
import { getAIService } from '@/services/ai.service';
import { generateDiagramShapes } from '@/engine/ai/diagram.generator';
import { validateGraph } from '@/engine/ai/graph.schema';
import { toast } from 'sonner';
import { convertExcalidrawLibrary } from "@/utils/excalidrawConverter";
// Removed obsolete svgConverter
import { 
    Search, 
    Plus, 
    Sparkles, 
    Lock,
    Layers,
    CirclePlus,
    MoreVertical,
    Trash2,
    UploadCloud
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FEATURED_SHAPES = [
    {
        id: 'feat-1',
        name: 'Browser window',
        sub: 'UI component',
        bg: '#E6F1FB',
        shapes: [
            { id: 'b-1', type: 'rectangle', position: { x: 0, y: 0 }, size: { width: 40, height: 30 }, style: { fill: '#85B7EB', stroke: 'none' } },
            { id: 'b-2', type: 'rectangle', position: { x: 0, y: -11 }, size: { width: 40, height: 8 }, style: { fill: '#185FA5', stroke: 'none' } },
            { id: 'b-3', type: 'ellipse', position: { x: -14, y: -11 }, size: { width: 3, height: 3 }, style: { fill: '#85B7EB', stroke: 'none' } },
            { id: 'b-4', type: 'ellipse', position: { x: -10, y: -11 }, size: { width: 3, height: 3 }, style: { fill: '#85B7EB', stroke: 'none' } },
            { id: 'b-5', type: 'rectangle', position: { x: 0, y: 4 }, size: { width: 32, height: 14 }, style: { fill: '#378ADD', stroke: 'none' } }
        ]
    },
    {
        id: 'feat-2',
        name: 'Database',
        sub: 'Infrastructure',
        bg: '#EAF3DE',
        shapes: [
            { id: 'db-1', type: 'cylinder', position: { x: 0, y: 0 }, size: { width: 24, height: 32 }, style: { fill: '#97C459', stroke: '#3B6D11', strokeWidth: 2 } }
        ]
    },
    {
        id: 'feat-3',
        name: 'Document',
        sub: 'General',
        bg: '#FAEEDA',
        shapes: [
            { id: 'doc-1', type: 'document', position: { x: 0, y: 0 }, size: { width: 28, height: 34 }, style: { fill: '#EF9F27', stroke: '#854F0B', strokeWidth: 2 } }
        ]
    },
    {
        id: 'feat-4',
        name: 'Network node',
        sub: 'Diagram',
        bg: '#EEEDFE',
        shapes: [
            { id: 'n-1', type: 'ellipse', position: { x: 0, y: 0 }, size: { width: 18, height: 18 }, style: { fill: '#7F77DD', stroke: '#534AB7', strokeWidth: 2 } },
            { id: 'n-2', type: 'line', position: { x: 0, y: -12 }, points: [{x:0, y:0}, {x:0, y:-5}], style: { stroke: '#534AB7', strokeWidth: 2 } },
            { id: 'n-3', type: 'line', position: { x: 0, y: 12 }, points: [{x:0, y:0}, {x:0, y:5}], style: { stroke: '#534AB7', strokeWidth: 2 } },
            { id: 'n-4', type: 'line', position: { x: 12, y: 0 }, points: [{x:0, y:0}, {x:5, y:0}], style: { stroke: '#534AB7', strokeWidth: 2 } },
            { id: 'n-5', type: 'line', position: { x: -12, y: 0 }, points: [{x:0, y:0}, {x:-5, y:0}], style: { stroke: '#534AB7', strokeWidth: 2 } }
        ]
    },
    {
        id: 'feat-5',
        name: 'File card',
        sub: 'General',
        bg: '#FAECE7',
        shapes: [
            { id: 'fc-1', type: 'rectangle', position: { x: 0, y: 0 }, size: { width: 26, height: 32 }, style: { fill: '#F0997B', stroke: '#993C1D', strokeWidth: 2 } },
            { id: 'fc-2', type: 'rectangle', position: { x: 0, y: -6 }, size: { width: 16, height: 4 }, style: { fill: '#993C1D', stroke: 'none' } },
            { id: 'fc-3', type: 'rectangle', position: { x: -2, y: 2 }, size: { width: 12, height: 2 }, style: { fill: '#993C1D', stroke: 'none' } },
            { id: 'fc-4', type: 'rectangle', position: { x: -3, y: 6 }, size: { width: 10, height: 2 }, style: { fill: '#993C1D', stroke: 'none' } }
        ]
    },
    {
        id: 'feat-6',
        name: 'Warning',
        sub: 'Indicator',
        bg: '#F1EFE8',
        shapes: [
            { id: 'w-1', type: 'path', position: { x: 0, y: 0 }, data: 'M 0 -14 L 16 14 L -16 14 Z', style: { fill: 'none', stroke: '#888780', strokeWidth: 3 } },
            { id: 'w-2', type: 'rectangle', position: { x: 0, y: 1 }, size: { width: 3, height: 10 }, style: { fill: '#5F5E5A', stroke: 'none' } },
            { id: 'w-3', type: 'ellipse', position: { x: 0, y: 9 }, size: { width: 3, height: 3 }, style: { fill: '#5F5E5A', stroke: 'none' } }
        ]
    }
];

const COLORS = ['#EEEDFE', '#E1F5EE', '#FAEEDA', '#E6F1FB', '#FAECE7']; // Purple, Green, Amber, Blue, Coral

export default function LibraryView() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { createBoard } = useBoardStore();
    const { libraryItems, addItem, publishToCommunity, removeItem } = useLibraryStore();
    
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [aiResult, setAiResult] = useState(null);

    const fileInputRef = useRef(null);

    const handleImportClick = () => {
        if (!user) {
            setIsSignupModalOpen(true);
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileUpload = (e) => {
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
                    await addItem(item.shapes, item.name, 'Excalidraw');
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

    const handleCreateBoard = async () => {
        try {
            const id = await createBoard(null, true);
            navigate(`/board/${id}`);
        } catch (err) {
            toast.error('Failed to create board');
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        if (!user) {
            setIsSignupModalOpen(true);
            return;
        }

        const apiKey = import.meta.env.VITE_GROQ_API_KEY;
        if (!apiKey) {
            toast.error('API Key missing');
            return;
        }

        setIsGenerating(true);
        setAiResult(null);
        try {
            const aiService = getAIService(apiKey);
            const intent = await aiService.generateGraphJSON(prompt);

            if (intent.intent_type === 'diagram') {
                const isExplanation = intent.graph?.diagramMode === 'explanation';
                const shouldValidate = !isExplanation;
                const isValid = !shouldValidate || validateGraph(intent.graph).success;
                if (isValid) {
                    const newShapes = generateDiagramShapes(intent);
                    if (newShapes && newShapes.length > 0) {
                        setAiResult({ shapes: newShapes, name: prompt });
                    }
                }
            } else {
                toast.info('Please provide a diagram description.');
            }
        } catch (error) {
            toast.error('Failed to generate diagram');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveAIResult = async () => {
        if (!aiResult) return;
        await addItem(aiResult.shapes, aiResult.name || 'AI Shape', 'AI');
        toast.success("Saved to Library!");
        setAiResult(null);
        setPrompt('');
    };

    const chips = [
        { dot: '#7F77DD', label: 'Server rack' },
        { dot: '#1D9E75', label: 'Cloud storage' },
        { dot: '#378ADD', label: 'Database cylinder' },
        { dot: '#D85A30', label: 'API gateway' },
        { dot: '#BA7517', label: 'Load balancer' },
    ];

    return (
        <div 
            className="flex flex-col h-full overflow-hidden bg-[#FAFAFA] relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag Overlay */}
            {isDragging && (
                <div className="absolute inset-4 z-[100] border-2 border-dashed border-[#7F77DD] bg-white/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center pointer-events-none transition-all animate-in fade-in zoom-in duration-200">
                    <div className="w-16 h-16 rounded-full bg-white shadow-xl border border-neutral-100 flex items-center justify-center mb-4">
                        <UploadCloud className="w-8 h-8 text-[#7F77DD] animate-bounce" />
                    </div>
                    <p className="text-lg font-semibold text-neutral-900">Drop shapes here</p>
                    <p className="text-sm text-neutral-500 mt-1">JSON or Excalidraw library</p>
                </div>
            )}

            {/* ── TOPBAR ──────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-[10px] px-[20px] py-[12px] bg-[#FAFAFA] shrink-0 sticky top-0 z-10 w-full">
                <div className="flex flex-1 max-w-[220px] relative">
                    <Search className="absolute left-[14px] top-1/2 -translate-y-1/2 h-[13px] w-[13px] text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search workspace..."
                        className="w-full bg-white border border-black/5 rounded-[99px] py-[8px] pl-[34px] pr-[14px] text-[12px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-black/10 transition-colors shadow-sm"
                    />
                </div>
                <div className="ml-auto flex items-center gap-[12px]">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".json,.excalidrawlib"
                        onChange={handleFileUpload}
                    />
                    <button 
                        onClick={handleImportClick}
                        className="flex items-center gap-[6px] bg-white text-black border border-black/10 rounded-[99px] px-[14px] py-[8px] text-[12px] font-medium hover:bg-neutral-50 transition-colors shadow-sm"
                    >
                        <UploadCloud className="h-[14px] w-[14px] text-neutral-500" />
                        Import Lib
                    </button>
                    <button 
                        onClick={handleCreateBoard}
                        className="flex items-center gap-[6px] bg-black text-white rounded-[99px] px-[14px] py-[8px] text-[12px] font-medium hover:bg-neutral-800 transition-colors shadow-sm hidden sm:flex"
                    >
                        <Plus className="h-[14px] w-[14px]" />
                        New board
                    </button>
                    <UserProfileMenu />
                </div>
            </div>

            {/* ── CONTENT AREA ────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto p-[20px] px-[24px]">
                <div className="max-w-[1200px] mx-auto flex flex-col gap-[24px]">
                    
                    {/* SECTION 1 — AI generation bar */}
                    <div className="bg-white border-[0.5px] border-black/5 rounded-[12px] p-[16px_20px] shadow-sm relative overflow-hidden">
                        {!user && (
                            <div 
                                className="absolute inset-0 z-10 cursor-pointer" 
                                onClick={() => setIsSignupModalOpen(true)}
                                title="Sign up free to use AI generation"
                            />
                        )}
                        <div className="flex items-center gap-[8px] mb-[12px]">
                            <Sparkles className="w-[14px] h-[14px]" style={{ stroke: '#534AB7' }} />
                            <span className="text-[13px] font-[500] text-black">Generate a shape with AI</span>
                            <div className="bg-[#EEEDFE] text-[#534AB7] border-[0.5px] border-[#CECBF6] text-[10px] font-[500] rounded-[99px] px-[8px] py-[2px]">
                                AI-powered
                            </div>
                        </div>

                        <form onSubmit={handleGenerate} className="flex gap-[8px]">
                            <input
                                type="text"
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                disabled={isGenerating || !user}
                                placeholder="Describe a shape… e.g. server rack, cloud storage icon, database cylinder"
                                className="flex-1 text-[12px] p-[9px_14px] border-[0.5px] border-black/5 rounded-[99px] bg-[#FAFAFA] focus:outline-none focus:border-[#7F77DD] focus:bg-white transition-colors placeholder:text-neutral-400 disabled:opacity-60"
                            />
                            <button
                                type="submit"
                                disabled={isGenerating || !user || !prompt.trim()}
                                className="bg-[#7F77DD] text-white border-none rounded-[99px] px-[18px] py-[9px] text-[12px] font-[500] hover:bg-[#534AB7] transition-colors disabled:opacity-50 disabled:hover:bg-[#7F77DD]"
                            >
                                {isGenerating ? "Generating..." : "Generate →"}
                            </button>
                        </form>

                        <div className="flex flex-row gap-[8px] mt-[12px] flex-wrap relative z-0">
                            {chips.map((chip, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setPrompt(chip.label)}
                                    className="flex items-center gap-[5px] px-[10px] py-[4px] rounded-[99px] border-[0.5px] border-black/5 bg-[#FAFAFA] text-[11px] text-neutral-500 cursor-pointer whitespace-nowrap transition-all duration-150 hover:border-black/15 hover:text-black"
                                >
                                    <div className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: chip.dot }}></div>
                                    {chip.label}
                                </div>
                            ))}
                        </div>

                        {/* AI Result Card */}
                        {aiResult && (
                            <div className="mt-[16px] bg-white border-[0.5px] border-black/5 rounded-[8px] p-[12px] flex items-center gap-[16px] shadow-sm relative z-20">
                                <div className="w-[60px] h-[60px] bg-[#FAFAFA] rounded-[6px] relative overflow-hidden flex items-center justify-center border border-black/5 shrink-0">
                                    <svg className="absolute inset-0 h-full w-full opacity-[0.03] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                                        <defs><pattern id="dotGrid" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" fill="#000" /></pattern></defs>
                                        <rect width="100%" height="100%" fill="url(#dotGrid)" />
                                    </svg>
                                    <div className="absolute inset-[5%] pointer-events-none">
                                        <LibraryItemPreview shapes={aiResult.shapes} />
                                    </div>
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="text-[12px] font-medium text-black">{aiResult.name}</span>
                                    <span className="text-[10px] text-neutral-500 mt-[2px] flex items-center gap-[4px]">
                                        <Sparkles className="w-[10px] h-[10px] text-indigo-400" />
                                        Generated by AI
                                    </span>
                                </div>
                                <div className="flex gap-[8px]">
                                    <button 
                                        onClick={() => setAiResult(null)}
                                        className="px-[12px] py-[6px] rounded-[6px] border border-black/10 text-[11px] font-medium text-black hover:bg-neutral-50 transition-colors"
                                    >
                                        Try again
                                    </button>
                                    <button 
                                        onClick={handleSaveAIResult}
                                        className="px-[12px] py-[6px] rounded-[6px] bg-black text-white text-[11px] font-medium hover:bg-neutral-800 transition-colors"
                                    >
                                        Save to library
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION 2 — Featured shapes */}
                    <div>
                        <div className="flex justify-between mb-[12px]">
                            <span className="text-[13px] font-[500] text-black">Featured shapes</span>
                            <span className="text-[11px] text-neutral-400">Common for all users</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-[10px]">
                            {FEATURED_SHAPES.map(item => (
                                <div key={item.id} className="relative group bg-white border-[0.5px] border-black/5 rounded-[10px] overflow-hidden cursor-pointer hover:-translate-y-[2px] hover:border-black/15 transition-all duration-[180ms] ease-out">
                                    <div className="h-[72px] w-full flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: item.bg }}>
                                        <div className="absolute inset-[15%] pointer-events-none opacity-90">
                                            <LibraryItemPreview shapes={item.shapes} />
                                        </div>
                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/15 flex items-center justify-center rounded-t-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!user) {
                                                        setIsSignupModalOpen(true);
                                                        return;
                                                    }
                                                    addItem(item.shapes, item.name, 'Custom');
                                                    toast.success(`${item.name} added to library!`);
                                                }}
                                                className="bg-black text-white border-none rounded-[99px] px-[10px] py-[4px] text-[9px] font-[500]"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-[7px_8px] border-t-[0.5px] border-black/5 flex flex-col">
                                        <span className="text-[10px] font-[500] text-black whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</span>
                                        <span className="text-[9px] text-neutral-500 mt-[1px]">{item.sub}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 3 — My library */}
                    <div>
                        <div className="flex justify-between mb-[12px]">
                            <span className="text-[13px] font-[500] text-black">My library</span>
                            <div className="flex items-center gap-[10px]">
                                {user && <span className="text-[11px] text-neutral-400">{libraryItems.length} shapes</span>}
                                {user && libraryItems.length > 0 && <span className="text-[11px] text-neutral-400 hover:text-black cursor-pointer transition-colors">Manage →</span>}
                            </div>
                        </div>

                        {!user ? (
                            <div className="bg-[#FAFAFA] border-[0.5px] border-dashed border-black/10 rounded-[10px] p-[32px] flex flex-col items-center justify-center gap-[8px] min-h-[160px]">
                                <Lock className="w-[24px] h-[24px] text-neutral-400 mb-[4px]" strokeWidth={1.5} />
                                <span className="text-[12px] font-[500] text-neutral-500">Your library is empty</span>
                                <span className="text-[11px] text-neutral-400 text-center leading-[1.5] max-w-[200px]">
                                    Sign up free to save and create shapes
                                </span>
                                <button 
                                    onClick={() => setIsSignupModalOpen(true)}
                                    className="mt-[4px] bg-[#7F77DD] text-white rounded-[8px] px-[16px] py-[8px] text-[12px] font-[500] hover:bg-[#534AB7] transition-colors"
                                >
                                    Sign up
                                </button>
                            </div>
                        ) : libraryItems.length === 0 ? (
                            <div className="bg-[#FAFAFA] border-[0.5px] border-dashed border-black/10 rounded-[10px] p-[32px] flex flex-col items-center justify-center gap-[8px] min-h-[160px]">
                                <Layers className="w-[28px] h-[28px] text-neutral-300 mb-[4px]" strokeWidth={1.5} />
                                <span className="text-[12px] font-[500] text-neutral-500">No shapes yet</span>
                                <span className="text-[11px] text-neutral-400 text-center leading-[1.5] max-w-[220px]">
                                    Generate a shape with AI above<br/>or create a custom shape from scratch
                                </span>
                                <button className="mt-[4px] bg-transparent text-black border border-black/15 rounded-[8px] px-[16px] py-[8px] text-[12px] font-[500] hover:bg-black/5 transition-colors">
                                    Create custom shape
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-[10px]">
                                {libraryItems.map((item, idx) => {
                                    const thumbBg = COLORS[idx % COLORS.length];

                                    return (
                                        <div key={item.id} className="relative group bg-white border-[0.5px] border-black/5 rounded-[10px] overflow-hidden cursor-pointer hover:-translate-y-[2px] hover:border-black/15 transition-all duration-[180ms] ease-out flex flex-col h-[114px]">
                                            <div className="h-[72px] w-full flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: thumbBg }}>
                                                <div className="absolute inset-[15%] pointer-events-none mix-blend-multiply opacity-80">
                                                    <LibraryItemPreview shapes={item.shapes} />
                                                </div>
                                                {/* Hover Overlay */}
                                                <div className="absolute inset-0 bg-black/15 flex items-center justify-center gap-[5px] rounded-t-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCreateBoard(); // Mocking "Use" as create new board
                                                            toast.info("Opening board with this shape...");
                                                        }}
                                                        className="bg-black text-white border-none rounded-[99px] px-[10px] py-[4px] text-[9px] font-[500] shadow-sm"
                                                    >
                                                        Use
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); publishToCommunity(item.id); toast.success('Published!'); }}
                                                        className="bg-white/90 text-[#222] border-none rounded-[99px] px-[10px] py-[4px] text-[9px] font-[500] shadow-sm hover:bg-white transition-colors"
                                                    >
                                                        Publish
                                                    </button>
                                                </div>
                                                
                                                {/* 3-dot menu */}
                                                <div className="absolute top-[6px] right-[6px] z-30">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button 
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="w-[22px] h-[22px] flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-neutral-500 hover:text-black transition-colors shadow-sm"
                                                            >
                                                                <MoreVertical className="w-[12px] h-[12px]" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-[120px]">
                                                            <DropdownMenuItem 
                                                                className="text-red-600 focus:text-red-600 cursor-pointer"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeItem(item.id);
                                                                    toast.success("Shape removed from library");
                                                                }}
                                                            >
                                                                <Trash2 className="w-[14px] h-[14px] mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                            <div className="flex-1 p-[7px_8px] border-t-[0.5px] border-black/5 bg-white flex flex-col justify-center">
                                                <span className="text-[10px] font-[500] text-black whitespace-nowrap overflow-hidden text-ellipsis mb-[3px]">{item.name}</span>
                                                <div className="flex">
                                                    {item.source === 'AI' ? (
                                                        <span className="bg-[#EEEDFE] text-[#534AB7] text-[9px] font-[500] rounded-[99px] px-[6px] py-[1px]">AI</span>
                                                    ) : (
                                                        <span className="bg-[#EAF3DE] text-[#3B6D11] text-[9px] font-[500] rounded-[99px] px-[6px] py-[1px]">Custom</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* New shape dashed card */}
                                <div className="bg-transparent border-[0.5px] border-dashed border-black/15 rounded-[10px] flex flex-col items-center justify-center gap-[5px] min-h-[114px] cursor-pointer hover:bg-[#FAFAFA] hover:border-solid hover:border-black/20 transition-all duration-[180ms] ease-out">
                                    <CirclePlus className="w-[20px] h-[20px] text-neutral-400 stroke-[1.3px]" />
                                    <span className="text-[10px] text-neutral-500">New shape</span>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <SignupModal isOpen={isSignupModalOpen} onOpenChange={setIsSignupModalOpen} />
        </div>
    );
}
