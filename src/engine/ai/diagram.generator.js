import dagre from 'dagre';

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

// ── Style constants ──────────────────────────────────────────────────────────
const HAND_FONT     = 'Caveat';
const HAND_STROKE   = '#1e293b';
const ROUGHNESS     = 1.4;
const ARROW_ROUGHNESS = 0.3;

// Node fills — pastel colours with good contrast for dark text
const NODE_FILLS = {
    rectangle:    '#dbeafe',   // blue-100
    ellipse:      '#d1fae5',   // emerald-100  (Start / End)
    diamond:      '#ede9fe',   // violet-100   (Decision)
    cylinder:     '#bbf7d0',   // green-200
    parallelogram:'#fef3c7',   // amber-100    (I/O)
    hexagon:      '#fce7f3',   // pink-100
    document:     '#fee2e2',   // red-100
};

const NODE_STROKE = {
    rectangle:    '#3b82f6',
    ellipse:      '#10b981',
    diamond:      '#7c3aed',
    cylinder:     '#16a34a',
    parallelogram:'#d97706',
    hexagon:      '#db2777',
    document:     '#dc2626',
};

// ── Node sizes (generous for Caveat font readability) ────────────────────────
const NODE_SIZES = {
    rectangle:     { w: 200, h: 72  },
    ellipse:       { w: 180, h: 72  },
    diamond:       { w: 200, h: 110 },
    cylinder:      { w: 180, h: 100 },
    parallelogram: { w: 210, h: 72  },
    hexagon:       { w: 200, h: 90  },
    document:      { w: 200, h: 90  },
};

// ── Spacing — scales with node count so large diagrams stay readable ─────────
function computeSpacing(nodeCount, rankdir) {
    const isLR = rankdir === 'LR';
    // Base gaps — tighter horizontally in LR so the diagram isn't too wide
    const baseNodeSep = isLR ? 60  : 80;
    const baseRankSep = isLR ? 140 : 160;
    // Scale up modestly for bigger diagrams
    const extra = Math.min(nodeCount * 3, 60);
    return {
        nodesep: baseNodeSep + extra,
        ranksep: baseRankSep + extra,
        edgesep: 30,
    };
}

// ── Shape defaults ────────────────────────────────────────────────────────────
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
        seed: 0,
        fillStyle: 'solid',
    },
    revision: { number: 1, timestamp: Date.now() }
};

const defaultTextProps = {
    ...defaultShapeProps,
    type: 'text',
    style: {
        ...defaultShapeProps.style,
        fill: '#0f172a',
        roughness: 0,
    },
    font: {
        family: HAND_FONT,
        size: 16,
        weight: '700',
        align: 'center',
    }
};

/**
 * Creates a node group: background shape + centred text label.
 * cx, cy = absolute canvas centre of the group.
 */
function createNodeShape(rawId, label, cx, cy, type = 'rectangle', w, h) {
    const sz = NODE_SIZES[type] || NODE_SIZES.rectangle;
    const width  = w ?? sz.w;
    const height = h ?? sz.h;

    const groupId = crypto.randomUUID();
    const shapeId = crypto.randomUUID();
    const textId  = crypto.randomUUID();

    const fill   = NODE_FILLS[type]   || NODE_FILLS.rectangle;
    const stroke = NODE_STROKE[type]  || HAND_STROKE;

    const shapeObj = {
        ...defaultShapeProps,
        id: shapeId,
        type,
        position: { x: 0, y: 0 },
        size: { width, height },
        style: {
            ...defaultShapeProps.style,
            fill,
            stroke,
            strokeWidth: 2.5,
            roughness: ROUGHNESS,
            seed: stableIntHash(shapeId),
        }
    };

    // Font size: slightly smaller for long labels
    const charCount = (label || '').length;
    const fontSize  = charCount > 22 ? 13 : charCount > 14 ? 15 : 17;

    const textObj = {
        ...defaultTextProps,
        id: textId,
        text: label || '',
        position: { x: 0, y: 0 },
        size: { width: width - 16, height: height },
        font: { ...defaultTextProps.font, size: fontSize },
        style: { ...defaultTextProps.style, fill: '#0f172a' },
    };

    const group = {
        ...defaultShapeProps,
        id: groupId,
        type: 'group',
        position: { x: cx, y: cy },
        size: { width, height },
        style: { ...defaultShapeProps.style, stroke: 'transparent', strokeWidth: 0 },
        children: [shapeObj, textObj],
        rawId,
    };

    return group;
}

// ── Main flowchart generator ──────────────────────────────────────────────────

/**
 * Converts a validated AI flowchart JSON intent → Infinity Canvas shapes.
 * Supports diagramMode "flowchart" and "explanation".
 */
export function generateDiagramShapes(intent) {
    if (intent.intent_type === 'non_visual' || !intent.graph) return [];

    const diagramMode = intent.graph.diagramMode || 'flowchart';
    if (diagramMode === 'explanation') return renderExplanationDiagram(intent);

    return renderFlowchart(intent);
}

function renderFlowchart(intent) {
    const nodes   = intent.graph.nodes || [];
    const edges   = intent.graph.edges || [];
    const rankdir = (intent.graph.direction || 'TB').toUpperCase();

    if (nodes.length === 0) return [];

    // ── 1. Build Dagre graph ─────────────────────────────────────────────────
    const g = new dagre.graphlib.Graph({ multigraph: true });
    const spacing = computeSpacing(nodes.length, rankdir);

    g.setGraph({
        rankdir,
        nodesep: spacing.nodesep,
        ranksep: spacing.ranksep,
        edgesep: spacing.edgesep,
        marginx: 80,
        marginy: 80,
        acyclicer: 'greedy',  // handles back-edges (loops) gracefully
        ranker: 'network-simplex',
    });
    g.setDefaultEdgeLabel(() => ({}));

    // Register nodes
    nodes.forEach(node => {
        const sz = NODE_SIZES[node.type] || NODE_SIZES.rectangle;
        g.setNode(node.id, { label: node.label || '', width: sz.w, height: sz.h, type: node.type });
    });

    // Register edges (multigraph: each edge gets a unique name)
    edges.forEach((edge, i) => {
        if (g.hasNode(edge.from) && g.hasNode(edge.to)) {
            g.setEdge(edge.from, edge.to, { label: edge.label || '' }, `e${i}`);
        }
    });

    // ── 2. Run layout ────────────────────────────────────────────────────────
    try {
        dagre.layout(g);
    } catch (e) {
        console.error('Dagre layout error:', e);
        return [];
    }

    // ── 3. Extract node positions ────────────────────────────────────────────
    // Centre the entire diagram at (0, 0)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
        const dn = g.node(node.id);
        if (!dn) return;
        minX = Math.min(minX, dn.x - dn.width  / 2);
        minY = Math.min(minY, dn.y - dn.height / 2);
        maxX = Math.max(maxX, dn.x + dn.width  / 2);
        maxY = Math.max(maxY, dn.y + dn.height / 2);
    });
    const offsetX = -(minX + maxX) / 2;
    const offsetY = -(minY + maxY) / 2;

    const shapes = [];
    // rawId → { cx, cy, w, h, groupShape }
    const nodeMap = new Map();

    nodes.forEach(node => {
        const dn = g.node(node.id);
        if (!dn) return;
        const cx = dn.x + offsetX;
        const cy = dn.y + offsetY;
        const group = createNodeShape(node.id, node.label, cx, cy, node.type, dn.width, dn.height);
        shapes.push(group);
        nodeMap.set(node.id, { cx, cy, w: dn.width, h: dn.height, groupShape: group });
    });

    // ── 4. Draw edges ────────────────────────────────────────────────────────
    edges.forEach((edge, i) => {
        const src = nodeMap.get(edge.from);
        const tgt = nodeMap.get(edge.to);
        if (!src || !tgt) return;

        // Use Dagre's computed waypoints for the edge
        const dagreEdge = g.edge(edge.from, edge.to, `e${i}`);
        let waypoints = dagreEdge?.points || [];

        // Offset waypoints by the same centering offset
        waypoints = waypoints.map(p => ({ x: p.x + offsetX, y: p.y + offsetY }));

        // Build relative points from the source centre
        // Snap first and last waypoint to node edges for a clean connection
        const startPt = getEdgeAnchor(src, tgt, 'exit',  rankdir);
        const endPt   = getEdgeAnchor(tgt, src, 'enter', rankdir);

        let relPoints;
        if (waypoints.length >= 2) {
            // Replace first & last dagre points with our snapped anchors
            const mid = waypoints.slice(1, -1);
            const pts = [startPt, ...mid, endPt];
            relPoints = pts.map(p => ({ x: p.x - startPt.x, y: p.y - startPt.y }));
        } else {
            relPoints = [
                { x: 0, y: 0 },
                { x: endPt.x - startPt.x, y: endPt.y - startPt.y }
            ];
        }

        // Collapse near-colinear intermediate points to avoid jitter
        relPoints = simplifyPoints(relPoints);

        const arrowId = crypto.randomUUID();
        shapes.push({
            id: arrowId,
            type: 'arrow',
            position: startPt,
            points: relPoints,
            size: { width: 1, height: 1 },
            zIndex: -1,
            rotation: 0,
            scale: { x: 1, y: 1 },
            locked: false,
            visible: true,
            style: {
                stroke: '#475569',
                fill: 'transparent',
                strokeWidth: 2,
                opacity: 1,
                renderMode: 'vector',
                roughness: ARROW_ROUGHNESS,
                seed: stableIntHash(`${edge.from}->${edge.to}-${i}`),
                fillStyle: 'solid',
            },
            revision: { number: 1, timestamp: Date.now() },
            arrow: { startHead: 'none', endHead: 'triangle' },
            bindings: {
                start: { elementId: src.groupShape.id, anchor: 'center' },
                end:   { elementId: tgt.groupShape.id, anchor: 'center' },
            }
        });

        // Edge label — positioned at the true midpoint of the path
        if (edge.label) {
            const midPt = pathMidpoint(startPt, relPoints);
            const isVertical = Math.abs(endPt.y - startPt.y) > Math.abs(endPt.x - startPt.x);
            shapes.push({
                ...defaultTextProps,
                id: crypto.randomUUID(),
                text: edge.label,
                position: {
                    x: midPt.x + (isVertical ? 28 : 0),  // offset slightly right of vertical arrows
                    y: midPt.y - (isVertical ?  0 : 20), // offset slightly above horizontal arrows
                },
                size: { width: 80, height: 26 },
                font: { ...defaultTextProps.font, size: 13, weight: '700', align: 'center' },
                style: { ...defaultTextProps.style, fill: '#7c3aed' },
            });
        }
    });

    return shapes;
}

/**
 * Returns the exit/enter anchor point on a node's boundary facing toward `other`.
 * mode: 'exit' → point on src boundary; 'enter' → point on tgt boundary
 */
function getEdgeAnchor(node, other, mode, rankdir) {
    const { cx, cy, w, h } = node;
    const hw = w / 2;
    const hh = h / 2;

    if (rankdir === 'LR') {
        return mode === 'exit'
            ? { x: cx + hw, y: cy }   // right edge
            : { x: cx - hw, y: cy };  // left edge
    }
    // TB
    return mode === 'exit'
        ? { x: cx, y: cy + hh }   // bottom edge
        : { x: cx, y: cy - hh };  // top edge
}

/**
 * Collapses consecutive near-colinear points to keep arrows clean.
 */
function simplifyPoints(pts) {
    if (pts.length <= 2) return pts;
    const result = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
        const prev = result[result.length - 1];
        const curr = pts[i];
        const next = pts[i + 1];
        // Keep the point if it creates a meaningful bend (> 8px off the line)
        const cross = Math.abs(
            (next.x - prev.x) * (prev.y - curr.y) -
            (prev.x - curr.x) * (next.y - prev.y)
        ) / (Math.hypot(next.x - prev.x, next.y - prev.y) + 0.001);
        if (cross > 8) result.push(curr);
    }
    result.push(pts[pts.length - 1]);
    return result;
}

/**
 * Returns the absolute midpoint along a relative-points path.
 */
function pathMidpoint(origin, relPts) {
    if (relPts.length === 0) return origin;
    if (relPts.length === 1) return { x: origin.x + relPts[0].x / 2, y: origin.y + relPts[0].y / 2 };
    const midIdx = Math.floor(relPts.length / 2);
    return { x: origin.x + relPts[midIdx].x, y: origin.y + relPts[midIdx].y };
}


// ═════════════════════════════════════════════════════════════════════════════
// ── Explanation Diagram Renderer ─────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const EXPLANATION_COLORS = {
    blue:   { fill: '#dbeafe', stroke: '#3b82f6', text: '#1e3a8a', hdr: '#1d4ed8' },
    purple: { fill: '#ede9fe', stroke: '#7c3aed', text: '#3b0764', hdr: '#6d28d9' },
    teal:   { fill: '#ccfbf1', stroke: '#0d9488', text: '#134e4a', hdr: '#0f766e' },
    amber:  { fill: '#fef3c7', stroke: '#d97706', text: '#78350f', hdr: '#b45309' },
    coral:  { fill: '#fee2e2', stroke: '#ef4444', text: '#7f1d1d', hdr: '#dc2626' },
    green:  { fill: '#dcfce7', stroke: '#16a34a', text: '#14532d', hdr: '#15803d' },
    gray:   { fill: '#f1f5f9', stroke: '#64748b', text: '#1e293b', hdr: '#475569' },
};

const EXPL_SECTION_W   = 260;
const EXPL_SECTION_PAD = 16;
const EXPL_HDR_H       = 42;
const EXPL_ITEM_H      = 36;
const EXPL_GAP         = 70;
const EXPL_TITLE_H     = 44;

function sectionCardHeight(section) {
    const items = section.items || [];
    return EXPL_HDR_H + items.length * EXPL_ITEM_H + EXPL_SECTION_PAD * 2;
}

function createExplanationSection(section, cx, cy) {
    const colors  = EXPLANATION_COLORS[section.color] || EXPLANATION_COLORS.gray;
    const items   = section.items || [];
    const cardH   = sectionCardHeight(section);
    const groupId = crypto.randomUUID();
    const children = [];

    // Card background
    const bgId = crypto.randomUUID();
    children.push({
        ...defaultShapeProps,
        id: bgId,
        type: 'rectangle',
        position: { x: 0, y: 0 },
        size: { width: EXPL_SECTION_W, height: cardH },
        style: { ...defaultShapeProps.style, fill: colors.fill, stroke: colors.stroke, strokeWidth: 1.5, roughness: 0.6, seed: stableIntHash(bgId) },
    });

    // Header strip
    const hdrId = crypto.randomUUID();
    children.push({
        ...defaultShapeProps,
        id: hdrId,
        type: 'rectangle',
        position: { x: 0, y: -cardH / 2 + EXPL_HDR_H / 2 },
        size: { width: EXPL_SECTION_W, height: EXPL_HDR_H },
        style: { ...defaultShapeProps.style, fill: colors.hdr, stroke: 'transparent', strokeWidth: 0, roughness: 0, seed: stableIntHash(hdrId) },
    });

    // Header title
    children.push({
        ...defaultTextProps,
        id: crypto.randomUUID(),
        text: section.title || '',
        position: { x: 0, y: -cardH / 2 + EXPL_HDR_H / 2 },
        size: { width: EXPL_SECTION_W - 16, height: EXPL_HDR_H },
        font: { ...defaultTextProps.font, size: 14, weight: '700', align: 'center' },
        style: { ...defaultTextProps.style, fill: '#ffffff' },
    });

    // Bullet items
    items.forEach((item, i) => {
        const itemY = -cardH / 2 + EXPL_HDR_H + EXPL_SECTION_PAD + i * EXPL_ITEM_H + EXPL_ITEM_H / 2;
        children.push({
            ...defaultTextProps,
            id: crypto.randomUUID(),
            text: `• ${item}`,
            position: { x: EXPL_SECTION_PAD / 2 - 4, y: itemY },
            size: { width: EXPL_SECTION_W - EXPL_SECTION_PAD * 2, height: EXPL_ITEM_H },
            font: { ...defaultTextProps.font, size: 13, weight: '600', align: 'left' },
            style: { ...defaultTextProps.style, fill: colors.text },
        });
    });

    return {
        ...defaultShapeProps,
        id: groupId,
        type: 'group',
        position: { x: cx, y: cy },
        size: { width: EXPL_SECTION_W, height: cardH },
        style: { ...defaultShapeProps.style, stroke: 'transparent', strokeWidth: 0 },
        children,
        rawId: section.id,
    };
}

export function renderExplanationDiagram(intent) {
    if (!intent || !intent.graph) return [];
    const data = intent.graph;

    const sections    = data.sections    || [];
    const connections = data.connections || [];
    const layout      = data.layout      || 'horizontal';
    const title       = data.title       || '';

    if (sections.length === 0) return [];

    const shapes = [];
    const posMap = new Map(); // section.id → { cx, cy, cardH }

    const isHoriz = layout !== 'vertical' && layout !== 'layered';

    if (isHoriz) {
        const maxCardH = Math.max(...sections.map(sectionCardHeight));
        const totalW   = sections.length * EXPL_SECTION_W + (sections.length - 1) * EXPL_GAP;
        const startX   = -(totalW - EXPL_SECTION_W) / 2;

        sections.forEach((sec, i) => {
            const cardH = sectionCardHeight(sec);
            const cx = startX + i * (EXPL_SECTION_W + EXPL_GAP);
            const cy = 0;
            posMap.set(sec.id, { cx, cy, cardH });
            shapes.push(createExplanationSection(sec, cx, cy));
        });

        if (title) {
            shapes.push({
                ...defaultTextProps,
                id: crypto.randomUUID(),
                text: title,
                position: { x: 0, y: -(maxCardH / 2) - EXPL_TITLE_H },
                size: { width: Math.max(400, totalW), height: EXPL_TITLE_H },
                font: { ...defaultTextProps.font, size: 20, weight: '700', align: 'center' },
                style: { ...defaultTextProps.style, fill: '#0f172a' },
            });
        }
    } else {
        let curY = 0;
        const totalH = sections.reduce((sum, s) => sum + sectionCardHeight(s) + EXPL_GAP, -EXPL_GAP);
        curY = -totalH / 2;

        sections.forEach(sec => {
            const cardH = sectionCardHeight(sec);
            const cx = 0, cy = curY + cardH / 2;
            posMap.set(sec.id, { cx, cy, cardH });
            shapes.push(createExplanationSection(sec, cx, cy));
            curY += cardH + EXPL_GAP;
        });

        if (title) {
            const topY = posMap.get(sections[0].id)?.cy - sectionCardHeight(sections[0]) / 2;
            shapes.push({
                ...defaultTextProps,
                id: crypto.randomUUID(),
                text: title,
                position: { x: 0, y: topY - EXPL_TITLE_H },
                size: { width: 400, height: EXPL_TITLE_H },
                font: { ...defaultTextProps.font, size: 20, weight: '700', align: 'center' },
                style: { ...defaultTextProps.style, fill: '#0f172a' },
            });
        }
    }

    // Connection arrows
    connections.forEach(conn => {
        const src = posMap.get(conn.from);
        const tgt = posMap.get(conn.to);
        if (!src || !tgt) return;

        let x1, y1, x2, y2;
        if (isHoriz) {
            x1 = src.cx + EXPL_SECTION_W / 2;
            y1 = src.cy;
            x2 = tgt.cx - EXPL_SECTION_W / 2;
            y2 = tgt.cy;
        } else {
            x1 = src.cx;
            y1 = src.cy + src.cardH / 2;
            x2 = tgt.cx;
            y2 = tgt.cy - tgt.cardH / 2;
        }

        shapes.push({
            id: crypto.randomUUID(),
            type: 'arrow',
            position: { x: x1, y: y1 },
            points: [{ x: 0, y: 0 }, { x: x2 - x1, y: y2 - y1 }],
            size: { width: 1, height: 1 },
            zIndex: -1,
            rotation: 0,
            scale: { x: 1, y: 1 },
            locked: false,
            visible: true,
            style: {
                stroke: '#475569',
                fill: 'transparent',
                strokeWidth: 2,
                opacity: 0.9,
                renderMode: 'vector',
                roughness: 0.3,
                seed: stableIntHash(conn.from + conn.to),
                fillStyle: 'solid',
            },
            revision: { number: 1, timestamp: Date.now() },
            arrow: { startHead: 'none', endHead: 'triangle' },
        });

        if (conn.label) {
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2 - 14;
            shapes.push({
                ...defaultTextProps,
                id: crypto.randomUUID(),
                text: conn.label,
                position: { x: mx, y: my },
                size: { width: 130, height: 20 },
                font: { ...defaultTextProps.font, size: 11, align: 'center' },
                style: { ...defaultTextProps.style, fill: '#475569' },
            });
        }
    });

    return shapes;
}