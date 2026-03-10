import rough from 'roughjs';

export function drawPath(ctx, shape, roughOps) {
    const { pathData, style } = shape;
    if (!pathData) return;

    ctx.save();
    ctx.translate(shape.position.x, shape.position.y);

    if (style.renderMode === 'rough') {
        const rc = rough.canvas(ctx.canvas);
        const options = {
            ...roughOps,
            stroke: style.stroke,
            strokeWidth: style.strokeWidth,
            fill: style.fill !== 'transparent' ? style.fill : undefined,
            fillStyle: style.fillStyle || 'hachure',
            roughness: style.roughness ?? 1.5,
            seed: style.seed
        };

        rc.path(pathData, options);
    } else {
        const p = new Path2D(pathData);

        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = style.strokeWidth;
        ctx.stroke(p);

        if (style.fill && style.fill !== 'transparent') {
            ctx.fillStyle = style.fill;
            ctx.fill(p);
        }
    }

    ctx.restore();
}
