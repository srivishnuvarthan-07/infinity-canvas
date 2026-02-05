import { useRef, useEffect, useState, useCallback } from 'react';
import { CanvasRenderer } from '@/engine/render/CanvasRenderer';
import { hitTest, hitTestControls } from '@/engine/physics/hitTest';

import { createBaseSchema, SHAPE_TYPES } from '@/engine/schema';
import { calculateResize, calculateRotation } from '@/engine/physics/resize';
import { measureTextShape } from '@/engine/utils/textUtils';
// import { v4 as uuidv4 } from 'uuid'; // Not installed, using crypto.randomUUID()

export function useCustomEngine({
    activeTool,
    setActiveTool,
    activeColor,
    strokeWidth,
    strokeStyle,
    sloppiness
} = {}) {
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);
    const [shapes, setShapes] = useState([]);
    const [hoveredShapeId, setHoveredShapeId] = useState(null);
    const [selectedShapeIds, setSelectedShapeIds] = useState(new Set());
    const [editingShapeId, setEditingShapeId] = useState(null);
    const frameIdRef = useRef(null);

    // Drag State
    // Drag & Resize State
    const [isDragging, setIsDragging] = useState(false);
    const [isDragSelecting, setIsDragSelecting] = useState(false); // New: Box Selection
    const [selectionBox, setSelectionBox] = useState(null); // { startX, startY, width, height }
    const [isResizing, setIsResizing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [activeHandle, setActiveHandle] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // OLD: Single drag offset
    const [dragStartPos, setDragStartPos] = useState(null); // { x, y } World
    const [initialShapePositions, setInitialShapePositions] = useState(new Map()); // Map<id, {x,y}>
    const [startDimensions, setStartDimensions] = useState(null);

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

    // Viewport State (Camera)
    const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
    const isPanning = useRef(false);
    const lastPanPos = useRef({ x: 0, y: 0 });
    const isSpacePressed = useRef(false);

    // Coordinate Conversion Helpers
    const toWorld = useCallback((screenX, screenY) => {
        return {
            x: (screenX - viewport.x) / viewport.zoom,
            y: (screenY - viewport.y) / viewport.zoom
        };
    }, [viewport]);

    const toScreen = useCallback((worldX, worldY) => {
        return {
            x: worldX * viewport.zoom + viewport.x,
            y: worldY * viewport.zoom + viewport.y
        };
    }, [viewport]);

    // Initialize Renderer
    useEffect(() => {
        console.log('[CustomEngine] Init Effect. CanvasRef:', canvasRef.current);
        if (!canvasRef.current) {
            console.error('[CustomEngine] CanvasRef is null during init!');
            return;
        }
        rendererRef.current = new CanvasRenderer(canvasRef.current);
        console.log('[CustomEngine] Renderer initialized');

        // Initial resize
        const parent = canvasRef.current.parentElement;
        if (parent) {
            rendererRef.current.resize(parent.clientWidth, parent.clientHeight);
        }

        const handleKeyDown = (e) => {
            if (e.code === "Space") {
                isSpacePressed.current = true;
                if (canvasRef.current) canvasRef.current.style.cursor = "grab";
            }
        };
        const handleKeyUp = (e) => {
            if (e.code === "Space") {
                isSpacePressed.current = false;
                if (canvasRef.current) canvasRef.current.style.cursor = "default";
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            // Cleanup if needed
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    // Interaction Handlers

    const handleWheel = useCallback((e) => {
        e.preventDefault(); // Prevent browser zoom
        e.stopPropagation();

        if (e.ctrlKey || e.metaKey) {
            // ZOOM
            const rect = canvasRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // 1. Calculate World Point before zoom (Cursor pivot)
            const worldX = (mouseX - viewport.x) / viewport.zoom;
            const worldY = (mouseY - viewport.y) / viewport.zoom;

            // 2. Calculate new Zoom
            let newZoom = viewport.zoom;
            // Sensitivity
            newZoom *= e.deltaY > 0 ? 0.95 : 1.05;
            newZoom = Math.min(Math.max(newZoom, 0.1), 10); // Clamp

            // 3. Calculate new Viewport Position to keep mouse pivot stable
            // mouseX = worldX * newZoom + newViewportX
            // newViewportX = mouseX - worldX * newZoom
            const newViewportX = mouseX - worldX * newZoom;
            const newViewportY = mouseY - worldY * newZoom;

            setViewport({ x: newViewportX, y: newViewportY, zoom: newZoom });
        } else {
            // PAN
            let deltaX = e.deltaX;
            let deltaY = e.deltaY;

            // Support Shift+Scroll for horizontal panning on standard mice
            // If shift is held and we have vertical scroll but no horizontal scroll, swap them
            if (e.shiftKey && deltaY !== 0 && Math.abs(deltaX) === 0) {
                deltaX = deltaY;
                deltaY = 0;
            }

            setViewport(prev => ({
                ...prev,
                x: prev.x - deltaX,
                y: prev.y - deltaY
            }));
        }
    }, [viewport]);

    // Manual Zoom Controls
    const zoomIn = useCallback(() => {
        setViewport(prev => {
            const newZoom = Math.min(prev.zoom + 0.1, 5);
            // Zoom to center (simplified)
            // Ideally should zoom to screen center, but for button click, center is fine.
            // But we need to adjust x/y to keep center stable?
            // For now, naive zoom (top-left pivot) is jarring.
            // Let's try to zoom into center of canvas.
            if (!canvasRef.current) return { ...prev, zoom: newZoom };

            const rect = canvasRef.current.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // World at center
            const worldX = (centerX - prev.x) / prev.zoom;
            const worldY = (centerY - prev.y) / prev.zoom;

            // New Viewport
            const newX = centerX - worldX * newZoom;
            const newY = centerY - worldY * newZoom;

            return { x: newX, y: newY, zoom: newZoom };
        });
    }, []);

    const zoomOut = useCallback(() => {
        setViewport(prev => {
            const newZoom = Math.max(prev.zoom - 0.1, 0.1);
            if (!canvasRef.current) return { ...prev, zoom: newZoom };

            const rect = canvasRef.current.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const worldX = (centerX - prev.x) / prev.zoom;
            const worldY = (centerY - prev.y) / prev.zoom;

            const newX = centerX - worldX * newZoom;
            const newY = centerY - worldY * newZoom;

            return { x: newX, y: newY, zoom: newZoom };
        });
    }, []);

    const resetZoom = useCallback(() => {
        setViewport({ x: 0, y: 0, zoom: 1 });
    }, []);
    const handlePointerMove = useCallback((e) => {
        if (!canvasRef.current || !rendererRef.current) return;


        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // PANNING
        if (isPanning.current) {
            const dx = screenX - lastPanPos.current.x;
            const dy = screenY - lastPanPos.current.y;

            setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            lastPanPos.current = { x: screenX, y: screenY };
            return;
        }

        const { x, y } = toWorld(screenX, screenY);

        // ERASER
        if (activeTool === 'eraser') {
            canvasRef.current.style.cursor = 'crosshair';
            if (isErasing.current) {
                // Try to delete shape under cursor
                let hitShape = null;
                for (let i = shapes.length - 1; i >= 0; i--) {
                    if (hitTest(shapes[i], x, y, viewport.zoom)) {
                        hitShape = shapes[i];
                        break;
                    }
                }

                if (hitShape) {
                    setShapes(prev => prev.filter(s => s.id !== hitShape.id));
                }
            }
            // Don't process other hover/drag logic
            setHoveredShapeId(null);
            return;
        }

        // 0. Handle Creation (Resize the new shape)
        if (isCreating && selectedShapeIds.size > 0) {
            const creationId = [...selectedShapeIds][0]; // Creation is always single
            setShapes(prevShapes => prevShapes.map(shape => {
                if (shape.id === creationId) {
                    const startX = dragOffset.startX;
                    const startY = dragOffset.startY;

                    // A. PENCIL: Append Points
                    if (shape.type === SHAPE_TYPES.PENCIL) {
                        return {
                            ...shape,
                            points: [...(shape.points || []), { x: x - startX, y: y - startY }]
                        };
                    }

                    // B. LINE / ARROW: Vector Logic (Start -> End)
                    if (shape.type === SHAPE_TYPES.LINE || shape.type === SHAPE_TYPES.ARROW) {
                        const newPoints = [
                            { x: 0, y: 0 },
                            { x: x - startX, y: y - startY }
                        ];
                        return { ...shape, points: newPoints, width: 0, height: 0 };
                    }

                    // C. BOX SHAPES (Rect, Ellipse, Diamond, Text)
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

        // 0. Handle Resizing & Rotation (Single Select Only for now)
        if (isResizing && selectedShapeIds.size === 1 && activeHandle) {
            const resizeId = [...selectedShapeIds][0];
            setShapes(prevShapes => prevShapes.map(shape => {
                if (shape.id === resizeId) {

                    if (activeHandle === 'rot') {
                        const newRotation = calculateRotation(shape, x, y);
                        return { ...shape, rotation: newRotation };
                    }

                    // Two-Point Resizing (Line/Arrow)
                    if (shape.type === SHAPE_TYPES.LINE || shape.type === SHAPE_TYPES.ARROW) {
                        if (activeHandle === 'end') {
                            const dx = x - shape.x;
                            const dy = y - shape.y;
                            const rad = -(shape.rotation * Math.PI) / 180;
                            const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
                            const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
                            return { ...shape, points: [shape.points[0], { x: rx, y: ry }] };
                        }

                        if (activeHandle === 'start') {
                            // Moving P0.
                            const oldP1Local = shape.points[1];
                            const rad = (shape.rotation * Math.PI) / 180;
                            const oldP1GlobalX = shape.x + (oldP1Local.x * Math.cos(rad) - oldP1Local.y * Math.sin(rad));
                            const oldP1GlobalY = shape.y + (oldP1Local.x * Math.sin(rad) + oldP1Local.y * Math.cos(rad));

                            const newX = x;
                            const newY = y;

                            const dx = oldP1GlobalX - newX;
                            const dy = oldP1GlobalY - newY;
                            const unRad = -rad;
                            const newP1LocalX = dx * Math.cos(unRad) - dy * Math.sin(unRad);
                            const newP1LocalY = dx * Math.sin(unRad) + dy * Math.cos(unRad);

                            return { ...shape, x: newX, y: newY, points: [{ x: 0, y: 0 }, { x: newP1LocalX, y: newP1LocalY }] };
                        }
                    }

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
                        if (shape.type === SHAPE_TYPES.PENCIL && startDimensions && startDimensions.points) {
                            const scaleX = updates.width / startDimensions.width;
                            const scaleY = updates.height / startDimensions.height;
                            const newPoints = startDimensions.points.map(p => ({
                                x: p.x * scaleX,
                                y: p.y * scaleY
                            }));
                            return { ...shape, ...updates, points: newPoints };
                        }
                        return { ...shape, ...updates };
                    }
                }
                return shape;
            }));
            canvasRef.current.style.cursor = activeHandle === 'rot' ? 'grabbing' : 'nwse-resize';
            return;
        }

        // 1. Handle Dragging (Multi logic)
        if (isDragging && selectedShapeIds.size > 0 && dragStartPos) {
            const dx = x - dragStartPos.x;
            const dy = y - dragStartPos.y;

            setShapes(prevShapes => prevShapes.map(shape => {
                if (initialShapePositions.has(shape.id)) {
                    const startPos = initialShapePositions.get(shape.id);
                    return {
                        ...shape,
                        x: startPos.x + dx,
                        y: startPos.y + dy
                    };
                }
                return shape;
            }));

            canvasRef.current.style.cursor = 'grabbing';
            return;
        }

        // 1.5 Handle Drag Selection
        if (isDragSelecting) {
            setSelectionBox(prev => ({ ...prev, currentX: x, currentY: y }));
            return;
        }

        // 2. Handle Hover (only if not dragging)
        let cursor = 'default';

        // Only check controls if single selection
        if (selectedShapeIds.size === 1) {
            const [id] = selectedShapeIds;
            const selectedShape = shapes.find(s => s.id === id);
            if (selectedShape) {
                const handle = hitTestControls(selectedShape, x, y, viewport.zoom);
                if (handle) {
                    cursor = 'pointer';
                    if (handle === 'rot') cursor = 'grabbing';
                }
            }
        }

        if (cursor === 'default') {
            let hitShape = null;
            for (let i = shapes.length - 1; i >= 0; i--) {
                if (hitTest(shapes[i], x, y, viewport.zoom)) {
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
    }, [shapes, isDragging, isResizing, selectedShapeIds, dragOffset, activeHandle, startDimensions, toWorld, viewport.zoom]);

    const handlePointerDown = useCallback((e) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const { x, y } = toWorld(screenX, screenY);

        console.log('[CustomEngine] Pointer Down:', x, y, 'Shapes:', shapes.length);
        console.log('[CustomEngine] Active Tool:', activeTool);


        // 0. Eraser Mode
        if (activeTool === 'eraser') {
            isErasing.current = true;
            canvasRef.current.style.cursor = 'crosshair';

            // Initial Erase
            let hitShape = null;
            // Iterate in reverse render order (top-most first)
            for (let i = shapes.length - 1; i >= 0; i--) {
                if (hitTest(shapes[i], x, y, viewport.zoom)) {
                    hitShape = shapes[i];
                    break;
                }
            }

            if (hitShape) {
                setShapes(prev => prev.filter(s => s.id !== hitShape.id));
                // Note: We don't save state on every Move delete, only on Up.
                // But for Down we should save? Or just let Up handle it.
                // Consistent with Move: Up handles "session" save.
            }
            return;
        }

        // 0. Panning Mode (Spacebar or Middle Mouse)
        if (isSpacePressed.current || activeTool === 'hand' || e.button === 1) {
            isPanning.current = true;
            lastPanPos.current = { x: screenX, y: screenY };
            canvasRef.current.style.cursor = 'grabbing';
            return;
        }

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
                case 'arrow': type = SHAPE_TYPES.ARROW; break;
                case 'pencil': type = SHAPE_TYPES.PENCIL; break;
                case 'draw': type = SHAPE_TYPES.PENCIL; break; // Alias
            }

            if (type) {
                console.log('[CustomEngine] Creating Shape:', type, 'ID:', id);
                const newShape = createBaseSchema(id, type, x, y);

                // Init Points for Line/Arrow/Pencil
                if (type === SHAPE_TYPES.LINE || type === SHAPE_TYPES.ARROW) {
                    newShape.points = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
                } else if (type === SHAPE_TYPES.PENCIL) {
                    newShape.points = [{ x: 0, y: 0 }];
                }

                if (type === SHAPE_TYPES.TEXT) {
                    console.log('[CustomEngine] Creating Text Shape', id);
                    newShape.text = 'Double click to edit'; // Default text
                    newShape.fontSize = 20;
                    newShape.textAlign = 'center';

                    if (canvasRef.current) {
                        try {
                            const ctx = canvasRef.current.getContext('2d');
                            const { width, height } = measureTextShape(ctx, newShape);
                            newShape.width = width;
                            newShape.height = height;
                            console.log('[CustomEngine] Measured Text:', width, height);
                        } catch (err) {
                            console.error('[CustomEngine] Text creation error during measurement:', err);
                            newShape.width = 100; // Fallback width
                            newShape.height = 20; // Fallback height
                        }
                    } else {
                        newShape.width = 200;
                        newShape.height = 30;
                    }

                    // Text is point creation usually - Just click to place
                    setShapes(prev => {
                        const updated = [...prev, newShape];
                        saveState(updated); // Save immediately
                        return updated;
                    });
                    setSelectedShapeIds(new Set([id]));
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
                setSelectedShapeIds(new Set([id]));
                setIsCreating(true);
                setDragOffset({ startX: x, startY: y });
                canvasRef.current.setPointerCapture(e.pointerId);
                return;
            }
        }

        // 1. Check Controls on Selected Shape (Only if 1 selected)
        if (selectedShapeIds.size === 1) {
            const [id] = selectedShapeIds;
            const selectedShape = shapes.find(s => s.id === id);
            if (selectedShape) {
                const handle = hitTestControls(selectedShape, x, y, viewport.zoom);
                if (handle) {
                    setIsResizing(true);
                    setActiveHandle(handle);
                    setDragOffset({ startX: x, startY: y });
                    setStartDimensions({
                        x: selectedShape.x,
                        y: selectedShape.y,
                        width: selectedShape.width,
                        height: selectedShape.height,
                        rotation: selectedShape.rotation,
                        points: selectedShape.type === SHAPE_TYPES.PENCIL ? selectedShape.points : undefined // Save initial points
                    });
                    canvasRef.current.setPointerCapture(e.pointerId);
                    return;
                }
            }
        }

        // 2. Hit Test Shapes
        let hitShape = null;
        for (let i = shapes.length - 1; i >= 0; i--) {
            if (hitTest(shapes[i], x, y, viewport.zoom)) {
                hitShape = shapes[i];
                console.log('[CustomEngine] Hit Shape:', hitShape.id);
                break;
            }
        }

        if (hitShape) {
            // Logic for Multi-Select
            if (e.shiftKey) {
                // Toggle
                setSelectedShapeIds(prev => {
                    const next = new Set(prev);
                    if (next.has(hitShape.id)) {
                        next.delete(hitShape.id);
                    } else {
                        next.add(hitShape.id);
                    }
                    return next;
                });
            } else {
                // If hitting one of the already selected shapes, KEEP selection (for dragging group)
                // Unless it's not selected, then select ONLY it
                if (!selectedShapeIds.has(hitShape.id)) {
                    setSelectedShapeIds(new Set([hitShape.id]));
                }
                // If it `has` it, we do nothing to selection, proceed to Drag
            }

            // Start Dragging (Prepare initial positions for ALL selected items)
            // Wait, state update above is async. We need to know who is selected NOW.
            let currentlySelectedIds = new Set(selectedShapeIds);
            if (e.shiftKey) {
                // We just toggled. Re-calc locally for drag init
                if (currentlySelectedIds.has(hitShape.id)) currentlySelectedIds.delete(hitShape.id);
                else currentlySelectedIds.add(hitShape.id);
            } else {
                if (!currentlySelectedIds.has(hitShape.id)) currentlySelectedIds = new Set([hitShape.id]);
            }

            // If we deselected the hit shape via toggle, and it's 0 items, don't drag.
            // But usually we don't drag on deselect.
            if (currentlySelectedIds.size > 0 && currentlySelectedIds.has(hitShape.id)) {
                setIsDragging(true);
                setDragStartPos({ x, y });

                // Store initial positions of all selected shapes
                const initPos = new Map();
                shapes.forEach(s => {
                    if (currentlySelectedIds.has(s.id)) {
                        initPos.set(s.id, { x: s.x, y: s.y });
                    }
                });
                setInitialShapePositions(initPos);

                canvasRef.current.style.cursor = 'grabbing';
                if (canvasRef.current.setPointerCapture) {
                    canvasRef.current.setPointerCapture(e.pointerId);
                }
            }

        } else {
            // Clicked Empty Space
            if (!e.shiftKey) {
                setSelectedShapeIds(new Set());
            }

            // Start Rubber Band Selection
            setIsDragSelecting(true);
            setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y });
            canvasRef.current.setPointerCapture(e.pointerId);
        }
    }, [shapes, selectedShapeIds, activeTool, activeColor, strokeWidth, strokeStyle, saveState, toWorld, viewport.zoom]);



    // Eraser State
    const isErasing = useRef(false);

    // Pointer Up
    const handlePointerUp = useCallback((e) => {
        if (isPanning.current) {
            isPanning.current = false;
            canvasRef.current.style.cursor = isSpacePressed.current ? 'grab' : 'default';
        }

        if (activeTool === 'eraser') {
            isErasing.current = false;
            saveState(shapes); // Save state after erasing session
            return;
        }

        if (isCreating && selectedShapeIds.size > 0) {
            const creationId = [...selectedShapeIds][0];
            // Finalize creation
            setShapes(prev => {
                const newShapes = prev.map(s => {
                    // Normalize Pencil on creation end
                    if (s.id === creationId && s.type === SHAPE_TYPES.PENCIL && s.points) {
                        // Calculate Bounding Box
                        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                        s.points.forEach(p => {
                            minX = Math.min(minX, p.x);
                            minY = Math.min(minY, p.y);
                            maxX = Math.max(maxX, p.x);
                            maxY = Math.max(maxY, p.y);
                        });

                        const w = maxX - minX;
                        const h = maxY - minY;

                        // Current Shape Center is s.x, s.y (which was start pos)
                        const centerX = s.x + minX + w / 2;
                        const centerY = s.y + minY + h / 2;

                        // Shift points to be relative to new Center
                        const newPoints = s.points.map(p => ({
                            x: (s.x + p.x) - centerX,
                            y: (s.y + p.y) - centerY
                        }));

                        return {
                            ...s,
                            x: centerX,
                            y: centerY,
                            width: w,
                            height: h,
                            points: newPoints
                        };
                    }
                    return s;
                }).filter(s => {
                    if (s.id === creationId) {
                        return s.width > 5 || s.height > 5 || (s.type === SHAPE_TYPES.PENCIL && s.points.length > 2);
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
        } else if (isDragSelecting && selectionBox) {
            // Finalize Drag Selection
            const box = selectionBox;
            const x1 = Math.min(box.startX, box.currentX);
            const x2 = Math.max(box.startX, box.currentX);
            const y1 = Math.min(box.startY, box.currentY);
            const y2 = Math.max(box.startY, box.currentY);

            // Find intersecting shapes
            const hitIds = new Set();
            shapes.forEach(s => {
                // Rough AABB Check (Center +/- Half Size)
                // This is simple "intersects" check. 
                // A better check would use exact bounds.
                // shape: cx, cy, w, h
                const sx1 = s.x - s.width / 2;
                const sx2 = s.x + s.width / 2;
                const sy1 = s.y - s.height / 2;
                const sy2 = s.y + s.height / 2;

                if (sx1 < x2 && sx2 > x1 && sy1 < y2 && sy2 > y1) {
                    hitIds.add(s.id);
                }
            });
            setSelectedShapeIds(hitIds);
        }

        setIsDragging(false);
        setIsResizing(false);
        setIsDragSelecting(false);
        setSelectionBox(null);
        setIsCreating(false);
        setActiveHandle(null);

        if (canvasRef.current && canvasRef.current.releasePointerCapture) {
            canvasRef.current.releasePointerCapture(e.pointerId);
        }
        if (!isSpacePressed.current) {
            canvasRef.current.style.cursor = 'default';
        }

        if (isCreating && setActiveTool) {
            setActiveTool('select');
        }

    }, [isCreating, selectedShapeIds, isDragSelecting, selectionBox, setActiveTool, shapes, isDragging, isResizing, activeTool, saveState]);

    // Double Click to Edit Text
    const handleDoubleClick = useCallback((e) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const { x, y } = toWorld(screenX, screenY);

        // Try to find shape at location
        let targetShape = null;

        // Prioritize selection
        if (selectedShapeIds.size > 0) {
            // Check if hit any
            for (const id of selectedShapeIds) {
                const s = shapes.find(sh => sh.id === id);
                if (s && hitTest(s, x, y, viewport.zoom)) {
                    targetShape = s;
                    break;
                }
            }
        }

        if (!targetShape) {
            for (let i = shapes.length - 1; i >= 0; i--) {
                if (hitTest(shapes[i], x, y, viewport.zoom)) {
                    targetShape = shapes[i];
                    break;
                }
            }
        }

        if (targetShape && targetShape.type === SHAPE_TYPES.TEXT) {
            if (!selectedShapeIds.has(targetShape.id)) setSelectedShapeIds(new Set([targetShape.id]));
            setEditingShapeId(targetShape.id);
        }
    }, [shapes, selectedShapeIds, toWorld, viewport.zoom]);

    // Attach Listeners
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener('wheel', handleWheel, { passive: false });
        canvas.addEventListener('pointermove', handlePointerMove);
        canvas.addEventListener('pointerdown', handlePointerDown);
        canvas.addEventListener('pointerup', handlePointerUp);
        canvas.addEventListener('dblclick', handleDoubleClick);

        return () => {
            canvas.removeEventListener('wheel', handleWheel);
            canvas.removeEventListener('pointermove', handlePointerMove);
            canvas.removeEventListener('pointerdown', handlePointerDown);
            canvas.removeEventListener('pointerup', handlePointerUp);
            canvas.removeEventListener('dblclick', handleDoubleClick);
        };
    }, [handlePointerMove, handlePointerDown, handlePointerUp, handleDoubleClick, handleWheel]);

    // State Refs for Render Loop (to avoid stale closures)
    const shapesRef = useRef(shapes);
    const hoveredIdRef = useRef(hoveredShapeId);
    const selectedIdsRef = useRef(selectedShapeIds);
    const editingShapeIdRef = useRef(editingShapeId);
    const viewportRef = useRef(viewport);
    // Ref for Selection Box
    const selectionBoxRef = useRef(selectionBox);

    useEffect(() => { shapesRef.current = shapes; }, [shapes]);
    useEffect(() => { hoveredIdRef.current = hoveredShapeId; }, [hoveredShapeId]);
    useEffect(() => { selectedIdsRef.current = selectedShapeIds; }, [selectedShapeIds]);
    useEffect(() => { editingShapeIdRef.current = editingShapeId; }, [editingShapeId]);
    useEffect(() => { viewportRef.current = viewport; }, [viewport]);
    useEffect(() => { selectionBoxRef.current = selectionBox; }, [selectionBox]);

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
        if (!rendererRef.current) {
            console.warn('[CustomEngine] Render loop skipped: No Renderer');
            return;
        }

        // Don't render the shape being edited (Overlay handles it)
        const shapesToRender = editingShapeIdRef.current
            ? shapesRef.current.filter(s => s.id !== editingShapeIdRef.current)
            : shapesRef.current;


        rendererRef.current.render(shapesToRender, {
            hoveredId: hoveredIdRef.current,
            selectedIds: selectedIdsRef.current, // Pass Set
            selectionBox: selectionBoxRef.current // Pass Drag Box
        }, viewportRef.current); // Use Ref to avoid stale closure

        frameIdRef.current = requestAnimationFrame(render);
    }, []); // Empty dependency array means loop function never changes

    const start = useCallback(() => {
        console.log('[CustomEngine] Start called. FrameId:', frameIdRef.current, 'Renderer:', !!rendererRef.current);
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

    // Update Shapes (for Sidebar integration)
    const updateShapes = useCallback((ids, updates) => {
        const idsSet = ids instanceof Set ? ids : new Set(Array.isArray(ids) ? ids : [ids]);
        setShapes(prev => {
            const newShapes = prev.map(s => idsSet.has(s.id) ? { ...s, ...updates } : s);
            saveState(newShapes);
            return newShapes;
        });
    }, [saveState]);

    // Grouping Logic
    const groupShapes = useCallback(() => {
        if (selectedShapeIds.size < 2) return;

        const ids = new Set(selectedShapeIds);
        const groupChildren = shapes.filter(s => ids.has(s.id));
        const remainingShapes = shapes.filter(s => !ids.has(s.id));

        if (groupChildren.length === 0) return;

        // Calculate Group Bounding Box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        // Helper to check rotated bounds would be better, but AABB of centers for now
        // Actually we need global AABB of all shapes
        groupChildren.forEach(s => {
            // Simplified: box
            const halfW = s.width / 2;
            const halfH = s.height / 2;
            minX = Math.min(minX, s.x - halfW);
            minY = Math.min(minY, s.y - halfH);
            maxX = Math.max(maxX, s.x + halfW);
            maxY = Math.max(maxY, s.y + halfH);
        });

        const groupX = minX + (maxX - minX) / 2;
        const groupY = minY + (maxY - minY) / 2;
        const groupW = maxX - minX;
        const groupH = maxY - minY;

        // Create Group Shape
        const groupId = crypto.randomUUID();
        // Convert Children to Local Coordinates
        const localChildren = groupChildren.map(child => {
            return {
                ...child,
                x: child.x - groupX,
                y: child.y - groupY
            };
            // Note: We don't change child rotation. It's relative to group (which is 0 rot).
        });

        const groupShape = createBaseSchema(groupId, SHAPE_TYPES.GROUP, groupX, groupY);
        groupShape.width = groupW;
        groupShape.height = groupH;
        groupShape.children = localChildren;
        groupShape.opacity = 1;

        const newShapes = [...remainingShapes, groupShape];
        setShapes(newShapes);
        saveState(newShapes);
        setSelectedShapeIds(new Set([groupId]));

    }, [shapes, selectedShapeIds, saveState]);

    const ungroupShapes = useCallback(() => {
        const newShapes = [];
        const newSelectedIds = new Set();
        let changed = false;

        shapes.forEach(shape => {
            if (selectedShapeIds.has(shape.id) && shape.type === SHAPE_TYPES.GROUP) {
                changed = true;
                // Ungroup
                if (shape.children) {
                    shape.children.forEach(child => {
                        // Transform to Global
                        // Child is local to Group (0,0 center).
                        // Group is at shape.x, shape.y.
                        // Group Rotation? If Group is rotated, we need to rotate child center too.
                        // For V1, Group rotation is 0 initially. But if user rotated group?

                        // Global X = GroupX + Rotated(ChildX)
                        const rad = (shape.rotation * Math.PI) / 180;
                        const rx = child.x * Math.cos(rad) - child.y * Math.sin(rad);
                        const ry = child.x * Math.sin(rad) + child.y * Math.cos(rad);

                        const globalX = shape.x + rx;
                        const globalY = shape.y + ry;
                        const globalRot = (child.rotation + shape.rotation) % 360;

                        const newChild = {
                            ...child,
                            x: globalX,
                            y: globalY,
                            rotation: globalRot
                        };
                        newShapes.push(newChild);
                        newSelectedIds.add(newChild.id);
                    });
                }
            } else {
                newShapes.push(shape);
                if (selectedShapeIds.has(shape.id)) newSelectedIds.add(shape.id);
            }
        });

        if (changed) {
            setShapes(newShapes);
            saveState(newShapes);
            setSelectedShapeIds(newSelectedIds);
        }

    }, [shapes, selectedShapeIds, saveState]);


    const clearCanvas = useCallback(() => {
        setShapes([]);
        setHistory([[]]);
        setHistoryIndex(0);
        setSelectedShapeIds(new Set());
    }, []);

    // Return
    return {
        canvasRef,
        start,
        stop,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        updateShapes,
        editingShapeId,
        setEditingShapeId,

        shapes, // Read-only access for UI
        setShapes, // Expose for full control (Clear/Load)
        clearCanvas, // Helper
        viewport,
        selectedShapeIds,
        groupShapes,
        ungroupShapes,

        // Zoom Controls
        zoomIn,
        zoomOut,
        resetZoom
    };
}
