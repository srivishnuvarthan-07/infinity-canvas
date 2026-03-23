import { useCallback, useRef } from 'react';

/**
 * useKeyboard
 * Manages canvas-specific keyboard shortcuts (Undo, Redo, Space-pan).
 */
export function useKeyboard({ canvasRef, isDragging, undo, redo }) {
    const isSpacePressed = useRef(false);

    const handleKeyDown = useCallback((e) => {
        // 1. Space Pan
        if (e.code === 'Space' && !isDragging) {
            isSpacePressed.current = true;
            if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
        }

        // 2. Undo / Redo (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
        const isMod = e.ctrlKey || e.metaKey;
        if (isMod && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            if (e.shiftKey) redo?.();
            else undo?.();
        }
        if (isMod && e.key.toLowerCase() === 'y') {
            e.preventDefault();
            redo?.();
        }
    }, [canvasRef, isDragging, undo, redo]);

    const handleKeyUp = useCallback((e) => {
        if (e.code === 'Space') {
            isSpacePressed.current = false;
            if (canvasRef.current && !isDragging) {
                canvasRef.current.style.cursor = 'default';
            }
        }
    }, [canvasRef, isDragging]);

    return { isSpacePressed, handleKeyDown, handleKeyUp };
}
