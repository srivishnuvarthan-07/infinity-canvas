// Unified Base Shape Properties
// These defaults ensure all shapes start with a consistent look and feel.

export const BASE_SHAPE_PROPS = {
    // Visual Properties
    stroke: "#000000",
    strokeWidth: 2,
    fill: "transparent",
    opacity: 1,
    strokeUniform: true,
    strokeLineCap: "round",
    strokeLineJoin: "round",
    visible: true,

    // Interaction Metadata
    selectable: true,
    hasControls: true,
    lockMovementX: false,
    lockMovementY: false,
    lockRotation: false,
    lockScalingX: false,
    lockScalingY: false,
    editable: true, // Custom flag for text/custom logic

    // Rendering
    objectCaching: false,
    perPixelTargetFind: true, // Allow clicking through transparent fill

    // Identity
    id: null, // Should be generated on creation
};

export const SHAPE_TYPES = {
    RECT: 'rectangle', // Matched for Toolbar
    CIRCLE: 'circle',
    TRIANGLE: 'triangle',
    LINE: 'line',
    TEXT: 'text',
    GROUP: 'group',
    PATH: 'path',
    IMAGE: 'image',
    ARROW: 'arrow',
    DIAMOND: 'diamond', // Polygon
    ELLIPSE: 'ellipse'
};
