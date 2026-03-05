/**
 * engine/core/actionManager.js
 * Higher-level canvas actions: grouping, layering, clipboard.
 * Pure functions — operate on shapes arrays, return new arrays.
 */

/**
 * Groups the specified shapes into a single group shape.
 * @param {Object[]} shapes - Full shapes array
 * @param {Set<string>} selectedIds - IDs to group
 * @returns {{ shapes: Object[], groupId: string } | null}
 */
export function groupShapes(shapes, selectedIds) {
    if (selectedIds.size < 2) return null;

    const selected = shapes.filter(s => selectedIds.has(s.id));
    if (selected.length < 2) return null;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selected.forEach(s => {
        const hw = s.size.width / 2;
        const hh = s.size.height / 2;
        minX = Math.min(minX, s.position.x - hw);
        minY = Math.min(minY, s.position.y - hh);
        maxX = Math.max(maxX, s.position.x + hw);
        maxY = Math.max(maxY, s.position.y + hh);
    });
    minX -= 10; minY -= 10; maxX += 10; maxY += 10;

    const width = maxX - minX;
    const height = maxY - minY;
    const cx = minX + width / 2;
    const cy = minY + height / 2;

    const groupId = crypto.randomUUID();
    const group = {
        id: groupId,
        type: 'group',
        position: { x: cx, y: cy },
        size: { width, height },
        rotation: 0,
        style: { opacity: 1, stroke: 'transparent', strokeWidth: 0, strokeStyle: 'solid' },
        children: selected.map(s => ({
            ...s,
            position: { x: s.position.x - cx, y: s.position.y - cy }
        }))
    };

    const idsToRemove = new Set(selected.map(s => s.id));
    const nextShapes = [...shapes.filter(s => !idsToRemove.has(s.id)), group];
    return { shapes: nextShapes, groupId };
}

/**
 * Ungroups the selected group shape into its children at absolute positions.
 * @param {Object[]} shapes
 * @param {string} groupId
 * @returns {{ shapes: Object[], childIds: string[] } | null}
 */
export function ungroupShapes(shapes, groupId) {
    const group = shapes.find(s => s.id === groupId);
    if (!group || group.type !== 'group' || !group.children) return null;

    const rad = (group.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const children = group.children.map(child => {
        const cx = child.position.x;
        const cy = child.position.y;
        return {
            ...child,
            position: {
                x: group.position.x + (cx * cos - cy * sin),
                y: group.position.y + (cx * sin + cy * cos)
            },
            rotation: (child.rotation || 0) + (group.rotation || 0)
        };
    });

    const nextShapes = [...shapes.filter(s => s.id !== groupId), ...children];
    return { shapes: nextShapes, childIds: children.map(c => c.id) };
}

/**
 * Moves selected shapes to the front (top of render order).
 * @param {Object[]} shapes
 * @param {Set<string>} selectedIds
 * @returns {Object[]}
 */
export function bringToFront(shapes, selectedIds) {
    const selected = shapes.filter(s => selectedIds.has(s.id));
    const others = shapes.filter(s => !selectedIds.has(s.id));
    return [...others, ...selected];
}

/**
 * Moves selected shapes to the back (bottom of render order).
 * @param {Object[]} shapes
 * @param {Set<string>} selectedIds
 * @returns {Object[]}
 */
export function sendToBack(shapes, selectedIds) {
    const selected = shapes.filter(s => selectedIds.has(s.id));
    const others = shapes.filter(s => !selectedIds.has(s.id));
    return [...selected, ...others];
}

/**
 * Moves a single shape one step forward.
 * @param {Object[]} shapes
 * @param {string} id
 * @returns {Object[]}
 */
export function bringForward(shapes, id) {
    const index = shapes.findIndex(s => s.id === id);
    if (index === -1 || index === shapes.length - 1) return shapes;
    const next = [...shapes];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    return next;
}

/**
 * Moves a single shape one step backward.
 * @param {Object[]} shapes
 * @param {string} id
 * @returns {Object[]}
 */
export function sendBackward(shapes, id) {
    const index = shapes.findIndex(s => s.id === id);
    if (index <= 0) return shapes;
    const next = [...shapes];
    [next[index], next[index - 1]] = [next[index - 1], next[index]];
    return next;
}

/**
 * Duplicates selected shapes at a slight offset.
 * @param {Object[]} shapes
 * @param {Set<string>} selectedIds
 * @param {{ dx?: number, dy?: number }} options
 * @returns {{ shapes: Object[], newIds: string[] }}
 */
export function duplicateShapes(shapes, selectedIds, { dx = 20, dy = 20 } = {}) {
    const selected = shapes.filter(s => selectedIds.has(s.id));
    const clones = selected.map(s => ({
        ...s,
        id: crypto.randomUUID(),
        position: { x: s.position.x + dx, y: s.position.y + dy }
    }));
    return { shapes: [...shapes, ...clones], newIds: clones.map(c => c.id) };
}
