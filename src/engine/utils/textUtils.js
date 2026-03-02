// Singleton offscreen canvas for measuring text when no ctx is available
let internalCtx = null;
function getInternalCtx() {
    if (!internalCtx) {
        const tempCanvas = document.createElement('canvas');
        internalCtx = tempCanvas.getContext('2d');
    }
    return internalCtx;
}

/**
 * Calculates the canonical layout for a text shape.
 * Single source of truth for Rendering, Hit-Testing, and Overlay.
 * 
 * @param {CanvasRenderingContext2D|null} ctx 
 * @param {import('../schema').BaseShapeSchema} shape 
 * @returns {{ width: number, height: number, offsetX: number, offsetY: number, lines: string[], lineHeight: number }}
 */
export function getTextLayout(ctx, shape) {
    const context = ctx || getInternalCtx();
    context.save();
    context.font = `${shape.font?.size || 20}px ${shape.font?.family || 'sans-serif'}`;

    const lines = (shape.text || '').split('\n');
    const fontSize = shape.font?.size || 20;
    const lineHeight = fontSize * 1.25; // Excalidraw uses ~1.25 usually

    let maxWidth = 0;
    const lineWidths = [];

    for (const line of lines) {
        const metrics = context.measureText(line);
        const w = metrics.width;
        lineWidths.push(w);
        maxWidth = Math.max(maxWidth, w);
    }

    const width = maxWidth;
    const height = lines.length * lineHeight;

    // Calculate Offsets relative to Anchor (0,0 of shape local space)
    // Horizontal
    let offsetX = 0;
    const align = shape.font?.align || 'center'; // Default to center

    if (align === 'left') {
        offsetX = 0;
    } else if (align === 'right') {
        offsetX = -width;
    } else { // center
        offsetX = -width / 2;
    }

    // Vertical (Assume Middle Alignment for now to match Center default)
    // If shape.y is center, then top-left is at y - height/2
    const offsetY = -height / 2;

    context.restore();

    return {
        width: Math.max(width, 10), // Min width
        height: Math.max(height, lineHeight), // Min height
        offsetX,
        offsetY,
        lines,
        lineHeight,
        lineWidths // Useful for per-line alignment if mixed? No, usually block alignment.
    };
}

// Deprecated alias for backward compat if needed temporarily
export const measureTextShape = getTextLayout;
