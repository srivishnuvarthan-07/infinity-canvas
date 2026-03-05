import { useState, useCallback, useRef } from 'react';
import { calculateResize, calculateRotation } from '@/engine/physics/resize';
import { updateConnectedArrows } from '@/engine/routing/smartArrow';
import { SHAPE_TYPES } from '@/engine/schema';

const SYNC_THROTTLE_MS = 50;

/**
 * useResize
 * Manages shape resize and rotation via control handles.
 * Handles all shape types: box shapes, line/arrow endpoints, pencil/group scale.
 */
export function useResize({ canvasRef, shapes, setShapes, selectedShapeIds, emitUpdate }) {
    const [isResizing, setIsResizing] = useState(false);
    const [activeHandle, setActiveHandle] = useState(null);
    const [dragOffset, setDragOffset] = useState({ startX: 0, startY: 0 });
    const [startDimensions, setStartDimensions] = useState(null);
    const lastSyncTime = useRef(0);

    const startResize = useCallback((handle, worldX, worldY, shape, e) => {
        setIsResizing(true);
        setActiveHandle(handle);
        setDragOffset({ startX: worldX, startY: worldY });
        setStartDimensions({
            x: shape.position?.x || 0,
            y: shape.position?.y || 0,
            width: shape.size?.width || 0,
            height: shape.size?.height || 0,
            rotation: shape.rotation || 0,
            points: shape.points ? JSON.parse(JSON.stringify(shape.points)) : undefined,
            children: shape.children ? JSON.parse(JSON.stringify(shape.children)) : undefined
        });
        if (canvasRef.current?.setPointerCapture) canvasRef.current.setPointerCapture(e.pointerId);
    }, [canvasRef]);

    const updateResize = useCallback((worldX, worldY) => {
        if (!activeHandle || selectedShapeIds.size !== 1) return;
        const resizeId = [...selectedShapeIds][0];

        setShapes(prev => {
            const mapped = prev.map(s => {
                if (s.id !== resizeId) return s;

                // Rotation
                if (activeHandle === 'rot') {
                    const newShape = { ...s, rotation: calculateRotation(s, worldX, worldY) };
                    if (Date.now() - lastSyncTime.current > SYNC_THROTTLE_MS) { emitUpdate(newShape); lastSyncTime.current = Date.now(); }
                    return newShape;
                }

                // Line / Arrow endpoint drag
                if (s.type === SHAPE_TYPES.LINE || s.type === SHAPE_TYPES.ARROW) {
                    const rad = (startDimensions.rotation || 0) * Math.PI / 180;
                    const cos = Math.cos(rad); const sin = Math.sin(rad);
                    const p0x = startDimensions.points[0]?.x || 0, p0y = startDimensions.points[0]?.y || 0;
                    const p1x = startDimensions.points[1]?.x || 0, p1y = startDimensions.points[1]?.y || 0;

                    let p0g = { x: startDimensions.x + (p0x * cos - p0y * sin), y: startDimensions.y + (p0x * sin + p0y * cos) };
                    let p1g = { x: startDimensions.x + (p1x * cos - p1y * sin), y: startDimensions.y + (p1x * sin + p1y * cos) };

                    if (activeHandle === 'start') p0g = { x: worldX, y: worldY };
                    else if (activeHandle === 'end') p1g = { x: worldX, y: worldY };
                    else return s;

                    const cx = (p0g.x + p1g.x) / 2, cy = (p0g.y + p1g.y) / 2;
                    const invCos = Math.cos(-rad), invSin = Math.sin(-rad);
                    const dx0 = p0g.x - cx, dy0 = p0g.y - cy;
                    const dx1 = p1g.x - cx, dy1 = p1g.y - cy;

                    const newShape = {
                        ...s,
                        position: { ...s.position, x: cx, y: cy },
                        points: [
                            { x: dx0 * invCos - dy0 * invSin, y: dx0 * invSin + dy0 * invCos },
                            { x: dx1 * invCos - dy1 * invSin, y: dx1 * invSin + dy1 * invCos }
                        ],
                        size: { ...s.size, width: Math.abs(dx0 - dx1) * 2, height: Math.abs(dy0 - dy1) * 2 }
                    };
                    if (Date.now() - lastSyncTime.current > SYNC_THROTTLE_MS) { emitUpdate(newShape); lastSyncTime.current = Date.now(); }
                    return newShape;
                }

                // Box resize
                const updates = calculateResize(s, activeHandle, worldX, worldY, {
                    ...startDimensions, startMouseX: dragOffset.startX, startMouseY: dragOffset.startY
                });
                if (!updates) return s;

                if (s.type === SHAPE_TYPES.PENCIL && startDimensions.points) {
                    const scaleX = updates.size.width / startDimensions.width;
                    const scaleY = updates.size.height / startDimensions.height;
                    const newShape = { ...s, ...updates, points: startDimensions.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY })) };
                    if (Date.now() - lastSyncTime.current > SYNC_THROTTLE_MS) { emitUpdate(newShape); lastSyncTime.current = Date.now(); }
                    return newShape;
                }
                if (s.type === SHAPE_TYPES.GROUP && startDimensions.children) {
                    const scaleX = updates.size.width / startDimensions.width;
                    const scaleY = updates.size.height / startDimensions.height;
                    const newChildren = startDimensions.children.map(child => ({
                        ...child,
                        position: { ...child.position, x: (child.position?.x || 0) * scaleX, y: (child.position?.y || 0) * scaleY },
                        size: { ...child.size, width: (child.size?.width || 0) * scaleX, height: (child.size?.height || 0) * scaleY },
                        points: child.points?.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }))
                    }));
                    const newShape = { ...s, ...updates, children: newChildren };
                    if (Date.now() - lastSyncTime.current > SYNC_THROTTLE_MS) { emitUpdate(newShape); lastSyncTime.current = Date.now(); }
                    return newShape;
                }

                const newShape = { ...s, ...updates };
                if (Date.now() - lastSyncTime.current > SYNC_THROTTLE_MS) { emitUpdate(newShape); lastSyncTime.current = Date.now(); }
                return newShape;
            });

            return updateConnectedArrows(selectedShapeIds, mapped);
        });
    }, [activeHandle, selectedShapeIds, startDimensions, dragOffset, setShapes, emitUpdate]);

    const commitResize = useCallback((saveState) => {
        saveState(shapes);
        setIsResizing(false);
        setActiveHandle(null);
        setStartDimensions(null);
    }, [shapes]);

    const cancelResize = useCallback(() => {
        setIsResizing(false);
        setActiveHandle(null);
    }, []);

    return {
        isResizing,
        setIsResizing,
        activeHandle,
        setActiveHandle,
        dragOffset,
        setDragOffset,
        startDimensions,
        startResize,
        updateResize,
        commitResize,
        cancelResize
    };
}
