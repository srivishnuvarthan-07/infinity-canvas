import { useCallback } from "react";
import { FabricImage } from "fabric";

export function useCanvasActions(fabricCanvas, saveState, resetHistory) {

    // Clear Canvas
    const handleClear = useCallback(() => {
        if (!fabricCanvas) return;
        if (confirm("Are you sure you want to clear the canvas?")) {
            fabricCanvas.clear();
            fabricCanvas.backgroundColor = "transparent"; // Restore background
            resetHistory(); // Clear history stack
            saveState(); // Save empty state
        }
    }, [fabricCanvas, resetHistory, saveState]);

    // Export as PNG
    const handleExport = useCallback(() => {
        if (!fabricCanvas) return;

        // Ensure no selection is shown in export
        fabricCanvas.discardActiveObject();
        fabricCanvas.renderAll();

        const dataURL = fabricCanvas.toDataURL({
            format: "png",
            quality: 1,
            multiplier: 2, // High res
        });

        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `infinity-canvas-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [fabricCanvas]);

    // Add Image
    const handleAddImage = useCallback(() => {
        if (!fabricCanvas) return;

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (f) => {
                const imgObj = new Image();
                imgObj.src = f.target.result;
                imgObj.onload = () => {
                    const imgInstance = new FabricImage(imgObj, {
                        left: 100,
                        top: 100,
                    });
                    // Scale down if too big
                    if (imgInstance.width > 500) {
                        imgInstance.scaleToWidth(500);
                    }
                    fabricCanvas.add(imgInstance);
                    fabricCanvas.setActiveObject(imgInstance);
                    saveState();
                };
            };
            reader.readAsDataURL(file);
        };

        input.click();
    }, [fabricCanvas, saveState]);

    // Save as .infinity (JSON)
    const handleSaveAs = useCallback(() => {
        if (!fabricCanvas) return;
        const json = fabricCanvas.toJSON();
        const jsonString = JSON.stringify(json);
        const blob = new Blob([jsonString], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `infinity-canvas-${Date.now()}.infinity`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [fabricCanvas]);

    // Load from .infinity (JSON)
    const handleLoad = useCallback(() => {
        if (!fabricCanvas) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".infinity";
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (f) => {
                const json = f.target.result;
                fabricCanvas.loadFromJSON(json, () => {
                    fabricCanvas.renderAll();
                    saveState();
                });
            };
            reader.readAsText(file);
        };
        input.click();
    }, [fabricCanvas, saveState]);

    return {
        handleClear,
        handleExport,
        handleAddImage,
        handleSaveAs,
        handleLoad
    };
}
