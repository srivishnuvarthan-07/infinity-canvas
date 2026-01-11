import { Rect, Circle, Triangle, Line, IText, Group, FabricImage, Polygon, Ellipse, Point } from "fabric";
import { BASE_SHAPE_PROPS, SHAPE_TYPES } from "./constants";
import { Arrow } from "./shapes/Arrow";

/**
 * Factory to create Fabric objects with unified properties.
 * strictly ensures all objects start with the base schema.
 */
export class CanvasObjectFactory {

    static create(type, pointer, options = {}) {
        const id = crypto.randomUUID();
        const commonProps = {
            ...BASE_SHAPE_PROPS,
            id,
            left: pointer.x,
            top: pointer.y,
            ...options
        };

        let shape = null;

        switch (type) {
            case SHAPE_TYPES.RECT:
                shape = new Rect({
                    width: 0,
                    height: 0,
                    rx: 4, ry: 4,
                    ...commonProps
                });
                break;
            case SHAPE_TYPES.CIRCLE:
                shape = new Circle({
                    radius: 0,
                    originX: 'center',
                    originY: 'center',
                    ...commonProps
                });
                break;
            case SHAPE_TYPES.ELLIPSE:
                shape = new Ellipse({
                    rx: 0, ry: 0,
                    originX: 'center',
                    originY: 'center',
                    ...commonProps
                });
                break;
            case SHAPE_TYPES.TRIANGLE:
                shape = new Triangle({
                    width: 0,
                    height: 0,
                    ...commonProps
                });
                break;
            case SHAPE_TYPES.LINE:
                shape = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                    ...commonProps
                });
                break;
            case SHAPE_TYPES.ARROW:
                shape = new Arrow([pointer.x, pointer.y, pointer.x, pointer.y], {
                    ...commonProps
                });
                break;
            case SHAPE_TYPES.TEXT:
                shape = new IText('Type something...', {
                    fontFamily: 'Inter',
                    fontSize: 20,
                    ...commonProps
                });
                break;
            case SHAPE_TYPES.DIAMOND:
                // Diamond as Polygon (Initial points at center)
                shape = new Polygon([
                    { x: pointer.x, y: pointer.y },
                    { x: pointer.x, y: pointer.y },
                    { x: pointer.x, y: pointer.y },
                    { x: pointer.x, y: pointer.y }
                ], {
                    ...commonProps
                });
                break;
            default:
                console.warn(`Unknown shape type: ${type}`);
                break;
        }

        return shape;
    }

    static createGroup(objects, options = {}) {
        const id = crypto.randomUUID();
        const commonProps = {
            ...BASE_SHAPE_PROPS,
            id,
            ...options
        };

        // Ensure visual props are transparent/neutral for the group container itself
        // unless explicitly set. Groups usually don't have fill/stroke themselves.
        return new Group(objects, {
            ...commonProps,
            fill: "transparent",
            stroke: null,
            subTargetCheck: true, // Allow checking sub-targets if needed
            interactive: true
        });
    }
}
