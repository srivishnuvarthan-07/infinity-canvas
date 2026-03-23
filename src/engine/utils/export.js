import { CanvasRenderer } from "../render/CanvasRenderer";
import { SHAPE_TYPES } from "../schema";

/**
 * Exports the given shapes to a PNG file.
 * @param {Array} shapes - The shapes to export.
 * @param {string} filename - The name of the file to download.
 */
export async function exportToPng(shapes, filename = 'canvas-export.png') {
    if (!shapes || shapes.length === 0) {
        alert("Canvas is empty!");
        return;
    }

    // 1. Calculate Bounding Box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    shapes.forEach(shape => {
        // Approximate bounds using center + width/height + rotation padding
        // For accurate bounds, we'd need full rotated rect points, but max dimension is safe enough foundation.
        const maxDim = Math.max(shape.size?.width || 0, shape.size?.height || 0) * 1.5; // Padding for rotation
        const sx = shape.position?.x || 0;
        const sy = shape.position?.y || 0;

        // If line/arrow, we need points
        if (shape.type === SHAPE_TYPES.LINE || shape.type === SHAPE_TYPES.ARROW) {
            // center is shape.position.x, shape.position.y
            // points are relative to center
            if (shape.points) {
                shape.points.forEach(p => {
                    const px = sx + p.x;
                    const py = sy + p.y;
                    minX = Math.min(minX, px);
                    minY = Math.min(minY, py);
                    maxX = Math.max(maxX, px);
                    maxY = Math.max(maxY, py);
                });
            }
        } else {
            minX = Math.min(minX, sx - maxDim / 2);
            minY = Math.min(minY, sy - maxDim / 2);
            maxX = Math.max(maxX, sx + maxDim / 2);
            maxY = Math.max(maxY, sy + maxDim / 2);
        }

    });

    // Handle single point or empty
    if (minX === Infinity) { minX = 0; maxX = 800; minY = 0; maxY = 600; }

    const PADDING = 20;
    const width = maxX - minX + (PADDING * 2);
    const height = maxY - minY + (PADDING * 2);

    // 2. Create Off-screen Canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    // 3. Render
    // We can reuse CanvasRenderer logic!
    const renderer = new CanvasRenderer(canvas);

    // Viewport transform: translate so (minX, minY) -> (PADDING, PADDING)
    const viewport = {
        x: -minX + PADDING,
        y: -minY + PADDING,
        zoom: 1
    };

    // Render using standard renderer
    renderer.render(shapes, {}, viewport);

    // 4. Download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
