import { useState, useRef, useCallback, useMemo } from 'react';
import { hitTest, hitTestControls, getClosestAnchor } from '@/engine/physics/hitTest';
import { createBaseSchema, SHAPE_TYPES } from '@/engine/schema';
import { calculateResize, calculateRotation } from '@/engine/physics/resize';
import { routeArrow, updateConnectedArrows } from '@/engine/routing/smartArrow';
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
    const spatialIndex = useMemo(() => {
        const qt = new Quadtree(new Rectangle(-50000, -50000, 100000, 100000), 20);
        shapes.forEach(s => {
            qt.insert(s);
        });
        return qt;
    }, [shapes]);

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
        const shapeMap = {};
        shapes.forEach(s => shapeMap[s.id] = s);

        if (activeTool === 'eraser') {
            isErasing.current = true;
            canvasRef.current.style.cursor = 'crosshair';

            const range = new Rectangle(x - (10 / viewport.zoom / 2), y - (10 / viewport.zoom / 2), 10 / viewport.zoom, 10 / viewport.zoom);
            const candidates = spatialIndex.query(range);
            let hitShape = null;
            const candidateIds = new Set(candidates.map(c => c.id));

            for (let i = shapes.length - 1; i >= 0; i--) {
                if (candidateIds.has(shapes[i].id)) {
                    if (hitTest(shapes[i], x, y, viewport.zoom, shapeMap)) {
                        hitShape = shapes[i];
                        break;
                    }
                }
            }

            if (hitShape) {
                setShapes(prev => prev.filter(s => s.id !== hitShape.id));
            }
            return;
        }

        // 3. Creation Mode
        if (activeTool && activeTool !== 'select') {
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

                if (type === SHAPE_TYPES.LINE || type === SHAPE_TYPES.ARROW) {
                    newShape.points = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
                } else if (type === SHAPE_TYPES.PENCIL) {
                    newShape.points = [{ x: 0, y: 0 }];
                }

                if (type === SHAPE_TYPES.TEXT) {
                    newShape.text = 'Double click to edit';
                    newShape.font = { ...newShape.font, size: 20, align: 'center' };
                    if (canvasRef.current) {
                        try {
                            const ctx = canvasRef.current.getContext('2d');
                            const { width, height } = measureTextShape(ctx, newShape);
                            newShape.size = { width, height };
                        } catch (e) {
                            newShape.size = { width: 100, height: 20 };
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

                newShape.size = { width: 0, height: 0 };
                newShape.style = { ...newShape.style, stroke: activeColor, strokeWidth, strokeStyle };

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
                const handle = hitTestControls(selectedShape, x, y, viewport.zoom, shapeMap);
                if (handle) {
                    setIsResizing(true);
                    setActiveHandle(handle);
                    setDragOffset({ startX: x, startY: y });
                    setStartDimensions({
                        x: selectedShape.position?.x || 0,
                        y: selectedShape.position?.y || 0,
                        width: selectedShape.size?.width || 0,
                        height: selectedShape.size?.height || 0,
                        rotation: selectedShape.rotation || 0,
                        points: selectedShape.points ? JSON.parse(JSON.stringify(selectedShape.points)) : undefined,
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

            let ids = new Set(selectedShapeIds);
            if (e.shiftKey) {
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
                        x: s.position?.x || 0,
                        y: s.position?.y || 0,
                    });
                });
                setInitialShapePositions(initPos);
                canvasRef.current.style.cursor = 'grabbing';
                if (canvasRef.current.setPointerCapture) canvasRef.current.setPointerCapture(e.pointerId);
            }

        } else {
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

        if (isPanning.current) {
            const dx = screenX - lastPanPos.current.x;
            const dy = screenY - lastPanPos.current.y;
            setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            lastPanPos.current = { x: screenX, y: screenY };
            return;
        }

        const shapeMap = {};
        shapes.forEach(s => shapeMap[s.id] = s);

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
                    setShapes(prev => prev.filter(s => s.id !== hitShape.id));
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
                        position: { ...s.position, x: cx, y: cy },
                        points: [p0, p1],
                        size: { ...s.size, width: Math.abs(x - startX), height: Math.abs(y - startY) }
                    };
                    if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape, boardId); lastSyncTime.current = Date.now(); }
                    return newShape;
                }

                const left = Math.min(startX, x);
                const top = Math.min(startY, y);
                const newShape = {
                    ...s,
                    position: { ...s.position, x: left + Math.abs(x - startX) / 2, y: top + Math.abs(y - startY) / 2 },
                    size: { ...s.size, width: Math.abs(x - startX), height: Math.abs(y - startY) }
                };
                if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape, boardId); lastSyncTime.current = Date.now(); }
                return newShape;
            }));
            return;
        }

        // Resizing
        if (isResizing && selectedShapeIds.size === 1 && activeHandle) {
            const resizeId = [...selectedShapeIds][0];
            setShapes(prev => {
                const mappedShapes = prev.map(shape => {
                    let s = shape;
                    if (s.id === dragGlowHitShapeId && !s.isHighlighted) s = { ...s, isHighlighted: true };
                    else if (s.id !== dragGlowHitShapeId && s.isHighlighted) s = { ...s, isHighlighted: false };

                    if (s.id === resizeId) {
                        if (activeHandle === 'rot') {
                            const newShape = { ...s, rotation: calculateRotation(s, x, y) };
                            if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape, boardId); lastSyncTime.current = Date.now(); }
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

                            newShape.position = { ...newShape.position, x: cx, y: cy };
                            newShape.points = [
                                { x: dx0 * invCos - dy0 * invSin, y: dx0 * invSin + dy0 * invCos },
                                { x: dx1 * invCos - dy1 * invSin, y: dx1 * invSin + dy1 * invCos }
                            ];
                            newShape.size = {
                                ...newShape.size,
                                width: Math.abs(newShape.points[0].x - newShape.points[1].x),
                                height: Math.abs(newShape.points[0].y - newShape.points[1].y)
                            };

                            if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape, boardId); lastSyncTime.current = Date.now(); }
                            return newShape;
                        }

                        const updates = calculateResize(s, activeHandle, x, y, {
                            ...startDimensions, startMouseX: dragOffset.startX, startMouseY: dragOffset.startY
                        });

                        if (updates) {
                            if (s.type === SHAPE_TYPES.PENCIL && startDimensions.points) {
                                const scaleX = updates.size.width / startDimensions.width;
                                const scaleY = updates.size.height / startDimensions.height;
                                const newPoints = startDimensions.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));
                                const newShape = { ...s, ...updates, points: newPoints };
                                if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape, boardId); lastSyncTime.current = Date.now(); }
                                return newShape;
                            }

                            if (s.type === SHAPE_TYPES.GROUP && startDimensions.children) {
                                const scaleX = updates.size.width / startDimensions.width;
                                const scaleY = updates.size.height / startDimensions.height;

                                const newChildren = startDimensions.children.map(child => {
                                    const nx = (child.position?.x || 0) * scaleX;
                                    const ny = (child.position?.y || 0) * scaleY;
                                    const nw = (child.size?.width || 0) * scaleX;
                                    const nh = (child.size?.height || 0) * scaleY;
                                    let nPoints = child.points;
                                    if (child.points) {
                                        nPoints = child.points.map(p => ({
                                            x: p.x * scaleX,
                                            y: p.y * scaleY
                                        }));
                                    }
                                    return {
                                        ...child,
                                        position: { ...child.position, x: nx, y: ny },
                                        size: { ...child.size, width: nw, height: nh },
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
                });

                // Secondary Pass: Smart Arrow Routing
                const finalShapes = updateConnectedArrows(selectedShapeIds, mappedShapes);

                return finalShapes;
            });
            return;
        }

        // Dragging
        if (isDragging && dragStartPos) {
            const dx = x - dragStartPos.x;
            const dy = y - dragStartPos.y;
            setShapes(prev => {
                const mappedShapes = prev.map(s => {
                    const init = initialShapePositions.get(s.id);
                    if (!init) return s;

                    if (selectedShapeIds.has(s.id)) {
                        const newShape = { ...s, position: { ...s.position, x: init.x + dx, y: init.y + dy } };
                        if (Date.now() - lastSyncTime.current > syncThrottleMs) { emitUpdate(newShape); lastSyncTime.current = Date.now(); }
                        return newShape;
                    }
                    return s;
                });

                // Secondary Pass: Smart Arrow Routing
                const finalShapes = updateConnectedArrows(selectedShapeIds, mappedShapes);

                return finalShapes;
            });
            canvasRef.current.style.cursor = 'grabbing';
        } else if (isDragSelecting) {
            setSelectionBox(prev => ({ ...prev, currentX: x, currentY: y }));
            return;
        }

        let cursor = 'default';
        dragGlowHitShapeId = null;

        if (selectedShapeIds.size === 1) {
            const [id] = selectedShapeIds;
            const s = shapes.find(sh => sh.id === id);
            if (s && hitTestControls(s, x, y, viewport.zoom, shapeMap)) {
                cursor = 'pointer';
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

        if (!dragGlowHitShapeId && shapes.some(s => s.isHighlighted)) {
            setShapes(prev => prev.map(s => s.isHighlighted ? { ...s, isHighlighted: false } : s));
        }

    }, [canvasRef, toWorld, isPanning, activeTool, shapes, viewport.zoom, setShapes, isCreating, selectedShapeIds, dragOffset, isResizing, activeHandle, startDimensions, isDragging, dragStartPos, initialShapePositions, isDragSelecting, setHoveredShapeId, setSelectionBox, boardId, emitUpdate, syncThrottleMs]);

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
            setShapes(prev => {
                let newShapes = prev.map(s => {
                    if (s.id === creationId && s.type === SHAPE_TYPES.PENCIL && s.points) {
                        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                        s.points.forEach(p => {
                            minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
                            maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
                        });
                        const w = maxX - minX; const h = maxY - minY;
                        const px = s.position?.x || 0;
                        const py = s.position?.y || 0;
                        const centerX = px + minX + w / 2; const centerY = py + minY + h / 2;
                        const newPoints = s.points.map(p => ({ x: (px + p.x) - centerX, y: (py + p.y) - centerY }));
                        return { ...s, position: { ...s.position, x: centerX, y: centerY }, size: { ...s.size, width: w, height: h }, points: newPoints };
                    }
                    return s;
                }).filter(s => {
                    if (s.id === creationId) {
                        if (s.type === SHAPE_TYPES.PENCIL && s.points.length > 2) return true;
                        const w = s.size?.width || 0;
                        const h = s.size?.height || 0;
                        if (w > 5 || h > 5) return true;
                        if ((s.type === SHAPE_TYPES.LINE || s.type === SHAPE_TYPES.ARROW) && (Math.abs(w) > 5 || Math.abs(h) > 5)) return true;
                        return false;
                    }
                    return true;
                });

                // --- Arrow Binding Logic ---
                const createdShape = newShapes.find(s => s.id === creationId);
                if (createdShape && createdShape.type === SHAPE_TYPES.ARROW) {
                    const startPos = dragOffset ? { x: dragOffset.startX, y: dragOffset.startY } : null;
                    const endPos = { x: e.clientX, y: e.clientY }; // We need world x, y

                    if (canvasRef.current && startPos) {
                        const rect = canvasRef.current.getBoundingClientRect();
                        const worldEnd = toWorld(e.clientX - rect.left, e.clientY - rect.top);

                        let startHitId = null;
                        let endHitId = null;

                        // Inverse array order (top to bottom)
                        for (let i = newShapes.length - 1; i >= 0; i--) {
                            const target = newShapes[i];
                            if (target.id === creationId) continue;

                            if (!startHitId && hitTest(target, startPos.x, startPos.y, viewport.zoom)) {
                                startHitId = target.id;
                            }
                            if (!endHitId && hitTest(target, worldEnd.x, worldEnd.y, viewport.zoom)) {
                                endHitId = target.id;
                            }
                            if (startHitId && endHitId) break;
                        }

                        if (startHitId || endHitId) {
                            newShapes = newShapes.map(s => {
                                if (s.id === creationId) {
                                    return {
                                        ...s,
                                        bindings: {
                                            start: startHitId ? { elementId: startHitId, anchor: "center" } : null,
                                            end: endHitId ? { elementId: endHitId, anchor: "center" } : null
                                        }
                                    };
                                }
                                return s;
                            });
                        }
                    }
                }
                // ---------------------------

                saveState(newShapes);
                return newShapes;
            });
            if (setActiveTool) setActiveTool('select');
        } else if (isResizing && selectedShapeIds.size === 1 && (activeHandle === 'start' || activeHandle === 'end')) {
            // --- Arrow endpoint re-binding: drag endpoint onto a shape to connect ---
            const resizeId = [...selectedShapeIds][0];
            const resizedShape = shapes.find(s => s.id === resizeId);
            if (resizedShape && resizedShape.type === SHAPE_TYPES.ARROW && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const worldPoint = toWorld(e.clientX - rect.left, e.clientY - rect.top);

                let hitId = null;
                for (let i = shapes.length - 1; i >= 0; i--) {
                    const target = shapes[i];
                    if (target.id === resizeId) continue;
                    if (hitTest(target, worldPoint.x, worldPoint.y, viewport.zoom)) {
                        hitId = target.id;
                        break;
                    }
                }

                const hadBinding = resizedShape.bindings && resizedShape.bindings[activeHandle];

                if (hitId || hadBinding) {
                    // Update binding and immediately route the arrow to snap to the new shape
                    setShapes(prev => {
                        const updatedShapes = prev.map(s => {
                            if (s.id !== resizeId) return s;
                            const newBindings = {
                                start: s.bindings?.start ?? null,
                                end: s.bindings?.end ?? null,
                                [activeHandle]: hitId ? { elementId: hitId, anchor: "center" } : null
                            };
                            return { ...s, bindings: newBindings };
                        });

                        // If both ends are now bound, immediately route the arrow
                        const updatedArrow = updatedShapes.find(s => s.id === resizeId);
                        if (updatedArrow?.bindings?.start && updatedArrow?.bindings?.end) {
                            const source = updatedShapes.find(s => s.id === updatedArrow.bindings.start.elementId);
                            const target = updatedShapes.find(s => s.id === updatedArrow.bindings.end.elementId);
                            if (source && target) {
                                const routedArrow = routeArrow(updatedArrow, source, target, "orthogonal");
                                const finalShapes = updatedShapes.map(s => s.id === resizeId ? routedArrow : s);
                                saveState(finalShapes);
                                return finalShapes;
                            }
                        }

                        saveState(updatedShapes);
                        return updatedShapes;
                    });
                } else {
                    saveState(shapes, boardId);
                }
            } else {
                saveState(shapes, boardId);
            }
        } else if (isDragSelecting && selectionBox) {
            const box = selectionBox;
            const x1 = Math.min(box.startX, box.currentX); const x2 = Math.max(box.startX, box.currentX);
            const y1 = Math.min(box.startY, box.currentY); const y2 = Math.max(box.startY, box.currentY);
            const hitIds = new Set();
            shapes.forEach(s => {
                const w = s.size?.width || 0;
                const h = s.size?.height || 0;
                const sx1 = (s.position?.x || 0) - w / 2; const sx2 = (s.position?.x || 0) + w / 2;
                const sy1 = (s.position?.y || 0) - h / 2; const sy2 = (s.position?.y || 0) + h / 2;
                if (sx1 < x2 && sx2 > x1 && sy1 < y2 && sy2 > y1) hitIds.add(s.id);
            });
            setSelectedShapeIds(hitIds);
        } else if (isDragging || isResizing) {
            saveState(shapes, boardId);
        }

        setIsDragging(false);
        setIsResizing(false);
        setIsDragSelecting(false);
        setSelectionBox(null);
        setIsCreating(false);
        setActiveHandle(null);

        if (canvasRef.current && canvasRef.current.releasePointerCapture) canvasRef.current.releasePointerCapture(e.pointerId);

    }, [isPanning, activeTool, saveState, shapes, isCreating, selectedShapeIds, isDragging, isResizing, isDragSelecting, selectionBox, setShapes, setActiveTool, setSelectedShapeIds, setSelectionBox, boardId]);

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
            const rect = canvasRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const { x: worldX, y: worldY } = toWorld(mouseX, mouseY);

            let newZoom = viewport.zoom;
            newZoom *= e.deltaY > 0 ? 0.95 : 1.05;
            newZoom = Math.min(Math.max(newZoom, 0.1), 10);

            const newViewportX = mouseX - worldX * newZoom;
            const newViewportY = mouseY - worldY * newZoom;

            setViewport({ x: newViewportX, y: newViewportY, zoom: newZoom });
        } else {
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
        isDragging: isDragging || isResizing || isCreating
    };
}
