import { SHAPE_TYPES, createBaseSchema } from '@/engine/schema';
import { getShapeWidth, getShapeHeight } from '@/engine/geometry/geometry';

/**
 * Normalizes Excalidraw colors to Infinity Canvas hex colors.
 */
function normalizeColor(color) {
    if (!color) return 'transparent';
    if (color === 'transparent') return 'transparent';
    if (/^#([0-9a-fA-F]{3})$/.test(color)) {
        const r = color[1];
        const g = color[2];
        const b = color[3];
        return `#${r}${r}${g}${g}${b}${b}`;
    }

    return color;
}

/**
 * Maps Excalidraw roughness (0, 1, 2) to Infinity Canvas roughness (0, 1.5, 3.0)
 */
function mapRoughness(roughness) {
    if (roughness === 0) return 0;
    if (roughness === 1) return 1.5;
    if (roughness === 2) return 3.0;
    return 1.5; // Default hand-drawn
}

/**
 * Maps Excalidraw strokeStyle to Infinity Canvas
 */
function mapStrokeStyle(strokeStyle) {
    if (strokeStyle === 'dashed') return [8, 8];
    if (strokeStyle === 'dotted') return [2, 6];
    return 'solid';
}

/**
 * Builds base Infinity Canvas shape properties from an Excalidraw element.
 */
function mapBaseProperties(el, targetType, customCx, customCy) {
    // Excalidraw defines (x,y) as Top-Left for shapes, but as the origin points[0] for lines.
    // Infinity Canvas defines (position.x, position.y) as the absolute Center of the shape.
    const cx = customCx !== undefined ? customCx : el.x + (el.width / 2);
    const cy = customCy !== undefined ? customCy : el.y + (el.height / 2);

    const base = createBaseSchema(el.id, targetType, cx, cy);

    // Common style properties
    base.style = {
        ...base.style,
        stroke: normalizeColor(el.strokeColor),
        fill: normalizeColor(el.backgroundColor),
        strokeWidth: el.strokeWidth || 2,
        opacity: (el.opacity ?? 100) / 100,
        roughness: mapRoughness(el.roughness),
        seed: el.seed,
        fillStyle: el.fillStyle === 'hachure' ? 'hachure' : 'solid',
        strokeStyle: mapStrokeStyle(el.strokeStyle)
    };

    base.rotation = (el.angle || 0) * (180 / Math.PI); // Rad to Deg
    base.locked = el.locked || false;

    return base;
}

/**
 * Converts a single Excalidraw element into an Infinity Canvas shape.
 * Returns null if the shape type is unsupported.
 */
function convertElement(el) {
    try {
        switch (el.type) {
            case 'rectangle':
            case 'diamond':
            case 'ellipse': {
                let targetType = SHAPE_TYPES.RECTANGLE;
                if (el.type === 'diamond') targetType = SHAPE_TYPES.DIAMOND;
                if (el.type === 'ellipse') targetType = SHAPE_TYPES.ELLIPSE;

                const shape = mapBaseProperties(el, targetType);
                shape.size = { width: el.width, height: el.height };
                if (el.type === 'rectangle' && el.roundness) {
                    shape.cornerRadius = 8;
                }
                return shape;
            }

            case 'text': {
                const shape = mapBaseProperties(el, SHAPE_TYPES.TEXT);

                // Text size might need manual bounding box sync, but renderer derives it
                shape.text = el.text;
                shape.size = { width: el.width, height: el.height };

                // Excalidraw doesn't have standard web fonts out of the box (uses Virgil, Helvetica, Cascadia)
                let family = 'Inter';
                if (el.fontFamily === 1) family = 'Caveat'; // Hand-drawn
                if (el.fontFamily === 3) family = 'Courier New'; // Monospace

                shape.font = {
                    family,
                    size: el.fontSize || 20,
                    weight: 'normal',
                    align: el.textAlign || 'center'
                };
                return shape;
            }

            case 'arrow':
            case 'line':
            case 'freedraw':
            case 'draw': {
                let targetType = SHAPE_TYPES.LINE;
                if (el.type === 'arrow') targetType = SHAPE_TYPES.ARROW;
                if (el.type === 'freedraw' || el.type === 'draw') targetType = SHAPE_TYPES.PENCIL;

                // Excalidraw points are relative to el.x and el.y, where points[0] is typically [0, 0].
                // We must find the proper bounding box center from the min/max of the points.
                let minX = 0, minY = 0, maxX = 0, maxY = 0;
                if (el.points && el.points.length > 0) {
                    minX = Math.min(...el.points.map(p => p[0]));
                    minY = Math.min(...el.points.map(p => p[1]));
                    maxX = Math.max(...el.points.map(p => p[0]));
                    maxY = Math.max(...el.points.map(p => p[1]));
                }

                const cx = el.x + (minX + maxX) / 2;
                const cy = el.y + (minY + maxY) / 2;

                const shape = mapBaseProperties(el, targetType, cx, cy);
                shape.size = { width: Math.max(el.width, maxX - minX), height: Math.max(el.height, maxY - minY) };

                const ox = (minX + maxX) / 2;
                const oy = (minY + maxY) / 2;

                // Move points so they're relative to the computed center (cx, cy)
                if (el.type === 'freedraw' || el.type === 'draw') {
                    shape.points = (el.points || []).map(p => ({ x: p[0] - ox, y: p[1] - oy }));
                    shape.style.strokeWidth = el.strokeWidth || 4;
                } else {
                    // Line / Arrow / Polygon
                    shape.points = (el.points || []).map(p => ({ x: p[0] - ox, y: p[1] - oy }));

                    // Closed path detection (Polyline converted to Polygon)
                    if (shape.points.length >= 3) {
                        const first = shape.points[0];
                        const last = shape.points[shape.points.length - 1];
                        const dist = Math.sqrt(Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2));

                        if (dist < 2) {
                            shape.isClosed = true;
                        }
                    }

                    if (el.type === 'arrow') {
                        shape.arrow = {
                            startHead: el.startArrowhead ? 'triangle' : 'none',
                            endHead: el.endArrowhead ? 'triangle' : 'none'
                        };
                    }
                }
                return shape;
            }

            default:
                console.warn(`Unsupported Excalidraw shape type: ${el.type}`);
                return null;
        }
    } catch (e) {
        console.error("Failed converting element", el, e);
        return null;
    }
}

/**
 * Parses raw Excalidraw library JSON string and returns an array of Infinity Canvas library items.
 * 
 * Excalidraw Library format:
 * {
 *   "type": "excalidrawlib",
 *   "version": 2,
 *   "libraryItems": [
 *      {
 *         "id": "item1",
 *         "status": "published",
 *         "elements": [ ... shapes ... ]
 *      }
 *   ]
 * }
 */
export function convertExcalidrawLibrary(jsonString) {
    try {
        let data = JSON.parse(jsonString);

        // Handle V1 Excalidraw Library format (which is just a raw array of items)
        if (Array.isArray(data)) {
            data = { type: 'excalidrawlib', libraryItems: data };
        }

        // Handle full .excalidraw workspace exports
        if (data.type === 'excalidraw' && Array.isArray(data.elements)) {
            const shapes = data.elements.map(convertElement).filter(s => s !== null);
            if (shapes.length > 0) {
                return [{
                    name: "Excalidraw Board",
                    shapes: shapes
                }];
            }
            return [];
        }

        const libraryArray = Array.isArray(data.libraryItems) ? data.libraryItems : (Array.isArray(data.library) ? data.library : null);

        if (data.type !== 'excalidrawlib' || !libraryArray) {
            // If it's just a raw object with elements...
            if (Array.isArray(data.elements)) {
                return [{
                    name: "Excalidraw Elements",
                    shapes: data.elements.map(convertElement).filter(s => s !== null)
                }];
            }

            throw new Error(`Invalid Format. Found type: '${data.type}', keys: [${Object.keys(data).join(', ')}]`);
        }

        const convertedItems = [];

        for (const item of libraryArray) {
            // Some library items nest elements in an elements array, others might be direct arrays?
            const elements = Array.isArray(item.elements) ? item.elements : (Array.isArray(item) ? item : null);
            if (!elements) continue;

            const shapes = elements
                .map(convertElement)
                .filter(s => s !== null);

            if (shapes.length > 0) {
                convertedItems.push({
                    name: item.name || `Excalidraw Item ${convertedItems.length + 1}`,
                    shapes: shapes
                });
            }
        }

        return convertedItems;

    } catch (error) {
        console.error("Excalidraw conversion error:", error);
        throw error;
    }
}
