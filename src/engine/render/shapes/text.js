import { getTextLayout } from '../../utils/textUtils';

export function drawText(ctx, shape) {
    try {
        const layout = getTextLayout(ctx, shape);

        // Uses style.fill for text color instead of strokeColor
        ctx.fillStyle = shape.style?.fill || '#000000';
        ctx.font = `${shape.font?.size || 20}px ${shape.font?.family || 'sans-serif'}`;

        // CANONICAL RENDERING: Always Left/Top relative to calculated offsets
        // The layout.offsetX/Y places the top-left of the bounding box relative to the Anchor (0,0)

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const startX = layout.offsetX;
        const startY = layout.offsetY;

        let y = startY;
        for (const line of layout.lines) {
            // If we want per-line alignment relative to the box width?
            // "TextAlign" property usually affects the whole block relative to anchor.
            // But inside the block, lines are usually aligned too?
            // If textAlign is center, the BLOCK is centered on anchor.
            // Do the lines verify center relative to each other?
            // Excalidraw: Center align means lines are centered to each other too.
            // My `getTextLayout` logic for `offsetX` moves the BLOCK.
            // It does NOT align lines internally if they have different widths.
            // To align lines internally:
            // If align=center, each line x = offsetX + (maxWidth - lineWidth)/2 ? NO.
            // If align=center, each line x should be centered on X=0.
            // My `getTextLayout` calculates `offsetX` as Box Top-Left.
            // If I just draw at `offsetX`, it's left aligned.
            // FIX: We should use `ctx.textAlign` match shape.font.align for INTERNAL alignment?
            // BUT we need to position the anchor correctly.
            // If ctx.textAlign = 'center', then drawing at (0, y) centers the line at 0.
            // If shape.textAlign = 'center', offsetX = -width/2.
            // WE SHOULD IGNORE offsetX for X position if we rely on ctx.textAlign for line alignment.
            // Let's refine:
            // Anchor (0,0).
            // If align='center', draw at (0, y). ctx.textAlign='center'.
            // If align='left', draw at (0, y). ctx.textAlign='left'. 
            // If align='right', draw at (0, y). ctx.textAlign='right'.
            // Simple!
            // BUT we still need `offsetX` for the Overlay/HitTest box calculation.
            // So `getTextLayout` returns the Box. Renderer just draws text at Anchor.

            // Wait, does 'left' mean anchor is left edge? Yes.
            // Does 'center' mean anchor is center? Yes.
            // So we can just use `ctx.textAlign = shape.textAlign`.
            // AND `ctx.fillText(line, 0, y)`.
            // The vertically, we need `layout.offsetY` (Top of box).

            ctx.textAlign = shape.font?.align || 'center';
            // We draw at x=0 (Anchor X).

            ctx.fillText(line, 0, y);
            y += layout.lineHeight;
        }

    } catch (err) {
        console.error('Error drawing text:', err);
    }
}
