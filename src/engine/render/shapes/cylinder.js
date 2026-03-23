import { getPatternCanvas } from "../../../utils/canvas/patterns";
import { getShapeSeed, applyLineDash } from "./shapeUtils";

export function drawCylinder(ctx, shape, roughOps = null) {
    const w = shape.size?.width || 0;
    const h = shape.size?.height || 0;
    const hw = w / 2;
    const hh = h / 2;
    const ry = Math.min(15, hh / 4);

    const pathString = `M ${-hw} ${-hh + ry}
        A ${hw} ${ry} 0 0 1 ${hw} ${-hh + ry}
        L ${hw} ${hh - ry}
        A ${hw} ${ry} 0 0 1 ${-hw} ${hh - ry}
        Z`;

    const topRingString = `M ${-hw} ${-hh + ry} A ${hw} ${ry} 0 0 0 ${hw} ${-hh + ry}`;

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
            const body = gen.path(pathString, options);
            const top = gen.path(topRingString, { ...options, fill: undefined }); // just stroke the top inner ring
            return [body, top];
        });

        if (drawable) {
            if (Array.isArray(drawable)) drawable.forEach(d => roughCanvas.draw(d));
            else roughCanvas.draw(drawable);
        }
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
    ctx.ellipse(0, -hh + ry, hw, ry, 0, Math.PI, 0); // top half
    ctx.lineTo(hw, hh - ry);
    ctx.ellipse(0, hh - ry, hw, ry, 0, 0, Math.PI); // bottom half
    ctx.lineTo(-hw, -hh + ry);
    ctx.closePath();

    if (fillState && fillState !== 'transparent') ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, -hh + ry, hw, ry, 0, 0, Math.PI); // top inner ring
    ctx.stroke();
}
