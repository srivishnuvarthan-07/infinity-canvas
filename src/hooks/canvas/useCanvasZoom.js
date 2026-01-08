import { useState, useEffect, useRef, useCallback } from "react";
import { Point } from "fabric";

export function useCanvasZoom(fabricCanvas) {
    const [zoom, setZoom] = useState(1);
    const isPanning = useRef(false);
    const lastPanPos = useRef({ x: 0, y: 0 });
    const isSpacePressed = useRef(false);

    // Handle Spacebar state
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === "Space") {
                isSpacePressed.current = true;
                if (fabricCanvas) fabricCanvas.defaultCursor = "grab";
            }
        };
        const handleKeyUp = (e) => {
            if (e.code === "Space") {
                isSpacePressed.current = false;
                if (fabricCanvas) fabricCanvas.defaultCursor = "default";
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, [fabricCanvas]);

    // Zoom to Center helper
    const zoomToCenter = useCallback(
        (newZoom) => {
            if (!fabricCanvas) return;
            newZoom = Math.min(Math.max(newZoom, 0.1), 5); // Clamp 10% - 500%

            const center = fabricCanvas.getCenter();
            fabricCanvas.zoomToPoint(new Point(center.left, center.top), newZoom);
            fabricCanvas.requestRenderAll();
            setZoom(newZoom);
        },
        [fabricCanvas]
    );

    // Mouse Wheel (Zoom & Pan)
    useEffect(() => {
        if (!fabricCanvas) return;

        const handleWheel = (opt) => {
            opt.e.preventDefault();
            opt.e.stopPropagation();

            const { e } = opt;
            const vpt = fabricCanvas.viewportTransform;

            if (e.ctrlKey) {
                // ZOOM
                let newZoom = fabricCanvas.getZoom();
                newZoom *= e.deltaY > 0 ? 0.95 : 1.05;
                newZoom = Math.min(Math.max(newZoom, 0.1), 5);

                const point = fabricCanvas.getPointer(e);
                fabricCanvas.zoomToPoint(new Point(point.x, point.y), newZoom);
                setZoom(newZoom);
            } else {
                // PAN (Trackpad two-finger or regular scroll)
                vpt[4] -= e.deltaX;
                vpt[5] -= e.deltaY;
            }
            fabricCanvas.requestRenderAll();
        };

        fabricCanvas.on("mouse:wheel", handleWheel);
        return () => fabricCanvas.off("mouse:wheel", handleWheel);
    }, [fabricCanvas]);

    // Mouse Down/Move/Up for Panning (Space + Drag)
    useEffect(() => {
        if (!fabricCanvas) return;

        const handleMouseDown = (opt) => {
            if (isSpacePressed.current) {
                isPanning.current = true;
                lastPanPos.current = { x: opt.e.clientX, y: opt.e.clientY };
                fabricCanvas.defaultCursor = "grabbing";
                fabricCanvas.selection = false; // Disable selection while panning
            }
        };

        const handleMouseMove = (opt) => {
            if (!isPanning.current) return;
            const dx = opt.e.clientX - lastPanPos.current.x;
            const dy = opt.e.clientY - lastPanPos.current.y;
            const vpt = fabricCanvas.viewportTransform;
            vpt[4] += dx;
            vpt[5] += dy;
            fabricCanvas.requestRenderAll();
            lastPanPos.current = { x: opt.e.clientX, y: opt.e.clientY };
        };

        const handleMouseUp = () => {
            if (isPanning.current) {
                isPanning.current = false;
                fabricCanvas.defaultCursor = isSpacePressed.current ? "grab" : "default";
                fabricCanvas.selection = true; // Re-enable selection
            }
        };

        fabricCanvas.on("mouse:down", handleMouseDown);
        fabricCanvas.on("mouse:move", handleMouseMove);
        fabricCanvas.on("mouse:up", handleMouseUp);

        return () => {
            fabricCanvas.off("mouse:down", handleMouseDown);
            fabricCanvas.off("mouse:move", handleMouseMove);
            fabricCanvas.off("mouse:up", handleMouseUp);
        };
    }, [fabricCanvas]);

    return {
        zoom,
        setZoom,
        zoomToCenter,
        handleZoomIn: () => zoomToCenter(zoom + 0.1),
        handleZoomOut: () => zoomToCenter(zoom - 0.1),
        handleZoomReset: () => {
            if (!fabricCanvas) return;
            setZoom(1);
            fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
            fabricCanvas.requestRenderAll();
        }
    };
}
