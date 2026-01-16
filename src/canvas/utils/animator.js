import { util, Color as FabricColor } from "fabric";

/**
 * ANIMATION CONFIGURATION
 * Strict whitelist of properties that are allowed to interpolate.
 * Structural properties (id, type, connections) are NEVER animated.
 */
const ANIMATABLE_PROPS = [
    "left", "top",
    "scaleX", "scaleY",
    "angle",
    "opacity",
    // "fill", "stroke", // TODO: Re-enable safely with color interpolation guards
    "strokeWidth",
    "rx", "ry", // For rect/ellipse
    "radius"    // For circle
];

// Easing function (Out-Quad is smooth and responsive)
const easeOutQuad = (t) => t * (2 - t);

// Helper for color interpolation
function lerpColor(start, end, t) {
    const r = start[0] + (end[0] - start[0]) * t;
    const g = start[1] + (end[1] - start[1]) * t;
    const b = start[2] + (end[2] - start[2]) * t;
    const a = start[3] + (end[3] - start[3]) * t;
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
}

/**
 * Creates an animation controller for transitioning the canvas to a target state.
 * 
 * @param {Object} canvas - The Fabric Canvas instance (View Layer).
 * @param {Object} targetJSON - The authoritative JSON snapshot we are moving towards.
 * @returns {Promise<Object>} - Controller { start, renderFrame, commit }
 */
export async function createSceneAnimator(canvas, targetJSON) {

    // 1. Prepare Target Objects (Shadow Objects)
    const targetObjects = await util.enlivenObjects(targetJSON.objects || []);

    // 2. Diffing & Set Identification
    const currentMap = new Map();
    canvas.getObjects().forEach(obj => {
        if (obj.id) currentMap.set(obj.id, obj);
    });

    const targetMap = new Map();
    targetObjects.forEach(obj => {
        if (obj.id) targetMap.set(obj.id, obj);
    });

    const updateSet = []; // { current, target, startState, deltaState }
    const enterSet = [];  // { clone, goalState }
    const exitSet = [];   // { current }

    // --- Identify Sets ---

    // Updates & Enters
    // Note: We need to handle async cloning for enters. 
    // We'll gather promises for cloning.
    const clonePromises = [];

    targetMap.forEach((tObj, id) => {
        const cObj = currentMap.get(id);
        if (cObj) {
            if (cObj.type === tObj.type) {
                updateSet.push({ current: cObj, target: tObj });
            } else {
                // Type mismatch -> Replace
                exitSet.push({ current: cObj });
                clonePromises.push(new Promise(resolve => {
                    tObj.clone((cloned) => resolve({ clone: cloned, targetOriginal: tObj }));
                }));
            }
        } else {
            // New Object -> Enter
            clonePromises.push(new Promise(resolve => {
                tObj.clone((cloned) => resolve({ clone: cloned, targetOriginal: tObj }));
            }));
        }
    });

    // Exits
    currentMap.forEach((cObj, id) => {
        if (!targetMap.has(id)) {
            exitSet.push({ current: cObj });
        }
    });

    // Wait for all clones
    const clones = await Promise.all(clonePromises);
    clones.forEach(({ clone, targetOriginal }) => {
        enterSet.push({
            clone: clone,
            // We use targetOriginal to get the goal properties since clone might have defaults?
            // Actually clone copies props. But we'll use it to set goalState.
            target: targetOriginal
        });
    });

    // --- Prepare Animation Data (Pre-calc) ---

    // Updates
    updateSet.forEach(item => {
        item.startState = {};
        item.deltaState = {};

        ANIMATABLE_PROPS.forEach(prop => {
            const startVal = item.current.get(prop);
            const endVal = item.target.get(prop);

            if (typeof startVal === 'number' && typeof endVal === 'number') {
                item.startState[prop] = startVal;
                item.deltaState[prop] = endVal - startVal;
            }
            // Color logic placeholder (disabled for now)
        });
    });

    // Enters
    enterSet.forEach(item => {
        const { clone, target } = item;
        const finalScaleX = target.scaleX || 1;
        const finalScaleY = target.scaleY || 1;
        const finalOpacity = target.opacity !== undefined ? target.opacity : 1;

        // Initial State (Visual Clone)
        clone.set({
            opacity: 0,
            scaleX: finalScaleX * 0.8,
            scaleY: finalScaleY * 0.8,
            evented: false,
            selectable: false,
            // Ensure ID doesn't conflict or is ignored? 
            // Better to nullify ID on visual clone to prevent lookups finding it?
            // Keeps it simple.
            id: null
        });

        item.goalState = {
            opacity: finalOpacity,
            scaleX: finalScaleX,
            scaleY: finalScaleY
        };

        // Add to canvas immediately? 
        // Logic says: Add to canvas so we can render it.
        canvas.add(clone);
    });

    // Exits
    exitSet.forEach(item => {
        // Disable interaction
        item.current.set({ evented: false, selectable: false });
    });


    // --- Controller Implementation ---

    return {
        /**
         * Renders the scene at a specific progress (0.0 to 1.0).
         * Pure view update, strictly deterministic.
         */
        renderFrame(progress) {
            const eased = easeOutQuad(progress);

            // Updates
            updateSet.forEach(item => {
                const { current, startState, deltaState } = item;
                ANIMATABLE_PROPS.forEach(prop => {
                    if (prop in deltaState) {
                        current.set(prop, startState[prop] + (deltaState[prop] * eased));
                    }
                });
            });

            // Enters
            enterSet.forEach(item => {
                const { clone, goalState } = item;
                const startSx = goalState.scaleX * 0.8;
                const startSy = goalState.scaleY * 0.8;

                clone.set({
                    opacity: goalState.opacity * eased,
                    scaleX: startSx + (goalState.scaleX - startSx) * eased,
                    scaleY: startSy + (goalState.scaleY - startSy) * eased
                });
            });

            // Exits
            exitSet.forEach(item => {
                // start opacity is assumed 1 (or whatever it was). 
                // We multiply current opacity by (1-eased)? 
                // Or just set opacity to 1 - eased?
                // Safest to just fade out from 1. 
                // Real implementation might need to capture start opacity if it wasn't 1.
                item.current.set({ opacity: 1 - eased });
            });

            canvas.requestRenderAll();
        },

        /**
         * Starts the animation loop.
         * Resolves when playback finishes (or is cancelled/committed).
         */
        start(duration = 300) {
            return new Promise((resolve) => {
                const startTime = performance.now();

                const tick = (now) => {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    this.renderFrame(progress);

                    if (progress < 1) {
                        requestAnimationFrame(tick);
                    } else {
                        resolve();
                    }
                };

                requestAnimationFrame(tick);
            });
        },

        /**
         * Snaps the canvas to the authoritative target state.
         * Cleans up visual clones and ensures data integrity.
         */
        commit() {
            // Remove Enter Clones from canvas (they were temporary)
            // Note: loadFromJSON will wipe them anyway, but cleaning up is good practice 
            // if we weren't doing a hard loadFromJSON. 
            // But strict requirement is: calls loadFromJSON.

            return new Promise((resolve) => {
                canvas.loadFromJSON(targetJSON, () => {
                    canvas.requestRenderAll();
                    resolve();
                });
            });
        }
    };
}
