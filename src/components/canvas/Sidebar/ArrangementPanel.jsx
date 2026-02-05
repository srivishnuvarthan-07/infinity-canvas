import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowUp, ArrowDown, Group, Ungroup } from "lucide-react"; // Wait, Lucide might not have Group/Ungroup icons clearly. Text is better. 
// Just keeping imports clean.
export function ArrangementPanel({ layerActions, selectedElement, groupActions }) {
    if (!selectedElement) return null;

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold">Arrangement</h4>
            <Separator />

            {/* Grouping */}
            {groupActions && (
                <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">Grouping</span>
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
                <span className="text-xs text-muted-foreground">Layers</span>
                <div className="flex gap-1">
                    <Button variant="outline" size="icon" onClick={layerActions.bringToFront} onMouseDown={(e) => e.preventDefault()} title="Bring to Front">
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={layerActions.moveForward} onMouseDown={(e) => e.preventDefault()} title="Move Forward">
                        <span className="text-xs">↑</span>
                    </Button>
                    <Button variant="outline" size="icon" onClick={layerActions.moveBackward} onMouseDown={(e) => e.preventDefault()} title="Move Backward">
                        <span className="text-xs">↓</span>
                    </Button>
                    <Button variant="outline" size="icon" onClick={layerActions.sendToBack} onMouseDown={(e) => e.preventDefault()} title="Send to Back">
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
