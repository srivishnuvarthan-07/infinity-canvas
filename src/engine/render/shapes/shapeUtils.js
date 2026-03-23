/**
 * Shared rendering utilities for shape renderers.
 */

/**
 * Stable integer hash from a shape's id — used as the Rough.js seed so each
 * shape renders the same sketch texture on every re-render.
 * @param {Object} shape
 * @returns {number}
 */
export function getShapeSeed(shape) {
    let h = 0xdeadbeef;
    const str = shape.id || '0';
    for (let i = 0; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
    return ((h ^ h >>> 16) >>> 0);
}

/**
 * Applies dash/dot line style to the given canvas context.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} strokeStyle - 'solid' | 'dashed' | 'dotted'
 * @param {number} strokeWidth
 */
export function applyLineDash(ctx, strokeStyle, strokeWidth) {
    if (strokeStyle === 'dashed') {
        ctx.setLineDash([strokeWidth * 3, strokeWidth * 3]);
    } else if (strokeStyle === 'dotted') {
        ctx.setLineDash([strokeWidth, strokeWidth * 2]);
    } else {
        ctx.setLineDash([]);
    }
}
