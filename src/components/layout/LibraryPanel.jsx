import { Trash2, Grid, Box } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export function LibraryPanel({ items, onDeleteItem }) {
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

    return (
        <div className="w-full h-full flex flex-col bg-transparent">
            <div className="p-4 border-b border-neutral-200">
                <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                    <Grid className="w-4 h-4" />
                    Library
                </h2>
            </div>

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
                            {/* Preview Placeholder (Real preview would need canvas rendering) */}
                            <Box className="w-8 h-8 text-neutral-300 mb-2 group-hover:text-blue-500 transition-colors" />

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
