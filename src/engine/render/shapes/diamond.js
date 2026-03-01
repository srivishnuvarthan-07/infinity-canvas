import { getPatternCanvas } from "../../../utils/canvas/patterns";

export function drawDiamond(ctx, shape, roughOps = null) {
    const w = shape.size?.width || 0;
    const h = shape.size?.height || 0;

    // ROUGH MODE
    if (roughOps && roughOps.roughCanvas) {
        const { roughCanvas, getRoughDrawable } = roughOps;
        const drawable = getRoughDrawable(shape, (gen) => {
            const roughness = shape.style?.roughness || 0;
            const isCartoonist = roughness > 1.5;
            const options = {
                stroke: shape.style?.stroke || '#000000',
                strokeWidth: shape.style?.strokeWidth || 2,
                fill: (shape.style?.fill && shape.style?.fill !== 'transparent') ? shape.style?.fill : undefined,
                fillStyle: shape.style?.fillStyle || 'hachure',
                roughness: roughness,
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
    const strokeWidth = shape.style?.strokeWidth || 2;
    // Setup styles
    ctx.strokeStyle = shape.style?.stroke || '#000000';
    ctx.lineWidth = strokeWidth;

    // Handle Fill Style
    const fillState = shape.style?.fill || 'transparent';
    const fillStyleState = shape.style?.fillStyle || 'solid';

    if (fillState && fillState !== 'transparent') {
        if (fillStyleState === 'hachure' || fillStyleState === 'cross-hatch') {
            const patternCanvas = getPatternCanvas(fillState, fillStyleState);
            if (patternCanvas) {
                const pattern = ctx.createPattern(patternCanvas, 'repeat');
                ctx.fillStyle = pattern;
            } else {
                ctx.fillStyle = fillState;
            }
        } else {
            ctx.fillStyle = fillState;
        }
    } else {
        ctx.fillStyle = 'transparent';
    }

    // Handle Dashed/Dotted
    const strokeStyleState = shape.style?.strokeStyle || 'solid';
    if (strokeStyleState === 'dashed') {
        ctx.setLineDash([strokeWidth * 3, strokeWidth * 3]);
    } else if (strokeStyleState === 'dotted') {
        ctx.setLineDash([strokeWidth, strokeWidth * 2]);
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

    if (fillState && fillState !== 'transparent') {
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
