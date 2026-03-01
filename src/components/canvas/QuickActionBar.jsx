import { Trash2, Copy, Lock, Unlock, ArrowUp, ArrowDown, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HexColorPicker } from "react-colorful";

export function QuickActionBar({
    selectedElement,
    viewport,
    onUpdateElement,
    onDelete,
    onDuplicate,
    onLayerAction,
    onLock
}) {
    if (!selectedElement || !viewport) return null;

    // Calculate position
    // We want it centered above the element
    // element.x/y is top-left in canvas coords

    // Canvas to Screen
    const screenX = ((selectedElement.position?.x || 0) - viewport.x) * viewport.zoom;
    const screenY = ((selectedElement.position?.y || 0) - viewport.y) * viewport.zoom;
    const screenWidth = (selectedElement.size?.width || 0) * viewport.zoom;
    // const screenHeight = selectedElement.size?.height * viewport.zoom;

    // Position: Center X, Above Y
    // Offset by -50px for toolbar height?
    const style = {
        position: 'absolute',
        top: `${screenY - 60}px`,
        left: `${screenX + screenWidth / 2}px`,
        transform: 'translateX(-50%)',
        zIndex: 50
    };

    // If off-screen top, flip to bottom?
    // Simplified for now.

    return (
        <div
            style={style}
            className="flex items-center gap-1 p-1 bg-white rounded-lg shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200"
            onMouseDown={(e) => e.stopPropagation()} // Prevent canvas deselect
        >
            {/* Color Picker */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded hover:bg-neutral-100">
                        <div
                            className="w-4 h-4 rounded-full border border-neutral-300"
                            style={{ backgroundColor: selectedElement.style?.fill || 'transparent' }}
                        />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                    <HexColorPicker
                        color={selectedElement.style?.fill || "#ffffff"}
                        onChange={(color) => onUpdateElement({ style: { ...selectedElement.style, fill: color } })}
                    />
                </PopoverContent>
            </Popover>

            <div className="w-[1px] h-4 bg-neutral-200 mx-1" />

            {/* Layers */}
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-neutral-100" onClick={() => onLayerAction('bringForward')} title="Bring Forward">
                <ArrowUp className="w-4 h-4 text-neutral-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-neutral-100" onClick={() => onLayerAction('sendBackward')} title="Send Backward">
                <ArrowDown className="w-4 h-4 text-neutral-600" />
            </Button>

            <div className="w-[1px] h-4 bg-neutral-200 mx-1" />

            {/* Actions */}
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-neutral-100" onClick={onDuplicate} title="Duplicate">
                <Copy className="w-4 h-4 text-neutral-600" />
            </Button>

            {/* Lock/Unlock (Future) 
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-neutral-100" onClick={onLock}>
                {selectedElement.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </Button> 
            */}

            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 text-red-500 hover:text-red-600" onClick={onDelete} title="Delete">
                <Trash2 className="w-4 h-4" />
            </Button>

        </div>
    );
}
