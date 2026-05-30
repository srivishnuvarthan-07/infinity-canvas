import { useState, useCallback, useRef, useMemo } from 'react';
import { hitTest, hitTestControls } from '@/engine/physics/hitTest';
import { createBaseSchema, SHAPE_TYPES } from '@/engine/schema';
import { measureTextShape } from '@/engine/utils/textUtils';
import { Quadtree, Rectangle } from '@/engine/utils/Quadtree';

import { useKeyboard } from './interaction/useKeyboard';
import { useSelection } from './interaction/useSelection';
import { useDrag } from './interaction/useDrag';
import { useResize } from './interaction/useResize';
import { useArrowConnect } from './interaction/useArrowConnect';

export function useEngineInteraction({
    canvasRef,
    shapes,
    setShapes,
    selectedShapeIds,
    setSelectedShapeIds,
    setHoveredShapeId,
    editingShapeId,
    setEditingShapeId,
    viewport,
    toWorld,
    setViewport,
    saveState,
    undo,
    redo,
    selectionBox,
    setSelectionBox,
    activeTool,
    setActiveTool,
    activeColor,
    strokeWidth,
    strokeStyle,
    emitUpdate,
    boardId,
    readonly = false
}) {
    const [isCreating, setIsCreating] = useState(false);
    const [dragOffset, setDragOffset] = useState({ startX: 0, startY: 0 });
    const creatingShapeId = useRef(null);
    const pendingTextRef = useRef(null); // debounce single-click text creation vs double-click

    // Panning
    const isPanning = useRef(false);
    const lastPanPos = useRef({ x: 0, y: 0 });

    // Eraser
    const isErasing = useRef(false);

    // Sub-hooks
    const { isSpacePressed, handleKeyDown, handleKeyUp } = useKeyboard({ 
        canvasRef, 
        isDragging: false,
        undo,
        redo
    });

    const { isDragSelecting, startDragSelect, updateDragSelect, commitDragSelect, cancelDragSelect } =
        useSelection({ canvasRef, shapes, toWorld, setSelectedShapeIds, setSelectionBox });

    const { isDragging, startDrag, updateDrag, commitDrag, cancelDrag } =
        useDrag({ canvasRef, shapes, setShapes, selectedShapeIds, emitUpdate });

    const { isResizing, activeHandle, startDimensions, startResize, updateResize, commitResize, cancelResize } =
        useResize({ canvasRef, shapes, setShapes, selectedShapeIds, emitUpdate });

    const { bindCreatedArrow, rebindArrowEndpoint } =
        useArrowConnect({ shapes, viewport, toWorld, canvasRef, setShapes, saveState });

    // Quadtree spatial index — rebuilt only when shapes change
    const spatialIndex = useMemo(() => {
        const qt = new Quadtree(new Rectangle(-50000, -50000, 100000, 100000), 20);
        shapes.forEach(s => qt.insert(s));
        return qt;
    }, [shapes]);

    const shapeMapOf = useCallback((arr) => {
        const m = {};
        arr.forEach(s => { m[s.id] = s; });
        return m;
    }, []);

    // ── Pointer Down ───────────────────────────────────────────────────────

    const handlePointerDown = useCallback((e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const { x, y } = toWorld(e.clientX - rect.left, e.clientY - rect.top);
        const shapeMap = shapeMapOf(shapes);

        // 1. Pan (spacebar / hand tool / middle mouse / readonly mode)
        if (isSpacePressed.current || activeTool === 'hand' || e.button === 1 || readonly) {
            isPanning.current = true;
            lastPanPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            canvasRef.current.style.cursor = 'grabbing';
            return;
        }

        // 2. Eraser
        if (activeTool === 'eraser') {
            isErasing.current = true;
            canvasRef.current.style.cursor = 'none';
            const range = new Rectangle(x, y, 10 / viewport.zoom, 10 / viewport.zoom);
            const candidates = new Set(spatialIndex.query(range).map(c => c.id));
            for (let i = shapes.length - 1; i >= 0; i--) {
                if (candidates.has(shapes[i].id) && hitTest(shapes[i], x, y, viewport.zoom, shapeMap)) {
                    setShapes(prev => prev.filter(s => s.id !== shapes[i].id));
                    break;
                }
            }
            return;
        }

        // 3. Shape Creation
        if (activeTool && activeTool !== 'select') {
            const typeMap = {
                rectangle: SHAPE_TYPES.RECTANGLE, ellipse: SHAPE_TYPES.ELLIPSE,
                line: SHAPE_TYPES.LINE, diamond: SHAPE_TYPES.DIAMOND,
                text: SHAPE_TYPES.TEXT, arrow: SHAPE_TYPES.ARROW,
                pencil: SHAPE_TYPES.PENCIL, draw: SHAPE_TYPES.PENCIL
            };
            const type = typeMap[activeTool];
            if (type) {
                if (type === SHAPE_TYPES.TEXT) {
                    // If clicked an existing text shape, open it for editing
                    const shapeMap = shapeMapOf(shapes);
                    let hitText = null;
                    for (let i = shapes.length - 1; i >= 0; i--) {
                        if (hitTest(shapes[i], x, y, viewport.zoom, shapeMap)) { hitText = shapes[i]; break; }
                    }
                    if (hitText?.type === SHAPE_TYPES.TEXT) {
                        setSelectedShapeIds(new Set([hitText.id]));
                        setEditingShapeId(hitText.id);
                        if (setActiveTool) setActiveTool('select');
                        return;
                    }

                    // Debounce: wait briefly so a double-click only fires once
                    if (pendingTextRef.current) clearTimeout(pendingTextRef.current);
                    pendingTextRef.current = setTimeout(() => {
                        pendingTextRef.current = null;
                        const id = crypto.randomUUID();
                        const newShape = {
                            id,
                            type: SHAPE_TYPES.TEXT,
                            position: { x, y },
                            rotation: 0,
                            scale: { x: 1, y: 1 },
                            zIndex: 0,
                            text: '',
                            font: { family: 'Caveat', size: 24, weight: 'normal', align: 'left' },
                            size: { width: 10, height: 30 },
                            style: {
                                stroke: '#1a1a1a',
                                fill: 'transparent',
                                strokeWidth: 2,
                                opacity: 1,
                                renderMode: 'vector',
                                roughness: 0,
                                seed: Math.floor(Math.random() * 1000000),
                                fillStyle: 'solid'
                            },
                            locked: false,
                            visible: true,
                            revision: { number: 1, timestamp: Date.now() }
                        };
                        setShapes(prev => { const next = [...prev, newShape]; saveState(next); return next; });
                        setSelectedShapeIds(new Set([id]));
                        setEditingShapeId(id);
                        if (setActiveTool) setActiveTool('select');
                    }, 180);
                    return;
                }

                const id = crypto.randomUUID();
                const newShape = createBaseSchema(id, type, x, y);

                if (type === SHAPE_TYPES.LINE || type === SHAPE_TYPES.ARROW) {
                    newShape.points = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
                } else if (type === SHAPE_TYPES.PENCIL) {
                    newShape.points = [{ x: 0, y: 0 }];
                }

                newShape.size = { width: 0, height: 0 };
                newShape.style = { ...newShape.style, stroke: activeColor, strokeWidth, strokeStyle };
                setShapes(prev => [...prev, newShape]);
                creatingShapeId.current = id;
                setSelectedShapeIds(new Set([id]));
                setIsCreating(true);
                setDragOffset({ startX: x, startY: y });
                if (canvasRef.current?.setPointerCapture) canvasRef.current.setPointerCapture(e.pointerId);
                return;
            }
        }

        // 4. Resize Handle
        if (selectedShapeIds.size === 1) {
            const [id] = selectedShapeIds;
            const sel = shapes.find(s => s.id === id);
            if (sel) {
                const handle = hitTestControls(sel, x, y, viewport.zoom, shapeMap);
                if (handle) {
                    startResize(handle, x, y, sel, e);
                    return;
                }
            }
        }

        // 5. Hit Test → Drag or Drag-Select
        let hit = null;
        for (let i = shapes.length - 1; i >= 0; i--) {
            if (hitTest(shapes[i], x, y, viewport.zoom, shapeMap)) { hit = shapes[i]; break; }
        }

        if (hit) {
            if (e.shiftKey) {
                setSelectedShapeIds(prev => {
                    const next = new Set(prev);
                    next.has(hit.id) ? next.delete(hit.id) : next.add(hit.id);
                    return next;
                });
            } else {
                if (!selectedShapeIds.has(hit.id)) setSelectedShapeIds(new Set([hit.id]));
            }
            startDrag(x, y, e);
        } else {
            if (!e.shiftKey) setSelectedShapeIds(new Set());
            startDragSelect(x, y, e);
        }
    }, [canvasRef, toWorld, activeTool, isSpacePressed, shapes, viewport.zoom, selectedShapeIds,
        setShapes, setSelectedShapeIds, setActiveTool, activeColor, strokeWidth, strokeStyle,
        saveState, spatialIndex, shapeMapOf, startResize, startDrag, startDragSelect]);

    // ── Pointer Move ────────────────────────────────────────────────────────

    const handlePointerMove = useCallback((e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const { x, y } = toWorld(screenX, screenY);
        const shapeMap = shapeMapOf(shapes);

        if (isPanning.current) {
            const dx = screenX - lastPanPos.current.x;
            const dy = screenY - lastPanPos.current.y;
            setViewport(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
            lastPanPos.current = { x: screenX, y: screenY };
            return;
        }

        if (activeTool === 'eraser') {
            canvasRef.current.style.cursor = 'none';
            if (isErasing.current) {
                for (let i = shapes.length - 1; i >= 0; i--) {
                    if (hitTest(shapes[i], x, y, viewport.zoom, shapeMap)) {
                        setShapes(prev => prev.filter(s => s.id !== shapes[i].id));
                        break;
                    }
                }
            }
            setHoveredShapeId(null);
            return;
        }

        if (isCreating && selectedShapeIds.size > 0) {
            const creationId = [...selectedShapeIds][0];
            const startX = dragOffset.startX, startY = dragOffset.startY;
            setShapes(prev => prev.map(s => {
                if (s.id !== creationId) return s;
                if (s.type === SHAPE_TYPES.PENCIL) {
                    return { ...s, points: [...(s.points || []), { x: x - startX, y: y - startY }] };
                }
                if (s.type === SHAPE_TYPES.LINE || s.type === SHAPE_TYPES.ARROW) {
                    const left = Math.min(startX, x), top = Math.min(startY, y);
                    const cx = left + Math.abs(x - startX) / 2, cy = top + Math.abs(y - startY) / 2;
                    return { ...s, position: { ...s.position, x: cx, y: cy }, points: [{ x: startX - cx, y: startY - cy }, { x: x - cx, y: y - cy }], size: { ...s.size, width: Math.abs(x - startX), height: Math.abs(y - startY) } };
                }
                const left = Math.min(startX, x), top = Math.min(startY, y);
                return { ...s, position: { ...s.position, x: left + Math.abs(x - startX) / 2, y: top + Math.abs(y - startY) / 2 }, size: { ...s.size, width: Math.abs(x - startX), height: Math.abs(y - startY) } };
            }));
            return;
        }

        if (isResizing) { updateResize(x, y); return; }
        if (isDragging) { updateDrag(x, y); canvasRef.current.style.cursor = 'grabbing'; return; }
        if (isDragSelecting) { updateDragSelect(x, y); return; }

        // Hover
        let cursor = 'default';
        if (selectedShapeIds.size === 1) {
            const [id] = selectedShapeIds;
            const s = shapes.find(sh => sh.id === id);
            if (s && hitTestControls(s, x, y, viewport.zoom, shapeMap)) cursor = 'pointer';
        }
        if (cursor === 'default') {
            let hit = null;
            for (let i = shapes.length - 1; i >= 0; i--) {
                if (hitTest(shapes[i], x, y, viewport.zoom, shapeMap)) { hit = shapes[i]; break; }
            }
            if (hit) { cursor = 'move'; setHoveredShapeId(hit.id); }
            else setHoveredShapeId(null);
        }
        canvasRef.current.style.cursor = cursor;

        // Clear isHighlighted if no shape is being targeted
        if (shapes.some(s => s.isHighlighted)) {
            setShapes(prev => prev.map(s => s.isHighlighted ? { ...s, isHighlighted: false } : s));
        }
    }, [canvasRef, toWorld, activeTool, shapes, viewport.zoom, setShapes, isCreating, selectedShapeIds,
        dragOffset, isResizing, isDragging, isDragSelecting, setHoveredShapeId, setViewport, shapeMapOf,
        updateResize, updateDrag, updateDragSelect]);

    // ── Pointer Up ─────────────────────────────────────────────────────────

    const handlePointerUp = useCallback((e) => {
        if (isPanning.current) {
            isPanning.current = false;
            canvasRef.current.style.cursor = isSpacePressed.current ? 'grab' : 'default';
        }

        if (activeTool === 'eraser') {
            isErasing.current = false;
            saveState(); // Uses Ref-based latest shapes
            return;
        }

        if (isCreating && creatingShapeId.current) {
            const creationId = creatingShapeId.current;
            const startPos = dragOffset ? { x: dragOffset.startX, y: dragOffset.startY } : null;
            setShapes(prev => {
                let next = prev.map(s => {
                    if (s.id !== creationId || s.type !== SHAPE_TYPES.PENCIL || !s.points) return s;
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    s.points.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
                    const w = maxX - minX, h = maxY - minY;
                    const px = s.position?.x || 0, py = s.position?.y || 0;
                    const cx = px + minX + w / 2, cy = py + minY + h / 2;
                    return { ...s, position: { ...s.position, x: cx, y: cy }, size: { ...s.size, width: w, height: h }, points: s.points.map(p => ({ x: (px + p.x) - cx, y: (py + p.y) - cy })) };
                }).filter(s => {
                    if (s.id !== creationId) return true;
                    if (s.type === SHAPE_TYPES.PENCIL && s.points.length > 2) return true;
                    const w = s.size?.width || 0, h = s.size?.height || 0;
                    if (w > 5 || h > 5) return true;
                    if ((s.type === SHAPE_TYPES.LINE || s.type === SHAPE_TYPES.ARROW) && (Math.abs(w) > 5 || Math.abs(h) > 5)) return true;
                    return false;
                });

                const created = next.find(s => s.id === creationId);
                if (created?.type === SHAPE_TYPES.ARROW && startPos) {
                    // Arrow binding is handled imperatively via bindCreatedArrow
                }
                saveState(next);
                return next;
            });

            const created = shapes.find(s => s.id === creationId);
            if (created?.type === SHAPE_TYPES.ARROW && startPos) {
                bindCreatedArrow(creationId, startPos, e);
            }

            if (setActiveTool && activeTool !== 'pencil' && activeTool !== 'draw') {
                setActiveTool('select');
            } else if (activeTool === 'pencil' || activeTool === 'draw') {
                // FreeDraw: do not auto-select the drawn stroke — clear selection instead
                setSelectedShapeIds(new Set());
            }
        } else if (isResizing && selectedShapeIds.size === 1 && (activeHandle === 'start' || activeHandle === 'end')) {
            const [arrowId] = selectedShapeIds;
            rebindArrowEndpoint(arrowId, activeHandle, e);
        } else if (isDragSelecting && selectionBox) {
            commitDragSelect(selectionBox);
        } else if (isDragging) {
            commitDrag(saveState); 
        } else if (isResizing) {
            commitResize(saveState);
        }

        setIsCreating(false);
        creatingShapeId.current = null;
        cancelDrag();
        cancelResize();
        cancelDragSelect();
        if (canvasRef.current?.releasePointerCapture) canvasRef.current.releasePointerCapture(e.pointerId);
    }, [isPanning, isSpacePressed, activeTool, saveState, shapes, isCreating, selectedShapeIds, dragOffset,
        isDragging, isResizing, activeHandle, isDragSelecting, selectionBox, setShapes, setActiveTool,
        bindCreatedArrow, rebindArrowEndpoint, commitDragSelect, commitDrag, commitResize,
        cancelDrag, cancelResize, cancelDragSelect]);

    // ── Double Click ────────────────────────────────────────────────────────

    const handleDoubleClick = useCallback((e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const { x, y } = toWorld(e.clientX - rect.left, e.clientY - rect.top);
        if (readonly) return;

        // Cancel any pending single-click text creation (text tool debounce)
        if (pendingTextRef.current) {
            clearTimeout(pendingTextRef.current);
            pendingTextRef.current = null;
        }

        // Check if we hit an existing shape
        let hit = null;
        for (let i = shapes.length - 1; i >= 0; i--) {
            if (hitTest(shapes[i], x, y, viewport.zoom)) { hit = shapes[i]; break; }
        }

        if (hit?.type === SHAPE_TYPES.TEXT) {
            // Edit existing text shape directly
            setEditingShapeId(hit.id);
            setSelectedShapeIds(new Set([hit.id]));
        } else if (hit) {
            // Double-click on a non-text shape → insert a text label centered inside it
            // Check if this shape already has an embedded text child
            const existing = shapes.find(
                s => s.type === SHAPE_TYPES.TEXT && s.parentId === hit.id
            );
            if (existing) {
                setEditingShapeId(existing.id);
                setSelectedShapeIds(new Set([existing.id]));
                return;
            }
            const id = crypto.randomUUID();
            const newShape = {
                id,
                parentId: hit.id, // soft-link so we can find it again
                type: SHAPE_TYPES.TEXT,
                position: { x: hit.position.x, y: hit.position.y }, // centered on parent
                rotation: 0,
                scale: { x: 1, y: 1 },
                zIndex: (hit.zIndex || 0) + 1,
                text: '',
                font: { family: 'Caveat', size: 42, weight: 'normal', align: 'center' },
                size: { width: 10, height: 30 },
                style: {
                    stroke: '#1a1a1a',
                    fill: 'transparent',
                    strokeWidth: 2,
                    opacity: 1,
                    renderMode: 'vector',
                    roughness: 0,
                    seed: Math.floor(Math.random() * 1000000),
                    fillStyle: 'solid'
                },
                locked: false,
                visible: true,
                revision: { number: 1, timestamp: Date.now() }
            };
            setShapes(prev => { const next = [...prev, newShape]; saveState(next); return next; });
            setSelectedShapeIds(new Set([id]));
            setEditingShapeId(id);
        } else {
            // Empty canvas — create a floating text shape
            const id = crypto.randomUUID();
            const newShape = {
                id,
                type: SHAPE_TYPES.TEXT,
                position: { x, y },
                rotation: 0,
                scale: { x: 1, y: 1 },
                zIndex: 0,
                text: '',
                font: { family: 'Caveat', size: 42, weight: 'normal', align: 'left' },
                size: { width: 10, height: 30 },
                style: {
                    stroke: '#1a1a1a',
                    fill: 'transparent',
                    strokeWidth: 2,
                    opacity: 1,
                    renderMode: 'vector',
                    roughness: 0,
                    seed: Math.floor(Math.random() * 1000000),
                    fillStyle: 'solid'
                },
                locked: false,
                visible: true,
                revision: { number: 1, timestamp: Date.now() }
            };
            setShapes(prev => { const next = [...prev, newShape]; saveState(next); return next; });
            setSelectedShapeIds(new Set([id]));
            setEditingShapeId(id);
        }
    }, [canvasRef, shapes, toWorld, viewport.zoom, setEditingShapeId, setSelectedShapeIds, setShapes, saveState, readonly]);

    // ── Wheel ───────────────────────────────────────────────────────────────

    const handleWheel = useCallback((e) => {
        if (!canvasRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (e.ctrlKey || e.metaKey) {
            const { x: worldX, y: worldY } = toWorld(mouseX, mouseY);
            const newZoom = Math.min(Math.max(viewport.zoom * (e.deltaY > 0 ? 0.95 : 1.05), 0.1), 10);
            setViewport({ x: mouseX - worldX * newZoom, y: mouseY - worldY * newZoom, zoom: newZoom });
        } else {
            let dx = e.deltaX, dy = e.deltaY;
            if (e.shiftKey && dy !== 0 && Math.abs(dx) === 0) { dx = dy; dy = 0; }
            setViewport(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
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
