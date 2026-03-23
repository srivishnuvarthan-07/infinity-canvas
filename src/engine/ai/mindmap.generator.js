/**
 * mindmap.generator.js
 * Generates Infinity Canvas shapes for AI mind map visualizations.
 * Uses a radial layout: root at center, branches spread outward.
 * Entire mind map is wrapped in a single group so dragging moves everything.
 */

const HAND_FONT = 'Caveat';
const HAND_STROKE = '#000000';
const ROUGHNESS = 1.4;

// 10-color branch palette — each top-level branch gets one color
const BRANCH_COLORS = [
    { fill: '#dbeafe', stroke: '#2563eb' }, // blue
    { fill: '#dcfce7', stroke: '#16a34a' }, // green
    { fill: '#fef9c3', stroke: '#ca8a04' }, // yellow
    { fill: '#fce7f3', stroke: '#db2777' }, // pink
    { fill: '#ede9fe', stroke: '#7c3aed' }, // purple
    { fill: '#ffedd5', stroke: '#ea580c' }, // orange
    { fill: '#cffafe', stroke: '#0891b2' }, // cyan
    { fill: '#fecaca', stroke: '#dc2626' }, // red
    { fill: '#d1fae5', stroke: '#059669' }, // emerald
    { fill: '#e0e7ff', stroke: '#4f46e5' }, // indigo
];

const ROOT_FILL   = '#1e293b';
const ROOT_STROKE = '#0f172a';

// Layout constants
const ROOT_W       = 200;
const ROOT_H       = 70;
const L1_ORBIT     = 300;  // root → level-1 distance
const L2_ORBIT     = 200;  // level-1 → level-2 distance
const NODE_H       = 48;
const NODE_PAD     = 28;
const MIN_NODE_W   = 110;
const MAX_NODE_W   = 230;
const FONT_SIZE_L1 = 17;
const FONT_SIZE_L2 = 15;

// ── Helpers ───────────────────────────────────────────────────────────────

function stableHash(str) {
    let h = 0xdeadbeef;
    for (let i = 0; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
    return ((h ^ (h >>> 16)) >>> 0);
}

function autoWidth(label, fontSize) {
    const charsPerPx = fontSize * 0.55; // Caveat is wide
    return Math.min(MAX_NODE_W, Math.max(MIN_NODE_W, label.length * charsPerPx + NODE_PAD));
}

function uid() { return crypto.randomUUID(); }

function baseStyle(overrides = {}) {
    return {
        strokeWidth: 2,
        opacity: 1,
        renderMode: 'vector',
        roughness: ROUGHNESS,
        fillStyle: 'solid',
        ...overrides,
    };
}

// ── Shape Factories ────────────────────────────────────────────────────────

/**
 * Returns a group containing: background shape + text label.
 * Position is absolute (center of the node).
 */
function makeNode({ label, cx, cy, fillColor, strokeColor, isRoot, fontSize }) {
    const w = isRoot ? ROOT_W : autoWidth(label, fontSize);
    const h = isRoot ? ROOT_H : NODE_H;

    const groupId  = uid();
    const shapeId  = uid();
    const textId   = uid();
    const textColor = isRoot ? '#ffffff' : '#111827';

    const shapeEl = {
        id: shapeId,
        type: isRoot ? 'ellipse' : 'rectangle',
        rotation: 0, scale: { x: 1, y: 1 }, zIndex: 1,
        locked: false, visible: true,
        revision: { number: 1, timestamp: Date.now() },
        position: { x: 0, y: 0 },
        size: { width: w, height: h },
        style: baseStyle({
            stroke: strokeColor,
            fill: fillColor,
            strokeWidth: isRoot ? 3 : 2,
            roughness: isRoot ? 1.0 : ROUGHNESS,
            seed: stableHash(shapeId),
        }),
    };

    const textEl = {
        id: textId,
        type: 'text',
        rotation: 0, scale: { x: 1, y: 1 }, zIndex: 2,
        locked: false, visible: true,
        revision: { number: 1, timestamp: Date.now() },
        text: label,
        position: { x: 0, y: 0 },
        size: { width: w - 16, height: h },
        font: {
            family: HAND_FONT,
            size: isRoot ? 20 : fontSize,
            weight: isRoot ? '700' : '600',
            align: 'center',
        },
        style: baseStyle({
            stroke: HAND_STROKE,
            fill: textColor,
            strokeWidth: 0,
            roughness: 0,
            seed: stableHash(textId),
        }),
    };

    return {
        id: groupId,
        type: 'group',
        rotation: 0, scale: { x: 1, y: 1 }, zIndex: 1,
        locked: false, visible: true,
        revision: { number: 1, timestamp: Date.now() },
        position: { x: cx, y: cy },
        size: { width: w, height: h },
        style: {
            stroke: 'transparent', strokeWidth: 0,
            fill: 'transparent', opacity: 1,
            renderMode: 'vector', roughness: 0,
            seed: stableHash(groupId), fillStyle: 'solid',
        },
        children: [shapeEl, textEl],
        // Store geometry for connection routing (stripped before final output)
        _cx: cx, _cy: cy, _w: w, _h: h, _isRoot: isRoot,
    };
}

/**
 * Straight 2-point connection — no midpoint, so it won't be re-routed on drag.
 * Exits from the edge of the source toward the target.
 */
function makeConnection({ x1, y1, x2, y2, strokeColor }) {
    const id = uid();
    return {
        id,
        type: 'arrow',
        rotation: 0, scale: { x: 1, y: 1 }, zIndex: 0, // behind nodes (zIndex 1)
        locked: false, visible: true,
        revision: { number: 1, timestamp: Date.now() },
        position: { x: x1, y: y1 },
        points: [
            { x: 0, y: 0 },
            { x: x2 - x1, y: y2 - y1 },
        ],
        size: { width: 1, height: 1 },
        style: baseStyle({
            stroke: strokeColor,
            fill: 'transparent',
            strokeWidth: 2.5,
            roughness: 0.35,
            seed: stableHash(`${x1},${y1},${x2},${y2}`),
        }),
        arrow: { startHead: 'none', endHead: 'none' },
    };
}

// ── Radial Layout ─────────────────────────────────────────────────────────

/**
 * Recursively place child nodes around a parent and emit connections.
 * @param {object}   node        - AI tree node
 * @param {number}   pcx/pcy     - Parent center x/y
 * @param {number}   pw/ph       - Parent width/height (for edge calculation)
 * @param {boolean}  parentIsRoot
 * @param {number}   angleStart/End - angular sector for children (radians)
 * @param {number}   depth
 * @param {object}   color       - {fill, stroke}
 * @param {object[]} nodes       - output node shapes
 * @param {object[]} connections - output arrow shapes
 * @param {number}   orbit       - radius to place children at from parent
 */
function layoutChildren(node, pcx, pcy, pw, ph, parentIsRoot, angleStart, angleEnd, depth, color, nodes, connections, orbit) {
    const children = node.children || [];
    if (children.length === 0) return;

    const sector     = angleEnd - angleStart;
    const angleStep  = sector / children.length;
    const fontSize   = depth === 1 ? FONT_SIZE_L1 : FONT_SIZE_L2;

    children.forEach((child, idx) => {
        const childAngle = angleStart + angleStep * idx + angleStep / 2;
        const cx = pcx + Math.cos(childAngle) * orbit;
        const cy = pcy + Math.sin(childAngle) * orbit;

        const nw = autoWidth(child.label, fontSize);
        const nh = NODE_H;

        // Source edge: exit from the parent's boundary toward child
        const srcEdgeX = pcx + Math.cos(childAngle) * (parentIsRoot ? ROOT_W / 2 : pw / 2);
        const srcEdgeY = pcy + Math.sin(childAngle) * (parentIsRoot ? ROOT_H / 2 : ph / 2);

        // Target edge: enter child's boundary from the parent direction
        const tgtEdgeX = cx - Math.cos(childAngle) * (nw / 2);
        const tgtEdgeY = cy - Math.sin(childAngle) * (nh / 2);

        connections.push(makeConnection({
            x1: srcEdgeX, y1: srcEdgeY,
            x2: tgtEdgeX, y2: tgtEdgeY,
            strokeColor: color.stroke,
        }));

        const childNode = makeNode({
            label: child.label,
            cx, cy,
            fillColor: color.fill,
            strokeColor: color.stroke,
            isRoot: false,
            fontSize,
        });
        nodes.push(childNode);

        // Recurse — narrow the sector for grandchildren
        const halfSpread = Math.max(Math.PI / 10, angleStep * 0.45);
        layoutChildren(
            child, cx, cy, nw, nh, false,
            childAngle - halfSpread, childAngle + halfSpread,
            depth + 1, color, nodes, connections, L2_ORBIT
        );
    });
}

// ── Main Entry ────────────────────────────────────────────────────────────

/**
 * Turn AI mind map JSON into Infinity Canvas shapes.
 * Everything is wrapped in a single parent group.
 *
 * @param {object} intent - { intent_type: 'mindmap', mindmap: { title, root } }
 * @returns {object[]} shapes
 */
export function generateMindMapShapes(intent) {
    if (!intent || intent.intent_type !== 'mindmap' || !intent.mindmap) return [];

    const { root } = intent.mindmap;
    if (!root) return [];

    const nodeShapes  = [];
    const connShapes  = [];
    const topChildren = root.children || [];
    const total       = topChildren.length || 1;
    const angleStep   = (2 * Math.PI) / total;

    // Root node
    const rootShape = makeNode({
        label: root.label,
        cx: 0, cy: 0,
        fillColor: ROOT_FILL,
        strokeColor: ROOT_STROKE,
        isRoot: true,
        fontSize: 20,
    });
    nodeShapes.push(rootShape);

    // Top-level branches
    topChildren.forEach((child, idx) => {
        const color      = BRANCH_COLORS[idx % BRANCH_COLORS.length];
        const baseAngle  = angleStep * idx - Math.PI / 2; // start from top
        const cx         = Math.cos(baseAngle) * L1_ORBIT;
        const cy         = Math.sin(baseAngle) * L1_ORBIT;
        const nw         = autoWidth(child.label, FONT_SIZE_L1);
        const nh         = NODE_H;

        // Connection: root edge → child edge
        const srcX = Math.cos(baseAngle) * (ROOT_W / 2);
        const srcY = Math.sin(baseAngle) * (ROOT_H / 2);
        const tgtX = cx - Math.cos(baseAngle) * (nw / 2);
        const tgtY = cy - Math.sin(baseAngle) * (nh / 2);

        connShapes.push(makeConnection({
            x1: srcX, y1: srcY,
            x2: tgtX, y2: tgtY,
            strokeColor: color.stroke,
        }));

        const childNode = makeNode({
            label: child.label,
            cx, cy,
            fillColor: color.fill,
            strokeColor: color.stroke,
            isRoot: false,
            fontSize: FONT_SIZE_L1,
        });
        nodeShapes.push(childNode);

        // Grandchildren sector
        const spread = angleStep * 0.45;
        layoutChildren(
            child, cx, cy, nw, nh, false,
            baseAngle - spread, baseAngle + spread,
            2, color, nodeShapes, connShapes, L2_ORBIT
        );
    });

    // Compute bounding box for the wrapper group
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    [...nodeShapes, ...connShapes].forEach(s => {
        const x = s.position?.x ?? s._cx ?? 0;
        const y = s.position?.y ?? s._cy ?? 0;
        const w = s.size?.width ?? 0;
        const h = s.size?.height ?? 0;
        minX = Math.min(minX, x - w / 2);
        minY = Math.min(minY, y - h / 2);
        maxX = Math.max(maxX, x + w / 2);
        maxY = Math.max(maxY, y + h / 2);
    });
    const PADDING = 60;
    const totalW  = (maxX - minX) + PADDING * 2;
    const totalH  = (maxY - minY) + PADDING * 2;

    // Connections rendered first so they appear behind nodes (z-order in children array)
    const allChildren = [...connShapes, ...nodeShapes];

    const wrapperId = uid();
    return [{
        id: wrapperId,
        type: 'group',
        rotation: 0, scale: { x: 1, y: 1 }, zIndex: 0,
        locked: false, visible: true,
        revision: { number: 1, timestamp: Date.now() },
        position: { x: 0, y: 0 },
        size: { width: totalW, height: totalH },
        style: {
            stroke: 'transparent', strokeWidth: 0,
            fill: 'transparent', opacity: 1,
            renderMode: 'vector', roughness: 0,
            seed: stableHash(wrapperId), fillStyle: 'solid',
        },
        children: allChildren,
    }];
}
