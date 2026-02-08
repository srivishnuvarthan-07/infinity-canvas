export function drawLine(ctx, shape, isArrow = false, roughOps = null) {
    // New 2-Point Model: shape.x/y is P0. shape.points[1] is P1 (relative).
    let pEnd = { x: shape.width, y: 0 }; // Default fallback

    if (shape.points && shape.points.length > 1) {
        pEnd = shape.points[1];
    }

    // ROUGH MODE
    if (roughOps && roughOps.roughCanvas) {
        const { roughCanvas, getRoughDrawable } = roughOps;
        const drawable = getRoughDrawable(shape, (gen) => {
            const isCartoonist = shape.sloppiness === 'cartoonist';
            const options = {
                stroke: shape.strokeColor,
                strokeWidth: shape.strokeWidth,
                roughness: isCartoonist ? 2.5 : 1.5,
                bowing: isCartoonist ? 2 : 1,
                seed: getShapeSeed(shape)
            };

            const pStart = (shape.points && shape.points.length > 0) ? shape.points[0] : { x: 0, y: 0 };
            const line = gen.line(pStart.x, pStart.y, pEnd.x, pEnd.y, options);

            if (!isArrow) return line;

            // Arrow logic
            const headLen = Math.max(shape.strokeWidth * 4, 10);
            const dx = pEnd.x;
            const dy = pEnd.y;
            const angle = Math.atan2(dy, dx);
            const arrowAngle = Math.PI / 6;

            const x1 = pEnd.x - headLen * Math.cos(angle - arrowAngle);
            const y1 = pEnd.y - headLen * Math.sin(angle - arrowAngle);
            const x2 = pEnd.x - headLen * Math.cos(angle + arrowAngle);
            const y2 = pEnd.y - headLen * Math.sin(angle + arrowAngle);

            const arrowLeg1 = gen.line(pEnd.x, pEnd.y, x1, y1, options);
            const arrowLeg2 = gen.line(pEnd.x, pEnd.y, x2, y2, options);

            // Rough.js doesn't natively support returning multiple shapes from one generator call 
            // easily if we want to cache them as one "Drawable".
            // Actually gen.linearPath or returning an array? 
            // roughCache expects a SINGLE drawable.
            // But roughCanvas.draw accepts a drawable.
            // We can return a "Combined" drawable or just draw separately inside here?
            // Wait, getRoughDrawable stores whatever we return.
            // If we return an array, roughCanvas.draw(array) won't work.
            // But the caller expects `canvas.draw(drawable)`.
            // We can cheat: Return an object with a custom draw method or an array.
            // BUT roughCanvas.draw only takes one.
            // SOLUTION: Use `gen.linearPath` for everything in one go or multiple sets?
            // Actually, we can return an array, and update CanvasRenderer to handle array.
            // OR simpler: `roughCanvas` can't draw array.
            // But we can just draw them inside logic if we bypass cache? NO, we NEED cache.

            // Allow returning Array from generator, and update consumer to loop.
            return [line, arrowLeg1, arrowLeg2];
        });

        if (drawable) {
            if (Array.isArray(drawable)) {
                drawable.forEach(d => roughCanvas.draw(d));
            } else {
                roughCanvas.draw(drawable);
            }
        }
        return;
    }

    // STANDARD MODE
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

    const pStart = (shape.points && shape.points.length > 0) ? shape.points[0] : { x: 0, y: 0 };

    ctx.beginPath();
    ctx.moveTo(pStart.x, pStart.y); // Local P0
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

function getShapeSeed(shape) {
    let h = 0xdeadbeef;
    const str = shape.id || '0';
    for (let i = 0; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
    return ((h ^ h >>> 16) >>> 0);
}
