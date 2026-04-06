import { useRef, useState } from "react";
import { Trash2, Grid, Box, UploadCloud } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { convertExcalidrawLibrary } from "@/utils/excalidrawConverter";
// Removed obsolete svgConverter

import { useAuth } from "@/hooks/useAuth";
import { SignupModal } from "@/components/auth/SignupModal";
import { Lock } from "lucide-react";

import { LibraryAIPrompt } from "./LibraryAIPrompt";
import { LibraryItemPreview } from "./LibraryItemPreview";
import { Globe, User as UserIcon, Share2 } from "lucide-react";

// Hardcoded featured shapes for guests to browse
const FEATURED_SHAPES = [
    {
        id: "featured-sticky",
        name: "Sticky Note",
        shapes: [
            {
                id: "f-s-1", type: "rectangle", position: { x: 0, y: 0 }, size: { width: 140, height: 140 },
                style: { fill: "#fef08a", stroke: "transparent", strokeWidth: 0, roughness: 1.5 }
            },
            {
                id: "f-s-2", type: "text", text: "Double click to edit", position: { x: 0, y: 0 }, size: { width: 120, height: 20 },
                font: { size: 14, family: "Caveat", align: "center" }, style: { fill: "#1f2937" }
            }
        ]
    },
    {
        id: "featured-process",
        name: "Process Node",
        shapes: [
            {
                id: "f-p-1", type: "rectangle", position: { x: 0, y: 0 }, size: { width: 160, height: 60 },
                style: { fill: "#e0f2fe", stroke: "#000", strokeWidth: 2, roughness: 1.5 }
            },
            {
                id: "f-p-2", type: "text", text: "Process", position: { x: 0, y: 0 }, size: { width: 140, height: 20 },
                font: { size: 16, family: "Caveat", align: "center", weight: "600" }, style: { fill: "#000" }
            }
        ]
    },
    {
        id: "featured-decision",
        name: "Decision Node",
        shapes: [
            {
                id: "f-d-1", type: "diamond", position: { x: 0, y: 0 }, size: { width: 120, height: 120 },
                style: { fill: "#e9d5ff", stroke: "#000", strokeWidth: 2, roughness: 1.5 }
            },
            {
                id: "f-d-2", type: "text", text: "Decision?", position: { x: 0, y: 0 }, size: { width: 80, height: 20 },
                font: { size: 15, family: "Caveat", align: "center", weight: "600" }, style: { fill: "#000" }
            }
        ]
    }
];

export function LibraryPanel({ 
    items, 
    onDeleteItem, 
    onAddItem, 
    libraryItems, 
    communityItems = [], 
    onPublishItem 
}) {
    const { user } = useAuth();
    const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = (e, item) => {
        const dragData = JSON.stringify({
            type: 'LIBRARY_ITEM',
            itemId: item.id,
            item: item // Send full item data to avoid lookups
        });
        e.dataTransfer.setData('application/infinity-canvas-library', dragData);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const fileInputRef = useRef(null);

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

    const renderGrid = (itemList, isReadOnly = false) => {
        if (!itemList || itemList.length === 0) {
            return (
                <div className="col-span-2 text-center py-6 text-neutral-400 text-xs">
                    No items yet. Add shapes to your library!
                </div>
            );
        }

        return itemList.map((item, idx) => (
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

                <span className="text-[9px] text-neutral-400">
                    {item.shapes.length} shapes
                </span>

                {!isReadOnly && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                        {/* Publish (if not already public) */}
                        {!item.isPublic && onPublishItem && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 bg-white text-neutral-400 hover:bg-indigo-50 hover:text-indigo-600 shadow-sm border border-neutral-100"
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
                        {/* Delete */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 bg-white text-neutral-400 hover:bg-red-50 hover:text-red-500 shadow-sm border border-neutral-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteItem(item.id);
                            }}
                            title="Delete from Library"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                )}
                
                {/* Creator Label for Community Items */}
                {isReadOnly && item.userName && (
                    <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] text-neutral-500 shadow-sm">
                        <UserIcon className="w-2 h-2" />
                        <span className="truncate max-w-[60px]">{item.userName}</span>
                    </div>
                )}
            </div>
        ));
    };

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
                            {renderGrid(FEATURED_SHAPES, true)}
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
                                {renderGrid(libraryItems, false)}
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
