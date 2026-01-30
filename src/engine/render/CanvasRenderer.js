import { SHAPE_TYPES } from '../schema';
import { drawRect } from './shapes/rect';
import { drawEllipse } from './shapes/ellipse';
import { drawLine } from './shapes/line';
import { drawDiamond } from './shapes/diamond';
import { drawText } from './shapes/text';

export class CanvasRenderer {
    /**
     * @param {HTMLCanvasElement} canvas 
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
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
     */
    render(shapes, overlayState = {}, viewport = { x: 0, y: 0, zoom: 1 }) {
        this.clear();
        this.ctx.save();

        // Apply Viewport Transform
        this.ctx.translate(viewport.x, viewport.y);
        this.ctx.scale(viewport.zoom, viewport.zoom);

        // Render each shape
        for (const shape of shapes) {
            this.drawShape(shape);

            // Draw Overlay (Hover)
            if (shape.id === overlayState.hoveredId && shape.id !== overlayState.selectedId) {
                this.drawSelectionOutline(shape, 'rgba(0, 150, 255, 0.3)');
            }

            // Draw Overlay (Selection)
            if (shape.id === overlayState.selectedId) {
                // this.drawSelectionOutline(shape, 'rgba(0, 100, 255, 0.8)');
                this.drawControls(shape);
            }
        }

        this.ctx.restore();
    }

    /**
     * Draws a simple bounding box outline for selection/hover
     * @param {import('../schema').BaseShapeSchema} shape 
     * @param {string} color 
     */
    drawSelectionOutline(shape, color) {
        this.ctx.save();
        this.ctx.translate(shape.x, shape.y);
        this.ctx.rotate((shape.rotation * Math.PI) / 180);

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;

        // Simple bounding box for now
        // Ideally we use the specific shape path, but rect is fine for v1
        const w = (shape.width || 0) + 10;
        const h = (shape.height || 0) + 10;

        this.ctx.strokeRect(-w / 2, -h / 2, w, h);

        this.ctx.restore();
    }

    /**
     * Draws selection controls (box + handles)
     * @param {import('../schema').BaseShapeSchema} shape 
     */
    drawControls(shape) {
        this.ctx.save();
        this.ctx.translate(shape.x, shape.y);
        this.ctx.rotate((shape.rotation * Math.PI) / 180);

        const w = (shape.width || 0);
        const h = (shape.height || 0);
        const color = '#3b82f6'; // Blue-500
        const handleSize = 10; // Match physics constant roughly

        // 1. Boundary
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(-w / 2, -h / 2, w, h);

        // 2. Handles
        this.ctx.fillStyle = '#ffffff';
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;

        const drawHandle = (x, y) => {
            this.ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
            this.ctx.strokeRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
        };

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
    drawShape(shape) {
        if (!shape) return;

        this.ctx.save();
        this.ctx.globalAlpha = shape.opacity;

        // Common Transform (Center Origin)
        this.ctx.translate(shape.x, shape.y);
        this.ctx.rotate((shape.rotation * Math.PI) / 180);

        // Dispatch to specific shape renderer
        switch (shape.type) {
            case SHAPE_TYPES.RECTANGLE:
                drawRect(this.ctx, shape);
                break;
            case SHAPE_TYPES.ELLIPSE:
                drawEllipse(this.ctx, shape);
                break;
            case SHAPE_TYPES.DIAMOND:
                drawDiamond(this.ctx, shape);
                break;
            case SHAPE_TYPES.LINE:
                drawLine(this.ctx, shape);
                break;
            case SHAPE_TYPES.ARROW:
                drawLine(this.ctx, shape, true); // isArrow = true
                break;
            case SHAPE_TYPES.TEXT:
                drawText(this.ctx, shape);
                break;
            default:
                // console.warn('Unknown shape type:', shape.type);
                break;
        }

        this.ctx.restore();
    }
}
