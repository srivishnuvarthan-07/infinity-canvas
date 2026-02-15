import { getPatternCanvas } from "../../../utils/canvas/patterns";

export function drawDiamond(ctx, shape, roughOps = null) {
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
                fillStyle: shape.fillStyle || 'hachure',
                roughness: isCartoonist ? 2.5 : 1.5,
                bowing: isCartoonist ? 2 : 1,
                seed: getShapeSeed(shape)
            };
            return gen.polygon([
                [0, -h / 2], // Top
                [w / 2, 0],  // Right
                [0, h / 2],  // Bottom
                [-w / 2, 0]  // Left
            ], options);
        });

        if (drawable) roughCanvas.draw(drawable);
        return;
    }

    // STANDARD MODE
    // Setup styles
    ctx.strokeStyle = shape.strokeColor;
    ctx.lineWidth = shape.strokeWidth;

    // Handle Fill Style
    if (shape.fillColor && shape.fillColor !== 'transparent') {
        if (shape.fillStyle === 'hachure' || shape.fillStyle === 'cross-hatch') {
            const patternCanvas = getPatternCanvas(shape.fillColor, shape.fillStyle);
            if (patternCanvas) {
                const pattern = ctx.createPattern(patternCanvas, 'repeat');
                ctx.fillStyle = pattern;
            } else {
                ctx.fillStyle = shape.fillColor;
            }
        } else {
            ctx.fillStyle = shape.fillColor;
        }
    } else {
        ctx.fillStyle = 'transparent';
    }

    // Handle Dashed/Dotted
    if (shape.strokeStyle === 'dashed') {
        ctx.setLineDash([shape.strokeWidth * 3, shape.strokeWidth * 3]);
    } else if (shape.strokeStyle === 'dotted') {
        ctx.setLineDash([shape.strokeWidth, shape.strokeWidth * 2]);
    } else {
        ctx.setLineDash([]);
    }

    // Draw Diamond Path
    ctx.beginPath();
    ctx.moveTo(0, -h / 2); // Top Center
    ctx.lineTo(w / 2, 0);  // Right Middle
    ctx.lineTo(0, h / 2);  // Bottom Center
    ctx.lineTo(-w / 2, 0); // Left Middle
    ctx.closePath();

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
