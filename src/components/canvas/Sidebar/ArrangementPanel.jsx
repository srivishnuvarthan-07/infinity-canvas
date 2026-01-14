import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowUp, ArrowDown } from "lucide-react";
export function ArrangementPanel({ layerActions, selectedElement }) {
    if (!selectedElement) return null;

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-semibold">Arrangement</h4>
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
