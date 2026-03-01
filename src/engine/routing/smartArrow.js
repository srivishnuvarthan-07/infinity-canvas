/**
 * src/engine/routing/smartArrow.js
 * Smart Arrow Routing logic for Infinity Canvas.
 * Computes point-to-point relative paths for arrows and provides integration helpers.
 */

import { computeEdgeConnection } from "./edgeAnchor";

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
 * Computes an orthogonal (elbow) route between two anchor points.
 * Retuns a polyline array of points relative to the start point.
 * @param {{x: number, y: number, anchorType: string}} start 
 * @param {{x: number, y: number, anchorType: string}} end 
 * @returns {Array<{x: number, y: number}>}
 */
export function computeOrthogonalRoute(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

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
 * Safe for direct use as the return value of setShapes(prev => ...).
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
        // Only process arrows with valid bindings
        if (s.type !== "arrow" || !s.bindings) return s;

        const startBoundId = s.bindings.start?.elementId;
        const endBoundId = s.bindings.end?.elementId;

        // Only re-route if one of this arrow's bound shapes moved
        if (!movedShapeIds.has(startBoundId) && !movedShapeIds.has(endBoundId)) return s;

        const source = allShapes.find(sh => sh.id === startBoundId);
        const target = allShapes.find(sh => sh.id === endBoundId);

        // Skip if either endpoint shape is missing
        if (!source || !target) return s;

        try {
            hasUpdates = true;
            return routeArrow(s, source, target, "orthogonal");
        } catch (e) {
            // Never crash the drag handler — return original arrow on error
            console.warn("[smartArrow] routeArrow failed:", e);
            return s;
        }
    });

    return hasUpdates ? result : allShapes;
}
