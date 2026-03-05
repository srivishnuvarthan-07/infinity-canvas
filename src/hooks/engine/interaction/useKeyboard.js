import { useCallback, useRef } from 'react';

/**
 * useKeyboard
 * Manages spacebar pan-mode tracking for the canvas.
 * Returns handleKeyDown / handleKeyUp to bind on the canvas container.
 */
export function useKeyboard({ canvasRef, isDragging }) {
    const isSpacePressed = useRef(false);

    const handleKeyDown = useCallback((e) => {
        if (e.code === 'Space') {
            isSpacePressed.current = true;
            if (canvasRef.current && !isDragging) {
                canvasRef.current.style.cursor = 'grab';
            }
        }
    }, [canvasRef, isDragging]);

    const handleKeyUp = useCallback((e) => {
        if (e.code === 'Space') {
            isSpacePressed.current = false;
            if (canvasRef.current) {
                canvasRef.current.style.cursor = 'default';
            }
        }
    }, [canvasRef]);

    return { isSpacePressed, handleKeyDown, handleKeyUp };
}
