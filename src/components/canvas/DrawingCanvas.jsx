import React, { useState, useEffect, useRef } from "react";
import { useCanvas } from "@/hooks/useCanvas";
import { Toolbar } from "./Toolbar";
import { MenuToolbar } from "./MenuToolbar";
import { ActionBar } from "./ActionBar";
import { ZoomControls } from "./ZoomControls";
import { Logo } from "./Logo";
import { Sidebar } from "@/components/canvas/Sidebar/Sidebar";
import { TextEditorOverlay } from "./TextEditorOverlay";
import { CommandMenu } from "./CommandMenu";
import { CursorOverlay } from "./CursorOverlay";
import { SelectionOverlay } from "./SelectionOverlay";
import { Undo, Redo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "./ShareDialog";

import { FloatingMenu } from "@/components/layout/FloatingMenu";
import { AIPromptBar } from "@/components/canvas/AIPromptBar";
import { useAuth } from "@/hooks/useAuth";
// import { useWorkspaceStore } from "@/hooks/useWorkspaceStore";
import { toast } from "sonner";


export function DrawingCanvas({
    initialShapes = [],
    onSave,
    libraryItems,
    onSelectionChange,
    onZoomChange,
    onMouseMove,
    onInteraction,
    disablePropertyPanel = false,
    // Navigation & Meta
    boardId,
    boardName,
    isLocal = false,
    isLive = false,
    ownerId, // Added ownerId
    onToggleLive,
    onRename,
    onBack,
    onAddToLibrary,
    socket,
    // Access Props
    linkAccess,
    visibility,
    onUpdateAccess,
    members = [],
    onInviteMember,
    onRemoveMember
}) {
    const { user } = useAuth();
    const actualIsOwner = isLocal || (user && user?._id === ownerId);
    const isLoggedIn = !!user;
    const canEdit = actualIsOwner || linkAccess === 'edit';

    // const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId);
    // const workspaces = useWorkspaceStore(state => state.workspaces);
    // const activeWorkspace = workspaces.find(w => w._id === activeWorkspaceId);
    // const workspaceName = activeWorkspace?.name ?? null;

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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
        insertShapes,
        deleteSelected
    } = useCanvas({ initialShapes, socket, boardId, readonly: !canEdit });

    // Propagate state changes
    useEffect(() => {
        onSelectionChange?.(selectedElement);

        if (socket?.emit) {
            let selectedIds = [];
            if (selectedElement) {
                if (selectedElement.type === 'activeSelection' && selectedElement.objects) {
                    selectedIds = selectedElement.objects.map(o => o.id);
                } else if (selectedElement.id) {
                    selectedIds = [selectedElement.id];
                }
            }
            socket.emit('selection-change', { selectedIds });
        }
    }, [selectedElement, onSelectionChange, socket]);

    useEffect(() => {
        onZoomChange?.(zoom);
    }, [zoom, onZoomChange]);

    // Mouse Move Handler
    const handleCanvasMouseMove = (e) => {
        if (!onMouseMove || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - (viewport?.x || 0)) / (viewport?.zoom || 1);
        const y = (e.clientY - rect.top - (viewport?.y || 0)) / (viewport?.zoom || 1);

        if (socket?.emit) {
            socket.emit('cursor-move', { cursor: { x, y } });
        }

        onMouseMove({ x, y });
    };

    const handleCanvasMouseDown = (e) => {
        onInteraction?.();
    };


    // Drop Handler for Library Items
    const handleDragOver = (e) => {
        e.preventDefault(); // allow drop
        e.dataTransfer.dropEffect = 'copy';
        handleCanvasMouseMove(e); // Track mouse during drag
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/infinity-canvas-library');
        if (!data) return;

        try {
            const parsed = JSON.parse(data);
            const { type, itemId } = parsed;
            
            // Prefer the sent 'item' object, fallback to lookup in libraryItems (original behavior)
            let item = parsed.item;
            if (!item && type === 'LIBRARY_ITEM' && itemId && libraryItems) {
                // libraryItems might be an array or object depending on source
                item = Array.isArray(libraryItems) 
                    ? libraryItems.find(i => i.id === itemId)
                    : libraryItems[itemId];
            }

            if (item) {
                    // Calculate Drop Position (Center of Item at Mouse)
                    const rect = containerRef.current.getBoundingClientRect();
                    const clientX = e.clientX - rect.left;
                    const clientY = e.clientY - rect.top;

                    // Convert to Canvas Coordinates
                    // x_canvas = (x_screen - pan_x) / zoom
                    const dropX = (clientX - (viewport?.x || 0)) / (viewport?.zoom || 1);
                    const dropY = (clientY - (viewport?.y || 0)) / (viewport?.zoom || 1);

                    // 1. Map old IDs to new IDs
                    const idMap = new Map();
                    item.shapes.forEach(s => idMap.set(s.id, crypto.randomUUID()));

                    // 2. Clone deeply, updating nested IDs and bindings
                    const clonedShapes = item.shapes.map(s => {
                        return {
                            ...s,
                            id: idMap.get(s.id),
                            children: s.children ? s.children.map(c => {
                                // Excalidraw doesn't nest, but handles legacy cases where children might be IDs or objects
                                return typeof c === 'object' ? { ...c, id: idMap.get(c.id) || c.id } : (idMap.get(c) || c);
                            }) : undefined,
                            bindings: s.bindings ? {
                                start: s.bindings.start ? { ...s.bindings.start, elementId: idMap.get(s.bindings.start.elementId) || s.bindings.start.elementId } : null,
                                end: s.bindings.end ? { ...s.bindings.end, elementId: idMap.get(s.bindings.end.elementId) || s.bindings.end.elementId } : null,
                            } : undefined
                        };
                    });

                    // 3. Find root shapes
                    const childSet = new Set();
                    clonedShapes.forEach(s => {
                        if (s.children && Array.isArray(s.children)) {
                            s.children.forEach(c => {
                                const cId = typeof c === 'object' ? c.id : c;
                                childSet.add(cId);
                            });
                        }
                    });
                    const rootShapes = clonedShapes.filter(s => !childSet.has(s.id));

                    let finalShapes = [];

                    if (rootShapes.length > 1) {
                        // Wrap all roots into one parent group at drop point.
                        const groupId = crypto.randomUUID();
                        finalShapes.push({
                            id: groupId,
                            type: 'group',
                            position: { x: dropX, y: dropY },
                            size: { width: item.width || 100, height: item.height || 100 },
                            rotation: 0,
                            scale: { x: 1, y: 1 },
                            children: rootShapes, // InfinityCanvas requires FULL objects, not just IDs!
                            locked: false,
                            visible: true,
                            style: { opacity: 1, stroke: 'transparent', strokeWidth: 0, strokeStyle: 'solid' },
                            revision: { number: 1, timestamp: Date.now() }
                        });
                    } else {
                        // If it's just a single root, no group wrapper is made.
                        // We must translate it (and all its root stuff) to the drop point.
                        rootShapes.forEach(rs => {
                            rs.position = {
                                x: dropX + (rs.position?.x || 0),
                                y: dropY + (rs.position?.y || 0)
                            };
                            finalShapes.push(rs);
                        });
                    }

                    insertShapes(finalShapes);
                }
        } catch (err) {
            console.error('Drop failed:', err);
        }
    };


    // Auto-Save Logic
    const saveTimeoutRef = useRef(null);
    const latestShapesRef = useRef(customShapes);
    const onSaveRef = useRef(onSave);

    // Keep shapes ref up to date for unmount flush
    useEffect(() => {
        latestShapesRef.current = customShapes;
    }, [customShapes]);

    useEffect(() => {
        onSaveRef.current = onSave;
    }, [onSave]);

    // Unmount flush
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                // There's a pending save that hasn't fired yet
                clearTimeout(saveTimeoutRef.current);
                let thumbnail = null;
                if (customCanvasRef.current && latestShapesRef.current.length > 0) {
                    try {
                        const canvasEl = customCanvasRef.current;
                        const tempCanvas = document.createElement('canvas');
                        const ctx = tempCanvas.getContext('2d');

                        const targetWidth = 400;
                        const targetHeight = (canvasEl.height / canvasEl.width) * targetWidth;

                        tempCanvas.width = targetWidth;
                        tempCanvas.height = targetHeight;

                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, targetWidth, targetHeight);
                        if (canvasEl.width > 0 && canvasEl.height > 0) {
                            ctx.drawImage(canvasEl, 0, 0, targetWidth, targetHeight);
                            thumbnail = tempCanvas.toDataURL('image/jpeg', 0.5);
                        }
                    } catch (e) {
                        console.error("Flush thumbnail generation failed", e);
                    }
                }
                if (onSaveRef.current) {
                    onSaveRef.current(latestShapesRef.current, thumbnail);
                }
            }
        };
    }, []); // Run ONLY on unmount

    // Effect to trigger save when shapes change
    useEffect(() => {
        if (!onSaveRef.current) return;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new timeout (debounce)
        saveTimeoutRef.current = setTimeout(() => {
            let thumbnail = null;
            if (customCanvasRef.current && customShapes.length > 0) {
                try {
                    const canvasEl = customCanvasRef.current;
                    const tempCanvas = document.createElement('canvas');
                    const ctx = tempCanvas.getContext('2d');

                    const targetWidth = 400;
                    const targetHeight = (canvasEl.height / canvasEl.width) * targetWidth;

                    tempCanvas.width = targetWidth;
                    tempCanvas.height = targetHeight;

                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, targetWidth, targetHeight);
                    if (canvasEl.width > 0 && canvasEl.height > 0) {
                        ctx.drawImage(canvasEl, 0, 0, targetWidth, targetHeight);
                        thumbnail = tempCanvas.toDataURL('image/jpeg', 0.5);
                    }
                } catch (e) {
                    console.error("Thumbnail generation failed", e);
                }
            }
            if (onSaveRef.current) {
                onSaveRef.current(customShapes, thumbnail);
            }
            saveTimeoutRef.current = null; // Mark as flushed so unmount doesn't duplicate it
        }, 1500); // 1.5s Debounce - wait for drawing to stop

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [customShapes]);

    const handleDuplicate = () => {
        if (!selectedElement) return;
        const shapesToDuplicate = selectedElement.type === 'activeSelection' ? selectedElement.objects : [selectedElement];

        const newShapes = shapesToDuplicate.map(s => ({
            ...s,
            id: crypto.randomUUID(),
            position: {
                x: (s.position?.x || 0) + 20,
                y: (s.position?.y || 0) + 20
            }
        }));

        insertShapes(newShapes);
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden bg-white"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMouseMove={handleCanvasMouseMove}
            onMouseDown={handleCanvasMouseDown}
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

            {/* TOP LEFT: FLOATING MENU */}
            <div className="absolute top-4 left-16 z-30 pointer-events-auto flex items-center gap-2">
                <FloatingMenu
                    boardName={boardName || "Untitled"}
                    isSaved={true} // Hook up real state later if possible
                    isLocal={isLocal}
                    onRename={onRename}
                    onBack={onBack}
                    onOpen={handleLoad}
                    onSaveAs={handleSaveAs}
                    onExport={handleExport}
                    onReset={handleClear}
                />

                {/* Board Type Indicator */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/90 backdrop-blur-md border border-black/5 shadow-sm text-[11px] font-semibold tracking-wide ${isLocal ? 'text-amber-600' : 'text-indigo-600'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isLocal ? 'bg-amber-500' : 'bg-indigo-500'}`}></span>
                    {isLocal ? 'Local Board' : 'Cloud Board'}
                </div>
            </div>

            {/* TOP RIGHT: COLLABORATION & SHARE */}
            <div className="absolute top-4 right-4 z-30 pointer-events-auto flex items-center gap-3">
                {/* Collaborators Avatar Pile / Presence Panel */}
                <div className="relative group flex items-center">
                    <div className="flex items-center -space-x-2 cursor-pointer transition-transform group-hover:scale-105">
                        {/* Render My Identity Avatar */}
                        {socket?.myIdentity && (
                            <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium shadow-sm z-10"
                                style={{ backgroundColor: socket.myIdentity.color, color: 'white' }}>
                                {socket.myIdentity.displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        {/* Render Remote Users */}
                        {Object.values(socket?.remoteUsers || {}).slice(0, 3).map((u, i) => (
                            <div key={u.userId || i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium shadow-sm"
                                style={{ backgroundColor: u.color || `hsl(${i * 60}, 70%, 90%)`, color: 'white' }}>
                                {(u.displayName || 'G').charAt(0).toUpperCase()}
                            </div>
                        ))}
                        {Object.keys(socket?.remoteUsers || {}).length > 3 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-neutral-50 flex items-center justify-center text-[10px] font-bold text-neutral-500 shadow-sm z-0 relative">
                                +{Object.keys(socket?.remoteUsers || {}).length - 3}
                            </div>
                        )}
                    </div>

                    {/* Hover Dropdown Presence Panel */}
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-neutral-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right group-hover:translate-y-0 translate-y-2 z-50 p-2 pointer-events-none">
                        <div className="text-[10px] font-bold tracking-wider text-neutral-400 mb-2 px-2 pt-1 uppercase">Currently in Board</div>
                        <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                            {/* Me */}
                            {socket?.myIdentity && (
                                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-100/50 transition-colors">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: socket.myIdentity.color }} />
                                    <span className="text-sm font-medium text-neutral-800">{socket.myIdentity.displayName} <span className="text-neutral-400 font-normal">(You)</span></span>
                                </div>
                            )}
                            {/* Others */}
                            {Object.values(socket?.remoteUsers || {}).map(u => (
                                <div key={u.userId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-100/50 transition-colors">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: u.color || '#cbd5e1' }} />
                                    <span className="text-sm font-medium text-neutral-600">{u.displayName || 'Guest'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {!isLocal && (
                    <div title={actualIsOwner ? "Share" : "Board Access"}>
                        <Button
                            className={`h-9 px-4 shadow-sm rounded-full font-medium transition-all ${actualIsOwner ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'} flex items-center gap-2`}
                            onClick={() => setIsShareModalOpen(true)}
                        >
                            {isLive && <div className={`w-2 h-2 rounded-full animate-pulse ${actualIsOwner ? 'bg-white/40' : 'bg-green-500'}`}></div>}
                            Share
                        </Button>
                    </div>
                )}
            </div>

            <ShareDialog
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                boardName={boardName || "Untitled"}
                isLive={isLive}
                onToggleLive={onToggleLive}
                linkAccess={linkAccess}
                onUpdateAccess={onUpdateAccess}
                activeUsers={
                    socket?.myIdentity ? [socket.myIdentity, ...Object.values(socket.remoteUsers || {})] : []
                }
                isOwner={actualIsOwner}
                isLoggedIn={isLoggedIn}
            />

            {/* BOTTOM CENTER: FLOATING TOOLBAR */}
            {canEdit && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                    <Toolbar
                        activeTool={activeTool}
                        onToolChange={setActiveTool}
                        orientation="horizontal"
                    />
                </div>
            )}

            {/* BOTTOM LEFT: AI PROMPT BAR */}
            {canEdit && <AIPromptBar onInsertShapes={insertShapes} onAddToLibrary={onAddToLibrary} />}

            {/* FLOATING PROPERTIES PANEL (Contextual) - Conditional */}
            {!disablePropertyPanel && canEdit && selectedElement && (
                <div className="absolute top-20 right-4 z-20 w-72 pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-200 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide">
                    <Sidebar
                        selectedElement={selectedElement}
                        updateElement={updateSelectedElement}
                        layerActions={layerActions}
                        groupActions={groupActions}
                        onAddToLibrary={() => {
                            // Extract shapes from selection
                            if (!onAddToLibrary || !selectedElement) return;

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
            <CursorOverlay
                cursors={Object.values(socket?.remoteCursors || {})}
                viewport={viewport || { x: 0, y: 0, zoom: 1 }}
            />
            <SelectionOverlay
                selections={Object.values(socket?.remoteSelections || {})}
                shapes={customShapes || []}
                viewport={viewport || { x: 0, y: 0, zoom: 1 }}
            />

            {editingShapeId && customShapes && (() => {
                const shape = customShapes.find(s => s.id === editingShapeId);
                if (!shape) return null;
                return (
                    <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
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
            })()}

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
            {canEdit && (
                <div className="absolute bottom-6 left-6 z-40 flex gap-2 pointer-events-auto">
                    <div className="bg-white/95 backdrop-blur-md border border-neutral-200/60 shadow-lg rounded-xl flex items-center p-1.5 gap-1.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 hover:bg-neutral-100/80 rounded-lg transition-all active:scale-90"
                            onClick={handleUndo}
                            disabled={!canUndo}
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo className="w-5 h-5 text-neutral-700" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 hover:bg-neutral-100/80 rounded-lg transition-all active:scale-90"
                            onClick={handleRedo}
                            disabled={!canRedo}
                            title="Redo (Ctrl+Y)"
                        >
                            <Redo className="w-5 h-5 text-neutral-700" />
                        </Button>
                    </div>
                </div>
            )}

            {/* COMMAND HINT (Bottom left, right of undo/redo) */}
            <div className="absolute bottom-6 left-32 z-40 pointer-events-auto flex items-center px-4 py-1 bg-white/70 backdrop-blur-md rounded-xl border border-neutral-200/50 text-xs text-neutral-500 font-medium font-mono select-none h-11 shadow-sm">
                ⌘K
            </div>

        </div>
    );
}