import { Pattern } from "fabric";

/**
 * Generates a Fabric Pattern for the given color and type.
 * @param {string} color - The color of the pattern lines.
 * @param {string} type - 'hachure' | 'cross-hatch'.
 * @returns {Pattern | string} - A Fabric Pattern object or the color string if solid.
 */
export const getPattern = (color, type) => {
    if (type === "solid") return color;

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
        ctx.moveTo(0, size);
        ctx.lineTo(size, 0);
        ctx.stroke();
    } else if (type === "cross-hatch") {
        // Cross lines
        ctx.beginPath();
        ctx.moveTo(0, size);
        ctx.lineTo(size, 0);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size, size);
        ctx.stroke();
    }

    return new Pattern({
        source: patternSource,
        repeat: "repeat",
    });
};
