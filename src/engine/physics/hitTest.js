// Physics Constants
import { SHAPE_TYPES } from '../schema';

export const HANDLE_SIZE = 10;
export const ROTATION_HANDLE_OFFSET = 20;

/**
 * Checks if a point hits a control handle of the selected shape
 * @param {import('../schema').BaseShapeSchema} shape 
 * @param {number} x 
 * @param {number} y 
 * @returns {'tl'|'tr'|'bl'|'br'|'mt'|'mb'|'ml'|'mr'|'rot'|null}
 */
export function hitTestControls(shape, x, y) {
    if (!shape) return null;

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
    const padding = HANDLE_SIZE / 2 + 5; // generous hit area

    // Helper for point-in-rect check (handle centered at hx, hy)
    const hitHandle = (hx, hy) => {
        return Math.abs(rx - hx) <= padding && Math.abs(ry - hy) <= padding;
    };

    // Check Corners
    if (hitHandle(-halfW, -halfH)) return 'tl';
    if (hitHandle(halfW, -halfH)) return 'tr';
    if (hitHandle(-halfW, halfH)) return 'bl';
    if (hitHandle(halfW, halfH)) return 'br';

    // Check Edges (Optional, usually good for specific resizing)
    if (hitHandle(0, -halfH)) return 'mt'; // Middle Top
    if (hitHandle(0, halfH)) return 'mb';  // Middle Bottom
    if (hitHandle(-halfW, 0)) return 'ml'; // Middle Left
    if (hitHandle(halfW, 0)) return 'mr';  // Middle Right

    // Check Rotation Handle (usually above top edge)
    // Position: (0, -halfH - ROTATION_HANDLE_OFFSET)
    if (hitHandle(0, -halfH - ROTATION_HANDLE_OFFSET)) return 'rot';

    return null;
}

/**
 * Checks if a point (x, y) hits a shape
 * @param {import('../schema').BaseShapeSchema} shape 
 * @param {number} x - Global X
 * @param {number} y - Global Y
 * @returns {boolean}
 */
export function hitTest(shape, x, y) {
    if (!shape) return false;

    // 1. Convert Global Point to Local Point (Scene Graph Transform)
    // Translate
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
    const padding = (shape.strokeWidth || 0) / 2 + 5; // buffer

    switch (shape.type) {
        case SHAPE_TYPES.RECTANGLE:
            return Math.abs(rx) <= (shape.width / 2) + padding &&
                Math.abs(ry) <= (shape.height / 2) + padding;

        case SHAPE_TYPES.ELLIPSE:
            // Normalize to unit circle
            const normX = rx / ((shape.width / 2) + padding);
            const normY = ry / ((shape.height / 2) + padding);
            return (normX * normX + normY * normY) <= 1;

        case SHAPE_TYPES.DIAMOND:
            // Diamond is a rect rotated 45deg, but we already rotated by shape.rotation.
            // If the shape.rotation INCLUDES the 45deg, then it's just a rect check.
            // But if 'diamond' acts as a specific shape where 0 rotation means "standing diamond",
            // then we need to rotate another 45 degrees.
            // Let's assume standard behavior: Diamond IS a rotated rect.
            // BUT, if it is a specific type, let's treat it as a polygon or Manhattan distance.
            // Manhattan distance for diamond: |x|/w + |y|/h <= 0.5 (approx)
            // Let's stick to the rotated rect logic if we assume it's just visual.
            // Actually, let's use the Manhattan distance check for a standing diamond.
            const halfW = (shape.width / 2) + padding;
            const halfH = (shape.height / 2) + padding;
            return (Math.abs(rx) / halfW) + (Math.abs(ry) / halfH) <= 1;

        case SHAPE_TYPES.LINE:
        case SHAPE_TYPES.ARROW:
            // Line from -w/2 to w/2 (centered)
            // Check distance to segment
            const halfLen = shape.width / 2;
            // The line lies on the X-axis in local space from -halfLen to +halfLen
            if (rx >= -halfLen - padding && rx <= halfLen + padding) {
                return Math.abs(ry) <= padding;
            }
            return false;

        case SHAPE_TYPES.TEXT:
            // Approximate text as a rectangle
            return Math.abs(rx) <= (shape.width / 2) + padding &&
                Math.abs(ry) <= (shape.height / 2) + padding; // Height needs to be derived/estimated if not in schema

        default:
            return false;
    }
}
