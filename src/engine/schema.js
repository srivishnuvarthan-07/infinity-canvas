/**
 * @typedef {'rectangle' | 'ellipse' | 'diamond' | 'line' | 'arrow' | 'text' | 'pencil'} ShapeType
 * @typedef {'solid' | 'dashed' | 'dotted'} StrokeStyle
 * @typedef {'artist' | 'architect' | 'cartoonist'} SloppinessType
 */

/**
 * Base properties shared by all shapes
 * @typedef {Object} BaseShapeSchema
 * @property {string} id - Unique identifier
 * @property {ShapeType} type - The type of the shape
 * @property {number} x - x coordinate (center)
 * @property {number} y - y coordinate (center)
 * @property {number} rotation - Rotation in degrees
 * @property {number} opacity - Opacity (0-1)
 * @property {string} strokeColor - Hex color string
 * @property {string} [fillColor] - Hex color string or "transparent"
 * @property {number} strokeWidth - Width of the stroke
 * @property {StrokeStyle} strokeStyle - Style of the stroke
 * @property {SloppinessType} [sloppiness] - Rendering style
 * @property {number} [width] - Width of the bounding box
 * @property {number} [height] - Height of the bounding box
 * @property {Array<number>} [points] - Points for polyline/pencil
 * @property {string} [text] - Text content for text objects
 * @property {number} [fontSize] - Font size for text objects
 */

export const SHAPE_TYPES = {
    RECTANGLE: 'rectangle',
    ELLIPSE: 'ellipse',
    DIAMOND: 'diamond',
    LINE: 'line',
    ARROW: 'arrow',
    TEXT: 'text',
    PENCIL: 'pencil',
};

// Default Schema Factoreis
export const createBaseSchema = (id, type, x, y) => ({
    id,
    type,
    x,
    y,
    rotation: 0,
    opacity: 1,
    strokeColor: '#000000',
    fillColor: 'transparent',
    strokeWidth: 2,
    strokeStyle: 'solid',
    sloppiness: 'architect',
});
