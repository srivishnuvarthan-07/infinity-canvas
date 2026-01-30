export function drawRect(ctx, shape) {
    const w = shape.width;
    const h = shape.height;

    // Setup styles
    ctx.strokeStyle = shape.strokeColor;
    ctx.lineWidth = shape.strokeWidth;
    ctx.fillStyle = shape.fillColor;

    // Handle Dashed/Dotted
    if (shape.strokeStyle === 'dashed') {
        ctx.setLineDash([shape.strokeWidth * 3, shape.strokeWidth * 3]);
    } else if (shape.strokeStyle === 'dotted') {
        ctx.setLineDash([shape.strokeWidth, shape.strokeWidth * 2]);
    } else {
        ctx.setLineDash([]);
    }

    // Draw (centered at 0,0 because of renderer translate)
    if (shape.fillColor && shape.fillColor !== 'transparent') {
        ctx.fillRect(-w / 2, -h / 2, w, h);
    }
    ctx.strokeRect(-w / 2, -h / 2, w, h);
}
