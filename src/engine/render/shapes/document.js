import { getPatternCanvas } from "../../../utils/canvas/patterns";
import { getShapeSeed, applyLineDash } from "./shapeUtils";

export function drawDocument(ctx, shape, roughOps = null) {
    const w = shape.size?.width || 0;
    const h = shape.size?.height || 0;
    const hw = w / 2;
    const hh = h / 2;

    // Create a wave using bezier curves
    // M -hw -hh L hw -hh L hw hh-20 C hw/2 hh, 0 hh-40, -hw hh-20 Z
    const pathString = `M ${-hw} ${-hh} L ${hw} ${-hh} L ${hw} ${hh - 15} C ${hw / 2} ${hh + 10}, ${-hw / 2} ${hh - 25}, ${-hw} ${hh - 5} Z`;

    // ROUGH MODE
    if (roughOps && roughOps.roughCanvas) {
        const { roughCanvas, getRoughDrawable } = roughOps;
        const drawable = getRoughDrawable(shape, (gen) => {
            const roughness = shape.style?.roughness || 0;
            const isCartoonist = roughness > 1.5;
            const options = {
                stroke: shape.style?.stroke || '#000000',
                strokeWidth: shape.style?.strokeWidth || 2,
                fill: shape.style?.fill !== 'transparent' ? shape.style?.fill : undefined,
                fillStyle: shape.style?.fillStyle || 'hachure',
                roughness: roughness,
                bowing: isCartoonist ? 2 : 1,
                seed: shape.style?.seed || getShapeSeed(shape)
            };
            return gen.path(pathString, options);
        });

        if (drawable) roughCanvas.draw(drawable);
        return;
    }

    // STANDARD MODE
    const strokeWidth = shape.style?.strokeWidth || 2;
    ctx.strokeStyle = shape.style?.stroke || '#000000';
    ctx.lineWidth = strokeWidth;

    const fillState = shape.style?.fill || 'transparent';
    if (fillState && fillState !== 'transparent') {
        const fillStyleState = shape.style?.fillStyle || 'solid';
        if (fillStyleState === 'hachure' || fillStyleState === 'cross-hatch') {
            const patternCanvas = getPatternCanvas(fillState, fillStyleState);
            ctx.fillStyle = patternCanvas ? ctx.createPattern(patternCanvas, 'repeat') : fillState;
        } else {
            ctx.fillStyle = fillState;
        }
    } else {
        ctx.fillStyle = 'transparent';
    }

    applyLineDash(ctx, shape.style?.strokeStyle || 'solid', strokeWidth);

    ctx.beginPath();
    ctx.moveTo(-hw, -hh);
    ctx.lineTo(hw, -hh);
    ctx.lineTo(hw, hh - 15);
    ctx.bezierCurveTo(hw / 2, hh + 10, -hw / 2, hh - 25, -hw, hh - 5);
    ctx.closePath();

    if (fillState && fillState !== 'transparent') ctx.fill();
    ctx.stroke();
}
