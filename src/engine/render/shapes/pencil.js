import { getStroke } from "perfect-freehand";

/**
 * Renders a pencil/polyline shape
 * @param {CanvasRenderingContext2D} ctx 
 * @param {import('../../schema').BaseShapeSchema} shape 
 */
export function drawPencil(ctx, shape) {
    if (!shape.points || shape.points.length < 1) return;

    ctx.fillStyle = shape.strokeColor;

    // 1. Simple Polyline (Architect/Cartoonist)
    if (shape.sloppiness !== 'artist') {
        ctx.strokeStyle = shape.strokeColor;
        ctx.lineWidth = shape.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        // Points are local to the shape center (shape.x, shape.y)
        // Renderer has already translated to shape.x, shape.y
        const p0 = shape.points[0];
        ctx.moveTo(p0.x, p0.y);

        for (let i = 1; i < shape.points.length; i++) {
            const p = shape.points[i];
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        return;
    }

    // 2. Artist Mode (Perfect Freehand)
    // We need to convert local points to [x, y] arrays
    // points are {x, y}
    const points = shape.points.map(p => [p.x, p.y, shape.strokeWidth]); // pressure?

    const stroke = getStroke(points, {
        size: shape.strokeWidth,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
    });

    // Render SVG path from stroke points
    // getStroke returns outline points (left & right)

    // We need a helper to draw the polygon from perfect-freehand
    if (stroke.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(stroke[0][0], stroke[0][1]);
    for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i][0], stroke[i][1]);
    }
    ctx.fill();
}

function getSvgPathFromStroke(stroke) {
    if (!stroke.length) return "";

    const d = stroke.reduce(
        (acc, [x0, y0], i, arr) => {
            const [x1, y1] = arr[(i + 1) % arr.length];
            acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
            return acc;
        },
        ["M", ...stroke[0], "Q"]
    );

    d.push("Z");
    return d.join(" ");
}
