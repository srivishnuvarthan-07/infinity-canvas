export function drawDiamond(ctx, shape) {
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

    // Draw Diamond Path
    ctx.beginPath();
    ctx.moveTo(0, -h / 2); // Top Center
    ctx.lineTo(w / 2, 0);  // Right Middle
    ctx.lineTo(0, h / 2);  // Bottom Center
    ctx.lineTo(-w / 2, 0); // Left Middle
    ctx.closePath();

    if (shape.fillColor && shape.fillColor !== 'transparent') {
        ctx.fill();
    }
    ctx.stroke();
}
