import { useEffect } from "react";

export function useCanvasGrid(fabricCanvas, showGrid) {
    useEffect(() => {
        if (!fabricCanvas || !showGrid) return;

        const GRID_SIZE = 50;
        const MINOR_GRID = 25;
        const MAJOR_GRID = 100;

        const drawGrid = () => {
            const ctx = fabricCanvas.getContext();
            const width = fabricCanvas.getWidth();
            const height = fabricCanvas.getHeight();
            const vpt = fabricCanvas.viewportTransform;

            ctx.save();
            // Reset transform to draw grid in screen coordinates based on viewport
            // Actually we want to draw based on world coordinates but projected.
            // Easiest is to manually project lines.

            const zoom = vpt[0];
            const offsetX = vpt[4];
            const offsetY = vpt[5];

            // Calculate visible world area
            const startX = -offsetX / zoom;
            const startY = -offsetY / zoom;
            const endX = startX + width / zoom;
            const endY = startY + height / zoom;

            const drawLines = (step) => {
                // Vertical
                for (
                    let x = Math.floor(startX / step) * step;
                    x < endX;
                    x += step
                ) {
                    const isMajor = x % MAJOR_GRID === 0;
                    ctx.beginPath();
                    ctx.strokeStyle = isMajor
                        ? "rgba(16, 14, 14, 0.15)"
                        : "rgba(30, 27, 27, 0.05)";
                    ctx.lineWidth = isMajor ? 1.2 : 0.5; // Thinner lines

                    const screenX = x * zoom + offsetX;
                    ctx.moveTo(screenX, 0); // Optimization: draw full height
                    ctx.lineTo(screenX, height);
                    ctx.stroke();
                }

                // Horizontal
                for (
                    let y = Math.floor(startY / step) * step;
                    y < endY;
                    y += step
                ) {
                    const isMajor = y % MAJOR_GRID === 0;
                    ctx.beginPath();
                    ctx.strokeStyle = isMajor
                        ? "rgba(19, 18, 18, 0.15)"
                        : "rgba(24, 22, 22, 0.05)";
                    ctx.lineWidth = isMajor ? 1.2 : 0.5;

                    const screenY = y * zoom + offsetY;
                    ctx.moveTo(0, screenY);
                    ctx.lineTo(width, screenY);
                    ctx.stroke();
                }
            };

            drawLines(MINOR_GRID);

            ctx.restore();
        };

        fabricCanvas.on("before:render", drawGrid);
        fabricCanvas.requestRenderAll();

        return () => {
            fabricCanvas.off("before:render", drawGrid);
            fabricCanvas.requestRenderAll(); // Clear grid when disabled
        };
    }, [fabricCanvas, showGrid]);
}
