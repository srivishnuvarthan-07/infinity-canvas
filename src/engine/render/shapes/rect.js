import { getPatternCanvas } from "../../../utils/canvas/patterns";
import { getShapeSeed, applyLineDash, getRoughLineDash } from "./shapeUtils";

export function drawRect(ctx, shape, roughOps = null) {
    const w = shape.size?.width || 0;
    const h = shape.size?.height || 0;

    // ROUGH MODE
    if (roughOps && roughOps.roughCanvas) {
        const { roughCanvas, getRoughDrawable } = roughOps;
        const drawable = getRoughDrawable(shape, (gen) => {
            const roughness = shape.style?.roughness || 0;
            const isCartoonist = roughness > 1.5;
            const hasFill = shape.style?.fill && shape.style.fill !== 'transparent';
            const sw = shape.style?.strokeWidth || 2;
            const dash = getRoughLineDash(shape.style?.strokeStyle || 'solid', sw);
            const options = {
                stroke: shape.style?.stroke || '#000000',
                strokeWidth: sw,
                fill: hasFill ? shape.style.fill : undefined,
                fillStyle: hasFill ? (shape.style?.fillStyle || 'solid') : undefined,
                roughness: roughness,
                bowing: isCartoonist ? 2 : 1,
                seed: shape.style?.seed || getShapeSeed(shape),
                ...(dash ? { strokeLineDash: dash } : {})
            };
            return gen.rectangle(-w / 2, -h / 2, w, h, options);
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

    applyLineDash(ctx, shape.style?.strokeStyle || 'solid', strokeWidth);

    // Draw (centered at 0,0 because of renderer translate)
    if (fillState && fillState !== 'transparent') {
        ctx.fillRect(-w / 2, -h / 2, w, h);
    }
    ctx.strokeRect(-w / 2, -h / 2, w, h);
}

