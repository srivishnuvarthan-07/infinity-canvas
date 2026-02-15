import { useState, useCallback, useRef } from 'react';

export function useEngineViewport() {
    // Viewport State (Camera)
    const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });

    // Refs for interaction to avoid re-renders during high-frequency events if needed, 
    // but state is fine for React render cycle.

    // Coordinate Conversion Helpers
    const toWorld = useCallback((screenX, screenY) => {
        return {
            x: (screenX - viewport.x) / viewport.zoom,
            y: (screenY - viewport.y) / viewport.zoom
        };
    }, [viewport]);

    const toScreen = useCallback((worldX, worldY) => {
        return {
            x: worldX * viewport.zoom + viewport.x,
            y: worldY * viewport.zoom + viewport.y
        };
    }, [viewport]);

    // Manual Zoom Controls
    const zoomIn = useCallback((canvasRef) => {
        setViewport(prev => {
            const newZoom = Math.min(prev.zoom + 0.1, 5);

            // Zoom to center
            if (!canvasRef?.current) return { ...prev, zoom: newZoom };

            const rect = canvasRef.current.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const worldX = (centerX - prev.x) / prev.zoom;
            const worldY = (centerY - prev.y) / prev.zoom;

            const newX = centerX - worldX * newZoom;
            const newY = centerY - worldY * newZoom;

            return { x: newX, y: newY, zoom: newZoom };
        });
    }, []);

    const zoomOut = useCallback((canvasRef) => {
        setViewport(prev => {
            const newZoom = Math.max(prev.zoom - 0.1, 0.1);

            // Zoom to center
            if (!canvasRef?.current) return { ...prev, zoom: newZoom };

            const rect = canvasRef.current.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const worldX = (centerX - prev.x) / prev.zoom;
            const worldY = (centerY - prev.y) / prev.zoom;

            const newX = centerX - worldX * newZoom;
            const newY = centerY - worldY * newZoom;

            return { x: newX, y: newY, zoom: newZoom };
        });
    }, []);

    const resetZoom = useCallback(() => {
        setViewport({ x: 0, y: 0, zoom: 1 });
    }, []);

    return {
        viewport,
        setViewport,
        toWorld,
        toScreen,
        zoomIn,
        zoomOut,
        resetZoom
    };
}
