
import { useCanvas } from "@/hooks/useCanvas";
import { Toolbar } from "./Toolbar";
import { MenuToolbar } from "./MenuToolbar";
import { ActionBar } from "./ActionBar";
import { ZoomControls } from "./ZoomControls";
import { Logo } from "./Logo";
import { Sidebar } from "@/components/canvas/Sidebar/Sidebar";
import { TextEditorOverlay } from "./TextEditorOverlay";
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
            className="flex w-full h-screen overflow-hidden bg-background"
        >
            {/* LEFT DOCK: TOOLS */}
            <div className="z-20 w-16 h-full flex flex-col items-center pointer-events-auto bg-card border-r border-border/50 backdrop-blur-sm transition-all duration-300">
                <div className="p-4 py-6 flex flex-col items-center gap-6">
                    <Logo />
                    {/* Compact Menu */}
                    <MenuToolbar
                        onOpen={handleLoad}
                        onSaveAs={handleSaveAs}
                        onExport={handleExport}
                        onReset={handleClear}
                    />
                </div>

                <div className="flex-1 w-full px-2 py-4 flex flex-col items-center gap-2 overflow-y-auto scrollbar-hide">
                    <Toolbar
                        activeTool={activeTool}
                        onToolChange={setActiveTool}
                        orientation="vertical"
                    />
                </div>

                <div className="p-4 py-6 flex flex-col items-center gap-4 border-t border-border/20 w-full">
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

            {/* CENTER CANVAS */}
            <div className="relative flex-1 h-full overflow-hidden bg-dot-pattern">
                <canvas
                    ref={customCanvasRef}
                    className="w-full h-full block touch-none"
                    {...canvasHandlers}
                />

                {/* OVERLAYS */}
                {editingShapeId && customShapes && (
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        {(() => {
                            const shape = customShapes.find(s => s.id === editingShapeId);
                            if (shape) {
                                return (
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
                                );
                            }
                            return null;
                        })()}
                    </div>
                )}

                {/* ZOOM CONTROLS (Floating in canvas area) */}
                <div className="absolute bottom-4 right-4 z-10 pointer-events-auto">
                    <ZoomControls
                        zoom={zoom}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onZoomReset={handleZoomReset}
                    />
                </div>
            </div>

            {/* RIGHT DOCK: PROPERTIES */}
            {selectedElement ? (
                <div className="z-20 w-72 h-full bg-card border-l border-border/50 backdrop-blur-sm shadow-xl flex flex-col pointer-events-auto transition-all duration-300">
                    <div className="flex-1 overflow-y-auto p-4">
                        <Sidebar
                            selectedElement={selectedElement}
                            updateElement={updateSelectedElement}
                            layerActions={layerActions}
                            groupActions={groupActions}
                        />
                    </div>
                </div>
            ) : null}

        </div>
    );
}