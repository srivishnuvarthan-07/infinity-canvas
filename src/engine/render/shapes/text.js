import { getTextLayout } from '../../utils/textUtils';

export function drawText(ctx, shape) {
    const layout = getTextLayout(ctx, shape);

    ctx.fillStyle = shape.style?.stroke || shape.style?.fill || '#000000';
    ctx.font = `${shape.font?.size || 20}px ${shape.font?.family || 'sans-serif'}`;

    // textAlign drives horizontal positioning: anchor (0,0) acts as left/center/right origin
    ctx.textAlign = shape.font?.align || 'center';
    ctx.textBaseline = 'top';

    let y = layout.offsetY;
    for (const line of layout.lines) {
        ctx.fillText(line, 0, y);
        y += layout.lineHeight;
    }
}
