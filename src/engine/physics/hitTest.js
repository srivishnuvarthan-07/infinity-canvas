// Physics Constants
import { SHAPE_TYPES } from '../schema';
import { getShapeWidth, getShapeHeight } from '../geometry/geometry';

export const HANDLE_SIZE = 10;
export const ROTATION_HANDLE_OFFSET = 20;

export function distToSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Finds the closest edge anchor of a shape to a point
 */
export function getClosestAnchor(shape, point) {
    if (!shape) return 'center';

    let lx = point.x - (shape.position?.x || 0);
    let ly = point.y - (shape.position?.y || 0);

    if (shape.rotation) {
        const angleRad = -(shape.rotation * Math.PI) / 180;
        const cosArg = Math.cos(angleRad);
        const sinArg = Math.sin(angleRad);
        const rx = lx * cosArg - ly * sinArg;
        const ry = lx * sinArg + ly * cosArg;
        lx = rx;
        ly = ry;
    }

    const halfW = getShapeWidth(shape) / 2;
    const halfH = getShapeHeight(shape) / 2;

    const dLeft = Math.abs(lx - (-halfW));
    const dRight = Math.abs(lx - halfW);
    const dTop = Math.abs(ly - (-halfH));
    const dBottom = Math.abs(ly - halfH);

    const minD = Math.min(dLeft, dRight, dTop, dBottom);
    if (minD === dTop) return 'top';
    if (minD === dBottom) return 'bottom';
    if (minD === dLeft) return 'left';
    return 'right';
}



/**
 * Checks if a point hits a control handle of the selected shape
 * @param {Object} shape 
 * @param {number} x - Global X (Scene)
 * @param {number} y - Global Y (Scene)
 * @param {number} zoom - Current Zoom Level (default 1)
 * @returns {'tl'|'tr'|'bl'|'br'|'mt'|'mb'|'ml'|'mr'|'rot'|null}
 */
export function hitTestControls(shape, x, y, zoom = 1, shapeMap = {}) {
    if (!shape) return null;

    // We verify controls in the UNROTATED local space of the shape
    // because handles usually rotate WITH the shape.

    // 1. Transform Point to Local Shape Space
    let lx = x - (shape.position?.x || 0);
    let ly = y - (shape.position?.y || 0);

    const angleRad = -((shape.rotation || 0) * Math.PI) / 180;
    const cosArg = Math.cos(angleRad);
    const sinArg = Math.sin(angleRad);

    // Rotate point
    const rx = lx * cosArg - ly * sinArg;
    const ry = lx * sinArg + ly * cosArg;

    const halfW = getShapeWidth(shape) / 2;
    const halfH = getShapeHeight(shape) / 2;

    // Zoom-safe padding
    // We want the hit area to be constant SCREEN size (e.g. 10px).
    // In Scene space, that is 10/zoom.
    const screenPadding = HANDLE_SIZE / 2 + 5; // 10px total target + buffer
    const padding = screenPadding / zoom;

    // Helper for point-in-rect check (handle centered at hx, hy)
    const hitHandle = (hx, hy) => {
        return Math.abs(rx - hx) <= padding && Math.abs(ry - hy) <= padding;
    };

    // 0. Special Case: Two-Point Shapes (Line, Arrow)
    if (shape.type === SHAPE_TYPES.LINE || shape.type === SHAPE_TYPES.ARROW) {
        const pts = (shape.points && shape.points.length > 1) ? shape.points : [{ x: 0, y: 0 }, { x: getShapeWidth(shape), y: 0 }];
        const pStart = pts[0];                   // Always first point
        const pEnd = pts[pts.length - 1];         // Always LAST point (handles multi-segment routing)

        if (hitHandle(pStart.x, pStart.y)) return 'start';
        if (hitHandle(pEnd.x, pEnd.y)) return 'end';
        return null;
    }

    // 0b. Special Case: Text (No Resize Handles)
    if (shape.type === SHAPE_TYPES.TEXT) {
        return null;
    }

    // 1. Check Rotation Handle (Highest Priority)
    // Position: (0, -halfH - ROTATION_HANDLE_OFFSET)
    if (hitHandle(0, -halfH - ROTATION_HANDLE_OFFSET)) return 'rot';

    // 2. Check Corners
    if (hitHandle(-halfW, -halfH)) return 'tl';
    if (hitHandle(halfW, -halfH)) return 'tr';
    if (hitHandle(-halfW, halfH)) return 'bl';
    if (hitHandle(halfW, halfH)) return 'br';

    // 3. Check Edges
    if (hitHandle(0, -halfH)) return 'mt'; // Middle Top
    if (hitHandle(0, halfH)) return 'mb';  // Middle Bottom
    if (hitHandle(-halfW, 0)) return 'ml'; // Middle Left
    if (hitHandle(halfW, 0)) return 'mr';  // Middle Right

    return null;
}

/**
 * Checks if a point (x, y) hits a shape
 * @param {Object} shape 
 * @param {number} x - Global X
 * @param {number} y - Global Y
 * @param {number} zoom - Current Zoom Level (default 1)
 * @param {Object} shapeMap - Live canvas shape models
 * @returns {boolean}
 */
export function hitTest(shape, x, y, zoom = 1, shapeMap = {}) {
    if (!shape) return false;

    const screenPadding = 10; // 10px tolerance
    const padding = ((shape.style?.strokeWidth || 0) / 2) + (screenPadding / zoom);

    // 1. Convert Global Point to Local Point (Scene Graph Transform)
    let lx = x - (shape.position?.x || 0);
    let ly = y - (shape.position?.y || 0);

    // Rotate (Inverse rotation)
    const angleRad = -((shape.rotation || 0) * Math.PI) / 180;
    const cosArg = Math.cos(angleRad);
    const sinArg = Math.sin(angleRad);

    // Rotate point around origin (which is now the shape center)
    const rx = lx * cosArg - ly * sinArg;
    const ry = lx * sinArg + ly * cosArg;

    const width = getShapeWidth(shape);
    const height = getShapeHeight(shape);

    // 2. Shape Specific Checks
    switch (shape.type) {
        case SHAPE_TYPES.RECTANGLE:
        case SHAPE_TYPES.CYLINDER:
        case SHAPE_TYPES.PARALLELOGRAM:
        case SHAPE_TYPES.HEXAGON:
        case SHAPE_TYPES.DOCUMENT:
        case SHAPE_TYPES.PATH:
            return Math.abs(rx) <= (width / 2) + padding &&
                Math.abs(ry) <= (height / 2) + padding;

        case SHAPE_TYPES.ELLIPSE:
            // Normalize to unit circle
            const rX = (width / 2) + padding;
            const rY = (height / 2) + padding;
            return ((rx * rx) / (rX * rX)) + ((ry * ry) / (rY * rY)) <= 1;

        case SHAPE_TYPES.DIAMOND:
            // Manhattan distance check for standing diamond (rotated 45deg visually relative to rect)
            const halfW = (width / 2) + padding;
            const halfH = (height / 2) + padding;
            return (Math.abs(rx) / halfW) + (Math.abs(ry) / halfH) <= 1;

        case SHAPE_TYPES.LINE:
        case SHAPE_TYPES.ARROW:
            if (shape.points && shape.points.length >= 2) {
                // Check ALL polyline segments (supports multi-point orthogonal routing)
                for (let i = 0; i < shape.points.length - 1; i++) {
                    const p1 = shape.points[i];
                    const p2 = shape.points[i + 1];
                    if (distToSegment(rx, ry, p1.x, p1.y, p2.x, p2.y) <= padding) return true;
                }
                return false;
            }
            // Fallback for older shapes without points
            const w2 = width / 2;
            const h2 = height / 2;
            const d1 = distToSegment(rx, ry, -w2, -h2, w2, h2);
            const d2 = distToSegment(rx, ry, -w2, h2, w2, -h2);
            return Math.min(d1, d2) <= padding;

        case SHAPE_TYPES.TEXT:
            // Text Hit Test - Matches src/engine/utils/textUtils.js Canonical Logic
            // We rely on shape.size being cached correctly.
            const align = shape.font?.align || 'center';

            let minX, maxX;

            // X Alignment (Matches Derived Offset)
            if (align === 'left') {
                minX = 0;
                maxX = width;
            } else if (align === 'right') {
                minX = -width;
                maxX = 0;
            } else { // center (default)
                minX = -width / 2;
                maxX = width / 2;
            }

            // Y Alignment (Matches Middle Baseline assumption)
            const minY = -height / 2;
            const maxY = height / 2;

            return rx >= minX - padding && rx <= maxX + padding &&
                ry >= minY - padding && ry <= maxY + padding;

        case SHAPE_TYPES.PENCIL:
            if (!shape.points || shape.points.length < 2) return false;

            // Check distance to any segment
            for (let i = 0; i < shape.points.length - 1; i++) {
                const p1 = shape.points[i];
                const p2 = shape.points[i + 1];

                const dist = distToSegment(rx, ry, p1.x, p1.y, p2.x, p2.y);
                if (dist <= padding) return true;
            }
            return false;

        case SHAPE_TYPES.GROUP:
            // Simple Bounding Box Hit Test for the Group Container
            // We treat the group as a single object (Rect)
            // (rx, ry) is already in local unrotated space relative to group center
            return Math.abs(rx) <= (width / 2) + padding &&
                Math.abs(ry) <= (height / 2) + padding;

        case SHAPE_TYPES.IMAGE:
            // Images are pure rectangles centered at position
            return Math.abs(rx) <= (width / 2) + padding &&
                Math.abs(ry) <= (height / 2) + padding;

        default:
            return false;
    }
}
