export function drawLine(ctx, shape, isArrow = false) {
    // New 2-Point Model: shape.x/y is P0. shape.points[1] is P1 (relative).
    // If points are missing (legacy), fallback or return.

    let pEnd = { x: shape.width, y: 0 }; // Default fallback

    if (shape.points && shape.points.length > 1) {
        pEnd = shape.points[1];
    } else {
        // Fallback for Box model (if any left) or during migration
        // In Box model, line was -w/2 to w/2. 
        // We are moving to P0 -> P1.
        // Let's assume P0 is 0,0 (local).
    }

    ctx.strokeStyle = shape.strokeColor;
    ctx.lineWidth = shape.strokeWidth;
    ctx.lineCap = 'round';

    if (shape.strokeStyle === 'dashed') {
        ctx.setLineDash([shape.strokeWidth * 3, shape.strokeWidth * 3]);
    } else if (shape.strokeStyle === 'dotted') {
        ctx.setLineDash([shape.strokeWidth, shape.strokeWidth * 2]);
    } else {
        ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(0, 0); // Local P0
    ctx.lineTo(pEnd.x, pEnd.y); // Local P1
    ctx.stroke();

    if (isArrow) {
        // Draw Arrowhead at pEnd
        const headLen = Math.max(shape.strokeWidth * 4, 10);
        const dx = pEnd.x; // (pEnd.x - 0)
        const dy = pEnd.y; // (pEnd.y - 0)
        const angle = Math.atan2(dy, dx);
        const arrowAngle = Math.PI / 6;

        ctx.beginPath();
        ctx.moveTo(pEnd.x, pEnd.y);
        ctx.lineTo(
            pEnd.x - headLen * Math.cos(angle - arrowAngle),
            pEnd.y - headLen * Math.sin(angle - arrowAngle)
        );
        ctx.moveTo(pEnd.x, pEnd.y);
        ctx.lineTo(
            pEnd.x - headLen * Math.cos(angle + arrowAngle),
            pEnd.y - headLen * Math.sin(angle + arrowAngle)
        );
        ctx.stroke();
    }
}
