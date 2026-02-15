import { useCanvas } from "@/hooks/useCanvas";
import { Toolbar } from "./Toolbar";
import { MenuToolbar } from "./MenuToolbar";
import { ActionBar } from "./ActionBar";
import { ZoomControls } from "./ZoomControls";
import { Logo } from "./Logo";
import { Sidebar } from "@/components/canvas/Sidebar/Sidebar";
import { TextEditorOverlay } from "./TextEditorOverlay";
import { CommandMenu } from "./CommandMenu";
import { useState, useEffect, useRef } from "react";
import { Undo, Redo } from "lucide-react";
import { Button } from "@/components/ui/button";


// Simple Debounce Hook Implementation since I don't want to rely on external
function useDebouncedCallback(callback, delay) {
    const timeoutRef = useRef(null);
    return (...args) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    };
}

export function DrawingCanvas({ initialShapes = [], onSave, libraryItems, onAddToLibrary }) {

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
        canvasHandlers,
        insertShapes
    } = useCanvas({ initialShapes });

    // Drop Handler for Library Items
    const handleDragOver = (e) => {
        e.preventDefault(); // allow drop
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/infinity-canvas-library');
        if (!data) return;

        try {
            const { type, itemId } = JSON.parse(data);
            if (type === 'LIBRARY_ITEM' && itemId && libraryItems) {
                const item = libraryItems[itemId];
                if (item) {
                    // Calculate Drop Position (Center of Item at Mouse)
                    const rect = containerRef.current.getBoundingClientRect();
                    const clientX = e.clientX - rect.left;
                    const clientY = e.clientY - rect.top;

                    // Convert to Canvas Coordinates
                    // x_canvas = (x_screen - pan_x) / zoom
                    const dropX = (clientX - viewport.x) / viewport.zoom;
                    const dropY = (clientY - viewport.y) / viewport.zoom;

                    // Clone and Offset Shapes
                    const newShapes = item.shapes.map(s => {
                        return {
                            ...s,
                            id: crypto.randomUUID(),
                            // Position relative to drop point
                            // Item shapes are normalized to center (0,0)
                            // So just add drop position
                            x: dropX + s.x,
                            y: dropY + s.y,
                            opacity: s.opacity ?? 1, // Ensure defaults
                        };
                    });

                    insertShapes(newShapes);
                }
            }
        } catch (err) {
            console.error('Drop failed:', err);
        }
    };


    // Auto-Save Logic
    const debouncedSave = useRef(
        // We can't use the hook directly inside the ref initialization usually, 
        // so we'll use a useEffect approach below using a timeout.
        null
    );

    // Effect to trigger save when shapes change
    useEffect(() => {
        if (!onSave) return;

        // Don't save on mount (if initialShapes matched customShapes approximately)
        // But customShapes initializes from initialShapes.
        // We should skip the very first render? 
        // Actually, debounce handles rapid updates.

        const handler = setTimeout(() => {
            onSave(customShapes);
        }, 1000); // 1s Debounce

        return () => clearTimeout(handler);
    }, [customShapes, onSave]);


    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden bg-white"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
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
                        onAddToLibrary={() => {
                            // Extract shapes from selection
                            if (!selectedElement) return;

                            let shapesToSave = [];
                            if (selectedElement.type === 'activeSelection' && selectedElement.objects) {
                                shapesToSave = selectedElement.objects;
                            } else {
                                shapesToSave = [selectedElement];
                            }

                            // Ask for name? simplified for now
                            const name = prompt("Enter name for library item:", "New Item");
                            if (name) {
                                onAddToLibrary(shapesToSave, name);
                            }
                        }}
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

            {/* UNDO / REDO CONTROLS (Bottom Left) */}
            <div className="absolute bottom-4 left-4 z-20 flex gap-2 pointer-events-auto">
                <div className="bg-white/90 backdrop-blur-sm border border-neutral-200 shadow-sm rounded-lg flex items-center p-1 gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-neutral-100"
                        onClick={handleUndo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo className="w-4 h-4 text-neutral-700" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-neutral-100"
                        onClick={handleRedo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo className="w-4 h-4 text-neutral-700" />
                    </Button>
                </div>

                {/* COMMAND HINT (Next to buttons) */}
                <div className="flex items-center px-2 py-1 bg-white/50 backdrop-blur-sm rounded-md border border-neutral-200/50 text-xs text-neutral-500 font-medium font-mono select-none h-10">
                    ⌘K
                </div>
            </div>

        </div>
    );
}