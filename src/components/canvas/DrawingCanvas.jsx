
import { useCanvas } from "@/hooks/useCanvas";
import { Toolbar } from "./Toolbar";
import { MenuToolbar } from "./MenuToolbar";
import { ActionBar } from "./ActionBar";
import { ZoomControls } from "./ZoomControls";
import { Logo } from "./Logo";
import { Sidebar } from "@/components/canvas/Sidebar/Sidebar";
import { TextEditorOverlay } from "./TextEditorOverlay";
import { CommandMenu } from "./CommandMenu";
import { useState } from "react";


export function DrawingCanvas() {

    const {
        containerRef,
        activeTool,
        setActiveTool,
        activeColor,
        setActiveColor,
        strokeWidth,
        setStrokeWidth,
        strokeStyle,
        setStrokeStyle,
        zoom,
        handleZoomIn,
        handleZoomOut,
        handleZoomReset,
        showgrid,
        setshowgrid,
        canUndo,
        canRedo,
        handleUndo,
        handleRedo,
        handleClear,
        handleExport,
        handleAddImage,
        selectedElement,
        updateSelectedElement,
        handleSaveAs,
        handleLoad,
        layerActions,
        groupActions,

        // Custom Engine
        customCanvasRef,
        editingShapeId,
        setEditingShapeId,

        customShapes,
        updateCustomShape,
        viewport,
        canvasHandlers
    } = useCanvas();


    return (
        <div
            ref={containerRef}
            className="relative w-full h-screen overflow-hidden bg-neutral-50/50"
        >
            <CommandMenu
                onUndo={handleUndo}
                onRedo={handleRedo}
                onClear={handleClear}
                onExport={handleExport}
                onAddImage={handleAddImage}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleZoomReset}
            />

            {/* TOP LEFT: BRANDING */}
            <div className="absolute top-4 left-4 z-30 pointer-events-none select-none opacity-50 hover:opacity-100 transition-opacity">
                <Logo />
            </div>

            {/* TOP RIGHT: MENU & ACTIONS */}
            <div className="absolute top-4 right-4 z-30 flex gap-2 pointer-events-auto">
                <div className="bg-white/80 backdrop-blur-md border border-neutral-200/60 shadow-sm rounded-lg flex items-center p-1">
                    <MenuToolbar
                        onOpen={handleLoad}
                        onSaveAs={handleSaveAs}
                        onExport={handleExport}
                        onReset={handleClear}
                    />
                </div>
            </div>

            {/* BOTTOM CENTER: FLOATING TOOLBAR */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                <Toolbar
                    activeTool={activeTool}
                    onToolChange={setActiveTool}
                    orientation="horizontal"
                />
            </div>

            {/* FLOATING PROPERTIES PANEL (Contextual) */}
            {selectedElement && (
                <div className="absolute top-16 right-4 z-20 w-72 pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-200">
                    <Sidebar
                        selectedElement={selectedElement}
                        updateElement={updateSelectedElement}
                        layerActions={layerActions}
                        groupActions={groupActions}
                    />
                </div>
            )}

            {/* CANVAS LAYER */}
            <div className="absolute inset-0 z-0">
                <canvas
                    ref={customCanvasRef}
                    className="w-full h-full block touch-none"
                    {...canvasHandlers}
                />
            </div>

            {/* OVERLAYS */}
            {editingShapeId && customShapes && (
                <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    {(() => {
                        const shape = customShapes.find(s => s.id === editingShapeId);
                        if (shape) {
                            return (
                                <div className="pointer-events-auto">
                                    <div className="pointer-events-auto">
                                        <TextEditorOverlay
                                            key={shape.id}
                                            shape={shape}
                                            canvasRef={customCanvasRef}
                                            updateShape={updateCustomShape}
                                            onBlur={() => setEditingShapeId(null)}
                                            viewport={viewport}
                                        />
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>
            )}

            {/* ZOOM CONTROLS (Bottom Right) */}
            <div className="absolute bottom-4 right-4 z-20 pointer-events-auto">
                <ZoomControls
                    zoom={zoom}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onZoomReset={handleZoomReset}
                />
            </div>

            {/* COMMAND HINT */}
            <div className="absolute bottom-4 left-4 z-10 pointer-events-none text-xs text-neutral-400 font-medium font-mono select-none">
                ⌘K to open commands
            </div>

        </div>
    );
}