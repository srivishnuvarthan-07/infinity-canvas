/**
 * @typedef {'rectangle' | 'ellipse' | 'diamond' | 'line' | 'arrow' | 'text' | 'pencil' | 'group'} ShapeType
 * @typedef {'solid' | 'dashed' | 'dotted'} StrokeStyle
 * @typedef {'artist' | 'architect' | 'cartoonist'} SloppinessType
 */

/**
 * Base properties shared by all shapes
 * @typedef {Object} BaseShapeSchema
 * @property {string} id - Unique identifier (UUID)
 * @property {ShapeType} type - The type of the shape
 * @property {number} x - x coordinate (center)
 * @property {number} y - y coordinate (center)
 * @property {number} rotation - Rotation in degrees
 * @property {number} opacity - Opacity (0-1)
 * @property {string} strokeColor - Hex color string
 * @property {string} [fillColor] - Hex color string or "transparent"
 * @property {string} [fillStyle] - Fill style ('hachure', 'solid', etc - specific to RoughJS)
 * @property {number} strokeWidth - Width of the stroke
 * @property {StrokeStyle} strokeStyle - Style of the stroke
 * @property {SloppinessType} [sloppiness] - Rendering style
 * @property {number} [width] - Width of the bounding box
 * @property {number} [height] - Height of the bounding box
 * @property {Array<{x: number, y: number}>} [points] - Points for polyline/pencil (Relative to x,y)
 * @property {string} [text] - Text content for text objects
 * @property {number} [fontSize] - Font size for text objects
 * @property {string} [textAlign] - Text alignment ('left', 'center', 'right')
 * @property {Array<BaseShapeSchema>} [children] - For Groups
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
};

/**
 * Factory for creating a base shape schema.
 * @param {string} id 
 * @param {ShapeType} type 
 * @param {number} x 
 * @param {number} y 
 * @returns {BaseShapeSchema}
 */
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
