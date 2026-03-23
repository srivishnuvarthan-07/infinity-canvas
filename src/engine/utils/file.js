import { createRootDocument } from '../schema';

/**
 * Saves the given shapes to a JSON file.
 * @param {Array} shapes - The shapes to save.
 * @param {string} filename - The name of the file to download.
 */
export function saveToFile(shapes, filename = 'infinity-canvas.json') {
    const doc = createRootDocument();
    doc.elements = shapes;

    const data = JSON.stringify(doc, null, 2);
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
                const doc = JSON.parse(e.target.result);

                // If it's an array, it's a V1 legacy file without a wrapper
                if (Array.isArray(doc)) {
                    reject(new Error("Unsupported document version: V1 boards are no longer supported."));
                    return;
                }

                if (doc.type !== 'infinity-canvas' || doc.version !== 2) {
                    reject(new Error(`Unsupported document version: Expected version 2.`));
                    return;
                }

                if (!Array.isArray(doc.elements)) {
                    reject(new Error("Invalid file format: Expected an elements array."));
                    return;
                }

                resolve(doc.elements);
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
