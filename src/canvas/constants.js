// Unified Base Shape Properties
// These defaults ensure all shapes start with a consistent look and feel.

export const BASE_SHAPE_PROPS = {
    stroke: "#000000",        // Default black stroke
    strokeWidth: 2,           // Default thickness
    fill: "transparent",      // Default no fill
    opacity: 1,               // 100% visible
    strokeUniform: true,      // Stroke width remains constant during scaling
    strokeLineCap: "round",   // Smooth ends
    strokeLineJoin: "round",  // Smooth corners
    objectCaching: false,     // Disable caching for better dynamic rendering quality (optional)
};
