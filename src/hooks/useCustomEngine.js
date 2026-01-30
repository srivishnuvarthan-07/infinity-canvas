import { useRef, useEffect, useState, useCallback } from 'react';
import { CanvasRenderer } from '@/engine/render/CanvasRenderer';
import { FabricAdapter } from '@/engine/adapter/FabricAdapter';
import { hitTest, hitTestControls } from '@/engine/physics/hitTest';

import { createBaseSchema, SHAPE_TYPES } from '@/engine/schema';
import { calculateResize, calculateRotation } from '@/engine/physics/resize';
// import { v4 as uuidv4 } from 'uuid'; // Not installed, using crypto.randomUUID()

export function useCustomEngine(fabricCanvas, {
    activeTool,
    setActiveTool, // Added for tool management
    activeColor,
    strokeWidth,
    strokeStyle,
    sloppiness
} = {}) {
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);
    const [shapes, setShapes] = useState([]);
    const [hoveredShapeId, setHoveredShapeId] = useState(null);
    const [selectedShapeId, setSelectedShapeId] = useState(null);
    const frameIdRef = useRef(null);

    // Drag State
    // Drag & Resize State
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [activeHandle, setActiveHandle] = useState(null); // 'tl', 'tr', 'br', etc.
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // Used for Drag AND Creation Start Point
    const [startDimensions, setStartDimensions] = useState(null); // { x, y, width, height, rotation }

    // History State
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Save State Helper
    const saveState = useCallback((newShapes) => {
        const snapshot = JSON.parse(JSON.stringify(newShapes));
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(snapshot);
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            setShapes(history[historyIndex - 1]);
        }
    }, [history, historyIndex]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            setShapes(history[historyIndex + 1]);
        }
    }, [history, historyIndex]);

    // Initialize Renderer
    useEffect(() => {
        if (!canvasRef.current) return;
        rendererRef.current = new CanvasRenderer(canvasRef.current);

        // Initial resize
        const parent = canvasRef.current.parentElement;
        if (parent) {
            rendererRef.current.resize(parent.clientWidth, parent.clientHeight);
        }

        return () => {
            // Cleanup if needed
        };
    }, []);

    // Interaction Handlers
    const handlePointerMove = useCallback((e) => {
        if (!canvasRef.current || !rendererRef.current) return;


        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 0. Handle Creation (Resize the new shape)
        if (isCreating && selectedShapeId) {
            setShapes(prevShapes => prevShapes.map(shape => {
                if (shape.id === selectedShapeId) {
                    const startX = dragOffset.startX; // Should have been set on Down
                    const startY = dragOffset.startY;

                    let newX = startX;
                    let newY = startY;
                    let width = x - startX;
                    let height = y - startY;

                    if (shape.type === SHAPE_TYPES.LINE) {
                        // specialized logic for line if needed, or just width/height
                        // For line, width/height are end points relative to x,y usually?
                        // Or we use width/height as delta.
                        // Let's assume standard behavior:
                        // Center = (startX + x)/2, Size = abs(width, height)
                    }

                    // Standard "Drag to Create" behavior:
                    // Anchor is startX, startY. Current is x,y.
                    // Shape X,Y is usually Center.

                    const left = Math.min(startX, x);
                    const top = Math.min(startY, y);
                    const w = Math.abs(x - startX);
                    const h = Math.abs(y - startY);

                    return {
                        ...shape,
                        x: left + w / 2,
                        y: top + h / 2,
                        width: w,
                        height: h
                    };
                }
                return shape;
            }));
            return;
        }

        // 0. Handle Resizing & Rotation
        if (isResizing && selectedShapeId && activeHandle) {
            setShapes(prevShapes => prevShapes.map(shape => {
                if (shape.id === selectedShapeId) {

                    if (activeHandle === 'rot') {
                        const newRotation = calculateRotation(shape, x, y);
                        return { ...shape, rotation: newRotation };
                    }

                    console.log('[CustomEngine] Resizing handle:', activeHandle); // DEBUG LOG

                    const updates = calculateResize(
                        shape,
                        activeHandle,
                        x,
                        y,
                        {
                            ...startDimensions,
                            startMouseX: dragOffset.startX,
                            startMouseY: dragOffset.startY
                        }
                    );

                    if (updates) {
                        return { ...shape, ...updates };
                    }
                }
                return shape;
            }));
            canvasRef.current.style.cursor = activeHandle === 'rot' ? 'grabbing' : 'nwse-resize';
            return;
        }

        // 1. Handle Dragging
        if (isDragging && selectedShapeId) {
            setShapes(prevShapes => prevShapes.map(shape => {
                if (shape.id === selectedShapeId) {
                    return {
                        ...shape,
                        x: x - dragOffset.x,
                        y: y - dragOffset.y
                    };
                }
                return shape;
            }));

            canvasRef.current.style.cursor = 'grabbing';
            return;
        }

        // 2. Handle Hover (only if not dragging)
        // Check for controls first if something is selected
        let cursor = 'default';
        if (selectedShapeId) {
            const selectedShape = shapes.find(s => s.id === selectedShapeId);
            // Assuming hitTestControls is defined elsewhere or will be added
            const hitTestControls = (shape, x, y) => {
                // Placeholder for actual control hit test logic
                // For now, let's just return 'br' if within a small area around bottom-right corner
                if (!shape) return null;
                const buffer = 5; // Hit test buffer
                const halfWidth = shape.width / 2;
                const halfHeight = shape.height / 2;

                // Transform mouse coordinates to shape's local space
                const cos = Math.cos(shape.rotation * Math.PI / 180);
                const sin = Math.sin(shape.rotation * Math.PI / 180);

                const translatedX = x - shape.x;
                const translatedY = y - shape.y;

                const localX = translatedX * cos + translatedY * sin;
                const localY = -translatedX * sin + translatedY * cos;

                // Check bottom-right handle (local coordinates)
                if (localX >= halfWidth - buffer && localX <= halfWidth + buffer &&
                    localY >= halfHeight - buffer && localY <= halfHeight + buffer) {
                    return 'br';
                }
                // Check middle-right handle
                if (localX >= halfWidth - buffer && localX <= halfWidth + buffer &&
                    localY >= -buffer && localY <= buffer) { // Centered vertically
                    return 'mr';
                }
                return null;
            };
            const handle = hitTestControls(selectedShape, x, y);
            if (handle) {
                cursor = 'pointer'; // TODO: specific cursors
            }
        }

        if (cursor === 'default') {
            let hitShape = null;
            for (let i = shapes.length - 1; i >= 0; i--) {
                if (hitTest(shapes[i], x, y)) {
                    hitShape = shapes[i];
                    break;
                }
            }
            if (hitShape) cursor = 'move';
            setHoveredShapeId(hitShape ? hitShape.id : null);
        } else {
            setHoveredShapeId(null);
        }

        canvasRef.current.style.cursor = cursor;
    }, [shapes, isDragging, isResizing, selectedShapeId, dragOffset, activeHandle, startDimensions]);

    const handlePointerDown = useCallback((e) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        console.log('[CustomEngine] Pointer Down:', x, y, 'Shapes:', shapes.length);
        console.log('[CustomEngine] Active Tool:', activeTool);

        // 0. Check for Creation Mode
        if (activeTool && activeTool !== 'select' && activeTool !== 'hand') {
            // Start Creation
            const id = crypto.randomUUID();
            let type = null;

            // Map tool to shape type
            switch (activeTool) {
                case 'rectangle': type = SHAPE_TYPES.RECTANGLE; break;
                case 'ellipse': type = SHAPE_TYPES.ELLIPSE; break;
                case 'line': type = SHAPE_TYPES.LINE; break;
                case 'diamond': type = SHAPE_TYPES.DIAMOND; break;
                case 'text': type = SHAPE_TYPES.TEXT; break;
            }

            if (type) {
                const newShape = createBaseSchema(id, type, x, y);

                if (type === SHAPE_TYPES.TEXT) {
                    newShape.text = 'Double click to edit'; // Default text
                    newShape.fontSize = 20;
                    newShape.width = 200; // Approx width
                    newShape.height = 30;

                    // Text is point creation usually
                    setShapes(prev => {
                        const updated = [...prev, newShape];
                        saveState(updated); // Save immediately
                        return updated;
                    });
                    setSelectedShapeId(id);
                    // Don't enter drag creation mode for text
                    if (setActiveTool) setActiveTool('select');
                    return;
                }

                // Apply current styles
                newShape.width = 0;
                newShape.height = 0;
                newShape.strokeColor = activeColor;
                newShape.strokeWidth = strokeWidth;
                newShape.strokeStyle = strokeStyle;
                // newShape.sloppiness = sloppiness; 

                setShapes(prev => [...prev, newShape]);
                setSelectedShapeId(id);
                setIsCreating(true);
                setDragOffset({ startX: x, startY: y });
                canvasRef.current.setPointerCapture(e.pointerId);
                return;
            }
        }

        // 1. Check Controls on Selected Shape
        if (selectedShapeId) {
            const selectedShape = shapes.find(s => s.id === selectedShapeId);
            // Assuming hitTestControls is defined elsewhere or will be added
            const hitTestControls = (shape, x, y) => {
                // Placeholder for actual control hit test logic
                // For now, let's just return 'br' if within a small area around bottom-right corner
                if (!shape) return null;
                const buffer = 5; // Hit test buffer
                const halfWidth = shape.width / 2;
                const halfHeight = shape.height / 2;

                // Transform mouse coordinates to shape's local space
                const cos = Math.cos(shape.rotation * Math.PI / 180);
                const sin = Math.sin(shape.rotation * Math.PI / 180);

                const translatedX = x - shape.x;
                const translatedY = y - shape.y;

                const localX = translatedX * cos + translatedY * sin;
                const localY = -translatedX * sin + translatedY * cos;

                // Check bottom-right handle (local coordinates)
                if (localX >= halfWidth - buffer && localX <= halfWidth + buffer &&
                    localY >= halfHeight - buffer && localY <= halfHeight + buffer) {
                    return 'br';
                }
                // Check middle-right handle
                if (localX >= halfWidth - buffer && localX <= halfWidth + buffer &&
                    localY >= -buffer && localY <= buffer) { // Centered vertically
                    return 'mr';
                }
                return null;
            };
            const handle = hitTestControls(selectedShape, x, y);
            console.log('[CustomEngine] Hit handle:', handle); // DEBUG LOG
            if (handle) {
                setIsResizing(true);
                setActiveHandle(handle);
                setDragOffset({ startX: x, startY: y });
                setStartDimensions({
                    x: selectedShape.x,
                    y: selectedShape.y,
                    width: selectedShape.width,
                    height: selectedShape.height,
                    rotation: selectedShape.rotation
                });
                canvasRef.current.setPointerCapture(e.pointerId);
                return;
            }
        }

        // 2. Hit Test Shapes
        let hitShape = null;
        for (let i = shapes.length - 1; i >= 0; i--) {
            if (hitTest(shapes[i], x, y)) {
                hitShape = shapes[i];
                console.log('[CustomEngine] Hit Shape:', hitShape.id);
                break;
            }
        }

        if (hitShape) {
            setSelectedShapeId(hitShape.id);
            setIsDragging(true);
            setDragOffset({
                x: x - hitShape.x,
                y: y - hitShape.y
            });
            canvasRef.current.style.cursor = 'grabbing';
            // Explicitly capture pointer if possible for smoother drag
            if (canvasRef.current.setPointerCapture) {
                canvasRef.current.setPointerCapture(e.pointerId);
            }
        } else {
            setSelectedShapeId(null);
        }
    }, [shapes, selectedShapeId, activeTool, activeColor, strokeWidth, strokeStyle, saveState]);

    const handlePointerUp = useCallback((e) => {
        if (isCreating) {
            // Finalize creation
            // Filter out tiny shapes?
            setShapes(prev => {
                const newShapes = prev.filter(s => {
                    if (s.id === selectedShapeId) {
                        return s.width > 5 || s.height > 5;
                    }
                    return true;
                });

                // Save History
                saveState(newShapes);
                return newShapes;
            });
        } else if (isDragging || isResizing) {
            // Save History on Drag/Resize End
            saveState(shapes);
        }

        setIsDragging(false);
        setIsResizing(false);
        setIsCreating(false);
        setActiveHandle(null);

        if (canvasRef.current && canvasRef.current.releasePointerCapture) {
            canvasRef.current.releasePointerCapture(e.pointerId);
        }
        canvasRef.current.style.cursor = 'default';

        // Auto-switch to select tool after creation (Standard UX)
        if (isCreating && setActiveTool) {
            setActiveTool('select');
        }

    }, [isCreating, selectedShapeId, setActiveTool, shapes, isDragging, isResizing, saveState]);

    // Attach Listeners
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener('pointermove', handlePointerMove);
        canvas.addEventListener('pointerdown', handlePointerDown);
        canvas.addEventListener('pointerup', handlePointerUp);
        // canvas.addEventListener('pointerleave', handlePointerUp); // Optional, but pointer capture handles this better

        return () => {
            canvas.removeEventListener('pointermove', handlePointerMove);
            canvas.removeEventListener('pointerdown', handlePointerDown);
            canvas.removeEventListener('pointerup', handlePointerUp);
            // canvas.removeEventListener('pointerleave', handlePointerUp);
        };
    }, [handlePointerMove, handlePointerDown, handlePointerUp]);

    // State Refs for Render Loop (to avoid stale closures)
    const shapesRef = useRef(shapes);
    const hoveredIdRef = useRef(hoveredShapeId);
    const selectedIdRef = useRef(selectedShapeId);

    useEffect(() => { shapesRef.current = shapes; }, [shapes]);
    useEffect(() => { hoveredIdRef.current = hoveredShapeId; }, [hoveredShapeId]);
    useEffect(() => { selectedIdRef.current = selectedShapeId; }, [selectedShapeId]);

    // Initialize Renderer & ResizeObserver
    useEffect(() => {
        if (!canvasRef.current) return;
        rendererRef.current = new CanvasRenderer(canvasRef.current);

        // Resize Observer to handle display:none -> display:block transitions
        const parent = canvasRef.current.parentElement;
        let resizeObserver;

        if (parent) {
            const handleResize = () => {
                if (parent.clientWidth > 0 && parent.clientHeight > 0) {
                    rendererRef.current.resize(parent.clientWidth, parent.clientHeight);
                    // Force a render if not running?
                    if (!frameIdRef.current) render();
                }
            };

            // Initial check
            handleResize();

            resizeObserver = new ResizeObserver(() => {
                handleResize();
            });
            resizeObserver.observe(parent);
        }

        return () => {
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, []);

    // Render Loop
    const render = useCallback(() => {
        if (!rendererRef.current) return;

        // Use Refs for all mutable state used in the loop
        rendererRef.current.render(shapesRef.current, {
            hoveredId: hoveredIdRef.current,
            selectedId: selectedIdRef.current
        });

        frameIdRef.current = requestAnimationFrame(render);
    }, []); // No dependencies needed as we use refs

    const start = useCallback(() => {
        console.log('[CustomEngine] Starting Render Loop');
        // Ensure we're not running duplicates
        if (!frameIdRef.current) {
            render();
        }
    }, [render]);

    const stop = useCallback(() => {
        if (frameIdRef.current) {
            cancelAnimationFrame(frameIdRef.current);
            frameIdRef.current = null;
        }
    }, []);

    // Sync: Fabric -> Engine
    const syncFromFabric = useCallback(() => {
        if (!fabricCanvas) return;

        // This is a "Stop the world" sync for now
        const fabricObjects = fabricCanvas.getObjects();
        const newShapes = fabricObjects.map(obj => FabricAdapter.fromFabric(obj)).filter(Boolean);

        console.log('[CustomEngine] Syncing from Fabric. Objects:', newShapes.length, newShapes);
        setShapes(newShapes);

        // Reset History
        setHistory([newShapes]);
        setHistoryIndex(0);

        // Also sync viewport if possible (zoom/pan)
        // For now, we assume reset viewport or we need to extract it
    }, [fabricCanvas]);

    // Sync: Engine -> Fabric
    const syncToFabric = useCallback(() => {
        if (!fabricCanvas) return;

        fabricCanvas.clear();
        fabricCanvas.backgroundColor = "transparent"; // Ensure transparent

        shapes.forEach(schema => {
            const fabricObj = FabricAdapter.toFabric(schema);
            if (fabricObj) {
                fabricCanvas.add(fabricObj);
            }
        });

        fabricCanvas.requestRenderAll();
    }, [fabricCanvas, shapes]);

    return {
        customCanvasRef: canvasRef,
        start,
        stop,
        syncFromFabric,
        syncToFabric,
        setShapes,
        selectedShapeId,
        hoveredShapeId,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        saveState // Expose to auto-save on end of interactions
    };
}
