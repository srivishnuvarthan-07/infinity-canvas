/**
 * Generates a Canvas element with the pattern drawn on it.
 * @param {string} color - The color of the pattern lines.
 * @param {string} type - 'hachure' | 'cross-hatch'.
 * @returns {HTMLCanvasElement | null} - The canvas element or null if solid/invalid.
 */
export const getPatternCanvas = (color, type) => {
    if (type === "solid") return null;

    const patternSource = document.createElement("canvas");
    const ctx = patternSource.getContext("2d");
    const size = 20; // Size of the pattern tile

    patternSource.width = size;
    patternSource.height = size;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    if (type === "hachure") {
        // Diagonal lines
        ctx.beginPath();
        // Draw multiple lines for density
        ctx.moveTo(0, size); ctx.lineTo(size, 0); // Main diagonal
        ctx.moveTo(0, 0); ctx.lineTo(size / 2, 0); // Top-left corner part
        ctx.moveTo(0, size / 2); ctx.lineTo(size / 2, 0); // Top-left corner part
        ctx.moveTo(size / 2, size); ctx.lineTo(size, size / 2); // Bottom-right corner part
        ctx.moveTo(size, size); ctx.lineTo(size / 2, size); // Bottom-right corner part
        ctx.stroke();
    } else if (type === "cross-hatch") {
        // Cross lines
        ctx.beginPath();
        // Diagonal 1
        ctx.moveTo(0, size); ctx.lineTo(size, 0);
        ctx.moveTo(0, size / 2); ctx.lineTo(size / 2, 0);
        ctx.moveTo(size / 2, size); ctx.lineTo(size, size / 2);

        // Diagonal 2
        ctx.moveTo(0, 0); ctx.lineTo(size, size);
        ctx.moveTo(0, size / 2); ctx.lineTo(size / 2, size);
        ctx.moveTo(size / 2, 0); ctx.lineTo(size, size / 2);
        ctx.stroke();
    }

    return patternSource;
};

/**
 * Generates a Fabric Pattern for the given color and type.
 * @param {string} color - The color of the pattern lines.
 * @param {string} type - 'hachure' | 'cross-hatch'.
 * @returns {Pattern | string} - A Fabric Pattern object or the color string if solid.
 */
export const getPattern = (color, type) => {
    if (type === "solid") return color;

    const patternSource = getPatternCanvas(color, type);
    if (!patternSource) return color;

    return new Pattern({
        source: patternSource,
        repeat: "repeat",
    });
};
