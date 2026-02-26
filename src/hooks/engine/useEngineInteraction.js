import { useState, useRef, useCallback, useMemo } from 'react';
import { hitTest, hitTestControls, getClosestAnchor, resolveConnectorPoint } from '@/engine/physics/hitTest';
import { createBaseSchema, SHAPE_TYPES } from '@/engine/schema';
import { calculateResize, calculateRotation } from '@/engine/physics/resize';
import { measureTextShape } from '@/engine/utils/textUtils';
import { Quadtree, Rectangle } from '@/engine/utils/Quadtree';
import React from 'react';

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
    strokeStyle,
    emitUpdate,
    boardId
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

    // Throttle for live Socket Sync
    const lastSyncTime = useRef(0);
    const syncThrottleMs = 50; // Sync every 50ms during active drag

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

    // OPTIMIZATION: Quadtree
    // Rebuild Quadtree when shapes change? 
    // Ideally we update it, but for React pattern rebuilding is safer.
    // To avoid lag on EVERY drag frame, we can memoize or throttle.
    // For now, simpler: Just Rebuild.
    // Actually, rebuilding 10k items every frame IS slow.
    // Better: Only use Quadtree for HOVER and MOUSE DOWN (Hit testing).
    // During drag, we don't need hit testing against other shapes usually.

    // Memoizing the tree:
    const spatialIndex = useMemo(() => { // Changed React.useMemo to useMemo
        // Assume world bounds -10000 to 10000? 
        const qt = new Quadtree(new Rectangle(-50000, -50000, 100000, 100000), 20); // Large bounds, adjusted to cover negative coords
        shapes.forEach(s => {
            // Ensure width/height are positive for Quadtree
            const w = Math.abs(s.width);
            const h = Math.abs(s.height);
            // Quadtree expects x, y, width, height. Our shapes have x, y as top-left.
            // For Quadtree, we can use the bounding box of the shape.
            // For simplicity, using x, y, width, height directly, assuming they define a bounding box.
            // If rotation is involved, a more complex bounding box calculation would be needed.
            qt.insert({
                x: s.x,
                y: s.y,
                width: w,
                height: h,
                id: s.id // Store ID for lookup
            });
        });
        return qt;
    }, [shapes]); // Dep on shapes. If shapes update 60fps, this runs 60fps.

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

            // Broad Phase
            const range = new Rectangle(x - (10 / viewport.zoom / 2), y - (10 / viewport.zoom / 2), 10 / viewport.zoom, 10 / viewport.zoom);
            const candidates = spatialIndex.query(range);

            let hitShape = null;
            const candidateIds = new Set(candidates.map(c => c.id));

            const shapeMap = {};
            shapes.forEach(s => shapeMap[s.id] = s);

            // Narrow Phase
            for (let i = shapes.length - 1; i >= 0; i--) {
                if (candidateIds.has(shapes[i].id)) {
                    if (hitTest(shapes[i], x, y, viewport.zoom, shapeMap)) {
                        hitShape = shapes[i];
                        break;
                    }
                }
            }

            if (hitShape) {
                setShapes(prev => {
                    return prev.filter(s => s.id !== hitShape.id).map(s => {
                        if (s.type === SHAPE_TYPES.CONNECTOR) {
                            let updated = { ...s };
                            let changed = false;
                            if (s.start && s.start.shapeId === hitShape.id) {
                                const pos = resolveConnectorPoint(s.start, shapeMap);
                                updated.start = { ...s.start, shapeId: null, anchor: null, x: pos.x, y: pos.y };
                                changed = true;
                            }
                            if (s.end && s.end.shapeId === hitShape.id) {
                                const pos = resolveConnectorPoint(s.end, shapeMap);
                                updated.end = { ...s.end, shapeId: null, anchor: null, x: pos.x, y: pos.y };
                                changed = true;
                            }
                            return changed ? updated : s;
                        }
                        return s;
                    });
                });
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

                if (type === SHAPE_TYPES.CONNECTOR) {
                    newShape.variant = 'line';
                    newShape.arrowType = 'straight';

                    newShape.start = { x, y, shapeId: null, anchor: null };
                    newShape.end = { x, y, shapeId: null, anchor: null };
                    newShape.mid = { x, y, isManual: false };
                } else if (type === SHAPE_TYPES.LINE || type === SHAPE_TYPES.ARROW) {
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
        const shapeMap = {};
        shapes.forEach(s => shapeMap[s.id] = s);

        if (selectedShapeIds.size === 1) {
            const [id] = selectedShapeIds;
            const selectedShape = shapes.find(s => s.id === id);
            if (selectedShape) {
                const handle = hitTestControls(selectedShape, x, y, viewport.zoom, shapeMap);
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
            if (hitTest(shapes[i], x, y, viewport.zoom, shapeMap)) {
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
                    initPos.set(s.id, {
                        x: s.x, y: s.y,
                        start: s.start ? { ...s.start } : undefined,
                        mid: s.mid ? { ...s.mid } : undefined,
                        end: s.end ? { ...s.end } : undefined
                    });
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

        const shapeMap = {};
        shapes.forEach(s => shapeMap[s.id] = s);

        // Eraser
        if (activeTool === 'eraser') {
            canvasRef.current.style.cursor = 'crosshair';
            if (isErasing.current) {
                let hitShape = null;
                for (let i = shapes.length - 1; i >= 0; i--) {
                    if (hitTest(shapes[i], x, y, viewport.zoom, shapeMap)) {
                        hitShape = shapes[i]; break;
                    }
                }
                if (hitShape) {
                    setShapes(prev => {
                        return prev.filter(s => s.id !== hitShape.id).map(s => {
                            if (s.type === SHAPE_TYPES.CONNECTOR) {
                                let updated = { ...s };
                                let changed = false;
                                if (s.start && s.start.shapeId === hitShape.id) {
                                    const pos = resolveConnectorPoint(s.start, shapeMap);
                                    updated.start = { ...s.start, shapeId: null, anchor: null, x: pos.x, y: pos.y };
                                    changed = true;
                                }
                                if (s.end && s.end.shapeId === hitShape.id) {
                                    const pos = resolveConnectorPoint(s.end, shapeMap);
                                    updated.end = { ...s.end, shapeId: null, anchor: null, x: pos.x, y: pos.y };
                                    changed = true;
                                }
                                return changed ? updated : s;
                            }
                            return s;
                        });
                    });
                }
            }
            setHoveredShapeId(null);
            return;
        }

        let dragGlowHitShapeId = null;
        if (isCreating || (isResizing && (activeHandle === 'start' || activeHandle === 'end'))) {
            for (let i = shapes.length - 1; i >= 0; i--) {
                if (hitTest(shapes[i], x, y, viewport.zoom, shapeMap)) {
                    if (!selectedShapeIds.has(shapes[i].id)) {
                        dragGlowHitShapeId = shapes[i].id;
                        break;
                    }
                }
            }
        }

        // Creation
        if (isCreating && selectedShapeIds.size > 0) {
            const creationId = [...selectedShapeIds][0];
            const startX = dragOffset.startX;
            const startY = dragOffset.startY;

            setShapes(prev => prev.map(shape => {
                let s = shape;
                if (s.id === dragGlowHitShapeId && !s.isHighlighted) s = { ...s, isHighlighted: true };
                else if (s.id !== dragGlowHitShapeId && s.isHighlighted) s = { ...s, isHighlighted: false };

                if (s.id !== creationId) return s;

                if (s.type === SHAPE_TYPES.PENCIL) {
                    const newShape = { ...s, points: [...(s.points || []), { x: x - startX, y: y - startY }] };
                    if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape, boardId); lastSyncTime.current = Date.now(); }
                    return newShape;
                }
                if (s.type === SHAPE_TYPES.LINE || s.type === SHAPE_TYPES.ARROW) {
                    const left = Math.min(startX, x);
                    const top = Math.min(startY, y);
                    const cx = left + Math.abs(x - startX) / 2;
                    const cy = top + Math.abs(y - startY) / 2;

                    const p0 = { x: startX - cx, y: startY - cy };
                    const p1 = { x: x - cx, y: y - cy };

                    const newShape = {
                        ...s,
                        x: cx,
                        y: cy,
                        points: [p0, p1],
                        width: Math.abs(x - startX),
                        height: Math.abs(y - startY)
                    };
                    if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape, boardId); lastSyncTime.current = Date.now(); }
                    return newShape;
                }
                if (s.type === SHAPE_TYPES.CONNECTOR) {
                    let hitShape = null;
                    for (let i = shapes.length - 1; i >= 0; i--) {
                        if (hitTest(shapes[i], x, y, viewport.zoom, shapeMap)) {
                            if (shapes[i].id !== s.id && shapes[i].id !== s.start.shapeId) {
                                hitShape = shapes[i]; break;
                            }
                        }
                    }

                    const newEnd = { x, y, shapeId: hitShape ? hitShape.id : null, anchor: hitShape ? getClosestAnchor(hitShape, { x, y }) : null };
                    const newMid = {
                        x: s.start.x + (newEnd.x - s.start.x) / 2,
                        y: s.start.y + (newEnd.y - s.start.y) / 2,
                        isManual: false
                    };

                    const newShape = { ...s, end: newEnd, mid: newMid };
                    if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape); lastSyncTime.current = Date.now(); }
                    return newShape;
                }

                const left = Math.min(startX, x);
                const top = Math.min(startY, y);
                const newShape = {
                    ...s,
                    x: left + Math.abs(x - startX) / 2,
                    y: top + Math.abs(y - startY) / 2,
                    width: Math.abs(x - startX),
                    height: Math.abs(y - startY)
                };
                if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape, boardId); lastSyncTime.current = Date.now(); }
                return newShape;
            }));
            return;
        }

        // Resizing
        if (isResizing && selectedShapeIds.size === 1 && activeHandle) {
            const resizeId = [...selectedShapeIds][0];
            setShapes(prev => prev.map(shape => {
                let s = shape;
                if (s.id === dragGlowHitShapeId && !s.isHighlighted) s = { ...s, isHighlighted: true };
                else if (s.id !== dragGlowHitShapeId && s.isHighlighted) s = { ...s, isHighlighted: false };

                if (s.id === resizeId) {
                    // Rotation
                    if (activeHandle === 'rot') {
                        const newShape = { ...s, rotation: calculateRotation(s, x, y) };
                        if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape, boardId); lastSyncTime.current = Date.now(); }
                        return newShape;
                    }

                    // Connector Endpoints
                    if (s.type === SHAPE_TYPES.CONNECTOR) {
                        const handle = activeHandle;
                        let newShape = { ...s };

                        if (handle === 'start' || handle === 'end') {
                            if (handle === 'start') {
                                newShape.start = { x, y, shapeId: null, anchor: null };
                            } else {
                                newShape.end = { x, y, shapeId: null, anchor: null };
                            }
                        } else if (handle === 'mid') {
                            newShape.mid = { x, y, isManual: true };
                        }
                        if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape); lastSyncTime.current = Date.now(); }
                        return newShape;
                    }

                    if (s.type === SHAPE_TYPES.LINE || s.type === SHAPE_TYPES.ARROW) {
                        const handle = activeHandle;
                        let newShape = { ...s };

                        const rad = (startDimensions.rotation || 0) * Math.PI / 180;
                        const cos = Math.cos(rad); const sin = Math.sin(rad);

                        const p0x = startDimensions.points[0]?.x || 0;
                        const p0y = startDimensions.points[0]?.y || 0;
                        const p1x = startDimensions.points[1]?.x || 0;
                        const p1y = startDimensions.points[1]?.y || 0;

                        let p0g = {
                            x: startDimensions.x + (p0x * cos - p0y * sin),
                            y: startDimensions.y + (p0x * sin + p0y * cos)
                        };
                        let p1g = {
                            x: startDimensions.x + (p1x * cos - p1y * sin),
                            y: startDimensions.y + (p1x * sin + p1y * cos)
                        };

                        if (handle === 'start') p0g = { x, y };
                        else if (handle === 'end') p1g = { x, y };
                        else return s;

                        const cx = (p0g.x + p1g.x) / 2;
                        const cy = (p0g.y + p1g.y) / 2;

                        const invCos = Math.cos(-rad); const invSin = Math.sin(-rad);
                        const dx0 = p0g.x - cx; const dy0 = p0g.y - cy;
                        const dx1 = p1g.x - cx; const dy1 = p1g.y - cy;

                        newShape.x = cx;
                        newShape.y = cy;
                        newShape.points = [
                            { x: dx0 * invCos - dy0 * invSin, y: dx0 * invSin + dy0 * invCos },
                            { x: dx1 * invCos - dy1 * invSin, y: dx1 * invSin + dy1 * invCos }
                        ];
                        newShape.width = Math.abs(newShape.points[0].x - newShape.points[1].x);
                        newShape.height = Math.abs(newShape.points[0].y - newShape.points[1].y);

                        if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape, boardId); lastSyncTime.current = Date.now(); }
                        return newShape;
                    }

                    const updates = calculateResize(s, activeHandle, x, y, {
                        ...startDimensions, startMouseX: dragOffset.startX, startMouseY: dragOffset.startY
                    });

                    if (updates) {
                        // Pencil Scaling
                        if (s.type === SHAPE_TYPES.PENCIL && startDimensions.points) {
                            const scaleX = updates.width / startDimensions.width;
                            const scaleY = updates.height / startDimensions.height;
                            const newPoints = startDimensions.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));
                            const newShape = { ...s, ...updates, points: newPoints };
                            if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape, boardId); lastSyncTime.current = Date.now(); }
                            return newShape;
                        }

                        // Group Scaling
                        if (s.type === SHAPE_TYPES.GROUP && startDimensions.children) {
                            const scaleX = updates.width / startDimensions.width;
                            const scaleY = updates.height / startDimensions.height;

                            const newChildren = startDimensions.children.map(child => {
                                const nx = child.x * scaleX;
                                const ny = child.y * scaleY;
                                const nw = child.width * scaleX;
                                const nh = child.height * scaleY;
                                let nPoints = child.points;
                                if (child.points) {
                                    nPoints = child.points.map(p => ({
                                        x: p.x * scaleX,
                                        y: p.y * scaleY
                                    }));
                                }

                                return {
                                    ...child,
                                    x: nx,
                                    y: ny,
                                    width: nw,
                                    height: nh,
                                    points: nPoints
                                };
                            });

                            const newShape = { ...s, ...updates, children: newChildren };
                            if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape, boardId); lastSyncTime.current = Date.now(); }
                            return newShape;
                        }

                        const newShape = { ...s, ...updates };
                        if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape, boardId); lastSyncTime.current = Date.now(); }
                        return newShape;
                    }
                }
                return s;
            }));
            return;
        }

        // Dragging
        if (isDragging && dragStartPos) {
            const dx = x - dragStartPos.x;
            const dy = y - dragStartPos.y;
            setShapes(prev => prev.map(s => {
                const init = initialShapePositions.get(s.id);
                if (!init) return s;

                // 1. Explicitly selected shapes
                if (selectedShapeIds.has(s.id)) {
                    if (s.type === SHAPE_TYPES.CONNECTOR) {
                        const newShape = {
                            ...s,
                            x: init.x + dx, y: init.y + dy,
                            start: init.start ? {
                                ...init.start,
                                x: init.start.shapeId ? init.start.x : init.start.x + dx,
                                y: init.start.shapeId ? init.start.y : init.start.y + dy
                            } : s.start,
                            mid: init.mid ? {
                                ...init.mid,
                                x: init.mid.x + dx,
                                y: init.mid.y + dy
                            } : s.mid,
                            end: init.end ? {
                                ...init.end,
                                x: init.end.shapeId ? init.end.x : init.end.x + dx,
                                y: init.end.shapeId ? init.end.y : init.end.y + dy
                            } : s.end,
                        };
                        if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape); lastSyncTime.current = Date.now(); }
                        return newShape;
                    }
                    const newShape = { ...s, x: init.x + dx, y: init.y + dy };
                    if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape); lastSyncTime.current = Date.now(); }
                    return newShape;
                }


                return s;
            }));
            canvasRef.current.style.cursor = 'grabbing';
            // DO NOT RETURN HERE either! Let glow proceed
        } else if (isDragSelecting) {
            // Drag Select
            setSelectionBox(prev => ({ ...prev, currentX: x, currentY: y }));
            // We DO return here because we don't need glow for selection boxes
            return;
        }

        // Hover & Glow
        let cursor = 'default';
        dragGlowHitShapeId = null;

        if (selectedShapeIds.size === 1) {
            const [id] = selectedShapeIds;
            const s = shapes.find(sh => sh.id === id);
            if (s && hitTestControls(s, x, y, viewport.zoom, shapeMap)) {
                cursor = 'pointer'; // Simplification
            }
        }

        if (cursor === 'default') {
            let hit = null;
            for (let i = shapes.length - 1; i >= 0; i--) {
                if (hitTest(shapes[i], x, y, viewport.zoom, shapeMap)) { hit = shapes[i]; break; }
            }
            if (hit) {
                cursor = 'move';
                setHoveredShapeId(hit.id);
            } else {
                setHoveredShapeId(null);
            }
        }
        canvasRef.current.style.cursor = cursor;

        // Ensure we clear out highlights if there isn't a drag event actively driving logic above
        if (!dragGlowHitShapeId && shapes.some(s => s.isHighlighted)) {
            setShapes(prev => prev.map(s => s.isHighlighted ? { ...s, isHighlighted: false } : s));
        }

    }, [canvasRef, toWorld, isPanning, activeTool, isErasing, shapes, viewport.zoom, setShapes, isCreating, selectedShapeIds, dragOffset, isResizing, activeHandle, startDimensions, isDragging, dragStartPos, initialShapePositions, isDragSelecting, setHoveredShapeId, setSelectionBox]);

    const handlePointerUp = useCallback((e) => {
        if (isPanning.current) {
            isPanning.current = false;
            canvasRef.current.style.cursor = isSpacePressed.current ? 'grab' : 'default';
        }
        if (activeTool === 'eraser') {
            isErasing.current = false;
            saveState(shapes, boardId);
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
                        if ((s.type === SHAPE_TYPES.LINE || s.type === SHAPE_TYPES.ARROW) && (Math.abs(s.width) > 5 || Math.abs(s.height) > 5)) return true;
                        if (s.type === SHAPE_TYPES.CONNECTOR && s.start && s.end) {
                            const dx = s.end.x - s.start.x;
                            const dy = s.end.y - s.start.y;
                            if (Math.sqrt(dx * dx + dy * dy) > 10) return true;
                        }
                        return false;
                    }
                    return true;
                });
                saveState(newShapes);
                return newShapes;
            });
            if (setActiveTool) setActiveTool('select');
        } else if (isDragging || isResizing) {
            saveState(shapes, boardId);
        } else if (isDragSelecting && selectionBox) {
            // Box Select Finalize using AABB
            const box = selectionBox;
            const x1 = Math.min(box.startX, box.currentX); const x2 = Math.max(box.startX, box.currentX);
            const y1 = Math.min(box.startY, box.currentY); const y2 = Math.max(box.startY, box.currentY);
            const hitIds = new Set();
            shapes.forEach(s => {
                if (s.type === SHAPE_TYPES.CONNECTOR && s.start && s.end) {
                    const minX = Math.min(s.start.x, s.end.x, s.mid ? s.mid.x : s.start.x);
                    const maxX = Math.max(s.start.x, s.end.x, s.mid ? s.mid.x : s.start.x);
                    const minY = Math.min(s.start.y, s.end.y, s.mid ? s.mid.y : s.start.y);
                    const maxY = Math.max(s.start.y, s.end.y, s.mid ? s.mid.y : s.start.y);
                    if (minX < x2 && maxX > x1 && minY < y2 && maxY > y1) hitIds.add(s.id);
                } else {
                    const sx1 = s.x - s.width / 2; const sx2 = s.x + s.width / 2;
                    const sy1 = s.y - s.height / 2; const sy2 = s.y + s.height / 2;
                    if (sx1 < x2 && sx2 > x1 && sy1 < y2 && sy2 > y1) hitIds.add(s.id);
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
        handleWheel,
        isDragging: isDragging || isResizing || isCreating // Treat all these as "Active Interactions"
    };
}
