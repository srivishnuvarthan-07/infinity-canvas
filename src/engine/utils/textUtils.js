/**
 * Calculates the canonical layout for a text shape.
 * Single source of truth for Rendering, Hit-Testing, and Overlay.
 * 
 * @param {CanvasRenderingContext2D} ctx 
 * @param {import('../schema').BaseShapeSchema} shape 
 * @returns {{ width: number, height: number, offsetX: number, offsetY: number, lines: string[], lineHeight: number }}
 */
export function getTextLayout(ctx, shape) {
    ctx.save();
    ctx.font = `${shape.fontSize || 20}px ${shape.fontFamily || 'sans-serif'}`;

    const lines = (shape.text || '').split('\n');
    const fontSize = shape.fontSize || 20;
    const lineHeight = fontSize * 1.25; // Excalidraw uses ~1.25 usually

    let maxWidth = 0;
    const lineWidths = [];

    for (const line of lines) {
        const metrics = ctx.measureText(line);
        const w = metrics.width;
        lineWidths.push(w);
        maxWidth = Math.max(maxWidth, w);
    }

    const width = maxWidth;
    const height = lines.length * lineHeight;

    // Calculate Offsets relative to Anchor (0,0 of shape local space)
    // Horizontal
    let offsetX = 0;
    const align = shape.textAlign || 'center'; // Default to center

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

    ctx.restore();

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
