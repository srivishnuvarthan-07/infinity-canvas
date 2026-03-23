import React from "react";
import { getBounds } from "../../engine/geometry/geometry";

// Calculate bounding box that encapsulates multiple shapes
function getBoundingRect(shapes) {
    if (!shapes || shapes.length === 0) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    shapes.forEach(shape => {
        const bounds = getBounds(shape);
        // Add padding for potential rotation (simple visual padding)
        const pad = Math.max(bounds.width, bounds.height) * 0.25;

        minX = Math.min(minX, bounds.minX - pad);
        minY = Math.min(minY, bounds.minY - pad);
        maxX = Math.max(maxX, bounds.maxX + pad);
        maxY = Math.max(maxY, bounds.maxY + pad);
    });

    if (minX === Infinity) return null;

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}

export function SelectionOverlay({ selections = [], shapes = [], viewport = { x: 0, y: 0, zoom: 1 } }) {
    if (!selections.length || !shapes.length) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
            {selections.map(({ userId, color, displayName, selectedIds }) => {
                if (!selectedIds || selectedIds.length === 0) return null;

                const selectedShapes = shapes.filter(s => selectedIds.includes(s.id));
                const rect = getBoundingRect(selectedShapes);

                if (!rect) return null;

                // Transform to screen coordinates
                const screenX = rect.x * (viewport?.zoom || 1) + (viewport?.x || 0);
                const screenY = rect.y * (viewport?.zoom || 1) + (viewport?.y || 0);
                const screenW = rect.width * (viewport?.zoom || 1);
                const screenH = rect.height * (viewport?.zoom || 1);

                const PADDING = 4; // Padding around the shape

                return (
                    <div
                        key={userId}
                        className="absolute transition-all duration-75 ease-out"
                        style={{
                            left: 0,
                            top: 0,
                            transform: `translate(${screenX - PADDING}px, ${screenY - PADDING}px)`,
                            width: `${screenW + PADDING * 2}px`,
                            height: `${screenH + PADDING * 2}px`,
                            border: `2px solid ${color || '#ef4444'}`,
                            borderRadius: '2px',
                        }}
                    >
                        {/* Name badge */}
                        <div
                            className="absolute -top-[22px] -left-[2px] px-2 py-0.5 whitespace-nowrap text-[10px] font-bold text-white shadow-sm rounded-sm"
                            style={{ backgroundColor: color || '#ef4444' }}
                        >
                            {displayName || 'Guest'}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
