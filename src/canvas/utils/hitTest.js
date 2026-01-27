import { Point } from "fabric";
import { SHAPE_TYPES } from "../constants";

/**
 * Transforms a point from canvas space to the shape's local coordinate space.
 * Un-rotates and un-translates.
 * 
 * @param {Object} shape - Fabric object
 * @param {Object} pointer - {x, y} in canvas coordinates
 * @returns {Point} - Point in local space (relative to center)
 */
export function toLocalSpace(shape, pointer) {
    const center = shape.getCenterPoint();
    const dx = pointer.x - center.x;
    const dy = pointer.y - center.y;
    const angleRad = -shape.angle * (Math.PI / 180);

    return new Point(
        dx * Math.cos(angleRad) - dy * Math.sin(angleRad),
        dx * Math.sin(angleRad) + dy * Math.cos(angleRad)
    );
}

/**
 * Helper to determine if a shape has a visible fill.
 * Returns false for null, 'transparent', or rgba(..., 0).
 */
function hasVisibleFill(shape) {
    if (!shape.fill) return false;
    if (shape.fill === 'transparent') return false;
    // Check for rgba(r,g,b,0) strictly if needed, but 'transparent' is the main Fabric keyword.
    // We could parse color but usually string 'transparent' is used for no-fill.
    return true;
}

/**
 * Checks if a point (canvas space) hits the shape (local space strict check).
 * 
 * @param {Object} shape 
 * @param {Object} pointer 
 * @returns {boolean}
 */
export function hitTestShape(shape, pointer, canvas = null) {
    if (!shape.visible || !shape.selectable && !shape.interactive) return false;

    // 1. Get Local Point
    const local = toLocalSpace(shape, pointer);

    // 2. Shape Specific Checks
    const { type, width, height, strokeWidth = 0 } = shape;
    const halfW = width / 2;
    const halfH = height / 2;
    // Add small padding for easier selection
    const padding = (strokeWidth / 2) + 5;

    switch (type) {
        case SHAPE_TYPES.RECT:
        case SHAPE_TYPES.DIAMOND:
            // Diamond is just a rotated Rect. Local space handles rotation.
            // Simple AABB in local space

            // 1. Check if inside bounds
            const insideRect = Math.abs(local.x) <= halfW + padding &&
                Math.abs(local.y) <= halfH + padding;

            if (!insideRect) return false;

            // 2. Invariant: Only capture interior if fill is visible.
            if (!hasVisibleFill(shape)) {
                // Must be close to the edge (Stroke Check)
                const closeToVertical = Math.abs(Math.abs(local.x) - halfW) <= padding;
                const closeToHorizontal = Math.abs(Math.abs(local.y) - halfH) <= padding;
                return closeToVertical || closeToHorizontal;
            }

            return true;

        case SHAPE_TYPES.CIRCLE:
            // Circle radius check
            const radius = shape.radius || 0;
            const distSq = local.x * local.x + local.y * local.y;
            const insideCircle = distSq <= Math.pow(radius + padding, 2);

            if (!insideCircle) return false;

            if (!hasVisibleFill(shape)) {
                // Must be close to the border
                // Distance from center must be approx Radius
                const dist = Math.sqrt(distSq);
                return Math.abs(dist - radius) <= padding;
            }
            return true;

        case SHAPE_TYPES.ELLIPSE:
            // Ellipse equation: x^2/a^2 + y^2/b^2 <= 1
            // shape.rx, shape.ry usually define radii
            const rx = shape.rx + padding;
            const ry = shape.ry + padding;
            if (rx === 0 || ry === 0) return false;

            const equation = ((local.x * local.x) / (rx * rx) + (local.y * local.y) / (ry * ry));
            if (equation > 1) return false;

            if (!hasVisibleFill(shape)) {
                // Approximate "close to border" for Ellipse (simplification: simple equation range)
                // (x^2/a^2 + y^2/b^2) should be close to 1
                // This is an approximation but works well for UI selection
                return equation >= 0.8; // Tolerance: inner boundary
            }
            return true;

        case SHAPE_TYPES.LINE:
        case SHAPE_TYPES.ARROW:
            // Line Segment Distance
            // Need line coordinates in local space.
            // shape.calcLinePoints() returns {x1, y1, x2, y2} centered
            const points = shape.calcLinePoints();
            return distanceToLineSegment(local, points, padding);

        // Text interacts via bounding box usually, which is Rect-like
        case SHAPE_TYPES.TEXT:
        case 'i-text':
        case 'textbox':
            return Math.abs(local.x) <= halfW + padding &&
                Math.abs(local.y) <= halfH + padding;

        default:
            // Handle Paths / Polygons / Generic Shapes
            if (shape.type === 'path' || shape.type === 'polygon' || type === SHAPE_TYPES.PATH || type === SHAPE_TYPES.POLYGON) {
                const canvasPoint = new Point(pointer.x, pointer.y);

                // 1. Exact Hit (Geometry)
                if (shape.containsPoint(canvasPoint)) {
                    // Invariant: Only capture interior if fill is visible.
                    if (!hasVisibleFill(shape) && canvas) {
                        if (canvas.isTargetTransparent(shape, pointer.x, pointer.y)) {
                            // If transparent pixel, check if we are "close enough" (Tolerance Fallback)
                            // This ensures that slightly missing the strict pixel doesn't fail 
                            // IF we are still within padding range of the mathematical stroke.
                            return isPointNearPath(shape, local, padding);
                        }
                    }
                    return true;
                }

                // 2. Proximity Hit (Tolerance)
                // If containsPoint returned false (e.g. clicked slightly outside thin stroke), 
                // check mathematical distance to path segments.
                // Only for stroke-only paths or transparent filled paths (where we missed the stroke).
                if (!hasVisibleFill(shape)) {
                    return isPointNearPath(shape, local, padding);
                }

                return false;
            }

            // Default Fallback AABB (Local Space)
            return Math.abs(local.x) <= halfW + padding &&
                Math.abs(local.y) <= halfH + padding;
    }
}

/**
 * Checks if a local point is within threshold distance of any path segment.
 * Simplifies curves to line segments for performance/simplicity.
 */
function isPointNearPath(shape, localPoint, threshold) {
    if (!shape.path) return false;

    const offset = shape.pathOffset || { x: 0, y: 0 };
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;

    for (let i = 0; i < shape.path.length; i++) {
        const command = shape.path[i];
        const type = command[0];

        switch (type) {
            case 'M': // Move
                startX = command[1] - offset.x;
                startY = command[2] - offset.y;
                currentX = startX;
                currentY = startY;
                break;

            case 'L': // Line
                const lX = command[1] - offset.x;
                const lY = command[2] - offset.y;
                if (distanceToLineSegment(localPoint, { x1: currentX, y1: currentY, x2: lX, y2: lY }, threshold)) return true;
                currentX = lX;
                currentY = lY;
                break;

            case 'Q': // Quadratic Bezier (Control, End)
                // Approx with line to end (User reported "vertices" select, so segments are the gap)
                // For better accuracy we could check distance to curve, but segment current->end is decent 1st upgrade.
                // Let's check current -> control -> end for better coverage?
                // Just checking current->end might miss the "bulge". 
                // Let's check two segments: current->control, control->end.

                const cX = command[1] - offset.x;
                const cY = command[2] - offset.y;
                const qX = command[3] - offset.x;
                const qY = command[4] - offset.y;

                if (distanceToLineSegment(localPoint, { x1: currentX, y1: currentY, x2: cX, y2: cY }, threshold)) return true;
                if (distanceToLineSegment(localPoint, { x1: cX, y1: cY, x2: qX, y2: qY }, threshold)) return true;

                currentX = qX;
                currentY = qY;
                break;

            case 'C': // Cubic Bezier (C1, C2, End)
                // Approx with 3 lines
                const c1X = command[1] - offset.x;
                const c1Y = command[2] - offset.y;
                const c2X = command[3] - offset.x;
                const c2Y = command[4] - offset.y;
                const endX = command[5] - offset.x;
                const endY = command[6] - offset.y;

                if (distanceToLineSegment(localPoint, { x1: currentX, y1: currentY, x2: c1X, y2: c1Y }, threshold)) return true;
                if (distanceToLineSegment(localPoint, { x1: c1X, y1: c1Y, x2: c2X, y2: c2Y }, threshold)) return true;
                if (distanceToLineSegment(localPoint, { x1: c2X, y1: c2Y, x2: endX, y2: endY }, threshold)) return true;

                currentX = endX;
                currentY = endY;
                break;

            case 'Z': // Close path
                if (distanceToLineSegment(localPoint, { x1: currentX, y1: currentY, x2: startX, y2: startY }, threshold)) return true;
                currentX = startX;
                currentY = startY;
                break;
        }
    }
    return false;
}

function distanceToLineSegment(p, line, threshold) {
    const { x1, y1, x2, y2 } = line;
    const A = p.x - x1;
    const B = p.y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = p.x - xx;
    const dy = p.y - yy;

    return Math.sqrt(dx * dx + dy * dy) <= threshold;
}

/**
 * Iterates shapes from top to bottom and finds the first unique hit.
 */
export function getShapeAtPointer(fabricCanvas, pointer) {
    const objects = fabricCanvas.getObjects();
    // Reverse iterate (Top -> Bottom)
    for (let i = objects.length - 1; i >= 0; i--) {
        const shape = objects[i];
        if (hitTestShape(shape, pointer, fabricCanvas)) {
            return shape;
        }
    }
    return null;
}
