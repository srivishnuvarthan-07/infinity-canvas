export function drawRect(ctx, shape, roughOps = null) {
    const w = shape.width;
    const h = shape.height;

    // ROUGH MODE
    if (roughOps && roughOps.roughCanvas) {
        const { roughCanvas, getRoughDrawable } = roughOps;
        const drawable = getRoughDrawable(shape, (gen) => {
            const isCartoonist = shape.sloppiness === 'cartoonist';
            const options = {
                stroke: shape.strokeColor,
                strokeWidth: shape.strokeWidth,
                fill: shape.fillColor !== 'transparent' ? shape.fillColor : undefined,
                fillStyle: shape.fillStyle || 'hachure', // Default to hachure
                roughness: isCartoonist ? 2.5 : 1.5,
                bowing: isCartoonist ? 2 : 1, // More curvy for cartoons
                seed: getShapeSeed(shape) // Consistent random seed
            };
            // Center is 0,0, so rect is from -w/2, -h/2
            return gen.rectangle(-w / 2, -h / 2, w, h, options);
        });

        if (drawable) roughCanvas.draw(drawable);
        return;
    }

    // STANDARD MODE
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

// Simple hash for seed
function getShapeSeed(shape) {
    // If shape has an id, hash it. roughjs takes integer seed.
    let h = 0xdeadbeef;
    const str = shape.id || '0';
    for (let i = 0; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
    return ((h ^ h >>> 16) >>> 0);
}
