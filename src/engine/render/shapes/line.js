export function drawLine(ctx, shape, isArrow = false, roughOps = null) {
    const pts = (shape.points && shape.points.length > 1) ? shape.points : [{ x: 0, y: 0 }, { x: shape.size?.width || 0, y: 0 }];

    const pStart = pts[0];
    const pEnd = pts[pts.length - 1];

    // ROUGH MODE
    if (roughOps && roughOps.roughCanvas) {
        const { roughCanvas, getRoughDrawable } = roughOps;
        const drawable = getRoughDrawable(shape, (gen) => {
            const roughness = shape.style?.roughness || 0;
            const isCartoonist = roughness > 1.5;
            const options = {
                stroke: shape.style?.stroke || '#000000',
                strokeWidth: shape.style?.strokeWidth || 2,
                roughness: roughness,
                bowing: isCartoonist ? 2 : 1,
                seed: shape.style?.seed || getShapeSeed(shape)
            };

            // Draw each segment of the polyline
            const lines = [];
            for (let i = 0; i < pts.length - 1; i++) {
                lines.push(gen.line(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, options));
            }

            if (!isArrow) return lines;

            // Arrowhead direction: last segment
            const secondLast = pts[pts.length - 2];
            const headLen = Math.max((shape.style?.strokeWidth || 2) * 4, 10);
            const dx = pEnd.x - secondLast.x;
            const dy = pEnd.y - secondLast.y;
            const angle = Math.atan2(dy, dx);
            const arrowAngle = Math.PI / 6;

            lines.push(gen.line(pEnd.x, pEnd.y, pEnd.x - headLen * Math.cos(angle - arrowAngle), pEnd.y - headLen * Math.sin(angle - arrowAngle), options));
            lines.push(gen.line(pEnd.x, pEnd.y, pEnd.x - headLen * Math.cos(angle + arrowAngle), pEnd.y - headLen * Math.sin(angle + arrowAngle), options));

            return lines;
        });

        if (drawable) {
            const list = Array.isArray(drawable) ? drawable : [drawable];
            list.forEach(d => d && roughCanvas.draw(d));
        }
        return;
    }

    // STANDARD MODE
    const strokeWidth = shape.style?.strokeWidth || 2;
    ctx.strokeStyle = shape.style?.stroke || '#000000';
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const strokeStyleState = shape.style?.strokeStyle || 'solid';
    if (strokeStyleState === 'dashed') {
        ctx.setLineDash([strokeWidth * 3, strokeWidth * 3]);
    } else if (strokeStyleState === 'dotted') {
        ctx.setLineDash([strokeWidth, strokeWidth * 2]);
    } else {
        ctx.setLineDash([]);
    }

    // Draw full polyline through all points
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    if (isArrow) {
        // Arrowhead direction = direction of last segment
        const secondLast = pts[pts.length - 2];
        const headLen = Math.max(strokeWidth * 4, 10);
        const dx = pEnd.x - secondLast.x;
        const dy = pEnd.y - secondLast.y;
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
