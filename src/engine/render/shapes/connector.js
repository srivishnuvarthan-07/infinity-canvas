import { resolveConnectorPoint } from '../../physics/hitTest';

export function drawConnector(ctx, shape, roughOps = null, shapeMap = {}) {
    // Connector data structure:
    // variant: 'line' | 'arrow'
    // arrowType: 'straight' | 'curved'
    // start: { x, y, shapeId, anchor }
    // mid: { x, y, isManual }
    // end: { x, y, shapeId, anchor }
    // 
    // Rendering dynamically resolves the actual (x,y) if attached to a shape.

    if (!shape.start || !shape.mid || !shape.end) return;

    const start = resolveConnectorPoint(shape.start, shapeMap);
    const end = resolveConnectorPoint(shape.end, shapeMap);
    let mid = { x: shape.mid.x, y: shape.mid.y };

    if (!shape.mid.isManual) {
        mid = {
            x: start.x + (end.x - start.x) / 2,
            y: start.y + (end.y - start.y) / 2
        };
    }

    const isArrow = shape.variant === 'arrow';
    const isCurved = shape.arrowType === 'curved';

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

            const paths = [];

            if (isCurved) {
                // Approximate curve for roughjs using curve
                paths.push(gen.curve([[start.x, start.y], [mid.x, mid.y], [end.x, end.y]], options));
            } else {
                paths.push(gen.linearPath([[start.x, start.y], [mid.x, mid.y], [end.x, end.y]], options));
            }

            if (isArrow) {
                const headLen = Math.max(shape.strokeWidth * 6, 20);

                // Calculate angle at the end point
                let dx, dy;
                if (isCurved) {
                    // Tangent at end of quadratic bezier:
                    // B'(t) = 2(1-t)(P1-P0) + 2t(P2-P1)
                    // At t=1, B'(1) = 2(P2-P1) = 2(end-mid)
                    dx = end.x - mid.x;
                    dy = end.y - mid.y;
                } else {
                    dx = end.x - mid.x;
                    dy = end.y - mid.y;
                }

                const angle = Math.atan2(dy, dx);
                const arrowAngle = Math.PI / 6;

                const x1 = end.x - headLen * Math.cos(angle - arrowAngle);
                const y1 = end.y - headLen * Math.sin(angle - arrowAngle);
                const x2 = end.x - headLen * Math.cos(angle + arrowAngle);
                const y2 = end.y - headLen * Math.sin(angle + arrowAngle);
                const arrowOptions = {
                    ...options,
                    fill: shape.strokeColor,
                    fillStyle: isCartoonist ? 'hachure' : 'solid',
                };
                paths.push(gen.polygon([[end.x, end.y], [x1, y1], [x2, y2]], arrowOptions));
            }

            return paths;
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
    ctx.lineJoin = 'round';

    if (shape.strokeStyle === 'dashed') {
        ctx.setLineDash([shape.strokeWidth * 3, shape.strokeWidth * 3]);
    } else if (shape.strokeStyle === 'dotted') {
        ctx.setLineDash([shape.strokeWidth, shape.strokeWidth * 2]);
    } else {
        ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);

    if (isCurved) {
        ctx.quadraticCurveTo(mid.x, mid.y, end.x, end.y);
    } else {
        ctx.lineTo(mid.x, mid.y);
        ctx.lineTo(end.x, end.y);
    }

    ctx.stroke();

    if (isArrow) {
        const headLen = Math.max(shape.strokeWidth * 6, 20);
        let dx, dy;
        if (isCurved) {
            dx = end.x - mid.x;
            dy = end.y - mid.y;
        } else {
            dx = end.x - mid.x;
            dy = end.y - mid.y;
        }

        const angle = Math.atan2(dy, dx);
        const arrowAngle = Math.PI / 6;

        ctx.fillStyle = shape.strokeColor;
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
            end.x - headLen * Math.cos(angle - arrowAngle),
            end.y - headLen * Math.sin(angle - arrowAngle)
        );
        ctx.lineTo(
            end.x - headLen * Math.cos(angle + arrowAngle),
            end.y - headLen * Math.sin(angle + arrowAngle)
        );
        ctx.closePath();
        ctx.fill();
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
