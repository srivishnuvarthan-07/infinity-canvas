import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowUp, ArrowDown, BookMarked } from "lucide-react";

export function ArrangementPanel({ layerActions, selectedElement, groupActions, onAddToLibrary }) {
    if (!selectedElement) return null;

    return (
        <div className="space-y-8">
            {/* LAYOUT SECTION */}
            <div className="space-y-5">
                <h4 className="text-[11px] uppercase text-neutral-400 tracking-widest font-semibold">Layout</h4>

                {/* Layers */}
                <div className="space-y-3">
                    <span className="text-[13px] font-medium text-neutral-600">Order</span>
                    <div className="grid grid-cols-4 gap-2">
                        <Button variant="outline" size="icon" className="h-9 w-full shadow-sm hover:bg-neutral-50" onClick={layerActions.bringToFront} title="Bring into Front">
                            <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-full shadow-sm hover:bg-neutral-50" onClick={layerActions.bringForward} title="Bring Forward">
                            <span className="text-sm font-bold font-mono">↑</span>
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-full shadow-sm hover:bg-neutral-50" onClick={layerActions.sendBackwards} title="Send Backward">
                            <span className="text-sm font-bold font-mono">↓</span>
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-full shadow-sm hover:bg-neutral-50" onClick={layerActions.sendToBack} title="Send to Back">
                            <ArrowDown className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Grouping */}
                {groupActions && (groupActions.canGroup || groupActions.canUngroup) && (
                    <div className="space-y-3 pt-2">
                        <span className="text-[13px] font-medium text-neutral-600">Grouping</span>
                        <div className="flex gap-2">
                            {groupActions.canGroup && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 shadow-sm h-9 hover:bg-neutral-50"
                                    onClick={groupActions.group}
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    Group
                                </Button>
                            )}
                            {groupActions.canUngroup && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 shadow-sm h-9 hover:bg-neutral-50"
                                    onClick={groupActions.ungroup}
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    Ungroup
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ACTIONS SECTION */}
            {onAddToLibrary && (
                <div className="space-y-5">
                    <h4 className="text-[11px] uppercase text-neutral-400 tracking-widest font-semibold">Actions</h4>

                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 shadow-sm h-9 hover:bg-neutral-50 justify-start px-4 text-neutral-700 font-medium"
                            onClick={onAddToLibrary}
                        >
                            <BookMarked className="w-4 h-4 text-neutral-400" />
                            Add to Library
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
