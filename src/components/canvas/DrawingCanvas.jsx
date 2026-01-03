import { useCanvas } from "@/hooks/useCanvas";
import { Toolbar } from "./Toolbar";
import { ColorPicker } from "./ColorPicker";
import { StrokeWidth } from "./StrokeWidth";
import { ActionBar } from "./ActionBar";
import { ZoomControls } from "./ZoomControls";
import { Logo } from "./Logo";

export function DrawingCanvas() {
    const {
        canvasRef,
        containerRef,
        activeTool,
        setActiveTool,
        activeColor,
        setActiveColor,
        strokeWidth,
        setStrokeWidth,
        zoom,
        canUndo,
        canRedo,
        handleUndo,
        handleRedo,
        handleClear,
        handleExport,
        handleAddImage,
        handleZoomIn,
        handleZoomOut,
        handleZoomReset,
    } = useCanvas();

    return (
        <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-background">
            <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
                <div className="pointer-events-auto">
                    <Logo />
                </div>

                <div className="pointer-events-auto flex items-center gap-3">
                    <Toolbar activeTool={activeTool} onToolChange={setActiveTool} />
                </div>

                <div className="pointer-events-auto">
                    <ActionBar
                        canUndo={canUndo}
                        canRedo={canRedo}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        onClear={handleClear}
                        onExport={handleExport}
                        onAddImage={handleAddImage}
                    />
                </div>
            </div>

            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-3">
                <ColorPicker activeColor={activeColor} onColorChange={setActiveColor} />
                <StrokeWidth activeWidth={strokeWidth} onWidthChange={setStrokeWidth} />
            </div>

            <div className="absolute bottom-4 right-4 z-10">
                <ZoomControls
                    zoom={zoom}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onZoomReset={handleZoomReset}
                />
            </div>

            <div className="canvas-container canvas-smooth w-full h-full">
                <canvas ref={canvasRef} />
            </div>

            <div className="absolute bottom-4 left-4 z-10 text-xs text-muted-foreground animate-fade-in">
                <span className="px-2 py-1 bg-card/80 backdrop-blur-sm rounded-md shadow-sm">
                    Press{" "}
                    <kbd className="px-1 py-0.5 mx-0.5 bg-muted rounded text-[10px] font-mono">V</kbd>{" "}
                    for Select,
                    <kbd className="px-1 py-0.5 mx-0.5 bg-muted rounded text-[10px] font-mono">P</kbd>{" "}
                    for Pencil,
                    <kbd className="px-1 py-0.5 mx-0.5 bg-muted rounded text-[10px] font-mono">R</kbd>{" "}
                    for Rectangle
                </span>
            </div>
        </div>
    );
}
