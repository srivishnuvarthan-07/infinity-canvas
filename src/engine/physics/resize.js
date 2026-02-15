
/**
 * Calculates new shape properties based on resize handles.
 * Follows strict Anchor-based resize for correct rotation support.
 * 
 * Algorithm:
 * 1. Transform mouse -> local space
 * 2. Determine which edge/corner is fixed (Anchor)
 * 3. Calculate new local bounds defined by Anchor and Mouse
 * 4. Recompute Width/Height and Center from new bounds
 * 5. Rotate center back -> global
 * 
 * @param {import('../../schema').BaseShapeSchema} shape - The shape being resized
 * @param {string} handle - Handle ID
 * @param {number} cursorX - Current mouse global X
 * @param {number} cursorY - Current mouse global Y
 * @param {Object} startState - { x, y, width, height, rotation }
 * @returns {Object|null} - Updates { x, y, width, height }
 */
export function calculateResize(shape, handle, cursorX, cursorY, startState) {
    const { x: centerX, y: centerY, width: w, height: h, rotation } = startState;

    // 1. Transform Global Mouse to Local Space (relative to center)
    const globalDx = cursorX - centerX;
    const globalDy = cursorY - centerY;

    const rad = -(rotation * Math.PI) / 180; // Inverse rotation (Global -> Local)
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const localMouseX = globalDx * cos - globalDy * sin;
    const localMouseY = globalDx * sin + globalDy * cos;

    // 2. Determine Fixed Anchor & Moving Point (in Local Space)
    // Bounds: Left: -w/2, Right: w/2, Top: -h/2, Bottom: h/2
    const halfW = w / 2;
    const halfH = h / 2;

    let anchorX = 0;
    let anchorY = 0;
    let newLocalX = localMouseX;
    let newLocalY = localMouseY;
    let isHeightResize = true;
    let isWidthResize = true;

    // Define Anchors (Opposite to handle)
    switch (handle) {
        case 'tl': // Bottom-Right fixed
            anchorX = halfW;
            anchorY = halfH;
            break;
        case 'tr': // Bottom-Left fixed
            anchorX = -halfW;
            anchorY = halfH;
            break;
        case 'bl': // Top-Right fixed
            anchorX = halfW;
            anchorY = -halfH;
            break;
        case 'br': // Top-Left fixed
            anchorX = -halfW;
            anchorY = -halfH;
            break;
        case 'mr': // Left fixed, Y Center fixed
            anchorX = -halfW;
            isHeightResize = false;
            break;
        case 'ml': // Right fixed, Y Center fixed
            anchorX = halfW;
            isHeightResize = false;
            break;
        case 'mt': // Bottom fixed, X Center fixed
            anchorY = halfH;
            isWidthResize = false;
            break;
        case 'mb': // Top fixed, X Center fixed
            anchorY = -halfH;
            isWidthResize = false;
            break;
        default:
            return null;
    }

    // 3. Calculate Scale/Size based on Anchor
    let finalW = w;
    let finalH = h;
    let localCenterX = 0;
    let localCenterY = 0;

    // Width Logic
    if (isWidthResize) {
        // Distance from Anchor to Mouse
        let rawW = newLocalX - anchorX;

        // Handle flipping (negative width)
        // If we want to support flipping, we track sign.
        // Fabric/Excalidraw usually allow flipping or keep positive width and rotate 180?
        // Simple approach: Keep width positive.

        finalW = Math.abs(rawW);

        // Constraint: Min Size
        if (finalW < 10) finalW = 10;

        // Recompute Center X relative to Anchor
        // If rawW was positive (Mouse > Anchor), we moved Right. Center is Anchor + W/2.
        // If rawW was negative (Mouse < Anchor), we moved Left. Center is Anchor - W/2.
        // We need to preserve the *direction* of the resize even if we clamped.

        const direction = rawW >= 0 ? 1 : -1;
        // Exception: If we just crossed 0?
        // Better: Use the side correctly.

        // If we are resizing 'br' (Top-Left Fixed `anchorX=-halfW`):
        // Mouse is at right. rawW > 0.
        // New Center = Anchor + finalW / 2.

        // If we are resizing 'tl' (Bottom-Right Fixed `anchorX=halfW`):
        // Mouse is at left. rawW < 0.
        // New Center = Anchor - finalW / 2.

        // General Formula: 
        // New Center = Anchor + (Sign(Mouse - Anchor) * FinalW / 2)
        // But what if Mouse crosses Anchor?
        // With Math.abs, we effectively duplicate behavior on other side.

        localCenterX = anchorX + (Math.sign(newLocalX - anchorX) || 1) * (finalW / 2);
    } else {
        // Fixed Width (e.g. mt/mb). Center X matches Anchor X? NOT NECESSARILY.
        // For mt/mb, the fixed axis is Y. X axis is unchanged.
        // Anchor X was calculated as 0? No, AnchorX/Y were corner based.
        // For `mt`: AnchorY = halfH. AnchorX is irrelevant? No, `mt` implies X-center is fixed.
        // In the switch, we didn't set anchorX for mt/mb. It defaults to 0.
        // This is correct: The "Anchor" for X-axis movement in `mt` is 0 (Center).
        localCenterX = 0;
    }

    // Height Logic
    if (isHeightResize) {
        let rawH = newLocalY - anchorY;
        finalH = Math.abs(rawH);

        if (finalH < 10) finalH = 10;

        localCenterY = anchorY + (Math.sign(newLocalY - anchorY) || 1) * (finalH / 2);
    } else {
        localCenterY = 0;
    }

    // 5. Rotate Center Back -> Global
    const posRad = (rotation * Math.PI) / 180;
    const posCos = Math.cos(posRad);
    const posSin = Math.sin(posRad);

    const globalShiftX = localCenterX * posCos - localCenterY * posSin;
    const globalShiftY = localCenterX * posSin + localCenterY * posCos;

    return {
        x: centerX + globalShiftX,
        y: centerY + globalShiftY,
        width: finalW,
        height: finalH
    };
}

/**
 * Calculates new rotation
 */
export function calculateRotation(shape, cursorX, cursorY) {
    const dx = cursorX - shape.x;
    const dy = cursorY - shape.y;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Offset because handle is at -90 degrees (top)
    angle += 90;

    return (angle + 360) % 360;
}
