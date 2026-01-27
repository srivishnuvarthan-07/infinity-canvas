
import { useCanvas } from "@/hooks/useCanvas";
import { Toolbar } from "./Toolbar";
import { ColorPicker } from "./ColorPicker";
import { StrokeWidth } from "./StrokeWidth";
import { ActionBar } from "./ActionBar";
import { ZoomControls } from "./ZoomControls";
import { Logo } from "./Logo";
import { Sidebar } from "@/components/canvas/Sidebar/Sidebar";
import { useState } from "react";


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
        layerActions,
        groupActions,
        history, // Destructure history
        fabricCanvas // Destructure fabricCanvas
    } = useCanvas();

    return (
        <div
            ref={containerRef}
            className="relative w-full h-screen overflow-hidden bg-background"
        >


            {/* FLOATING LEFT STYLE PANEL */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 pointer-events-auto">
                <Sidebar
                    selectedElement={selectedElement}
                    updateElement={updateSelectedElement}
                    layerActions={layerActions}
                    groupActions={groupActions}
                />
            </div>

            {/* TOP BAR */}
            <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
                <div className="pointer-events-auto">
                    <Logo />
                </div>

                <div className="pointer-events-auto">
                    <Toolbar
                        activeTool={activeTool}
                        onToolChange={setActiveTool}
                    />
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

            {/* ZOOM */}
            <div className="absolute bottom-4 right-4 z-10 pointer-events-auto">
                <ZoomControls
                    zoom={zoom}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onZoomReset={handleZoomReset}
                />
            </div>

            {/* CANVAS */}
            <canvas ref={canvasRef} className="w-full h-full" />
        </div>
    );
}