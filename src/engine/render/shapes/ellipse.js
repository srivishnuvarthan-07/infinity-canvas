export function drawEllipse(ctx, shape) {
    const rx = shape.width / 2;
    const ry = shape.height / 2;

    ctx.strokeStyle = shape.strokeColor;
    ctx.lineWidth = shape.strokeWidth;
    ctx.fillStyle = shape.fillColor;

    if (shape.strokeStyle === 'dashed') {
        ctx.setLineDash([shape.strokeWidth * 3, shape.strokeWidth * 3]);
    } else if (shape.strokeStyle === 'dotted') {
        ctx.setLineDash([shape.strokeWidth, shape.strokeWidth * 2]);
    } else {
        ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, 2 * Math.PI);

    if (shape.fillColor && shape.fillColor !== 'transparent') {
        ctx.fill();
    }
    ctx.stroke();
}
