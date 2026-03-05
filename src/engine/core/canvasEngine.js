/**
 * engine/core/canvasEngine.js
 * The top-level engine orchestrator.
 * Owns the CanvasRenderer, manages the RAF loop, and wires up resize observation.
 */

import { CanvasRenderer } from '../render/CanvasRenderer';

export class CanvasEngine {
    /**
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new CanvasRenderer(canvas);

        // Offscreen buffer for static layer caching
        this.offscreen = document.createElement('canvas');
        this.staticRenderer = new CanvasRenderer(this.offscreen);

        this._frameId = null;
        this._resizeObserver = null;

        // State refs — set externally before starting loop
        this.getShapes = () => [];
        this.getViewport = () => ({ x: 0, y: 0, zoom: 1 });
        this.getOverlayState = () => ({});
    }

    /**
     * Wire up the data providers used each frame.
     * @param {{ getShapes, getViewport, getOverlayState }} providers
     */
    connect({ getShapes, getViewport, getOverlayState }) {
        this.getShapes = getShapes;
        this.getViewport = getViewport;
        this.getOverlayState = getOverlayState;
    }

    /**
     * Attach a ResizeObserver to keep the canvas sized to its parent.
     * @param {HTMLElement} container
     */
    observeResize(container) {
        this._resizeObserver = new ResizeObserver(() => {
            const w = container.clientWidth || window.innerWidth;
            const h = container.clientHeight || window.innerHeight;
            this.resize(w, h);
        });
        this._resizeObserver.observe(container);
        // Initial size
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        this.resize(w, h);
    }

    /**
     * Resize both the main and offscreen canvases.
     * @param {number} width
     * @param {number} height
     */
    resize(width, height) {
        this.renderer.resize(width, height);

        const dpr = window.devicePixelRatio || 1;
        this.offscreen.width = width * dpr;
        this.offscreen.height = height * dpr;
        this.offscreen.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
        this.staticRenderer.width = width;
        this.staticRenderer.height = height;
    }

    /**
     * Start the render loop.
     */
    start() {
        if (this._frameId) return;
        const loop = () => {
            this._render();
            this._frameId = requestAnimationFrame(loop);
        };
        this._frameId = requestAnimationFrame(loop);
    }

    /**
     * Stop the render loop.
     */
    stop() {
        if (this._frameId) {
            cancelAnimationFrame(this._frameId);
            this._frameId = null;
        }
    }

    /**
     * Destroy — stop loop, disconnect observer.
     */
    destroy() {
        this.stop();
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
    }

    // ─── Private ────────────────────────────────────────────────────────────

    _render() {
        const shapes = this.getShapes();
        const viewport = this.getViewport();
        const overlay = this.getOverlayState();

        this.renderer.render(shapes, overlay, viewport);
    }
}
