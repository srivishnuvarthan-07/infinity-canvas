import { SHAPE_TYPES } from '../schema';
import { drawRect } from './shapes/rect';
import { drawEllipse } from './shapes/ellipse';
import { drawLine } from './shapes/line';
import { drawDiamond } from './shapes/diamond';
import { drawText } from './shapes/text';
import { drawPencil } from './shapes/pencil';

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
        this.imageCache = new Map(); // Cache ID -> HTMLImageElement
    }

    /**
     * Resizes the canvas
     * @param {number} width 
     * @param {number} height 
     */
    resize(width, height) {
        this.width = width;
        this.height = height;

        // Handle High DPI scaling
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
    }

    /**
     * Clears the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Renders a list of shapes
     * @param {import('../schema').BaseShapeSchema[]} shapes 
     * @param {Object} overlayState - Selection/Hover state
     * @param {string} [overlayState.hoveredId]
     * @param {string} [overlayState.selectedId]
     * @param {Object} viewport - Transform for pan/zoom
     * @param {Object} [options] - Render options
     * @param {boolean} [options.clear=true] - Whether to clear canvas before rendering
     */
    render(shapes, overlayState = {}, viewport = { x: 0, y: 0, zoom: 1 }, options = { clear: true }) {
        if (options.clear !== false) {
            this.clear();
        }
        this.ctx.save();

        // Apply Viewport Transform
        this.ctx.translate(viewport.x, viewport.y);
        this.ctx.scale(viewport.zoom, viewport.zoom);

        // Build a fresh shape map for this frame
        const shapeMap = {};
        for (const shape of shapes) {
            shapeMap[shape.id] = shape;
        }

        // Render each shape
        for (const shape of shapes) {
            if (options.drawShapes !== false && overlayState.editingShapeId !== shape.id) {
                this.drawShape(shape, shapeMap);
            }

            // Draw Overlay (Hover)
            if (shape.id === overlayState.hoveredId && (!overlayState.selectedIds || !overlayState.selectedIds.has(shape.id))) {
                this.drawGlow(shape);
            }
        }

        // Draw Selection Overlay
        const selectedIds = overlayState.selectedIds; // Set<string>
        if (selectedIds && selectedIds.size > 0) {
            if (selectedIds.size === 1) {
                // Single Selection: Draw Normal Controls
                const id = [...selectedIds][0];
                const shape = shapes.find(s => s.id === id);
                if (shape && shape.id !== overlayState.editingShapeId) {
                    this.drawControls(shape);
                }
            } else {
                // Multi Selection: Draw Group Bounds
                this.drawGroupSelection(shapes, selectedIds);
            }
        }

        // Draw Drag Selection Box (Rubber Band)
        if (overlayState.selectionBox) {
            const { startX, startY, currentX, currentY } = overlayState.selectionBox;
            const x = Math.min(startX, currentX);
            const y = Math.min(startY, currentY);
            const w = Math.abs(currentX - startX);
            const h = Math.abs(currentY - startY);

            this.ctx.save();
            this.ctx.fillStyle = 'rgba(0, 100, 255, 0.1)';
            this.ctx.strokeStyle = 'rgba(0, 100, 255, 0.8)';
            this.ctx.lineWidth = 1;
            this.ctx.fillRect(x, y, w, h);
            this.ctx.strokeRect(x, y, w, h);
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    drawGroupSelection(shapes, selectedIds) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        let found = false;

        for (const shape of shapes) {
            if (selectedIds.has(shape.id)) {
                // Calculate bounds of this shape
                // Simplified: AABB of rotated shape
                // Actually, for V1, just use current bbox logic or shape.x/y/w/h
                // But shape.x/y is center.
                const w = getShapeWidth(shape);
                const h = getShapeHeight(shape);
                const hw = w / 2;
                const hh = h / 2;

                // If rotated, bounding box is larger. 
                // Let's compute 4 corners and expand.
                const corners = [
                    { x: -hw, y: -hh },
                    { x: hw, y: -hh },
                    { x: hw, y: hh },
                    { x: -hw, y: hh }
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
        }

        if (!found) return;

        const padding = 10;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        this.ctx.save();
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([4, 4]);
        this.ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        this.ctx.setLineDash([]);
        this.ctx.restore();
    }

    /**
     * Draws a simple bounding box outline for selection/hover
     * @param {import('../schema').BaseShapeSchema} shape 
     * @param {string} color 
     */
    drawSelectionOutline(shape, color) {
        this.ctx.save();
        this.ctx.translate(shape.position?.x || 0, shape.position?.y || 0);
        this.ctx.rotate(((shape.rotation || 0) * Math.PI) / 180);

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;

        // Simple bounding box for now
        // Ideally we use the specific shape path, but rect is fine for v1
        const strokeWidth = shape.type === SHAPE_TYPES.TEXT ? 0 : (shape.style?.strokeWidth || 0);
        const w = getShapeWidth(shape) + 10 + strokeWidth;
        const h = getShapeHeight(shape) + 10 + strokeWidth;

        this.ctx.strokeRect(-w / 2, -h / 2, w, h);

        this.ctx.restore();
    }

    /**
     * Draws a soft glow effect for hovered shapes
     * @param {import('../schema').BaseShapeSchema} shape 
     */
    drawGlow(shape) {
        this.ctx.save();
        this.ctx.translate(shape.position?.x || 0, shape.position?.y || 0);
        this.ctx.rotate(((shape.rotation || 0) * Math.PI) / 180);

        const strokeWidth = shape.type === SHAPE_TYPES.TEXT ? 0 : (shape.style?.strokeWidth || 0);
        const padding = 10;

        this.ctx.shadowColor = 'rgba(59, 130, 246, 0.8)'; // Tailwind blue-500
        this.ctx.shadowBlur = 15;
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
        this.ctx.lineWidth = strokeWidth + padding * 2;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        if (shape.type === SHAPE_TYPES.ELLIPSE) {
            const w = (shape.size?.width || 0) + strokeWidth;
            const h = (shape.size?.height || 0) + strokeWidth;
            this.ctx.ellipse(0, 0, w / 2 + padding, h / 2 + padding, 0, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            this.ctx.fill();
        } else if (shape.type === SHAPE_TYPES.LINE || shape.type === SHAPE_TYPES.ARROW) {
            const pStart = (shape.points && shape.points.length > 0) ? shape.points[0] : { x: 0, y: 0 };
            const pEnd = (shape.points && shape.points.length > 1) ? shape.points[1] : { x: getShapeWidth(shape), y: 0 };
            this.ctx.moveTo(pStart.x, pStart.y);
            this.ctx.lineTo(pEnd.x, pEnd.y);
            this.ctx.stroke();
        } else if (shape.type === SHAPE_TYPES.PENCIL) {
            if (shape.points && shape.points.length > 0) {
                this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
                for (let i = 1; i < shape.points.length; i++) {
                    this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
                }
                this.ctx.stroke();
            }
        } else if (shape.type === SHAPE_TYPES.TEXT) {
            const layout = getTextLayout(this.ctx, shape);
            this.ctx.roundRect(layout.offsetX - padding, layout.offsetY - padding, layout.width + padding * 2, layout.height + padding * 2, 8);
            this.ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            this.ctx.fill();
        } else {
            const w = getShapeWidth(shape) + strokeWidth;
            const h = getShapeHeight(shape) + strokeWidth;
            this.ctx.roundRect(-w / 2 - padding, -h / 2 - padding, w + padding * 2, h + padding * 2, 8);
            this.ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    /**
     * Draws selection controls (box + handles)
     * @param {import('../schema').BaseShapeSchema} shape 
     */
    drawControls(shape) {
        this.ctx.save();
        if (true) {
            this.ctx.translate(shape.position?.x || 0, shape.position?.y || 0);
            this.ctx.rotate(((shape.rotation || 0) * Math.PI) / 180);
        }

        const strokeWidth = shape.type === SHAPE_TYPES.TEXT ? 0 : (shape.style?.strokeWidth || 0);
        const w = getShapeWidth(shape) + strokeWidth;
        const h = getShapeHeight(shape) + strokeWidth;
        const padding = 10;

        this.ctx.strokeStyle = '#0066ff'; // Selection color
        const handleSize = 10;

        // Common Handle Drawer
        const drawHandle = (x, y) => {
            this.ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
            this.ctx.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
        };

        this.ctx.strokeStyle = '#0066ff';
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = '#ffffff';

        // 1. Two-Point Shapes (Line, Arrow)
        if (shape.type === SHAPE_TYPES.LINE || shape.type === SHAPE_TYPES.ARROW) {
            // ... (existing code)
            const pStart = (shape.points && shape.points.length > 0) ? shape.points[0] : { x: 0, y: 0 };
            let pEnd = { x: getShapeWidth(shape), y: 0 };
            if (shape.points && shape.points.length > 1) {
                pEnd = shape.points[1];
            }

            this.ctx.beginPath();
            this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
            this.ctx.moveTo(pStart.x, pStart.y);
            this.ctx.lineTo(pEnd.x, pEnd.y);
            this.ctx.stroke();

            drawHandle(pStart.x, pStart.y);
            drawHandle(pEnd.x, pEnd.y);

            this.ctx.restore();
            return;
        }

        // 2. Text (Selection Box Only, No Handles)
        if (shape.type === SHAPE_TYPES.TEXT) {
            const layout = getTextLayout(this.ctx, shape);

            this.ctx.strokeStyle = '#3b82f6';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]); // Dashed for text selection?
            this.ctx.strokeRect(layout.offsetX, layout.offsetY, layout.width, layout.height);
            this.ctx.setLineDash([]);

            this.ctx.restore();
            return;
        }

        // 2. Box Shapes (Rect, Ellipse, Diamond, Text, Pencil)
        // Draw Boundary
        this.ctx.strokeRect(-w / 2, -h / 2, w, h);

        // Draw Handles
        // Corners
        drawHandle(-w / 2, -h / 2); // TL
        drawHandle(w / 2, -h / 2);  // TR
        drawHandle(-w / 2, h / 2);  // BL
        drawHandle(w / 2, h / 2);   // BR

        // Edges
        drawHandle(0, -h / 2);    // MT
        drawHandle(0, h / 2);     // MB
        drawHandle(-w / 2, 0);    // ML
        drawHandle(w / 2, 0);     // MR

        // Rotation Handle
        const rotOffset = 20;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -h / 2);
        this.ctx.lineTo(0, -h / 2 - rotOffset);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(0, -h / 2 - rotOffset, handleSize / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.restore();
    }

    /**
     * @param {import('../schema').BaseShapeSchema} shape 
     */
    /**
     * @param {import('../schema').BaseShapeSchema} shape 
     * @param {Object} shapeMap
     */
    drawShape(shape, shapeMap = {}) {
        if (!shape) return;

        this.ctx.save();
        this.ctx.globalAlpha = shape.style?.opacity ?? 1;

        // Draw Soft Glow for actual geometry background if highlighted
        if (shape.isHighlighted) {
            this.ctx.save();

            // Common Transform for background glow specifically
            this.ctx.translate(shape.position?.x || 0, shape.position?.y || 0);
            this.ctx.rotate(((shape.rotation || 0) * Math.PI) / 180);

            const strokeWidth = shape.type === SHAPE_TYPES.TEXT ? 0 : (shape.style?.strokeWidth || 0);
            const padding = 10;

            this.ctx.shadowColor = 'rgba(59, 130, 246, 0.8)';
            this.ctx.shadowBlur = 15;
            this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
            this.ctx.lineWidth = strokeWidth + padding * 2;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            this.ctx.beginPath();
            if (shape.type === SHAPE_TYPES.ELLIPSE) {
                const gw = (shape.size?.width || 0) + strokeWidth;
                const gh = (shape.size?.height || 0) + strokeWidth;
                this.ctx.ellipse(0, 0, gw / 2 + padding, gh / 2 + padding, 0, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
                this.ctx.fill();
            } else if (shape.type === SHAPE_TYPES.LINE || shape.type === SHAPE_TYPES.ARROW) {
                const pStart = (shape.points && shape.points.length > 0) ? shape.points[0] : { x: 0, y: 0 };
                const pEnd = (shape.points && shape.points.length > 1) ? shape.points[1] : { x: shape.size?.width || 0, y: 0 };
                this.ctx.moveTo(pStart.x, pStart.y);
                this.ctx.lineTo(pEnd.x, pEnd.y);
                this.ctx.stroke();
            } else if (shape.type === SHAPE_TYPES.PENCIL) {
                if (shape.points && shape.points.length > 0) {
                    this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
                    for (let i = 1; i < shape.points.length; i++) {
                        this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
                    }
                    this.ctx.stroke();
                }
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

        // Common Transform (Center Origin)
        this.ctx.translate(shape.position?.x || 0, shape.position?.y || 0);
        this.ctx.rotate(((shape.rotation || 0) * Math.PI) / 180);

        // Rough.js Context
        const roughness = shape.style?.roughness ?? (shape.sloppiness === 'artist' ? 1.5 : (shape.sloppiness === 'cartoonist' ? 2.5 : 0));
        const isRough = roughness > 0;
        const roughOps = isRough ? {
            roughCanvas: this.roughCanvas,
            getRoughDrawable: this.getRoughDrawable.bind(this)
        } : null;

        // Dispatch to specific shape renderer
        switch (shape.type) {
            case SHAPE_TYPES.RECTANGLE:
                drawRect(this.ctx, shape, roughOps);
                break;
            case SHAPE_TYPES.ELLIPSE:
                drawEllipse(this.ctx, shape, roughOps);
                break;
            case SHAPE_TYPES.DIAMOND:
                drawDiamond(this.ctx, shape, roughOps);
                break;
            case SHAPE_TYPES.LINE:
                drawLine(this.ctx, shape, false, roughOps);
                break;
            case SHAPE_TYPES.ARROW:
                drawLine(this.ctx, shape, true, roughOps); // isArrow = true
                break;
            case SHAPE_TYPES.TEXT:
                drawText(this.ctx, shape); // Text usually not rough?
                break;
            case SHAPE_TYPES.PENCIL:
                drawPencil(this.ctx, shape, roughOps);
                break;
            case SHAPE_TYPES.GROUP:
                if (shape.children) {
                    shape.children.forEach(child => this.drawShape(child, shapeMap));
                }
                break;

            case SHAPE_TYPES.IMAGE:
                this.drawImage(shape);
                break;
            default:
                // console.warn('Unknown shape type:', shape.type);
                break;
        }

        this.ctx.restore();
    }



    /**
     * Draws an image shape
     * @param {import('../schema').BaseShapeSchema} shape 
     */
    drawImage(shape) {
        if (!shape.src) return;

        let img = this.imageCache.get(shape.id);
        if (!img) {
            img = new Image();
            img.src = shape.src;
            img.onload = () => {
                // Trigger re-render? The loop will handle it next frame usually. 
                // Or if we are in static mode, we might need to force update.
                // For now, assume render loop picks it up.
            };
            this.imageCache.set(shape.id, img);
        }

        if (img.complete && img.naturalWidth > 0) {
            const w = getShapeWidth(shape);
            const h = getShapeHeight(shape);
            this.ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }
    }

    /**
     * Helper to get or create a cached rough drawable
     * @param {import('../schema').BaseShapeSchema} shape 
     * @param {Function} generatorFn - Function that returns the drawable from generator
     */
    getRoughDrawable(shape, generatorFn) {
        // 1. Check Cache
        let cached = this.roughCache.get(shape);
        if (cached) return cached;

        // 2. Generate
        try {
            const drawable = generatorFn(this.roughCanvas.generator, shape);
            this.roughCache.set(shape, drawable);
            return drawable;
        } catch (err) {
            console.error('Error generating rough drawable:', err);
            return null;
        }
    }
}
