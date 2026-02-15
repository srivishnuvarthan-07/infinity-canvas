/**
 * Saves the given shapes to a JSON file.
 * @param {Array} shapes - The shapes to save.
 * @param {string} filename - The name of the file to download.
 */
export function saveToFile(shapes, filename = 'infinity-canvas.json') {
    const data = JSON.stringify(shapes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Loads shapes from a JSON file.
 * @param {File} file - The file to load.
 * @returns {Promise<Array>} - A promise that resolves to the shapes array.
 */
export function loadFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const shapes = JSON.parse(e.target.result);
                if (!Array.isArray(shapes)) {
                    reject(new Error("Invalid file format: Expected an array of shapes."));
                    return;
                }
                // Basic validation could go here
                resolve(shapes);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
    });
}

/**
 * Loads an image from a file.
 * @param {File} file - The image file to load.
 * @returns {Promise<string>} - A promise that resolves to the image data URL.
 */
export function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error("Failed to load image"));
        reader.readAsDataURL(file);
    });
}
