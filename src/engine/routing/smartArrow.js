/**
 * src/engine/routing/smartArrow.js
 * Smart Arrow Routing logic for Infinity Canvas.
 * Computes point-to-point relative paths for arrows and provides integration helpers.
 */

import { computeEdgeConnection, getEdgeAnchor } from "./edgeAnchor";

/**
 * Computes a straight line route between two points.
 * Points are returned relative to the start point (which becomes [0,0]).
 * @param {{x: number, y: number}} start 
 * @param {{x: number, y: number}} end 
 * @returns {Array<{x: number, y: number}>}
 */
export function computeStraightRoute(start, end) {
    return [
        { x: 0, y: 0 },
        { x: end.x - start.x, y: end.y - start.y }
    ];
}

/**
 * Detects whether a route is a "back-edge" — going against the dominant flow direction.
 *
 * In TB layout the natural flow exits "bottom" → enters "top".
 * A back-edge exits "top" → enters "bottom" (or "top" → "top" for a self-loop).
 *
 * In LR layout the natural flow exits "right" → enters "left".
 * A back-edge exits "left" → enters "right".
 */
function isBackEdge(start, end) {
    const { anchorType: sa } = start;
    const { anchorType: ae } = end;
    // Vertical-dominant back-edges (TB layout)
    if ((sa === 'top' && ae === 'bottom') ||
        (sa === 'top' && ae === 'top') ||
        (sa === 'bottom' && ae === 'bottom')) return true;
    // Horizontal-dominant back-edges (LR layout)
    if ((sa === 'left' && ae === 'right') ||
        (sa === 'left' && ae === 'left') ||
        (sa === 'right' && ae === 'right')) return true;
    return false;
}

/**
 * Computes a U-loop route for back-edges.
 *
 * The path goes:
 *   start → stub away from source → loop to the side → travel past target →
 *   approach target from same side → enter target anchor
 *
 * This guarantees the arrow never passes through nodes between source and target.
 *
 * @param {{x:number,y:number,anchorType:string}} start  World-space anchor on source
 * @param {{x:number,y:number,anchorType:string}} end    World-space anchor on target
 * @returns {Array<{x:number,y:number}>}  Points relative to start
 */
function computeBackEdgeRoute(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // How far to pop out before turning (avoids clipping the source shape corner)
    const STUB = 36;
    // Minimum clearance past the outermost node on the way around
    const MIN_MARGIN = 70;

    const isVertical = start.anchorType === 'top' || start.anchorType === 'bottom';

    if (isVertical) {
        // ── TB back-edge loop ──────────────────────────────────────────────
        // Determine stub direction: out of source top → go UP (negative y)
        const stubDir = start.anchorType === 'top' ? -1 : 1;

        // Loop to whichever side gives more clearance; default: opposite of dx
        // If target is to the right (dx > 0), loop left; otherwise loop right.
        const sideMargin = Math.max(MIN_MARGIN, Math.abs(dx) / 2 + MIN_MARGIN);
        const side = dx >= 0 ? -sideMargin : sideMargin;

        // Extra overshoot ensures we clear the target node's far edge before
        // turning back in; proportional to the vertical span of the loop.
        const overshoot = STUB;

        return [
            { x: 0, y: 0 },  // start at source anchor
            { x: 0, y: stubDir * STUB },  // pop out from source face
            { x: side, y: stubDir * STUB },  // go to the side
            { x: side, y: dy - stubDir * overshoot }, // travel past target
            { x: dx, y: dy - stubDir * overshoot }, // come in from side to target X
            { x: dx, y: dy },  // enter target anchor
        ];
    } else {
        // ── LR back-edge loop ──────────────────────────────────────────────
        const stubDir = start.anchorType === 'left' ? -1 : 1;

        const sideMargin = Math.max(MIN_MARGIN, Math.abs(dy) / 2 + MIN_MARGIN);
        const side = dy >= 0 ? -sideMargin : sideMargin;
        const overshoot = STUB;

        return [
            { x: 0, y: 0 },
            { x: stubDir * STUB, y: 0 },
            { x: stubDir * STUB, y: side },
            { x: dx - stubDir * overshoot, y: side },
            { x: dx - stubDir * overshoot, y: dy },
            { x: dx, y: dy },
        ];
    }
}

/**
 * Computes an orthogonal (elbow) route between two anchor points.
 * Retuns a polyline array of points relative to the start point.
 * @param {{x: number, y: number, anchorType: string}} start 
 * @param {{x: number, y: number, anchorType: string}} end 
 * @returns {Array<{x: number, y: number}>}
 */
export function computeOrthogonalRoute(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // ── Back-edge: route around the side with a U-loop ───────────────────
    if (isBackEdge(start, end)) {
        return computeBackEdgeRoute(start, end);
    }

    // Use anchor type to determine the dominant routing direction out of the shape
    const isHorizontalStart = start.anchorType === "left" || start.anchorType === "right";

    // If it's a perfectly straight line horizontally or vertically, fall back to straight
    if ((isHorizontalStart && dy === 0) || (!isHorizontalStart && dx === 0)) {
        return computeStraightRoute(start, end);
    }

    const points = [{ x: 0, y: 0 }];

    if (isHorizontalStart) {
        // Horizontal dominant: [start, {midX, start.y}, {midX, end.y}, end]
        const midX = dx / 2;
        points.push({ x: midX, y: 0 });
        points.push({ x: midX, y: dy });
        points.push({ x: dx, y: dy });
    } else {
        // Vertical dominant: [start, {start.x, midY}, {end.x, midY}, end]
        const midY = dy / 2;
        points.push({ x: 0, y: midY });
        points.push({ x: dx, y: midY });
        points.push({ x: dx, y: dy });
    }

    return points;
}


/**
 * Pure function to map an arrow shape with a new route between two shapes.
 * Arrow.position is anchored at the exact start world point.
 * Arrow.points become purely relative to the arrow position.
 * @param {Object} arrow 
 * @param {Object} sourceShape 
 * @param {Object} targetShape 
 * @param {string} mode 
 * @returns {Object} New arrow object
 */
export function routeArrow(arrow, sourceShape, targetShape, mode = "orthogonal") {
    if (!sourceShape || !targetShape) {
        return { ...arrow };
    }

    const { start, end } = computeEdgeConnection(sourceShape, targetShape);

    let relativePoints;
    if (mode === "straight") {
        relativePoints = computeStraightRoute(start, end);
    } else {
        relativePoints = computeOrthogonalRoute(start, end);
    }

    return {
        ...arrow,
        position: { x: start.x, y: start.y },
        points: relativePoints
    };
}

/**
 * Integration helper for interaction layer (drag & resize hooks).
 * Accepts a Set of moved shape IDs and the full shapes array.
 * Returns a new full shapes array with connected arrows re-routed.
 * Handles three cases:
 *   1. Both ends bound → full edge-aware re-route
 *   2. Only start bound → snap start to shape edge, keep free end world-stable
 *   3. Only end bound → snap end to shape edge, keep free start world-stable
 * @param {Set<string>} movedShapeIds
 * @param {Array<Object>} allShapes
 * @returns {Array<Object>}
 */
export function updateConnectedArrows(movedShapeIds, allShapes) {
    // Guard: if nothing moved or no shapes, return as-is
    if (!movedShapeIds || movedShapeIds.size === 0 || !allShapes || allShapes.length === 0) {
        return allShapes;
    }

    let hasUpdates = false;

    const result = allShapes.map(s => {
        if (s.type !== "arrow" || !s.bindings) return s;

        const startBoundId = s.bindings.start?.elementId;
        const endBoundId = s.bindings.end?.elementId;

        const startMoved = startBoundId && movedShapeIds.has(startBoundId);
        const endMoved = endBoundId && movedShapeIds.has(endBoundId);

        if (!startMoved && !endMoved) return s;

        const source = startBoundId ? allShapes.find(sh => sh.id === startBoundId) : null;
        const target = endBoundId ? allShapes.find(sh => sh.id === endBoundId) : null;

        try {
            hasUpdates = true;

            // Case 1: Both ends bound → full orthogonal re-route
            if (source && target) {
                return routeArrow(s, source, target, "orthogonal");
            }

            const pts = s.points || [{ x: 0, y: 0 }, { x: 0, y: 0 }];
            const posX = s.position?.x || 0;
            const posY = s.position?.y || 0;

            // Case 2: Only START bound, end is free
            if (source && !target) {
                // Free end is fixed in world space: arrow.position + last point
                const lastPt = pts[pts.length - 1];
                const freeEnd = { x: posX + lastPt.x, y: posY + lastPt.y };

                // Snap source edge to face the free end
                const startAnchor = getEdgeAnchor(source, freeEnd);

                return {
                    ...s,
                    position: { x: startAnchor.x, y: startAnchor.y },
                    points: [
                        { x: 0, y: 0 },
                        { x: freeEnd.x - startAnchor.x, y: freeEnd.y - startAnchor.y }
                    ]
                };
            }

            // Case 3: Only END bound, start is free
            if (!source && target) {
                // Free start is fixed: arrow.position (points[0] is always {0,0})
                const freeStart = { x: posX, y: posY };

                // Snap target edge to face the free start
                const endAnchor = getEdgeAnchor(target, freeStart);

                return {
                    ...s,
                    // position stays the same (free start doesn't move)
                    points: [
                        { x: 0, y: 0 },
                        { x: endAnchor.x - posX, y: endAnchor.y - posY }
                    ]
                };
            }

        } catch (e) {
            console.warn("[smartArrow] updateConnectedArrows failed:", e);
        }

        return s;
    });

    return hasUpdates ? result : allShapes;
}
