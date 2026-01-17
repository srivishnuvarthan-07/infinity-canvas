import GIF from "gif.js.optimized";
import { createSceneAnimator } from "./animator";

export class GifExporter {
    constructor(canvas, history) {
        this.canvas = canvas;
        this.history = history;
    }

    async export(options = { fps: 30, width: 800, delay: 500 }) {
        if (this.history.length < 2) return null;

        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: options.width,
            height: options.width * (this.canvas.height / this.canvas.width),
            workerScript: '/gif.worker.js' // Need to ensure this is available in public/
        });

        // 1. Reset to Start
        const startState = JSON.parse(this.history[0]);
        await new Promise(resolve => this.canvas.loadFromJSON(startState, resolve));

        // Capture first frame
        this.canvas.renderAll();
        gif.addFrame(this.canvas.getElement(), { delay: options.delay, copy: true });

        // 2. Iterate Transitions
        const fps = options.fps;
        const frameInterval = 1000 / fps; // ms per frame
        const transitionDuration = 500; // ms
        const totalFrames = Math.round(transitionDuration / frameInterval);

        for (let i = 0; i < this.history.length - 1; i++) {
            const targetState = JSON.parse(this.history[i + 1]);
            const animator = await createSceneAnimator(this.canvas, targetState);

            // Render Frames Synchronously
            for (let f = 1; f <= totalFrames; f++) {
                const progress = f / totalFrames;
                animator.renderFrame(progress);
                gif.addFrame(this.canvas.getElement(), { delay: frameInterval, copy: true });
            }

            // Initial hold at new state?
            gif.addFrame(this.canvas.getElement(), { delay: options.delay, copy: true });
        }

        // Render
        return new Promise((resolve, reject) => {
            gif.on('finished', (blob) => {
                resolve(blob);
            });
            gif.render();
        });
    }
}
