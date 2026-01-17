import { createSceneAnimator } from "./animator";

export class SequenceAnimator {
    constructor(canvas, history) {
        this.canvas = canvas;
        this.history = history; // Array of JSON strings
        this.isPlaying = false;
        this.shouldStop = false;
    }

    async play(startIndex = 0) {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.shouldStop = false;

        // Start from snapshot 0? Or current state?
        // Logic: Clear canvas, Load Snapshot 0, Animate 0->1, 1->2...
        // Assuming we want to replay the whole thing.

        // 1. Reset to start
        if (startIndex === 0 && this.history.length > 0) {
            const startState = JSON.parse(this.history[0]);
            await new Promise(resolve => this.canvas.loadFromJSON(startState, resolve));
            this.canvas.requestRenderAll();
        }

        // 2. Play loop
        // We start transitions from startIndex (e.g. 0 to 1).
        for (let i = startIndex; i < this.history.length - 1; i++) {
            if (this.shouldStop) break;

            const targetState = JSON.parse(this.history[i + 1]);

            // Create Controller for this segment
            // Note: The canvas is at state 'i' (visual).
            const animator = await createSceneAnimator(this.canvas, targetState);

            // Run transition
            await animator.start(500); // 500ms per step? Or make configurable.

            // Note: We do NOT commit(). We stay in visual state and move to next.
            // Wait a bit?
            // await new Promise(r => setTimeout(r, 100));
        }

        this.isPlaying = false;
    }

    async step(fromIndex) {
        if (fromIndex >= this.history.length - 1) return;

        // Ensure we are at fromIndex visually? 
        // For performance, we assume the user is stepping sequentially.
        // If needed, we could force load fromIndex first, but that kills smoothness.

        const targetState = JSON.parse(this.history[fromIndex + 1]);
        const animator = await createSceneAnimator(this.canvas, targetState);
        await animator.start(500);
    }

    stop() {
        this.shouldStop = true;
        this.isPlaying = false;
    }
}
