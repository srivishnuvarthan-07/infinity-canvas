/**
 * engine/core/stateManager.js
 * Pure, framework-agnostic shape state mutations.
 * No React, no hooks — just plain functions that operate on a shapes array.
 */

/**
 * Deep-merges updates into all shapes matching the given ids.
 * Handles nested position, size, scale, style, font sub-objects.
 * @param {Object[]} shapes
 * @param {string|string[]|Set<string>} ids
 * @param {Object} updates
 * @returns {Object[]}
 */
export function updateShapes(shapes, ids, updates) {
    const idSet = ids instanceof Set ? ids : new Set(Array.isArray(ids) ? ids : [ids]);
    return shapes.map(shape => {
        if (!idSet.has(shape.id)) return shape;
        return {
            ...shape,
            ...updates,
            position: updates.position ? { ...shape.position, ...updates.position } : shape.position,
            size: updates.size ? { ...shape.size, ...updates.size } : shape.size,
            scale: updates.scale ? { ...shape.scale, ...updates.scale } : shape.scale,
            style: updates.style ? { ...shape.style, ...updates.style } : shape.style,
            font: updates.font ? { ...shape.font, ...updates.font } : shape.font,
            revision: {
                number: (shape.revision?.number || 0) + 1,
                timestamp: Date.now()
            }
        };
    });
}

/**
 * Builds a diff (Command[]) between two shape arrays.
 * Commands: { type: 'ADD'|'UPDATE'|'REMOVE', id, prev?, next? }
 * @param {Object[]} prevShapes
 * @param {Object[]} nextShapes
 * @returns {Object[]}
 */
export function diffShapes(prevShapes, nextShapes) {
    const prevMap = new Map(prevShapes.map(s => [s.id, s]));
    const nextMap = new Map(nextShapes.map(s => [s.id, s]));
    const commands = [];

    nextShapes.forEach(next => {
        const prev = prevMap.get(next.id);
        if (!prev) {
            commands.push({ type: 'ADD', id: next.id, next });
        } else if (JSON.stringify(prev) !== JSON.stringify(next)) {
            commands.push({ type: 'UPDATE', id: next.id, prev, next });
        }
    });

    prevShapes.forEach(prev => {
        if (!nextMap.has(prev.id)) {
            commands.push({ type: 'REMOVE', id: prev.id, prev });
        }
    });

    return commands;
}

/**
 * Applies an inverse of each command (for undo).
 * @param {Object[]} shapes
 * @param {Object[]} commands
 * @returns {Object[]}
 */
export function applyUndo(shapes, commands) {
    const map = new Map(shapes.map(s => [s.id, s]));
    for (let i = commands.length - 1; i >= 0; i--) {
        const cmd = commands[i];
        if (cmd.type === 'ADD') map.delete(cmd.id);
        else if (cmd.type === 'REMOVE') map.set(cmd.id, cmd.prev);
        else if (cmd.type === 'UPDATE') map.set(cmd.id, cmd.prev);
    }
    return Array.from(map.values());
}

/**
 * Applies commands forward (for redo).
 * @param {Object[]} shapes
 * @param {Object[]} commands
 * @returns {Object[]}
 */
export function applyRedo(shapes, commands) {
    const map = new Map(shapes.map(s => [s.id, s]));
    for (const cmd of commands) {
        if (cmd.type === 'ADD') map.set(cmd.id, cmd.next);
        else if (cmd.type === 'REMOVE') map.delete(cmd.id);
        else if (cmd.type === 'UPDATE') map.set(cmd.id, cmd.next);
    }
    return Array.from(map.values());
}
