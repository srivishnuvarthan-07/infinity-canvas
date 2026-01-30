import { Rect, Ellipse, Line, Textbox, Canvas as FabricCanvas } from 'fabric';
import { SHAPE_TYPES } from '../schema';

export class FabricAdapter {
    /**
     * Converts a pure ShapeSchema into a Fabric.js object
     * @param {import('../schema').BaseShapeSchema} schema 
     * @returns {import('fabric').Object | null}
     */
    static toFabric(schema) {
        if (!schema || !schema.type) return null;

        let fabricObject;
        const options = {
            left: schema.x,
            top: schema.y,
            angle: schema.rotation || 0,
            opacity: schema.opacity !== undefined ? schema.opacity : 1,
            stroke: schema.strokeColor,
            strokeWidth: schema.strokeWidth,
            fill: schema.fillColor === 'transparent' ? '' : schema.fillColor,
            // Custom properties to persist ID and logic
            id: schema.id,
            sloppiness: schema.sloppiness,
        };

        // Handle stroke styles
        if (schema.strokeStyle === 'dashed') {
            options.strokeDashArray = [options.strokeWidth * 3, options.strokeWidth * 3];
        } else if (schema.strokeStyle === 'dotted') {
            options.strokeDashArray = [options.strokeWidth, options.strokeWidth * 2];
        }

        switch (schema.type) {
            case SHAPE_TYPES.RECTANGLE:
                fabricObject = new Rect({
                    ...options,
                    width: schema.width || 0,
                    height: schema.height || 0,
                });
                break;

            case SHAPE_TYPES.ELLIPSE:
                fabricObject = new Ellipse({
                    ...options,
                    rx: (schema.width || 0) / 2,
                    ry: (schema.height || 0) / 2,
                });
                break;

            case SHAPE_TYPES.DIAMOND:
                // For simplicity in migration, mapping diamond to Rect with rotation
                fabricObject = new Rect({
                    ...options,
                    width: schema.width || 0,
                    height: schema.height || 0,
                    angle: (schema.rotation || 0) + 45,
                });
                break;

            case SHAPE_TYPES.LINE:
            case SHAPE_TYPES.ARROW:
                fabricObject = new Line([0, 0, schema.width, schema.height], options);
                break;

            case SHAPE_TYPES.TEXT:
                fabricObject = new Textbox(schema.text || '', {
                    ...options,
                    fontSize: schema.fontSize || 20,
                    width: schema.width, // Textbox needs width
                });
                break;

            default:
                // For pencil/path, we'd need 'path' data or 'points'
                console.warn(`[FabricAdapter] Unsupported type: ${schema.type}`);
                return null;
        }

        // Center origin for easier syncing
        if (fabricObject) {
            fabricObject.set({
                originX: 'center',
                originY: 'center'
            });
        }

        return fabricObject;
    }

    /**
     * Converts a Fabric.js object into a pure ShapeSchema
     * @param {import('fabric').Object} fabricObject 
     * @returns {import('../schema').BaseShapeSchema | null}
     */
    static fromFabric(fabricObject) {
        if (!fabricObject) return null;

        // Determine type
        let type = SHAPE_TYPES.RECTANGLE; // fallback
        if (fabricObject.type === 'rect') type = SHAPE_TYPES.RECTANGLE;
        else if (fabricObject.type === 'ellipse') type = SHAPE_TYPES.ELLIPSE;
        else if (fabricObject.type === 'textbox') type = SHAPE_TYPES.TEXT;
        else if (fabricObject.type === 'line') type = SHAPE_TYPES.LINE;
        // ... more mappings locally

        // Extract ID - assuming we stored it on the object
        const id = fabricObject.id || crypto.randomUUID();

        const schema = {
            id,
            type,
            x: fabricObject.left,
            y: fabricObject.top,
            rotation: fabricObject.angle,
            width: fabricObject.getScaledWidth(), // Important: get visual width
            height: fabricObject.getScaledHeight(),
            opacity: fabricObject.opacity,
            strokeColor: fabricObject.stroke || '#000000',
            fillColor: (fabricObject.fill && fabricObject.fill !== 'transparent') ? fabricObject.fill : 'transparent',
            strokeWidth: fabricObject.strokeWidth || 0,
            strokeStyle: fabricObject.strokeDashArray ? 'dashed' : 'solid', // Simplified detection
            sloppiness: fabricObject.sloppiness || 'architect',
        };

        if (type === SHAPE_TYPES.TEXT) {
            schema.text = fabricObject.text;
            schema.fontSize = fabricObject.fontSize;
        }

        return schema;
    }
}
