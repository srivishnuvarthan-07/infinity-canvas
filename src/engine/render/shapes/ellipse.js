export function drawEllipse(ctx, shape, roughOps = null) {
    const rx = shape.width / 2;
    const ry = shape.height / 2;

    // ROUGH MODE
    if (roughOps && roughOps.roughCanvas) {
        const { roughCanvas, getRoughDrawable } = roughOps;
        const drawable = getRoughDrawable(shape, (gen) => {
            const isCartoonist = shape.sloppiness === 'cartoonist';
            const options = {
                stroke: shape.strokeColor,
                strokeWidth: shape.strokeWidth,
                fill: shape.fillColor !== 'transparent' ? shape.fillColor : undefined,
                fillStyle: shape.fillStyle || 'hachure',
                roughness: isCartoonist ? 2.5 : 1.5,
                bowing: isCartoonist ? 2 : 1,
                seed: getShapeSeed(shape)
            };
            // center x, center y, width, height
            return gen.ellipse(0, 0, shape.width, shape.height, options);
        });

        if (drawable) roughCanvas.draw(drawable);
        return;
    }

    // STANDARD MODE
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

function getShapeSeed(shape) {
    let h = 0xdeadbeef;
    const str = shape.id || '0';
    for (let i = 0; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
    return ((h ^ h >>> 16) >>> 0);
}
