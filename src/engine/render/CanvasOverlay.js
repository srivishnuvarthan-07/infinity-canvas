/**
 * engine/render/CanvasOverlay.js
 * All selection and hover overlay drawing — split from CanvasRenderer for clarity.
 * Operates on a shared CanvasRenderingContext2D.
 */

import { SHAPE_TYPES } from '../schema';
import { getShapeWidth, getShapeHeight } from '../geometry/geometry';
import { getTextLayout } from '../utils/textUtils';

const SELECTION_COLOR = '#0066ff';
const HOVER_COLOR = 'rgba(59, 130, 246, 0.8)';
const HANDLE_SIZE = 10;
const ROTATION_OFFSET = 20;
const GLOW_PADDING = 10;

/**
 * Draws the rubber-band drag selection box.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ startX, startY, currentX, currentY }} selectionBox
 */
export function drawSelectionBox(ctx, selectionBox) {
    const { startX, startY, currentX, currentY } = selectionBox;
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);

    ctx.save();
    ctx.fillStyle = 'rgba(0, 100, 255, 0.1)';
    ctx.strokeStyle = 'rgba(0, 100, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
}

/**
 * Draws a dashed bounding box around all selected shapes (multi-select).
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object[]} shapes
 * @param {Set<string>} selectedIds
 */
export function drawGroupSelection(ctx, shapes, selectedIds) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    let found = false;

    for (const shape of shapes) {
        if (!selectedIds.has(shape.id)) continue;

        const w = getShapeWidth(shape);
        const h = getShapeHeight(shape);
        const hw = w / 2;
        const hh = h / 2;
        const corners = [
            { x: -hw, y: -hh }, { x: hw, y: -hh },
            { x: hw, y: hh }, { x: -hw, y: hh }
        ];

        const rad = (shape.rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        corners.forEach(p => {
            const gx = (shape.position?.x || 0) + (p.x * cos - p.y * sin);
            const gy = (shape.position?.y || 0) + (p.x * sin + p.y * cos);
            minX = Math.min(minX, gx);
            minY = Math.min(minY, gy);
            maxX = Math.max(maxX, gx);
            maxY = Math.max(maxY, gy);
        });
        found = true;
    }

    if (!found) return;

    const pad = 10;
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(minX - pad, minY - pad, (maxX - minX) + pad * 2, (maxY - minY) + pad * 2);
    ctx.setLineDash([]);
    ctx.restore();
}

/**
 * Draws the blue hover glow around a shape.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} shape
 */
export function drawGlow(ctx, shape) {
    ctx.save();
    ctx.translate(shape.position?.x || 0, shape.position?.y || 0);
    ctx.rotate(((shape.rotation || 0) * Math.PI) / 180);

    const strokeWidth = shape.type === SHAPE_TYPES.TEXT ? 0 : (shape.style?.strokeWidth || 0);
    const padding = GLOW_PADDING;

    ctx.shadowColor = HOVER_COLOR;
    ctx.shadowBlur = 15;
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.lineWidth = strokeWidth + padding * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    if (shape.type === SHAPE_TYPES.ELLIPSE) {
        const w = (shape.size?.width || 0) + strokeWidth;
        const h = (shape.size?.height || 0) + strokeWidth;
        ctx.ellipse(0, 0, w / 2 + padding, h / 2 + padding, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fill();
    } else if (shape.type === SHAPE_TYPES.LINE || shape.type === SHAPE_TYPES.ARROW) {
        const pts = (shape.points?.length >= 2) ? shape.points : [{ x: 0, y: 0 }, { x: getShapeWidth(shape), y: 0 }];
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
    } else if (shape.type === SHAPE_TYPES.PENCIL) {
        if (shape.points?.length > 0) {
            ctx.moveTo(shape.points[0].x, shape.points[0].y);
            for (let i = 1; i < shape.points.length; i++) {
                ctx.lineTo(shape.points[i].x, shape.points[i].y);
            }
            ctx.stroke();
        }
    } else if (shape.type === SHAPE_TYPES.TEXT) {
        const layout = getTextLayout(ctx, shape);
        ctx.roundRect(layout.offsetX - padding, layout.offsetY - padding, layout.width + padding * 2, layout.height + padding * 2, 8);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fill();
    } else {
        const w = getShapeWidth(shape) + strokeWidth;
        const h = getShapeHeight(shape) + strokeWidth;
        ctx.roundRect(-w / 2 - padding, -h / 2 - padding, w + padding * 2, h + padding * 2, 8);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fill();
    }

    ctx.restore();
}

/**
 * Draws selection handles and bounding box for a single selected shape.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} shape
 */
export function drawControls(ctx, shape) {
    ctx.save();
    ctx.translate(shape.position?.x || 0, shape.position?.y || 0);
    ctx.rotate(((shape.rotation || 0) * Math.PI) / 180);

    const strokeWidth = shape.type === SHAPE_TYPES.TEXT ? 0 : (shape.style?.strokeWidth || 0);
    const w = getShapeWidth(shape) + strokeWidth;
    const h = getShapeHeight(shape) + strokeWidth;

    ctx.strokeStyle = SELECTION_COLOR;
    ctx.lineWidth = 1;
    ctx.fillStyle = '#ffffff';

    const drawHandle = (x, y) => {
        ctx.fillRect(x - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
        ctx.strokeRect(x - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    };

    // Line / Arrow — show endpoint handles only
    if (shape.type === SHAPE_TYPES.LINE || shape.type === SHAPE_TYPES.ARROW) {
        const pts = (shape.points?.length >= 2)
            ? shape.points
            : [{ x: 0, y: 0 }, { x: getShapeWidth(shape), y: 0 }];
        const pStart = pts[0];
        const pEnd = pts[pts.length - 1]; // ← always the true endpoint, not points[1]

        // Trace all segments so the selection overlay follows the full elbow route
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();

        ctx.strokeStyle = SELECTION_COLOR;
        drawHandle(pStart.x, pStart.y);
        drawHandle(pEnd.x, pEnd.y);
        ctx.restore();
        return;
    }

    // Text — dashed selection box only, no resize handles
    if (shape.type === SHAPE_TYPES.TEXT) {
        const layout = getTextLayout(ctx, shape);
        ctx.strokeStyle = '#3b82f6';
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(layout.offsetX, layout.offsetY, layout.width, layout.height);
        ctx.setLineDash([]);
        ctx.restore();
        return;
    }

    // Box shapes — bounding box + all 8 handles + rotation handle
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    drawHandle(-w / 2, -h / 2); // TL
    drawHandle(w / 2, -h / 2);  // TR
    drawHandle(-w / 2, h / 2);  // BL
    drawHandle(w / 2, h / 2);   // BR
    drawHandle(0, -h / 2);      // MT
    drawHandle(0, h / 2);       // MB
    drawHandle(-w / 2, 0);      // ML
    drawHandle(w / 2, 0);       // MR

    // Rotation stem + handle
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(0, -h / 2 - ROTATION_OFFSET);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -h / 2 - ROTATION_OFFSET, HANDLE_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}
