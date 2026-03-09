import React, { useEffect, useRef } from 'react';
import { CanvasRenderer } from '@/engine/render/CanvasRenderer';
import { getBounds } from '@/engine/geometry/geometry';

export function LibraryItemPreview({ shapes, className = '' }) {
    const canvasRef = useRef(null);
    const rendererRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !shapes || shapes.length === 0) return;

        // Initialize renderer if not exists
        if (!rendererRef.current) {
            rendererRef.current = new CanvasRenderer(canvas);
        }

        const renderer = rendererRef.current;
        const dpr = window.devicePixelRatio || 1;

        // Fixed thumbnail size
        const THUMBNAIL_SIZE = 80;
        renderer.resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE);

        // 1. Calculate overall bounding box of the shapes
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        shapes.forEach(shape => {
            const bounds = getBounds(shape);
            if (bounds.minX < minX) minX = bounds.minX;
            if (bounds.minY < minY) minY = bounds.minY;
            if (bounds.maxX > maxX) maxX = bounds.maxX;
            if (bounds.maxY > maxY) maxY = bounds.maxY;
        });

        // 2. Determine scale to fit the bounds into thumbnail with 15% padding
        const PADDING_FACTOR = 0.85;
        const boundsWidth = maxX - minX;
        const boundsHeight = maxY - minY;

        // Prevent division by zero for single points or degenerate shapes
        if (boundsWidth === 0 && boundsHeight === 0) {
            renderer.clear();
            return;
        }

        const scaleX = (THUMBNAIL_SIZE * PADDING_FACTOR) / boundsWidth;
        const scaleY = (THUMBNAIL_SIZE * PADDING_FACTOR) / boundsHeight;

        // Fit within the smallest constraint
        const zoom = Math.min(scaleX, scaleY);

        // 3. Determine pan offset to center the shapes
        const centerX = minX + boundsWidth / 2;
        const centerY = minY + boundsHeight / 2;

        const viewportX = (THUMBNAIL_SIZE / 2) - (centerX * zoom);
        const viewportY = (THUMBNAIL_SIZE / 2) - (centerY * zoom);

        // 4. Render the shapes statically to the canvas
        // Disable overlay rendering by passing empty overlayState
        renderer.render(shapes, {}, { x: viewportX, y: viewportY, zoom }, { clear: true, drawShapes: true });

    }, [shapes]);

    return (
        <div className={`flex items-center justify-center w-full h-full overflow-hidden pointer-events-none rounded-md bg-[#fafafa] group-hover:bg-[#f0f9ff] transition-colors ${className}`}>
            <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
                width={80}
                height={80}
            />
        </div>
    );
}
