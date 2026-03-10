import { useRef } from "react";
import { Trash2, Grid, Box, UploadCloud } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { convertExcalidrawLibrary } from "@/utils/excalidrawConverter";

import { LibraryAIPrompt } from "./LibraryAIPrompt";
import { LibraryItemPreview } from "./LibraryItemPreview";

export function LibraryPanel({ items, onDeleteItem, onAddItem }) {
    const sortedItems = Object.values(items).sort((a, b) => b.createdAt - a.createdAt);

    const handleDragStart = (e, item) => {
        // Serialize item ID and data for the drop handler
        const dragData = JSON.stringify({
            type: 'LIBRARY_ITEM',
            itemId: item.id
        });
        e.dataTransfer.setData('application/infinity-canvas-library', dragData);
        e.dataTransfer.effectAllowed = 'copy';

        // Transparent drag image? Or browser default is fine.
    };

    const fileInputRef = useRef(null);

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const jsonStr = event.target.result;
                const convertedItems = convertExcalidrawLibrary(jsonStr);

                if (convertedItems.length === 0) {
                    toast.error("No compatible shapes found in library file.");
                    return;
                }

                // Add all converted items
                for (const item of convertedItems) {
                    await onAddItem(item.shapes, item.name);
                }

                toast.success(`Imported ${convertedItems.length} items from Excalidraw!`);
            } catch (err) {
                console.error("Excalidraw parse failed:", err);
                toast.error(`Import Failed: ${err.message || "Invalid file format"}`);
            }
        };
        reader.readAsText(file);

        // Reset input so the same file can be uploaded again if needed
        e.target.value = null;
    };

    return (
        <div className="w-full h-full flex flex-col bg-transparent">
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
                    onClick={() => fileInputRef.current?.click()}
                    title="Import Excalidraw Library (.excalidrawlib)"
                >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Import
                </Button>
            </div>

            {/* AI Generation Form */}
            <LibraryAIPrompt onGenerateSuccess={(shapes, name) => onAddItem?.(shapes, name)} />

            <ScrollArea className="flex-1">
                <div className="p-4 grid grid-cols-2 gap-3">
                    {sortedItems.length === 0 && (
                        <div className="col-span-2 text-center py-8 text-neutral-400 text-xs">
                            No items saved.<br />Select shapes and click "Add to Library"
                        </div>
                    )}

                    {sortedItems.map(item => (
                        <div
                            key={item.id}
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

                            {/* Delete Button (Hover) */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-all"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteItem(item.id);
                                }}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
