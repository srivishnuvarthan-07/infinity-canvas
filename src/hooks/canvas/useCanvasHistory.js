import { useState, useCallback, useEffect } from "react";


export function useCanvasHistory(fabricCanvas) {
    const [history, setHistory] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);

    // Save current state to history
    const saveState = useCallback(() => {
        if (!fabricCanvas) return;

        // We export to JSON
        const json = JSON.stringify(fabricCanvas.toJSON());

        setHistory((prev) => {
            // If we are in the middle of the stack, discard the future
            const newHistory = prev.slice(0, currentIndex + 1);
            newHistory.push(json);

            // Limit history size to 50
            if (newHistory.length > 50) {
                newHistory.shift();
            }
            return newHistory;
        });

        setCurrentIndex((prev) => {
            const newIndex = prev + 1;
            // Adjust if we shifted
            // Adjust if we shifted
            return history.length >= 50 ? 49 : newIndex;
        });
    }, [fabricCanvas, currentIndex, history.length]);

    // Save initial state on load
    useEffect(() => {
        if (fabricCanvas && history.length === 0) {
            saveState();
        }
    }, [fabricCanvas, history.length, saveState]);

    // Undo
    const undo = useCallback(() => {
        if (!fabricCanvas || currentIndex <= 0) return;

        const prevIndex = currentIndex - 1;
        const prevState = history[prevIndex];

        // Parse JSON string to Object
        const targetState = JSON.parse(prevState);

        // Optimistically update index
        setCurrentIndex(prevIndex);

        // Instant Load
        fabricCanvas.loadFromJSON(targetState, () => {
            fabricCanvas.requestRenderAll();
        });

    }, [fabricCanvas, currentIndex, history]);

    // Redo
    const redo = useCallback(() => {
        if (!fabricCanvas || currentIndex >= history.length - 1) return;

        const nextIndex = currentIndex + 1;
        const nextState = history[nextIndex];

        const targetState = JSON.parse(nextState);

        setCurrentIndex(nextIndex);

        // Instant Load
        fabricCanvas.loadFromJSON(targetState, () => {
            fabricCanvas.requestRenderAll();
        });

    }, [fabricCanvas, currentIndex, history]);

    // Reset history (for clear canvas)
    const resetHistory = useCallback(() => {
        setHistory([]);
        setCurrentIndex(-1);
    }, []);

    return {
        history,
        saveState,
        undo,
        redo,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1,
        resetHistory
    };
}
