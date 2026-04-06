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
const HAND_STROKE = '#000000';      // Pure black for better visibility
const ROUGHNESS = 1.8;            // Shape sketch roughness (0 = clean, 3 = wild)
const ARROW_ROUGHNESS = 0.4;        // Keep arrows clean — high roughness doubles long lines

// Soft pastel fills per node type — chosen to be light enough that dark text
// stays readable but rich enough to immediately distinguish shape roles.
const NODE_FILLS = {
    rectangle: '#e0f2fe',  // Vibrant pastel blue
    ellipse: '#fef08a',  // Vibrant pastel yellow
    diamond: '#e9d5ff',  // Vibrant pastel purple
    cylinder: '#bbf7d0', // Vibrant pastel green
    parallelogram: '#fed7aa', // Vibrant pastel orange
    hexagon: '#fbcfe8',  // Vibrant pastel pink
    document: '#fecaca', // Vibrant pastel red
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

/**
 * Creates a grouped node (shape + text label) at absolute center (x, y).
 */
function createNodeShape(id, text, x, y, type = 'rectangle', width = 160, height = 70) {
    const groupId = crypto.randomUUID();
    const nodeId = id || crypto.randomUUID();
    const textId = crypto.randomUUID();

    const fillColor = NODE_FILLS[type] || NODE_FILLS.rectangle;

    const nodeShape = {
        ...defaultShapeProps,
        id: nodeId,
        type,
        position: { x: 0, y: 0 }, // Relative to group center
        size: { width, height },
        style: {
            ...defaultShapeProps.style,
            fill: fillColor,
            seed: stableIntHash(nodeId)
        }
    };

    const textShape = {
        ...defaultTextProps,
        id: textId,
        text,
        position: { x: 0, y: 0 }, // Relative to group center
        size: { width: width - 20, height: 20 },
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
        rawId: id // Important for Edge routing lookup
    };

    return groupShape;
}

function createGroupContainerShape(id, text, x, y, width, height, depth = 1) {
    const groupId = crypto.randomUUID();
    const bgId = crypto.randomUUID();

    // Assign progressively darker faint background colors based on nesting depth
    const depthColors = ['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1'];
    const bgColor = depthColors[Math.min(depth - 1, depthColors.length - 1)];

    const bgShape = {
        ...defaultShapeProps,
        id: bgId,
        type: 'rectangle',
        position: { x: 0, y: 0 },
        size: { width, height },
        style: {
            ...defaultShapeProps.style,
            fill: bgColor,
            opacity: 1, // Solid tier
            strokeWidth: 2,
            strokeStyle: 'solid',
            roughness: ROUGHNESS * 0.8, // Slightly cleaner borders for groups
            seed: stableIntHash(bgId)
        }
    };

    const children = [bgShape];

    if (text) {
        // Position group label in a styling header block at top-left
        const textShape = {
            ...defaultTextProps,
            id: crypto.randomUUID(),
            text,
            position: { x: -width / 2 + 10, y: -height / 2 + 10 },
            size: { width: width - 20, height: 24 },
            font: {
                ...defaultTextProps.font,
                size: 16,
                weight: '700',
                align: 'left'
            },
            style: {
                ...defaultTextProps.style,
                fill: '#0f172a' // Dark slate for header
            }
        };
        children.push(textShape);

        // Add a subtle separator line under the header
        const lineShape = {
            ...defaultShapeProps,
            id: crypto.randomUUID(),
            type: 'line',
            position: { x: 0, y: -height / 2 + 36 },
            points: [{ x: -width / 2, y: 0 }, { x: width / 2, y: 0 }],
            style: {
                ...defaultShapeProps.style,
                stroke: '#cbd5e1',
                strokeWidth: 1,
                roughness: 0.5
            }
        };
        children.push(lineShape);
    }

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
        children,
        rawId: id
    };

    return groupShape;
}


// Canonical node sizes — sized generously to accommodate Caveat handwriting font
const NODE_SIZES = {
    rectangle:    { w: 190, h: 80  },
    ellipse:      { w: 160, h: 90  },
    diamond:      { w: 190, h: 110 },
    cylinder:     { w: 160, h: 100 },
    parallelogram:{ w: 200, h: 80  },
    hexagon:      { w: 190, h: 95  },
    document:     { w: 190, h: 95  },
};

function computeSpacing(nodeCount) {
    // More nodes need MORE breathing room, not less.
    // ranksep = vertical gap between ranks; nodesep = horizontal gap between siblings.
    const nodesep = Math.min(80 + nodeCount * 2, 160);
    const ranksep = Math.min(120 + nodeCount * 4, 260);
    return { nodesep, ranksep };
}

// ── Recursive Layout Math ────────────────────────────────────────────────

function buildParentMap(nodes, parentId = null, map = new Map()) {
    nodes.forEach(n => {
        map.set(n.id, parentId);
        if (n.type === 'group' && n.nodes) {
            buildParentMap(n.nodes, n.id, map);
        }
    });
    return map;
}

function getAncestorAtLevel(nodeId, levelNodes, parentMap) {
    const levelIds = new Set(levelNodes.map(n => n.id));
    let curr = nodeId;
    while (curr) {
        if (levelIds.has(curr)) return curr;
        curr = parentMap.get(curr);
    }
    return null;
}

const GROUP_PADDING = 100;

function layoutGraphRecursive(levelNodes, allEdges, parentMap, rankdir = 'TB', depth = 1) {
    const g = new dagre.graphlib.Graph();
    const spacing = computeSpacing(levelNodes.length, rankdir);

    g.setGraph({
        rankdir,
        nodesep: spacing.nodesep,
        ranksep: spacing.ranksep,
        edgesep: 20,
        marginx: GROUP_PADDING,
        marginy: GROUP_PADDING
    });
    g.setDefaultEdgeLabel(() => ({}));

    const childResults = new Map();

    // 1. Register nodes
    levelNodes.forEach(node => {
        if (node.type === 'group' && node.nodes && node.nodes.length > 0) {
            const res = layoutGraphRecursive(node.nodes, allEdges, parentMap, node.direction || rankdir, depth + 1);
            childResults.set(node.id, res);
            g.setNode(node.id, {
                label: node.label || '',
                width: res.width,
                height: res.height,
                type: 'group'
            });
        } else {
            const sz = NODE_SIZES[node.type] || NODE_SIZES.rectangle;
            g.setNode(node.id, {
                label: node.label || '',
                width: sz.w,
                height: sz.h,
                type: node.type
            });
        }
    });

    // 2. Register edges
    allEdges.forEach(edge => {
        const ancFrom = getAncestorAtLevel(edge.from, levelNodes, parentMap);
        const ancTo = getAncestorAtLevel(edge.to, levelNodes, parentMap);
        if (ancFrom && ancTo && ancFrom !== ancTo) {
            g.setEdge(ancFrom, ancTo, { label: edge.label || '' });
        }
    });

    // 3. Layout
    dagre.layout(g);

    // 4. Extract sizes and paths
    const layouts = [];
    const edgePaths = [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    levelNodes.forEach(node => {
        const dNode = g.node(node.id);
        if (!dNode) return;

        layouts.push({
            id: node.id,
            type: node.type,
            label: node.label || '',
            w: dNode.width,
            h: dNode.height,
            x: dNode.x,
            y: dNode.y,
            childrenRes: childResults.get(node.id)
        });

        const hw = dNode.width / 2;
        const hh = dNode.height / 2;
        minX = Math.min(minX, dNode.x - hw);
        minY = Math.min(minY, dNode.y - hh);
        maxX = Math.max(maxX, dNode.x + hw);
        maxY = Math.max(maxY, dNode.y + hh);
    });

    allEdges.forEach((edge, i) => {
        const ancFrom = getAncestorAtLevel(edge.from, levelNodes, parentMap);
        const ancTo = getAncestorAtLevel(edge.to, levelNodes, parentMap);
        if (ancFrom && ancTo && ancFrom !== ancTo) {
            const dEdge = g.edge(ancFrom, ancTo);
            if (dEdge && dEdge.points) {
                edgePaths.push({
                    from: edge.from,
                    to: edge.to,
                    points: dEdge.points,
                    label: edge.label || '',
                    index: i
                });
            }
        }
    });

    const width = maxX === -Infinity ? 100 : (maxX - minX + GROUP_PADDING * 2);
    const height = maxY === -Infinity ? 100 : (maxY - minY + GROUP_PADDING * 2);
    const cx = maxX === -Infinity ? 0 : (maxX + minX) / 2;
    const cy = maxY === -Infinity ? 0 : (maxY + minY) / 2;

    return { layouts, edgePaths, width, height, cx, cy };
}

/**
 * Transforms a validated AI Graph JSON intent into Infinity Canvas shapes.
 * Supports two diagram modes:
 *   "flowchart"    → dagre-based node/edge layout (original)
 *   "explanation"  → zone/section cards with bullets + arrows
 */
export function generateDiagramShapes(intent) {
    if (intent.intent_type === 'non_visual' || !intent.graph) {
        return [];
    }

    // Route explanation diagrams to dedicated renderer
    const diagramMode = intent.graph.diagramMode || 'flowchart';
    if (diagramMode === 'explanation') {
        return renderExplanationDiagram(intent);
    }

    // --- EXISTING: Flowchart / Dagre Output Handling ---
    const nodes = intent.graph.nodes || [];
    const edges = intent.graph.edges || [];
    const rankdir = intent.graph.direction || 'TB';

    if (!nodes || nodes.length === 0) return [];

    const parentMap = buildParentMap(nodes);

    let rootResult;
    try {
        rootResult = layoutGraphRecursive(nodes, edges, parentMap, rankdir);
    } catch (e) {
        console.error('Dagre Recursive Layout Error:', e);
        return [];
    }

    const shapes = [];
    const nodeDataMap = new Map(); // Absolute rawId -> {x, y, w, h, groupShape}
    const allDagreEdges = []; // Collect all edge paths recursively to draw arrows correctly

    function extractShapes(layouts, edgePaths, parentX, parentY) {
        layouts.forEach(l => {
            const absX = parentX + l.x;
            const absY = parentY + l.y;

            if (l.type === 'group' && l.childrenRes) {
                const groupContainer = createGroupContainerShape(l.id, l.label, absX, absY, l.w, l.h);
                shapes.push(groupContainer);
                nodeDataMap.set(l.id, { x: absX, y: absY, w: l.w, h: l.h, groupShape: groupContainer });

                // Map child centers: relative to subgroup center (l.childrenRes.cx, cy)
                extractShapes(
                    l.childrenRes.layouts,
                    l.childrenRes.edgePaths,
                    absX - l.childrenRes.cx,
                    absY - l.childrenRes.cy
                );
            } else {
                // Standard built-in shape creation (rectangle, diamond, etc.)
                const nodeShape = createNodeShape(l.id, l.label, absX, absY, l.type, l.w, l.h);
                shapes.push(nodeShape);
                nodeDataMap.set(l.id, { x: absX, y: absY, w: l.w, h: l.h, groupShape: nodeShape });
            }
        });

        if (edgePaths) {
            edgePaths.forEach(ep => {
                allDagreEdges.push({
                    ...ep,
                    // Translate local dagre coordinates to absolute global space
                    points: ep.points.map(p => ({ x: p.x + parentX, y: p.y + parentY }))
                });
            });
        }
    }

    // Start with parent absolute center at (0, 0) for the root graph center
    extractShapes(rootResult.layouts, rootResult.edgePaths, -rootResult.cx, -rootResult.cy);

    // ── Pre-compute Anchor Staggering ────────────────────────────────────────
    // For edges landing on the exact same face of a node, stagger them slightly
    const anchorUsage = new Map(); // "nodeId:anchorType" -> array of edge IDs

    edges.forEach((edge, i) => {
        const srcData = nodeDataMap.get(edge.from);
        const tgtData = nodeDataMap.get(edge.to);
        if (!srcData || !tgtData) return;

        // Very basic mock detect to find anchor face
        const dx = tgtData.x - srcData.x;
        const dy = tgtData.y - srcData.y;
        const srcAnchor = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "bottom" : "top");
        const tgtAnchor = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "left" : "right") : (dy > 0 ? "top" : "bottom");

        const srcKey = `${edge.from}:${srcAnchor}`;
        const tgtKey = `${edge.to}:${tgtAnchor}`;

        if (!anchorUsage.has(srcKey)) anchorUsage.set(srcKey, []);
        if (!anchorUsage.has(tgtKey)) anchorUsage.set(tgtKey, []);

        anchorUsage.get(srcKey).push(`src-${i}`);
        anchorUsage.get(tgtKey).push(`tgt-${i}`);
    });

    const ARROW_STAGGER_PX = 15;

    // ── Route Edges ──────────────────────────────────────────────────────────
    edges.forEach((edge, i) => {
        const srcData = nodeDataMap.get(edge.from);
        const tgtData = nodeDataMap.get(edge.to);
        if (!srcData || !tgtData) return;

        // Determine stagger offsets based on connection index
        const dx = tgtData.x - srcData.x;
        const dy = tgtData.y - srcData.y;
        const srcAnchor = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "bottom" : "top");
        const tgtAnchor = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "left" : "right") : (dy > 0 ? "top" : "bottom");

        const srcKey = `${edge.from}:${srcAnchor}`;
        const tgtKey = `${edge.to}:${tgtAnchor}`;

        const srcArr = anchorUsage.get(srcKey) || [];
        const tgtArr = anchorUsage.get(tgtKey) || [];

        const srcIndex = srcArr.indexOf(`src-${i}`);
        const tgtIndex = tgtArr.indexOf(`tgt-${i}`);

        // Center the stagger around 0
        const srcOffset = srcArr.length > 1 ? (srcIndex - (srcArr.length - 1) / 2) * ARROW_STAGGER_PX : 0;
        const tgtOffset = tgtArr.length > 1 ? (tgtIndex - (tgtArr.length - 1) / 2) * ARROW_STAGGER_PX : 0;

        // For Horizontal anchors (left/right) stagger Y. For Vertical anchors (top/bottom) stagger X.
        const srcMod = { x: (srcAnchor === 'top' || srcAnchor === 'bottom') ? srcOffset : 0, y: (srcAnchor === 'left' || srcAnchor === 'right') ? srcOffset : 0 };
        const tgtMod = { x: (tgtAnchor === 'top' || tgtAnchor === 'bottom') ? tgtOffset : 0, y: (tgtAnchor === 'left' || tgtAnchor === 'right') ? tgtOffset : 0 };

        // Attempt to find Dagre's detailed edge path
        const dagreEdge = allDagreEdges.find(de => de.index === i);

        /**
         * Route decision:
         *   - If source and target are roughly aligned (within 40px on either axis),
         *     use a STRAIGHT arrow — looks clean for direct TB/LR flows.
         *   - If the Dagre path is essentially straight (only 2-3 colinear pts), simplify.
         *   - Otherwise use the elbow (orthogonal) route from smartArrow.
         */
        const absDx = Math.abs(tgtData.x - srcData.x);
        const absDy = Math.abs(tgtData.y - srcData.y);
        const isAligned = absDx < 40 || absDy < 40; // nearly same column or row

        const startPt = { x: srcData.x + srcMod.x, y: srcData.y + srcMod.y };
        const endPt = { x: tgtData.x + tgtMod.x, y: tgtData.y + tgtMod.y };
        let relativePoints;

        if (isAligned) {
            // Straight line — cleanest look for aligned nodes
            relativePoints = [
                { x: 0, y: 0 },
                { x: endPt.x - startPt.x, y: endPt.y - startPt.y }
            ];
        } else if (dagreEdge && dagreEdge.points && dagreEdge.points.length >= 2) {
            // Check if Dagre points are essentially colinear → collapse to straight
            const rawPts = dagreEdge.points;
            const isColinear = rawPts.every(p =>
                Math.abs(p.x - rawPts[0].x) < 10 || Math.abs(p.y - rawPts[0].y) < 10
            );

            if (isColinear) {
                relativePoints = [
                    { x: 0, y: 0 },
                    { x: endPt.x - startPt.x, y: endPt.y - startPt.y }
                ];
            } else {
                // True elbow: use Dagre waypoints, snapped to our staggered anchors
                const snappedPts = [...rawPts];
                snappedPts[0] = startPt;
                snappedPts[snappedPts.length - 1] = endPt;
                relativePoints = snappedPts.map(p => ({
                    x: p.x - startPt.x,
                    y: p.y - startPt.y
                }));
            }
        } else {
            // Fallback to smartArrow orthogonal routing
            const stubArrow = {
                id: crypto.randomUUID(),
                type: 'arrow',
                position: startPt,
                points: [{ x: 0, y: 0 }, { x: endPt.x - startPt.x, y: endPt.y - startPt.y }],
                size: { width: 1, height: 1 }
            };
            const tempRouted = routeArrow(stubArrow, srcData.groupShape, tgtData.groupShape, 'orthogonal');
            relativePoints = tempRouted.points;
        }

        const routedArrow = {
            id: crypto.randomUUID(),
            type: 'arrow',
            position: startPt,
            points: relativePoints,
            size: { width: 1, height: 1 },
            zIndex: -1,
            rotation: 0,
            scale: { x: 1, y: 1 },
            locked: false,
            visible: true,
            style: {
                stroke: HAND_STROKE,
                fill: 'transparent',
                strokeWidth: 2.5,
                opacity: 1,
                renderMode: 'vector',
                roughness: ARROW_ROUGHNESS,
                seed: stableIntHash(edge.from + '->' + edge.to)
            },
            revision: { number: 1, timestamp: Date.now() },
            arrow: { startHead: 'none', endHead: 'triangle' },
            bindings: {
                start: { elementId: srcData.groupShape.id, anchor: 'center' },
                end: { elementId: tgtData.groupShape.id, anchor: 'center' }
            }
        };
        shapes.push(routedArrow);

        // Edge label
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

    return shapes;
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Explanation Diagram Renderer ─────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Color map matching the AI's color tokens to actual fills + strokes.
 * Pairs chosen so text is always readable on the fill.
 */
const EXPLANATION_COLORS = {
  blue:   { fill: '#dbeafe', stroke: '#3b82f6', text: '#1e3a8a', hdr: '#1d4ed8' },
  purple: { fill: '#ede9fe', stroke: '#7c3aed', text: '#3b0764', hdr: '#6d28d9' },
  teal:   { fill: '#ccfbf1', stroke: '#0d9488', text: '#134e4a', hdr: '#0f766e' },
  amber:  { fill: '#fef3c7', stroke: '#d97706', text: '#78350f', hdr: '#b45309' },
  coral:  { fill: '#fee2e2', stroke: '#ef4444', text: '#7f1d1d', hdr: '#dc2626' },
  green:  { fill: '#dcfce7', stroke: '#16a34a', text: '#14532d', hdr: '#15803d' },
  gray:   { fill: '#f1f5f9', stroke: '#64748b', text: '#1e293b', hdr: '#475569' },
};

const EXPL_SECTION_W  = 260;  // width of each section card
const EXPL_SECTION_PAD = 16;  // inner padding
const EXPL_HDR_H      = 42;   // header bar height
const EXPL_ITEM_H     = 36;   // height per bullet item (generous to prevent wrap/overlap)
const EXPL_GAP        = 70;   // gap between sections (for arrows)
const EXPL_TITLE_H    = 44;   // diagram title height above sections

/**
 * Compute section card height from its items count.
 */
function sectionCardHeight(section) {
  const items = section.items || [];
  return EXPL_HDR_H + items.length * EXPL_ITEM_H + EXPL_SECTION_PAD * 2;
}

/**
 * Build a single section card shape group.
 * cx, cy = absolute center of the card.
 */
function createExplanationSection(section, cx, cy) {
  const colors = EXPLANATION_COLORS[section.color] || EXPLANATION_COLORS.gray;
  const items  = section.items || [];
  const cardH  = sectionCardHeight(section);
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
    style: {
      ...defaultShapeProps.style,
      fill: colors.fill,
      stroke: colors.stroke,
      strokeWidth: 1.5,
      roughness: 0.6,
      seed: stableIntHash(bgId),
    },
  });

  // Header strip
  const hdrId = crypto.randomUUID();
  children.push({
    ...defaultShapeProps,
    id: hdrId,
    type: 'rectangle',
    position: { x: 0, y: -cardH / 2 + EXPL_HDR_H / 2 },
    size: { width: EXPL_SECTION_W, height: EXPL_HDR_H },
    style: {
      ...defaultShapeProps.style,
      fill: colors.hdr,
      stroke: 'transparent',
      strokeWidth: 0,
      roughness: 0,
      seed: stableIntHash(hdrId),
    },
  });

  // Header title text
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

/**
 * Renders an explanation diagram from AI JSON.
 * Supports horizontal (L→R) and vertical (T→B) layouts.
 * Returns flat array of Infinity Canvas shapes.
 */
export function renderExplanationDiagram(intent) {
  if (!intent || !intent.graph) return [];
  const data = intent.graph;

  const sections    = data.sections    || [];
  const connections = data.connections || [];
  const layout      = data.layout      || 'horizontal';
  const title       = data.title       || '';

  if (sections.length === 0) return [];

  const shapes  = [];
  const posMap  = new Map(); // section id → { cx, cy, cardH }

  const isHoriz = layout !== 'vertical' && layout !== 'layered';

  // ── Position each section card ─────────────────────────────────────────────
  // For horizontal: cards side by side, all vertically centered at cy=0
  // For vertical:   cards stacked top-to-bottom, all horizontally centered at cx=0

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

    // Title above
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
    // Vertical layout
    let curY = 0;
    const totalH = sections.reduce((sum, s) => sum + sectionCardHeight(s) + EXPL_GAP, -EXPL_GAP);
    curY = -totalH / 2;

    sections.forEach((sec) => {
      const cardH = sectionCardHeight(sec);
      const cx = 0;
      const cy = curY + cardH / 2;
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

  // ── Draw connection arrows ─────────────────────────────────────────────────
  connections.forEach(conn => {
    const src = posMap.get(conn.from);
    const tgt = posMap.get(conn.to);
    if (!src || !tgt) return;

    let x1, y1, x2, y2;

    if (isHoriz) {
      // Connect right edge of src → left edge of tgt
      x1 = src.cx + EXPL_SECTION_W / 2;
      y1 = src.cy;
      x2 = tgt.cx - EXPL_SECTION_W / 2;
      y2 = tgt.cy;
    } else {
      // Connect bottom edge of src → top edge of tgt
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

    // Connection label
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