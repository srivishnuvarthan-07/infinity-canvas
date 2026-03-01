/**
 * src/engine/routing/edgeAnchor.js
 * Edge Anchor Detection system for Infinity Canvas.
 * Computes exact edge midpoints for anchoring connectors.
 */

import { getBounds, getCenter } from "../geometry/geometry";

/**
 * Calculates the exact midpoint of a specific edge on a shape's bounding box.
 * @param {Object} bounds { minX, minY, maxX, maxY }
 * @param {string} edge "top" | "bottom" | "left" | "right" | "center"
 * @returns {{ x: number, y: number, anchorType: string }}
 */
function getEdgeCenter(bounds, edge) {
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const centerX = bounds.minX + width / 2;
    const centerY = bounds.minY + height / 2;

    switch (edge) {
        case "top":
            return { x: centerX, y: bounds.minY, anchorType: "top" };
        case "bottom":
            return { x: centerX, y: bounds.maxY, anchorType: "bottom" };
        case "left":
            return { x: bounds.minX, y: centerY, anchorType: "left" };
        case "right":
            return { x: bounds.maxX, y: centerY, anchorType: "right" };
        case "center":
        default:
            return { x: centerX, y: centerY, anchorType: "center" };
    }
}

/**
 * Detects the best edge of a shape to attach an arrow facing a target point.
 * @param {Object} shape 
 * @param {{ x: number, y: number }} targetPoint 
 * @returns {{ x: number, y: number, anchorType: string }}
 */
export function getEdgeAnchor(shape, targetPoint) {
    const center = getCenter(shape);
    const bounds = getBounds(shape);

    const dx = targetPoint.x - center.x;
    const dy = targetPoint.y - center.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? getEdgeCenter(bounds, "right") : getEdgeCenter(bounds, "left");
    } else {
        return dy > 0 ? getEdgeCenter(bounds, "bottom") : getEdgeCenter(bounds, "top");
    }
}

/**
 * Determines the best anchor types for a source and target shape based on their relative centers.
 * @param {Object} sourceShape 
 * @param {Object} targetShape 
 * @returns {{ sourceAnchor: string, targetAnchor: string }}
 */
export function detectBestEdge(sourceShape, targetShape) {
    const sourceCenter = getCenter(sourceShape);
    const targetCenter = getCenter(targetShape);

    const dx = targetCenter.x - sourceCenter.x;
    const dy = targetCenter.y - sourceCenter.y;

    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0
            ? { sourceAnchor: "right", targetAnchor: "left" }
            : { sourceAnchor: "left", targetAnchor: "right" };
    } else {
        return dy > 0
            ? { sourceAnchor: "bottom", targetAnchor: "top" }
            : { sourceAnchor: "top", targetAnchor: "bottom" };
    }
}

/**
 * Computes the complete edge connection between two shapes.
 * Returns both start and end anchor points in world coordinates.
 * @param {Object} sourceShape 
 * @param {Object} targetShape 
 * @returns {{ start: { x: number, y: number, anchorType: string }, end: { x: number, y: number, anchorType: string } }}
 */
export function computeEdgeConnection(sourceShape, targetShape) {
    const sourceCenter = getCenter(sourceShape);
    const targetCenter = getCenter(targetShape);

    return {
        start: getEdgeAnchor(sourceShape, targetCenter),
        end: getEdgeAnchor(targetShape, sourceCenter)
    };
}
