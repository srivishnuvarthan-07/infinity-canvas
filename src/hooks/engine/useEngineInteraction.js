import { useState, useRef, useCallback } from 'react';
import { hitTest, hitTestControls } from '@/engine/physics/hitTest';
import { createBaseSchema, SHAPE_TYPES } from '@/engine/schema';
import { calculateResize, calculateRotation } from '@/engine/physics/resize';
import { measureTextShape } from '@/engine/utils/textUtils';

export function useEngineInteraction({
    canvasRef,
    shapes,
    setShapes,
    selectedShapeIds,
    setSelectedShapeIds,
    setHoveredShapeId,
    editingShapeId, // NEW
    setEditingShapeId, // NEW
    viewport,
    toWorld,
    setViewport, // For panning
    saveState,

    // Shared Interaction State (Lifted for Renderer access)
    selectionBox,
    setSelectionBox,

    // Config
    activeTool,
    setActiveTool,
    activeColor,
    strokeWidth,
    strokeStyle
}) {
    // Interaction State
    const [isDragging, setIsDragging] = useState(false);
    const [isDragSelecting, setIsDragSelecting] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [activeHandle, setActiveHandle] = useState(null);

    // Drag Refs
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // Local offset for single item
    const [dragStartPos, setDragStartPos] = useState(null); // World pos start
    const [initialShapePositions, setInitialShapePositions] = useState(new Map());
    const [startDimensions, setStartDimensions] = useState(null);

    // Panning State
    const isPanning = useRef(false);
    const lastPanPos = useRef({ x: 0, y: 0 });
    const isSpacePressed = useRef(false);

    // Eraser State
    const isErasing = useRef(false);

    // Keyboard (Spacebar)
    const handleKeyDown = useCallback((e) => {
        if (e.code === "Space") {
            isSpacePressed.current = true;
            if (canvasRef.current && !isDragging) canvasRef.current.style.cursor = "grab";
        }
    }, [canvasRef, isDragging]);

    const handleKeyUp = useCallback((e) => {
        if (e.code === "Space") {
            isSpacePressed.current = false;
            if (canvasRef.current) canvasRef.current.style.cursor = "default";
        }
    }, [canvasRef]);

    // Pointer Handlers
    const handlePointerDown = useCallback((e) => {
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const { x, y } = toWorld(screenX, screenY);

        // 1. Panning & Spacebar
        if (isSpacePressed.current || activeTool === 'hand' || e.button === 1) {
            isPanning.current = true;
            lastPanPos.current = { x: screenX, y: screenY };
            canvasRef.current.style.cursor = 'grabbing';
            return;
        }

        // 2. Eraser Mode
        if (activeTool === 'eraser') {
            isErasing.current = true;
            canvasRef.current.style.cursor = 'crosshair';
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
            return;
        }

        // 3. Creation Mode
        if (activeTool && activeTool !== 'select') {
            // ... Creation Logic
            const id = crypto.randomUUID();
            let type = null;
            switch (activeTool) {
                case 'rectangle': type = SHAPE_TYPES.RECTANGLE; break;
                case 'ellipse': type = SHAPE_TYPES.ELLIPSE; break;
                case 'line': type = SHAPE_TYPES.LINE; break;
                case 'diamond': type = SHAPE_TYPES.DIAMOND; break;
                case 'text': type = SHAPE_TYPES.TEXT; break;
                case 'arrow': type = SHAPE_TYPES.ARROW; break;
                case 'pencil': type = SHAPE_TYPES.PENCIL; break;
                case 'draw': type = SHAPE_TYPES.PENCIL; break;
            }

            if (type) {
                const newShape = createBaseSchema(id, type, x, y);

                // Init Points
                if (type === SHAPE_TYPES.LINE || type === SHAPE_TYPES.ARROW) {
                    newShape.points = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
                } else if (type === SHAPE_TYPES.PENCIL) {
                    newShape.points = [{ x: 0, y: 0 }];
                }

                // Text Special Case
                if (type === SHAPE_TYPES.TEXT) {
                    newShape.text = 'Double click to edit';
                    newShape.fontSize = 20;
                    newShape.textAlign = 'center';
                    // Measure
                    if (canvasRef.current) {
                        try {
                            const ctx = canvasRef.current.getContext('2d');
                            const { width, height } = measureTextShape(ctx, newShape);
                            newShape.width = width; newShape.height = height;
                        } catch (e) {
                            newShape.width = 100; newShape.height = 20;
                        }
                    }

                    setShapes(prev => {
                        const updated = [...prev, newShape];
                        saveState(updated);
                        return updated;
                    });
                    setSelectedShapeIds(new Set([id]));
                    if (setActiveTool) setActiveTool('select');
                    return;
                }

                // Standard Shape
                newShape.width = 0; newShape.height = 0;
                newShape.strokeColor = activeColor;
                newShape.strokeWidth = strokeWidth;
                newShape.strokeStyle = strokeStyle;

                setShapes(prev => [...prev, newShape]);
                setSelectedShapeIds(new Set([id]));
                setIsCreating(true);
                setDragOffset({ startX: x, startY: y });

                if (canvasRef.current.setPointerCapture)
                    canvasRef.current.setPointerCapture(e.pointerId);

                return;
            }
        }

        // 4. Check Controls (Resizing)
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
                        x: selectedShape.x, y: selectedShape.y,
                        width: selectedShape.width, height: selectedShape.height,
                        rotation: selectedShape.rotation,
                        points: selectedShape.points,
                        children: selectedShape.children ? JSON.parse(JSON.stringify(selectedShape.children)) : undefined
                    });
                    if (canvasRef.current.setPointerCapture) canvasRef.current.setPointerCapture(e.pointerId);
                    return;
                }
            }
        }

        // 5. Hit Test (Selection / Dragging)
        let hitShape = null;
        for (let i = shapes.length - 1; i >= 0; i--) {
            if (hitTest(shapes[i], x, y, viewport.zoom)) {
                hitShape = shapes[i];
                break;
            }
        }

        if (hitShape) {
            // Multi-Select Logic
            if (e.shiftKey) {
                setSelectedShapeIds(prev => {
                    const next = new Set(prev);
                    if (next.has(hitShape.id)) next.delete(hitShape.id);
                    else next.add(hitShape.id);
                    return next;
                });
            } else {
                if (!selectedShapeIds.has(hitShape.id)) {
                    setSelectedShapeIds(new Set([hitShape.id]));
                }
            }

            // Drag Init
            // Determine actual selection state AFTER update usually requires Ref or Effect, 
            // but here we can predict:
            let ids = new Set(selectedShapeIds);
            if (e.shiftKey) {
                // Toggle prediction logic roughly
                if (ids.has(hitShape.id)) ids.delete(hitShape.id); else ids.add(hitShape.id);
            } else {
                if (!ids.has(hitShape.id)) ids = new Set([hitShape.id]);
            }

            if (ids.size > 0 && ids.has(hitShape.id)) {
                setIsDragging(true);
                setDragStartPos({ x, y });
                const initPos = new Map();
                shapes.forEach(s => {
                    if (ids.has(s.id)) initPos.set(s.id, { x: s.x, y: s.y });
                });
                setInitialShapePositions(initPos);
                canvasRef.current.style.cursor = 'grabbing';
                if (canvasRef.current.setPointerCapture) canvasRef.current.setPointerCapture(e.pointerId);
            }

        } else {
            // Empty Space
            if (!e.shiftKey) setSelectedShapeIds(new Set());
            setIsDragSelecting(true);
            setSelectionBox({ startX: x, startY: y, currentX: x, currentY: y });
            if (canvasRef.current.setPointerCapture) canvasRef.current.setPointerCapture(e.pointerId);
        }

    }, [canvasRef, toWorld, activeTool, isSpacePressed, shapes, viewport.zoom, selectedShapeIds, setShapes, setSelectedShapeIds, setActiveTool, activeColor, strokeWidth, strokeStyle, saveState, setSelectionBox]);

    const handlePointerMove = useCallback((e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const { x, y } = toWorld(screenX, screenY);

        // Panning
        if (isPanning.current) {
            const dx = screenX - lastPanPos.current.x;
            const dy = screenY - lastPanPos.current.y;
            setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            lastPanPos.current = { x: screenX, y: screenY };
            return;
        }

        // Eraser
        if (activeTool === 'eraser') {
            canvasRef.current.style.cursor = 'crosshair';
            if (isErasing.current) {
                let hitShape = null;
                for (let i = shapes.length - 1; i >= 0; i--) {
                    if (hitTest(shapes[i], x, y, viewport.zoom)) {
                        hitShape = shapes[i]; break;
                    }
                }
                if (hitShape) setShapes(prev => prev.filter(s => s.id !== hitShape.id));
            }
            setHoveredShapeId(null);
            return;
        }

        // Creation
        if (isCreating && selectedShapeIds.size > 0) {
            const creationId = [...selectedShapeIds][0];
            const startX = dragOffset.startX;
            const startY = dragOffset.startY;

            setShapes(prev => prev.map(shape => {
                if (shape.id !== creationId) return shape;

                if (shape.type === SHAPE_TYPES.PENCIL) {
                    return { ...shape, points: [...(shape.points || []), { x: x - startX, y: y - startY }] };
                }
                if (shape.type === SHAPE_TYPES.LINE || shape.type === SHAPE_TYPES.ARROW) {
                    const startX = dragOffset.startX;
                    const startY = dragOffset.startY;
                    const w = Math.abs(x - startX);
                    const h = Math.abs(y - startY);
                    const centerX = startX + (x - startX) / 2;
                    const centerY = startY + (y - startY) / 2;

                    // Points relative to center
                    // Start (startX, startY) - Center (centerX, centerY)
                    const p0 = { x: startX - centerX, y: startY - centerY };
                    const p1 = { x: x - centerX, y: y - centerY };

                    return {
                        ...shape,
                        x: centerX,
                        y: centerY,
                        width: w,
                        height: h,
                        points: [p0, p1]
                    };
                }

                const left = Math.min(startX, x);
                const top = Math.min(startY, y);
                return {
                    ...shape,
                    x: left + Math.abs(x - startX) / 2,
                    y: top + Math.abs(y - startY) / 2,
                    width: Math.abs(x - startX),
                    height: Math.abs(y - startY)
                };
            }));
            return;
        }

        // Resizing
        if (isResizing && selectedShapeIds.size === 1 && activeHandle) {
            const resizeId = [...selectedShapeIds][0];
            setShapes(prev => prev.map(shape => {
                if (shape.id !== resizeId) return shape;

                // Rotation
                if (activeHandle === 'rot') {
                    return { ...shape, rotation: calculateRotation(shape, x, y) };
                }

                // Line/Arrow Endpoint
                if (shape.type === SHAPE_TYPES.LINE || shape.type === SHAPE_TYPES.ARROW) {
                    if (activeHandle === 'end') {
                        const dx = x - shape.x; const dy = y - shape.y;
                        const rad = -(shape.rotation * Math.PI) / 180;
                        const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
                        const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
                        return { ...shape, points: [shape.points[0], { x: rx, y: ry }] };
                    } else if (activeHandle === 'start') {
                        // Simplify: Just don't handle start for now or use complex logic
                        return shape;
                    }
                }

                const updates = calculateResize(shape, activeHandle, x, y, {
                    ...startDimensions, startMouseX: dragOffset.startX, startMouseY: dragOffset.startY
                });

                if (updates) {
                    // Pencil Scaling
                    if (shape.type === SHAPE_TYPES.PENCIL && startDimensions.points) {
                        const scaleX = updates.width / startDimensions.width;
                        const scaleY = updates.height / startDimensions.height;
                        const newPoints = startDimensions.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));
                        return { ...shape, ...updates, points: newPoints };
                    }

                    // Group Scaling
                    if (shape.type === SHAPE_TYPES.GROUP && startDimensions.children) {
                        const scaleX = updates.width / startDimensions.width;
                        const scaleY = updates.height / startDimensions.height;

                        const newChildren = startDimensions.children.map(child => {
                            // Scale Position
                            const nx = child.x * scaleX;
                            const ny = child.y * scaleY;

                            // Scale Dimensions
                            const nw = child.width * scaleX;
                            const nh = child.height * scaleY;

                            // Scale Points (if line/arrow/pencil)
                            let nPoints = child.points;
                            if (child.points) {
                                nPoints = child.points.map(p => ({
                                    x: p.x * scaleX,
                                    y: p.y * scaleY
                                }));
                            }

                            // TODO: Scale Stroke Width? FontSize?
                            // For MVP, position and size is critical.

                            return {
                                ...child,
                                x: nx,
                                y: ny,
                                width: nw,
                                height: nh,
                                points: nPoints
                            };
                        });

                        return { ...shape, ...updates, children: newChildren };
                    }

                    return { ...shape, ...updates };
                }
                return shape;
            }));
            return;
        }

        // Dragging
        if (isDragging && dragStartPos) {
            const dx = x - dragStartPos.x;
            const dy = y - dragStartPos.y;
            setShapes(prev => prev.map(s => {
                if (initialShapePositions.has(s.id)) {
                    const start = initialShapePositions.get(s.id);
                    return { ...s, x: start.x + dx, y: start.y + dy };
                }
                return s;
            }));
            canvasRef.current.style.cursor = 'grabbing';
            return;
        }

        // Drag Select
        if (isDragSelecting) {
            setSelectionBox(prev => ({ ...prev, currentX: x, currentY: y }));
            return;
        }

        // Hover
        let cursor = 'default';
        if (selectedShapeIds.size === 1) {
            const [id] = selectedShapeIds;
            const s = shapes.find(sh => sh.id === id);
            if (s && hitTestControls(s, x, y, viewport.zoom)) cursor = 'pointer'; // Simplification
        }

        if (cursor === 'default') {
            let hit = null;
            for (let i = shapes.length - 1; i >= 0; i--) {
                if (hitTest(shapes[i], x, y, viewport.zoom)) { hit = shapes[i]; break; }
            }
            if (hit) {
                cursor = 'move';
                setHoveredShapeId(hit.id);
            } else {
                setHoveredShapeId(null);
            }
        }
        canvasRef.current.style.cursor = cursor;

    }, [canvasRef, toWorld, isPanning, activeTool, isErasing, shapes, viewport.zoom, setShapes, isCreating, selectedShapeIds, dragOffset, isResizing, activeHandle, startDimensions, isDragging, dragStartPos, initialShapePositions, isDragSelecting, setHoveredShapeId, setSelectionBox]);

    const handlePointerUp = useCallback((e) => {
        if (isPanning.current) {
            isPanning.current = false;
            canvasRef.current.style.cursor = isSpacePressed.current ? 'grab' : 'default';
        }
        if (activeTool === 'eraser') {
            isErasing.current = false;
            saveState(shapes);
            return;
        }

        if (isCreating && selectedShapeIds.size > 0) {
            const creationId = [...selectedShapeIds][0];
            // Normalize Pencil (Center logic)
            setShapes(prev => {
                const newShapes = prev.map(s => {
                    if (s.id === creationId && s.type === SHAPE_TYPES.PENCIL && s.points) {
                        // ... Bounding box normalization logic (Simplified for space)
                        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                        s.points.forEach(p => {
                            minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
                            maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
                        });
                        const w = maxX - minX; const h = maxY - minY;
                        const centerX = s.x + minX + w / 2; const centerY = s.y + minY + h / 2;
                        const newPoints = s.points.map(p => ({ x: (s.x + p.x) - centerX, y: (s.y + p.y) - centerY }));
                        return { ...s, x: centerX, y: centerY, width: w, height: h, points: newPoints };
                    }
                    return s;
                }).filter(s => {
                    if (s.id === creationId) {
                        // Keep if large enough OR if it's a line/arrow/pencil with content
                        if (s.type === SHAPE_TYPES.PENCIL && s.points.length > 2) return true;
                        if (s.width > 5 || s.height > 5) return true;
                        // Force keep lines if they have length (width/height might be small if horizontal/vertical)
                        if ((s.type === SHAPE_TYPES.LINE || s.type === SHAPE_TYPES.ARROW) && (s.width > 5 || s.height > 5)) return true;
                        return false;
                    }
                    return true;
                });
                saveState(newShapes);
                return newShapes;
            });
            if (setActiveTool) setActiveTool('select');
        } else if (isDragging || isResizing) {
            saveState(shapes);
        } else if (isDragSelecting && selectionBox) {
            // Box Select Finalize using AABB
            const box = selectionBox;
            const x1 = Math.min(box.startX, box.currentX); const x2 = Math.max(box.startX, box.currentX);
            const y1 = Math.min(box.startY, box.currentY); const y2 = Math.max(box.startY, box.currentY);
            const hitIds = new Set();
            shapes.forEach(s => {
                const sx1 = s.x - s.width / 2; const sx2 = s.x + s.width / 2;
                const sy1 = s.y - s.height / 2; const sy2 = s.y + s.height / 2;
                if (sx1 < x2 && sx2 > x1 && sy1 < y2 && sy2 > y1) hitIds.add(s.id);
            });
            setSelectedShapeIds(hitIds);
        }

        setIsDragging(false);
        setIsResizing(false);
        setIsDragSelecting(false);
        setSelectionBox(null);
        setIsCreating(false);
        setActiveHandle(null);

        if (canvasRef.current && canvasRef.current.releasePointerCapture) canvasRef.current.releasePointerCapture(e.pointerId);

    }, [isPanning, activeTool, saveState, shapes, isCreating, selectedShapeIds, isDragging, isResizing, isDragSelecting, selectionBox, setShapes, setActiveTool, setSelectedShapeIds, setSelectionBox]);

    const handleDoubleClick = useCallback((e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const { x, y } = toWorld(screenX, screenY);

        let targetShape = null;
        for (let i = shapes.length - 1; i >= 0; i--) {
            if (hitTest(shapes[i], x, y, viewport.zoom)) {
                targetShape = shapes[i];
                break;
            }
        }

        if (targetShape && targetShape.type === SHAPE_TYPES.TEXT) {
            setEditingShapeId(targetShape.id);
            setSelectedShapeIds(new Set([targetShape.id]));
        } else {
            setEditingShapeId(null);
        }
    }, [shapes, toWorld, viewport.zoom, setEditingShapeId, setSelectedShapeIds, canvasRef]);

    const handleWheel = useCallback((e) => {
        if (!canvasRef.current) return;
        e.preventDefault();
        e.stopPropagation();

        if (e.ctrlKey || e.metaKey) {
            // ZOOM
            const rect = canvasRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // 1. Calculate World Point before zoom
            const { x: worldX, y: worldY } = toWorld(mouseX, mouseY);

            // 2. Calculate new Zoom
            let newZoom = viewport.zoom;
            // Use smaller steps for finer control
            newZoom *= e.deltaY > 0 ? 0.95 : 1.05;
            newZoom = Math.min(Math.max(newZoom, 0.1), 10);

            // 3. New Viewport to keep mouse under same world point
            // mouseX = (worldX * newZoom) + newViewportX
            // newViewportX = mouseX - (worldX * newZoom)
            const newViewportX = mouseX - worldX * newZoom;
            const newViewportY = mouseY - worldY * newZoom;

            setViewport({ x: newViewportX, y: newViewportY, zoom: newZoom });
        } else {
            // PAN
            let deltaX = e.deltaX;
            let deltaY = e.deltaY;
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
    }, [canvasRef, viewport, setViewport, toWorld]);

    return {
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handleKeyDown,
        handleKeyUp,
        handleDoubleClick,
        handleWheel
    };
}
