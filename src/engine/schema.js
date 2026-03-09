/**
 * @typedef {'rectangle' | 'ellipse' | 'diamond' | 'line' | 'arrow' | 'text' | 'pencil' | 'group' | 'image'} ShapeType
 * @typedef {'vector' | 'rough'} RenderMode
 */

export const SHAPE_TYPES = {
    RECTANGLE: 'rectangle',
    ELLIPSE: 'ellipse',
    DIAMOND: 'diamond',
    LINE: 'line',
    ARROW: 'arrow',
    TEXT: 'text',
    PENCIL: 'pencil',
    GROUP: 'group',
    IMAGE: 'image',
    CYLINDER: 'cylinder',
    PARALLELOGRAM: 'parallelogram',
    HEXAGON: 'hexagon',
    DOCUMENT: 'document',
    PATH: 'path',
};

/**
 * Factory for creating a base shape schema.
 * @param {string} id 
 * @param {ShapeType} type 
 * @param {number} x 
 * @param {number} y 
 * @returns {Object}
 */
export const createBaseSchema = (id, type, x, y) => ({
    id,
    type,

    position: { x, y },
    rotation: 0,
    scale: { x: 1, y: 1 },

    zIndex: 0,

    style: {
        stroke: '#000000',
        fill: 'transparent',
        strokeWidth: 2,
        opacity: 1,

        renderMode: 'vector',
        roughness: 0,
        seed: Math.floor(Math.random() * 1000000),
        fillStyle: 'solid'
    },

    locked: false,
    visible: true,

    revision: {
        number: 1,
        timestamp: Date.now()
    }
});

/**
 * Creates a rectangle schema
 */
export const createRectangle = (id, x, y, width, height) => ({
    ...createBaseSchema(id, SHAPE_TYPES.RECTANGLE, x, y),
    size: { width, height },
    cornerRadius: 0
});

/**
 * Creates an ellipse schema
 */
export const createEllipse = (id, x, y, width, height) => ({
    ...createBaseSchema(id, SHAPE_TYPES.ELLIPSE, x, y),
    size: { width, height }
});

/**
 * Creates a diamond schema
 */
export const createDiamond = (id, x, y, width, height) => ({
    ...createBaseSchema(id, SHAPE_TYPES.DIAMOND, x, y),
    size: { width, height }
});

/**
 * Creates a text schema
 */
export const createText = (id, x, y, textStr, fontSize = 20) => ({
    ...createBaseSchema(id, SHAPE_TYPES.TEXT, x, y),
    text: textStr,
    font: {
        family: 'Arial',
        size: fontSize,
        weight: 'normal',
        align: 'center'
    }
});

/**
 * Creates an arrow schema
 */
export const createArrow = (id, startPoint, endPoint) => ({
    ...createBaseSchema(id, SHAPE_TYPES.ARROW, startPoint.x, startPoint.y),
    points: [{ x: 0, y: 0 }, { x: endPoint.x - startPoint.x, y: endPoint.y - startPoint.y }],
    arrow: {
        startHead: "none",
        endHead: "triangle"
    },
    bindings: {
        start: null, // { elementId: string, anchor: string }
        end: null
    }
});

/**
 * Creates a line schema
 */
export const createLine = (id, startPoint, endPoint) => ({
    ...createBaseSchema(id, SHAPE_TYPES.LINE, startPoint.x, startPoint.y),
    points: [{ x: 0, y: 0 }, { x: endPoint.x - startPoint.x, y: endPoint.y - startPoint.y }],
    bindings: {
        start: null,
        end: null
    }
});

/**
 * Creates a pencil schema
 */
export const createPencil = (id, startPoint) => ({
    ...createBaseSchema(id, SHAPE_TYPES.PENCIL, startPoint.x, startPoint.y),
    points: [{ x: 0, y: 0 }]
});

/**
 * Root Document Schema Factory
 */
export const createRootDocument = () => ({
    type: "infinity-canvas",
    version: 2,
    createdAt: Date.now(),
    updatedAt: Date.now(),

    viewport: {
        zoom: 1,
        scrollX: 0,
        scrollY: 0
    },

    elements: [],
    groups: [],
    assets: [],
    meta: {}
});
