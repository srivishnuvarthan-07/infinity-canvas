// Physics Constants
import { SHAPE_TYPES, createBaseSchema } from '../schema';
import { measureTextShape } from '../utils/textUtils';

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

    let lx = point.x - shape.x;
    let ly = point.y - shape.y;

    if (shape.rotation) {
        const angleRad = -(shape.rotation * Math.PI) / 180;
        const cosArg = Math.cos(angleRad);
        const sinArg = Math.sin(angleRad);
        const rx = lx * cosArg - ly * sinArg;
        const ry = lx * sinArg + ly * cosArg;
        lx = rx;
        ly = ry;
    }

    const halfW = (shape.width || 0) / 2;
    const halfH = (shape.height || 0) / 2;

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
 * Resolves dynamic connector point using anchor
 */
export function resolveConnectorPoint(pointData, shapeMap) {
    if (!pointData) return { x: 0, y: 0 };

    // Padding to keep arrow slightly away from the connected shape (Excalidraw style)
    const ARROW_PADDING = 12;

    if (pointData.shapeId && shapeMap && shapeMap[pointData.shapeId]) {
        const target = shapeMap[pointData.shapeId];
        const halfW = (target.width || 0) / 2;
        const halfH = (target.height || 0) / 2;

        let lx = 0, ly = 0;
        let padX = 0, padY = 0;

        switch (pointData.anchor) {
            case 'top':
                ly = -halfH;
                padY = -ARROW_PADDING;
                break;
            case 'bottom':
                ly = halfH;
                padY = ARROW_PADDING;
                break;
            case 'left':
                lx = -halfW;
                padX = -ARROW_PADDING;
                break;
            case 'right':
                lx = halfW;
                padX = ARROW_PADDING;
                break;
            default: break; // center
        }

        lx += padX;
        ly += padY;

        if (target.rotation) {
            const angleRad = (target.rotation * Math.PI) / 180;
            const cosArg = Math.cos(angleRad);
            const sinArg = Math.sin(angleRad);
            const gx = target.x + (lx * cosArg - ly * sinArg);
            const gy = target.y + (lx * sinArg + ly * cosArg);
            return { x: gx, y: gy };
        } else {
            return { x: target.x + lx, y: target.y + ly };
        }
    }
    return { x: pointData.x, y: pointData.y };
}

/**
 * Checks if a point hits a control handle of the selected shape
 * @param {import('../schema').BaseShapeSchema} shape 
 * @param {number} x - Global X (Scene)
 * @param {number} y - Global Y (Scene)
 * @param {number} zoom - Current Zoom Level (default 1)
 * @returns {'tl'|'tr'|'bl'|'br'|'mt'|'mb'|'ml'|'mr'|'rot'|null}
 */
export function hitTestControls(shape, x, y, zoom = 1, shapeMap = {}) {
    if (!shape) return null;

    // Connectors use Absolute coordinates
    if (shape.type === SHAPE_TYPES.CONNECTOR && shape.start && shape.mid && shape.end) {
        const start = resolveConnectorPoint(shape.start, shapeMap);
        const end = resolveConnectorPoint(shape.end, shapeMap);
        let mid = { x: shape.mid.x, y: shape.mid.y };

        if (!shape.mid.isManual) {
            mid = {
                x: start.x + (end.x - start.x) / 2,
                y: start.y + (end.y - start.y) / 2
            };
        }

        const padding = (HANDLE_SIZE / 2 + 5) / zoom;
        const hitHandleGlobal = (hx, hy) => Math.abs(x - hx) <= padding && Math.abs(y - hy) <= padding;
        if (hitHandleGlobal(start.x, start.y)) return 'start';
        if (hitHandleGlobal(mid.x, mid.y)) return 'mid';
        if (hitHandleGlobal(end.x, end.y)) return 'end';
        return null;
    }

    // We verify controls in the UNROTATED local space of the shape
    // because handles usually rotate WITH the shape.

    // 1. Transform Point to Local Shape Space
    let lx = x - shape.x;
    let ly = y - shape.y;

    const angleRad = -(shape.rotation * Math.PI) / 180;
    const cosArg = Math.cos(angleRad);
    const sinArg = Math.sin(angleRad);

    // Rotate point
    const rx = lx * cosArg - ly * sinArg;
    const ry = lx * sinArg + ly * cosArg;

    const halfW = shape.width / 2;
    const halfH = shape.height / 2;

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
        let pEnd = { x: shape.width, y: 0 };
        if (shape.points && shape.points.length > 1) {
            pEnd = shape.points[1];
        }

        if (hitHandle(0, 0)) return 'start';
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
 * @param {import('../schema').BaseShapeSchema} shape 
 * @param {number} x - Global X
 * @param {number} y - Global Y
 * @param {number} zoom - Current Zoom Level (default 1)
 * @param {Object} shapeMap - Live canvas shape models
 * @returns {boolean}
 */
export function hitTest(shape, x, y, zoom = 1, shapeMap = {}) {
    if (!shape) return false;

    const screenPadding = 10; // 10px tolerance
    const padding = ((shape.strokeWidth || 0) / 2) + (screenPadding / zoom);

    // Connector uses Global Scene Points completely independent of shape.x and shape.y
    if (shape.type === SHAPE_TYPES.CONNECTOR) {
        if (!shape.start || !shape.end) return false;

        const start = resolveConnectorPoint(shape.start, shapeMap);
        const end = resolveConnectorPoint(shape.end, shapeMap);
        let mid = { x: shape.mid.x, y: shape.mid.y };

        if (!shape.mid.isManual) {
            mid = {
                x: start.x + (end.x - start.x) / 2,
                y: start.y + (end.y - start.y) / 2
            };
        }

        if (shape.arrowType === 'curved' && mid) {
            const dStartMid = distToSegment(x, y, start.x, start.y, mid.x, mid.y);
            const dMidEnd = distToSegment(x, y, mid.x, mid.y, end.x, end.y);
            return Math.min(dStartMid, dMidEnd) <= padding;
        } else if (mid) {
            const dStartMid = distToSegment(x, y, start.x, start.y, mid.x, mid.y);
            const dMidEnd = distToSegment(x, y, mid.x, mid.y, end.x, end.y);
            return Math.min(dStartMid, dMidEnd) <= padding;
        } else {
            return distToSegment(x, y, start.x, start.y, end.x, end.y) <= padding;
        }
    }

    // 1. Convert Global Point to Local Point (Scene Graph Transform)
    let lx = x - shape.x;
    let ly = y - shape.y;

    // Rotate (Inverse rotation)
    const angleRad = -(shape.rotation * Math.PI) / 180;
    const cosArg = Math.cos(angleRad);
    const sinArg = Math.sin(angleRad);

    // Rotate point around origin (which is now the shape center)
    const rx = lx * cosArg - ly * sinArg;
    const ry = lx * sinArg + ly * cosArg;

    // 2. Shape Specific Checks
    switch (shape.type) {
        case SHAPE_TYPES.RECTANGLE:
            return Math.abs(rx) <= (shape.width / 2) + padding &&
                Math.abs(ry) <= (shape.height / 2) + padding;

        case SHAPE_TYPES.ELLIPSE:
            // Normalize to unit circle
            const rX = (shape.width / 2) + padding;
            const rY = (shape.height / 2) + padding;
            return ((rx * rx) / (rX * rX)) + ((ry * ry) / (rY * rY)) <= 1;

        case SHAPE_TYPES.DIAMOND:
            // Manhattan distance check for standing diamond (rotated 45deg visually relative to rect)
            const halfW = (shape.width / 2) + padding;
            const halfH = (shape.height / 2) + padding;
            return (Math.abs(rx) / halfW) + (Math.abs(ry) / halfH) <= 1;

        case SHAPE_TYPES.LINE:
        case SHAPE_TYPES.ARROW:
            // Check distance to line segment from (-w/2, -h/2) to (w/2, h/2) or similar.
            // But CUSTOM ENGINE LINES might be simple boxes or diagonals?
            // "standard drag to create" produces a box.
            // Let's assume the line goes from Top-Left to Bottom-Right if width/height are positive?
            // Wait, we don't store direction. That's a flaw in schema.
            // Assumption: Line is always drawn along the main diagonal.
            // But we should check BOTH diagonals or just check if point is near the segment.
            // Best interaction: Check if point is near segment (-w/2, 0) to (w/2, 0) IF 1D?
            // But we allow 2D resizing of lines.
            // Let's check distance to Segment P1(-w/2, -h/2) -> P2(w/2, h/2).
            // AND check P3(-w/2, h/2) -> P4(w/2, -h/2).

            // Or better: If it's a "Line", users expect it to be a specific diagonal.
            // But since we lost direction, let's treat "Hit" as "Inside the thin diagonal bounding areas".
            const w2 = (shape.width || 0) / 2;
            const h2 = (shape.height || 0) / 2;
            const d1 = distToSegment(rx, ry, -w2, -h2, w2, h2);
            const d2 = distToSegment(rx, ry, -w2, h2, w2, -h2);

            return Math.min(d1, d2) <= padding;

        case SHAPE_TYPES.TEXT:
            // Text Hit Test - Matches src/engine/utils/textUtils.js Canonical Logic
            // We rely on shape.width and shape.height being cached correctly.

            const textW = shape.width || 0;
            const textH = shape.height || 0;
            const align = shape.textAlign || 'center';

            let minX, maxX;

            // X Alignment (Matches Derived Offset)
            if (align === 'left') {
                minX = 0;
                maxX = textW;
            } else if (align === 'right') {
                minX = -textW;
                maxX = 0;
            } else { // center (default)
                minX = -textW / 2;
                maxX = textW / 2;
            }

            // Y Alignment (Matches Middle Baseline assumption)
            const minY = -textH / 2;
            const maxY = textH / 2;

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
            return Math.abs(rx) <= (shape.width / 2) + padding &&
                Math.abs(ry) <= (shape.height / 2) + padding;

        default:
            return false;
    }
}
