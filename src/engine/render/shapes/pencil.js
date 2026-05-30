import { getStroke } from "perfect-freehand";

/**
 * Renders a pencil/freehand shape using perfect-freehand for an ink-like feel.
 * Mimics Excalidraw's hand-drawn ink brush with variable width and smooth curves.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} shape
 */
export function drawPencil(ctx, shape) {
    if (!shape.points || shape.points.length < 1) return;

    const strokeWidth = shape.style?.strokeWidth ?? 8;
    const color = shape.style?.stroke || '#1a1a1a';

    ctx.fillStyle = color;
    ctx.strokeStyle = color;

    // With only 1 point, draw a dot
    if (shape.points.length === 1) {
        const p = shape.points[0];
        ctx.beginPath();
        ctx.arc(p.x, p.y, strokeWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
    }

    // Convert shape points {x, y} → [x, y, pressure] for perfect-freehand
    const pts = shape.points.map((p, i) => {
        // Simulate pressure: ramp up at start, ramp down at end (like real ink)
        const t = i / (shape.points.length - 1);
        const pressure = 0.4 + 0.6 * Math.sin(t * Math.PI);
        return [p.x, p.y, pressure];
    });

    // Excalidraw-like ink stroke settings
    const stroke = getStroke(pts, {
        size: strokeWidth,
        thinning: 0.6,       // How much the stroke thins at low pressure (0=none, 1=max)
        smoothing: 0.5,      // How much to smooth the stroke outline
        streamline: 0.4,     // How much to streamline the input points
        easing: (t) => t,   // Linear easing
        simulatePressure: false, // We provide synthetic pressure above
        last: true,          // Taper the end
        start: {
            taper: strokeWidth * 2, // Ink starts thin
            easing: (t) => t * t,
        },
        end: {
            taper: strokeWidth * 3, // Ink ends thin (like lifting pen)
            easing: (t) => t * t,
        },
    });

    if (stroke.length < 2) return;

    // Draw the filled outline polygon that perfect-freehand returns
    ctx.beginPath();
    ctx.moveTo(stroke[0][0], stroke[0][1]);

    // Use quadratic curves for smooth rendering (like Excalidraw)
    for (let i = 1; i < stroke.length - 1; i++) {
        const mx = (stroke[i][0] + stroke[i + 1][0]) / 2;
        const my = (stroke[i][1] + stroke[i + 1][1]) / 2;
        ctx.quadraticCurveTo(stroke[i][0], stroke[i][1], mx, my);
    }

    ctx.closePath();
    ctx.fill();
}
