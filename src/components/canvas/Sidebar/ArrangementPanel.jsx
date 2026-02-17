import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowUp, ArrowDown, BookMarked } from "lucide-react";

export function ArrangementPanel({ layerActions, selectedElement, groupActions, onAddToLibrary }) {
    if (!selectedElement) return null;

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold">Arrangement</h4>
            <Separator />

            {/* Library Action */}
            {onAddToLibrary && (
                <div className="space-y-2">
                    <span className="text-xs text-neutral-500">Library</span>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full gap-2"
                        onClick={onAddToLibrary}
                    >
                        <BookMarked className="w-3 h-3" />
                        Add to Library
                    </Button>
                </div>
            )}
            <Separator />

            {/* Grouping */}
            {groupActions && (
                <div className="space-y-2">
                    <span className="text-xs text-neutral-500">Grouping</span>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={groupActions.group}
                            disabled={!groupActions.canGroup}
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            Group
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={groupActions.ungroup}
                            disabled={!groupActions.canUngroup}
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            Ungroup
                        </Button>
                    </div>
                </div>
            )}
            <Separator />

            {/* Layers */}
            <div className="space-y-2">
                <span className="text-xs text-neutral-500">Order</span>
                <div className="grid grid-cols-4 gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-full" onClick={layerActions.bringToFront} title="Bring into Front">
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-full" onClick={layerActions.bringForward} title="Bring Forward">
                        <span className="text-xs font-bold font-mono">↑</span>
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-full" onClick={layerActions.sendBackwards} title="Send Backward">
                        <span className="text-xs font-bold font-mono">↓</span>
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-full" onClick={layerActions.sendToBack} title="Send to Back">
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
