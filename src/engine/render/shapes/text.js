export function drawText(ctx, shape) {
    ctx.fillStyle = shape.strokeColor; // Text uses stroke color as fill usually, or separate fill
    ctx.font = `${shape.fontSize || 20}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Handle multiline text if needed, but for now simple
    const lines = (shape.text || '').split('\n');
    const lineHeight = (shape.fontSize || 20) * 1.2;
    const totalHeight = lines.length * lineHeight;
    let startY = -totalHeight / 2 + lineHeight / 2;

    for (const line of lines) {
        ctx.fillText(line, 0, startY);
        startY += lineHeight;
    }
}
