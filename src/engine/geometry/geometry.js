/**
 * src/engine/geometry/geometry.js
 * Default Geometry Abstraction Layer for Infinity Canvas
 * Pure functions for V2 nested schema.
 */

const POINT_BASED_TYPES = new Set(['line', 'arrow', 'pencil']);

/**
 * Gets the width of a shape, handling both size-based and point-based shapes safely.
 * @param {Object} shape
 * @returns {number}
 */
export function getShapeWidth(shape) {
    if (shape.size && typeof shape.size.width === 'number') {
        return shape.size.width;
    }
    if (POINT_BASED_TYPES.has(shape.type) && shape.points && shape.points.length > 0) {
        const bounds = getLocalBoundsFromPoints(shape.points);
        return bounds.width;
    }
    return 0;
}

/**
 * Gets the height of a shape, handling both size-based and point-based shapes safely.
 * @param {Object} shape
 * @returns {number}
 */
export function getShapeHeight(shape) {
    if (shape.size && typeof shape.size.height === 'number') {
        return shape.size.height;
    }
    if (POINT_BASED_TYPES.has(shape.type) && shape.points && shape.points.length > 0) {
        const bounds = getLocalBoundsFromPoints(shape.points);
        return bounds.height;
    }
    return 0;
}

/**
 * Returns the local bounding box of an array of points.
 * @param {Array<{x: number, y: number}>} points 
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number, width: number, height: number }}
 */
export function getLocalBoundsFromPoints(points) {
    if (!points || points.length === 0) {
        return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    }

    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Computes world points by translating local points via the shape's position.
 * @param {Object} shape 
 * @returns {Array<{x: number, y: number}>}
 */
export function getWorldPoints(shape) {
    const px = shape.position?.x || 0;
    const py = shape.position?.y || 0;
    const pts = shape.points || [];

    if (pts.length === 0) {
        // Fallback for size-based shapes: return 4 corners
        const w = getShapeWidth(shape);
        const h = getShapeHeight(shape);
        const hw = w / 2;
        const hh = h / 2;
        return [
            { x: px - hw, y: py - hh }, // TL
            { x: px + hw, y: py - hh }, // TR
            { x: px + hw, y: py + hh }, // BR
            { x: px - hw, y: py + hh }  // BL
        ];
    }

    const worldPoints = new Array(pts.length);
    for (let i = 0; i < pts.length; i++) {
        worldPoints[i] = {
            x: px + pts[i].x,
            y: py + pts[i].y
        };
    }
    return worldPoints;
}

/**
 * Returns the axis-aligned bounding box of a shape in world coordinates.
 * @param {Object} shape 
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number, width: number, height: number }}
 */
export function getBounds(shape) {
    const px = shape.position?.x || 0;
    const py = shape.position?.y || 0;

    if (POINT_BASED_TYPES.has(shape.type) && shape.points && shape.points.length > 0) {
        const localBounds = getLocalBoundsFromPoints(shape.points);
        return {
            minX: px + localBounds.minX,
            minY: py + localBounds.minY,
            maxX: px + localBounds.maxX,
            maxY: py + localBounds.maxY,
            width: localBounds.width,
            height: localBounds.height
        };
    }

    // Size-based shapes typically center around position.
    const w = getShapeWidth(shape);
    const h = getShapeHeight(shape);
    const halfW = w / 2;
    const halfH = h / 2;

    return {
        minX: px - halfW,
        minY: py - halfH,
        maxX: px + halfW,
        maxY: py + halfH,
        width: w,
        height: h
    };
}

/**
 * Gets the center point of a shape in world coordinates.
 * @param {Object} shape 
 * @returns {{ x: number, y: number }}
 */
export function getCenter(shape) {
    if (POINT_BASED_TYPES.has(shape.type) && shape.points && shape.points.length > 0) {
        const bounds = getBounds(shape);
        return {
            x: bounds.minX + bounds.width / 2,
            y: bounds.minY + bounds.height / 2
        };
    }
    // For size-based, the position is already the center.
    return {
        x: shape.position?.x || 0,
        y: shape.position?.y || 0
    };
}

/**
 * Translates an array of points by dx and dy, returning a new array.
 * @param {Array<{x: number, y: number}>} points 
 * @param {number} dx 
 * @param {number} dy 
 * @returns {Array<{x: number, y: number}>}
 */
export function translatePoints(points, dx, dy) {
    if (!points) return [];
    const newPoints = new Array(points.length);
    for (let i = 0; i < points.length; i++) {
        newPoints[i] = {
            x: points[i].x + dx,
            y: points[i].y + dy
        };
    }
    return newPoints;
}

/**
 * Scales an array of points by scaleX and scaleY relative to the origin, returning a new array.
 * @param {Array<{x: number, y: number}>} points 
 * @param {number} scaleX 
 * @param {number} scaleY 
 * @returns {Array<{x: number, y: number}>}
 */
export function scalePoints(points, scaleX, scaleY) {
    if (!points) return [];
    const newPoints = new Array(points.length);
    for (let i = 0; i < points.length; i++) {
        newPoints[i] = {
            x: points[i].x * scaleX,
            y: points[i].y * scaleY
        };
    }
    return newPoints;
}

/**
 * Checks if a world coordinate (x, y) is inside the bounding box of the shape.
 * @param {Object} shape 
 * @param {number} x 
 * @param {number} y 
 * @returns {boolean}
 */
export function pointInShape(shape, x, y) {
    const bounds = getBounds(shape);
    return x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY;
}

/**
 * Checks if two shapes' bounding boxes intersect (AABB collision).
 * @param {Object} shapeA 
 * @param {Object} shapeB 
 * @returns {boolean}
 */
export function shapesIntersect(shapeA, shapeB) {
    const boundsA = getBounds(shapeA);
    const boundsB = getBounds(shapeB);

    return (
        boundsA.minX <= boundsB.maxX &&
        boundsA.maxX >= boundsB.minX &&
        boundsA.minY <= boundsB.maxY &&
        boundsA.maxY >= boundsB.minY
    );
}
