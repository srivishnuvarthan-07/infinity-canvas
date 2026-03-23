/**
 * engine/render/CanvasRenderer.js
 * Core canvas renderer — handles viewport transform, shape dispatch,
 * image caching, and rough.js integration.
 * Overlay drawing (glow, handles, selection) is in CanvasOverlay.js.
 */

import { SHAPE_TYPES } from '../schema';
import { drawRect } from './shapes/rect';
import { drawEllipse } from './shapes/ellipse';
import { drawLine } from './shapes/line';
import { drawDiamond } from './shapes/diamond';
import { drawText } from './shapes/text';
import { drawPencil } from './shapes/pencil';
import { drawCylinder } from './shapes/cylinder';
import { drawParallelogram } from './shapes/parallelogram';
import { drawHexagon } from './shapes/hexagon';
import { drawDocument } from './shapes/document';
import { drawPath } from './shapes/path';
import { drawGlow, drawControls, drawGroupSelection, drawSelectionBox } from './CanvasOverlay';

import rough from 'roughjs';
import { getTextLayout } from '../utils/textUtils';
import { getShapeWidth, getShapeHeight } from '../geometry/geometry';

export class CanvasRenderer {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.roughCanvas = rough.canvas(canvas);
        this.roughCache = new WeakMap();
        this.imageCache = new Map();
    }

    /**
     * Resizes the canvas and handles High-DPI scaling.
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }

    /** Clears the canvas. */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Full render pass: clears, applies viewport, draws shapes + overlays.
     * @param {Object[]} shapes
     * @param {Object} overlayState
     * @param {Object} viewport - { x, y, zoom }
     * @param {{ clear?: boolean, drawShapes?: boolean }} [options]
     */
    render(shapes, overlayState = {}, viewport = { x: 0, y: 0, zoom: 1 }, options = {}) {
        if (options.clear !== false) this.clear();

        this.ctx.save();
        this.ctx.translate(viewport.x, viewport.y);
        this.ctx.scale(viewport.zoom, viewport.zoom);

        const shapeMap = {};
        for (const shape of shapes) shapeMap[shape.id] = shape;

        // Draw shapes
        for (const shape of shapes) {
            if (options.drawShapes !== false && overlayState.editingShapeId !== shape.id) {
                this.drawShape(shape, shapeMap);
            }
        }

        // Selection overlays
        const selectedIds = overlayState.selectedIds;
        if (selectedIds?.size > 0) {
            if (selectedIds.size === 1) {
                const id = [...selectedIds][0];
                const shape = shapes.find(s => s.id === id);
                if (shape && shape.id !== overlayState.editingShapeId) {
                    drawControls(this.ctx, shape);
                }
            } else {
                drawGroupSelection(this.ctx, shapes, selectedIds);
            }
        }

        // Drag rubber-band selection box
        if (overlayState.selectionBox) {
            drawSelectionBox(this.ctx, overlayState.selectionBox);
        }

        this.ctx.restore();
    }

    /**
     * Draws a single shape, dispatching to the correct renderer.
     * @param {Object} shape
     * @param {Object} shapeMap
     */
    drawShape(shape, shapeMap = {}) {
        if (!shape) return;

        this.ctx.save();
        this.ctx.globalAlpha = shape.style?.opacity ?? 1;

        // Highlight glow (inline, for shapes marked isHighlighted)
        if (shape.isHighlighted) {
            this._drawHighlight(shape);
        }

        this.ctx.translate(shape.position?.x || 0, shape.position?.y || 0);
        this.ctx.rotate(((shape.rotation || 0) * Math.PI) / 180);

        const roughness = shape.style?.roughness ?? 0;
        const roughOps = roughness > 0 ? {
            roughCanvas: this.roughCanvas,
            getRoughDrawable: this.getRoughDrawable.bind(this)
        } : null;

        switch (shape.type) {
            case SHAPE_TYPES.RECTANGLE: drawRect(this.ctx, shape, roughOps); break;
            case SHAPE_TYPES.ELLIPSE: drawEllipse(this.ctx, shape, roughOps); break;
            case SHAPE_TYPES.DIAMOND: drawDiamond(this.ctx, shape, roughOps); break;
            case SHAPE_TYPES.CYLINDER: drawCylinder(this.ctx, shape, roughOps); break;
            case SHAPE_TYPES.PARALLELOGRAM: drawParallelogram(this.ctx, shape, roughOps); break;
            case SHAPE_TYPES.HEXAGON: drawHexagon(this.ctx, shape, roughOps); break;
            case SHAPE_TYPES.DOCUMENT: drawDocument(this.ctx, shape, roughOps); break;
            case SHAPE_TYPES.LINE: drawLine(this.ctx, shape, false, roughOps); break;
            case SHAPE_TYPES.ARROW: drawLine(this.ctx, shape, true, roughOps); break;
            case SHAPE_TYPES.TEXT: drawText(this.ctx, shape); break;
            case SHAPE_TYPES.PENCIL: drawPencil(this.ctx, shape); break;
            case SHAPE_TYPES.PATH: drawPath(this.ctx, shape, roughOps); break;
            case SHAPE_TYPES.GROUP:
                if (shape.children) shape.children.forEach(child => this.drawShape(child, shapeMap));
                break;
            case SHAPE_TYPES.IMAGE: this._drawImage(shape); break;
        }

        this.ctx.restore();
    }

    /**
     * Returns a cached Rough.js drawable, generating it if needed.
     * @param {Object} shape
     * @param {Function} generatorFn
     */
    getRoughDrawable(shape, generatorFn) {
        const cached = this.roughCache.get(shape);
        if (cached) return cached;

        try {
            const drawable = generatorFn(this.roughCanvas.generator, shape);
            this.roughCache.set(shape, drawable);
            return drawable;
        } catch {
            return null;
        }
    }

    // ─── Private ────────────────────────────────────────────────────────────

    _drawImage(shape) {
        if (!shape.src) return;

        let img = this.imageCache.get(shape.id);
        if (!img) {
            img = new Image();
            img.src = shape.src;
            this.imageCache.set(shape.id, img);
        }

        if (img.complete && img.naturalWidth > 0) {
            const w = getShapeWidth(shape);
            const h = getShapeHeight(shape);
            this.ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }
    }

    _drawHighlight(shape) {
        this.ctx.save();
        this.ctx.translate(shape.position?.x || 0, shape.position?.y || 0);
        this.ctx.rotate(((shape.rotation || 0) * Math.PI) / 180);

        const strokeWidth = shape.type === SHAPE_TYPES.TEXT ? 0 : (shape.style?.strokeWidth || 0);
        const padding = 10;

        this.ctx.shadowColor = 'rgba(59, 130, 246, 0.8)';
        this.ctx.shadowBlur = 15;
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        this.ctx.lineWidth = strokeWidth + padding * 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();

        if (shape.type === SHAPE_TYPES.LINE || shape.type === SHAPE_TYPES.ARROW) {
            // Trace ALL polyline segments so elbow arrows glow along their full route
            const pts = (shape.points?.length >= 2) ? shape.points : [{ x: 0, y: 0 }, { x: 0, y: 0 }];
            this.ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
                this.ctx.lineTo(pts[i].x, pts[i].y);
            }
            this.ctx.stroke();
        } else if (shape.type === SHAPE_TYPES.ELLIPSE) {
            const gw = (shape.size?.width || 0) + strokeWidth;
            const gh = (shape.size?.height || 0) + strokeWidth;
            this.ctx.ellipse(0, 0, gw / 2 + padding, gh / 2 + padding, 0, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            this.ctx.fill();
        } else if (shape.type === SHAPE_TYPES.TEXT) {
            const layout = getTextLayout(this.ctx, shape);
            this.ctx.roundRect(layout.offsetX - padding, layout.offsetY - padding, layout.width + padding * 2, layout.height + padding * 2, 8);
            this.ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            this.ctx.fill();
        } else {
            const gw = (shape.size?.width || 0) + strokeWidth;
            const gh = (shape.size?.height || 0) + strokeWidth;
            this.ctx.roundRect(-gw / 2 - padding, -gh / 2 - padding, gw + padding * 2, gh + padding * 2, 8);
            this.ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            this.ctx.fill();
        }

        this.ctx.restore();
    }
}
