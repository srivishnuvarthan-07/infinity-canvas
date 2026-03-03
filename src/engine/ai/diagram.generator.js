import dagre from 'dagre';
import { routeArrow } from '@/engine/routing/smartArrow';

/**
 * Deterministic integer hash from a string — used as Rough.js seed so each
 * node/edge renders the same sketch texture on every re-render.
 */
function stableIntHash(str) {
    let h = 0xdeadbeef;
    for (let i = 0; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
    return ((h ^ (h >>> 16)) >>> 0);
}

// ── Hand-drawn style constants ──────────────────────────────────────────────
const HAND_FONT = 'Caveat';       // Google handwriting font loaded in index.html
const HAND_STROKE = '#2d2d2d';      // Warm dark (not pure black)
const ROUGHNESS = 1.8;            // Shape sketch roughness (0 = clean, 3 = wild)
const ARROW_ROUGHNESS = 1.2;        // Slightly less rough for lines

// Soft pastel fills per node type — chosen to be light enough that dark text
// stays readable but rich enough to immediately distinguish shape roles.
const NODE_FILLS = {
    rectangle: '#fffde7',  // Warm cream / yellow
    ellipse: '#e3f2fd',  // Sky blue
    diamond: '#f3e5f5',  // Soft lavender
};

/**
 * Common shape defaults  (all generated shapes share these)
 */
const defaultShapeProps = {
    position: { x: 0, y: 0 },
    rotation: 0,
    scale: { x: 1, y: 1 },
    zIndex: 0,
    locked: false,
    visible: true,
    style: {
        stroke: HAND_STROKE,
        fill: 'transparent',
        strokeWidth: 2,
        opacity: 1,
        renderMode: 'vector',
        roughness: ROUGHNESS,
        seed: Math.floor(Math.random() * 1000000),
        fillStyle: 'solid'
    },
    revision: {
        number: 1,
        timestamp: Date.now()
    }
};

// Hand-drawn text defaults
const defaultTextProps = {
    ...defaultShapeProps,
    type: 'text',
    style: {
        ...defaultShapeProps.style,
        fill: HAND_STROKE,
        roughness: 0,  // Text itself doesn't use roughness
    },
    font: {
        family: HAND_FONT,
        size: 17,
        weight: '600',
        align: 'center'
    }
};

// Base node shape defaults (filled in createNode with per-type color)
const defaultNodeProps = {
    ...defaultShapeProps,
    type: 'rectangle',
    size: { width: 160, height: 70 },
    style: {
        ...defaultShapeProps.style,
        fill: NODE_FILLS.rectangle,
    }
};

/**
 * Creates a grouped node (shape + text label) at absolute center (x, y).
 */
function createNode(id, text, x, y, type = 'rectangle', width = 160, height = 70) {
    const groupId = crypto.randomUUID();
    const nodeId = id || crypto.randomUUID();
    const textId = crypto.randomUUID();

    const nodeShape = {
        ...defaultNodeProps,
        id: nodeId,
        type,
        position: { x: 0, y: 0 }, // Relative to group center
        size: { width, height },
    };

    const textShape = {
        ...defaultTextProps,
        id: textId,
        text,
        position: { x: 0, y: 0 }, // Relative to group center
        size: { width: width - 10, height: 20 },
        font: {
            ...defaultTextProps.font,
            size: 13
        }
    };

    const groupShape = {
        ...defaultShapeProps,
        id: groupId,
        type: 'group',
        position: { x, y },
        size: { width, height },
        style: {
            ...defaultShapeProps.style,
            stroke: 'transparent',
            strokeWidth: 0,
        },
        children: [nodeShape, textShape],
        rawId: id
    };

    return groupShape;
}

/**
 * Computes orthogonal (elbow) waypoints between two absolute positions.
 *
 * For TB layout (vertical flow):
 *   start → drop to mid-Y → slide horizontally → climb to end
 * For LR layout (horizontal flow):
 *   start → slide to mid-X → drop vertically → slide to end
 *
 * All points are stored RELATIVE to the center (midpoint) of the bounding box
 * so they match the canvas arrow center-origin schema.
 *
 * When source and target are already axis-aligned we skip the extra bend and
 * keep the path straight (avoids a zero-length segment artefact).
 */
function computeElbowPoints(startX, startY, endX, endY, dir = 'TB') {
    const THRESHOLD = 8; // px — below this we treat as "already aligned"

    let rawPts;

    if (dir === 'LR') {
        if (Math.abs(startY - endY) < THRESHOLD) {
            // Already on same horizontal line — straight
            rawPts = [
                { x: startX, y: startY },
                { x: endX, y: endY }
            ];
        } else {
            const midX = (startX + endX) / 2;
            rawPts = [
                { x: startX, y: startY },
                { x: midX, y: startY },
                { x: midX, y: endY },
                { x: endX, y: endY }
            ];
        }
    } else {
        // TB (default)
        if (Math.abs(startX - endX) < THRESHOLD) {
            // Already on same vertical line — straight
            rawPts = [
                { x: startX, y: startY },
                { x: endX, y: endY }
            ];
        } else {
            const midY = startY + (endY - startY) / 2;
            rawPts = [
                { x: startX, y: startY },
                { x: startX, y: midY },
                { x: endX, y: midY },
                { x: endX, y: endY }
            ];
        }
    }

    return rawPts;
}

/**
 * Creates a smart-elbow arrow from absolute world coordinates.
 *
 * The canvas arrow schema is center-origin: `position` is the midpoint of the
 * bounding box, and every point in `points[]` is an offset from that midpoint.
 */
function createArrow(startX, startY, endX, endY, label = '', dir = 'TB') {
    const edgeId = crypto.randomUUID();

    const rawPts = computeElbowPoints(startX, startY, endX, endY, dir);

    // Compute bounding box of all raw path points
    let bMinX = Infinity, bMinY = Infinity, bMaxX = -Infinity, bMaxY = -Infinity;
    rawPts.forEach(p => {
        bMinX = Math.min(bMinX, p.x);
        bMinY = Math.min(bMinY, p.y);
        bMaxX = Math.max(bMaxX, p.x);
        bMaxY = Math.max(bMaxY, p.y);
    });

    // Center-origin for the arrow shape
    const cx = (bMinX + bMaxX) / 2;
    const cy = (bMinY + bMaxY) / 2;

    // Convert all raw points to center-relative offsets
    const relPoints = rawPts.map(p => ({ x: p.x - cx, y: p.y - cy }));

    const arrowShape = {
        ...defaultShapeProps,
        id: edgeId,
        type: 'arrow',
        position: { x: cx, y: cy },
        points: relPoints,
        size: {
            width: Math.max(1, bMaxX - bMinX),
            height: Math.max(1, bMaxY - bMinY)
        },
        zIndex: -1,
        arrow: {
            startHead: 'none',
            endHead: 'triangle'
        }
    };

    const shapes = [arrowShape];

    if (label) {
        const textId = crypto.randomUUID();
        // Place label just above the midpoint of the path
        const midPtIdx = Math.floor(rawPts.length / 2);
        const labelPt = rawPts[midPtIdx];
        shapes.push({
            ...defaultTextProps,
            id: textId,
            text: label,
            position: { x: labelPt.x, y: labelPt.y - 14 },
            size: { width: 120, height: 18 },
            font: { ...defaultTextProps.font, size: 11, align: 'center' },
            style: { ...defaultTextProps.style, fill: '#555555' }
        });
    }

    return shapes;
}

// Canonical node sizes — MUST match in both Dagre population AND rendering.
const NODE_SIZES = {
    rectangle: { w: 160, h: 70 },
    ellipse: { w: 130, h: 80 },
    diamond: { w: 160, h: 90 },
};

/**
 * Computes balanced Dagre spacing based on graph size.
 * Scales inversely so small graphs breathe and large graphs stay legible.
 * @param {number} nodeCount
 * @param {string} direction 'TB' | 'LR'
 * @returns {{ nodesep: number, ranksep: number }}
 */
function computeSpacing(nodeCount, direction) {
    // Nodes per rank estimate: TB is wider, LR is taller
    const nodesep = Math.max(40, Math.round(120 - nodeCount * 3.5));
    const ranksep = Math.max(80, Math.round(160 - nodeCount * 3));
    return { nodesep, ranksep };
}

/**
 * Transforms a validated AI Graph JSON intent into Infinity Canvas shapes.
 *
 * Pipeline:
 *   AI Graph JSON → Dagre layout (positions) → Canvas shapes → Auto-center
 */
export function generateDiagramShapes(intent) {
    if (intent.intent_type === 'non_visual' || !intent.graph) {
        return [];
    }

    const { nodes, edges } = intent.graph;
    const rankdir = intent.graph.direction || 'TB';
    const spacing = computeSpacing(nodes.length, rankdir);

    // ── 1. Configure Dagre ──────────────────────────────────────────────────
    const g = new dagre.graphlib.Graph();
    g.setGraph({
        rankdir,
        nodesep: spacing.nodesep,
        ranksep: spacing.ranksep,
        edgesep: 20,
        marginx: 60,
        marginy: 60
    });
    g.setDefaultEdgeLabel(() => ({}));

    // ── 2. Register nodes ───────────────────────────────────────────────────
    nodes.forEach(node => {
        const sz = NODE_SIZES[node.type] || NODE_SIZES.rectangle;
        g.setNode(node.id, {
            label: node.label,
            width: sz.w,
            height: sz.h,
            type: node.type
        });
    });

    // ── 3. Register edges ───────────────────────────────────────────────────
    edges.forEach(edge => {
        g.setEdge(edge.from, edge.to, { label: edge.label || '' });
    });

    // ── 4. Run layout ───────────────────────────────────────────────────────
    try {
        dagre.layout(g);
    } catch (e) {
        console.error('Dagre Layout Error:', e);
        return [];
    }

    // ── 5. Build shapes ─────────────────────────────────────────────────────
    const shapes = [];

    /**
     * nodeDataMap: nodeId → { x, y, w, h, groupShape }
     * Stores the FINAL (post-jitter) center plus the group shape reference.
     * groupShape is required for routeArrow's edge-anchor computation.
     */
    const nodeDataMap = new Map();

    // --- Render nodes ---
    g.nodes().forEach(v => {
        const node = g.node(v);
        if (!node || node.x === undefined) return;

        const sz = NODE_SIZES[node.type] || NODE_SIZES.rectangle;

        // No jitter or rotation — getBounds() and getEdgeAnchor() assume axis-aligned
        // shapes. Any rotation or positional jitter would misalign arrow anchor points.
        const px = node.x;
        const py = node.y;

        // Pick pastel fill by node type
        const fillColor = NODE_FILLS[node.type] || NODE_FILLS.rectangle;

        const groupShape = createNode(v, node.label, px, py, node.type, sz.w, sz.h);
        // Apply per-node stable seed so roughness is consistent on re-renders
        groupShape.children[0].style.fill = fillColor;
        groupShape.children[0].style.seed = stableIntHash(v);

        shapes.push(groupShape);
        nodeDataMap.set(v, { x: px, y: py, w: sz.w, h: sz.h, groupShape });
    });

    // --- Render edges ---
    // (dir is determined by Dagre but we always use orthogonal via routeArrow)

    g.edges().forEach(e => {
        const edge = g.edge(e);
        const srcData = nodeDataMap.get(e.v);
        const tgtData = nodeDataMap.get(e.w);
        if (!srcData || !tgtData) return;

        // Build a stub arrow, then immediately route it via routeArrow so it
        // snaps to the proper edge anchors of each group shape.
        const stubArrow = {
            ...{
                id: crypto.randomUUID(),
                type: 'arrow',
                position: { x: srcData.x, y: srcData.y },
                points: [{ x: 0, y: 0 }, { x: 0, y: 0 }],
                size: { width: 1, height: 1 },
                zIndex: -1,
                rotation: 0,
                scale: { x: 1, y: 1 },
                locked: false,
                visible: true,
                style: {
                    stroke: '#555555',
                    fill: 'transparent',
                    strokeWidth: 2,
                    opacity: 1,
                    renderMode: 'vector',
                    roughness: 0,
                    seed: Math.floor(Math.random() * 1000000),
                    fillStyle: 'solid'
                },
                revision: { number: 1, timestamp: Date.now() }
            },
            arrow: { startHead: 'none', endHead: 'triangle' },
            // Binding: point to group IDs so drag tracking picks them up
            bindings: {
                start: { elementId: srcData.groupShape.id, anchor: 'center' },
                end: { elementId: tgtData.groupShape.id, anchor: 'center' }
            }
        };

        // routeArrow uses computeEdgeConnection which reads .position and .size
        // from the group shapes — giving us real edge-to-edge anchor points.
        const routedArrow = routeArrow(stubArrow, srcData.groupShape, tgtData.groupShape, 'orthogonal');
        // Apply hand-drawn roughness to the arrow line
        routedArrow.style = {
            ...routedArrow.style,
            roughness: ARROW_ROUGHNESS,
            stroke: HAND_STROKE,
            strokeWidth: 2,
            seed: stableIntHash(e.v + '->' + e.w)
        };

        shapes.push(routedArrow);

        // Edge label: float at the midpoint of the routed path, above the line
        if (edge.label) {
            const pts = routedArrow.points;
            const midPt = pts[Math.floor(pts.length / 2)];
            const lx = routedArrow.position.x + midPt.x;
            const ly = routedArrow.position.y + midPt.y - 14;
            shapes.push({
                ...defaultTextProps,
                id: crypto.randomUUID(),
                text: edge.label,
                position: { x: lx, y: ly },
                size: { width: 120, height: 18 },
                font: { ...defaultTextProps.font, size: 11, align: 'center' },
                style: { ...defaultTextProps.style, fill: '#555555' }
            });
        }
    });

    // ── 6. Auto-center around (0, 0) ────────────────────────────────────────
    // Only use group nodes for the bounding box — arrows will naturally follow
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    shapes.forEach(s => {
        if (s.type !== 'group') return;
        const hw = s.size.width / 2;
        const hh = s.size.height / 2;
        minX = Math.min(minX, s.position.x - hw);
        minY = Math.min(minY, s.position.y - hh);
        maxX = Math.max(maxX, s.position.x + hw);
        maxY = Math.max(maxY, s.position.y + hh);
    });

    if (minX !== Infinity) {
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        shapes.forEach(s => {
            s.position.x -= cx;
            s.position.y -= cy;
        });
    }

    return shapes;
}
