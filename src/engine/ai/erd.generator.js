/**
 * erd.generator.js  (improved)
 * Generates Entity-Relationship Diagram shapes for the Infinity Canvas.
 * NOTE: Canvas engine uses CENTER-BASED positioning for all shapes.
 * Arrows use smart orthogonal routing based on actual dagre positions.
 */

import dagre from 'dagre';

const HAND_FONT = 'Caveat';
const HAND_STROKE = '#000000';

const ENTITY_W = 230;
const HEADER_H = 46;
const FIELD_H = 32;
const RANKSEP = 220;
const NODESEP = 140;

// ── Color palette ─────────────────────────────────────────────────────────────
const ENTITY_COLORS = {
    primary: { header: '#1D4ED8', border: '#1E3A8A' }, // blue   – core tables
    secondary: { header: '#6D28D9', border: '#4C1D95' }, // purple – lookup/reference
    accent: { header: '#0E7490', border: '#164E63' }, // cyan   – junction/bridge
    neutral: { header: '#374151', border: '#1F2937' }, // gray   – audit/log
};
const FALLBACK_COLORS = [
    ENTITY_COLORS.primary,
    ENTITY_COLORS.secondary,
    ENTITY_COLORS.accent,
    ENTITY_COLORS.neutral,
];

const PK_ROW_BG = '#FEF3C7'; // amber tint  – primary key rows
const FK_ROW_BG = '#ECFDF5'; // green tint  – foreign key rows
const ROW_BG_A = '#F8FAFC';
const ROW_BG_B = '#F1F5F9';
const BORDER_F = '#E2E8F0';

const ARROW_COLORS = {
    'one-to-many': '#3B82F6', // blue
    'many-to-many': '#8B5CF6', // purple
    'one-to-one': '#10B981', // green
};
const ARROW_FALLBACK = '#6366F1';

const TITLE_CLR = '#0F172A';

// ─────────────────────────────────────────────────────────────────────────────

function uid() { return crypto.randomUUID(); }
function sh(s) {
    let h = 0xdeadbeef;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
    return ((h ^ (h >>> 16)) >>> 0);
}
function base(id) {
    return { id, rotation: 0, scale: { x: 1, y: 1 }, locked: false, visible: true, revision: { number: 1, timestamp: Date.now() } };
}

function makeRect(cx, cy, w, h, fill, stroke, roughness = 0) {
    const id = uid();
    return {
        ...base(id), type: 'rectangle', zIndex: 0,
        position: { x: cx, y: cy },
        size: { width: w, height: h },
        style: { stroke, fill, strokeWidth: 1.5, opacity: 1, renderMode: 'vector', roughness, seed: sh(id), fillStyle: 'solid' },
    };
}

function makeText(cx, cy, w, h, text, color, size = 14, weight = '600', align = 'center') {
    const id = uid();
    return {
        ...base(id), type: 'text', text, zIndex: 1,
        // position is CENTER of the bounding box (same convention as rects)
        position: { x: cx, y: cy },
        size: { width: w - 10, height: h },
        font: { family: HAND_FONT, size, weight, align, verticalAlign: 'middle' },
        style: { stroke: HAND_STROKE, fill: color, strokeWidth: 0, opacity: 1, renderMode: 'vector', roughness: 0, seed: sh(text + id), fillStyle: 'solid' },
    };
}

/**
 * Smart orthogonal arrow.
 * Detects dominant direction (horizontal vs vertical) from actual positions,
 * then routes the connector along the shortest non-overlapping path.
 *
 *  Horizontal neighbors  →  right-edge → left-edge   (Z-route via X midpoint)
 *  Vertical neighbors    →  bottom-edge → top-edge   (Z-route via Y midpoint)
 *  Diagonal              →  routes along dominant axis first
 */
function makeSmartArrow(x1, y1, x2, y2, srcH, tgtH, label = '', color = ARROW_FALLBACK) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const shapes = [];
    const id = uid();

    let points;

    if (horizontal) {
        // Connect: right edge of src → left edge of tgt
        const sx = x1 + ENTITY_W / 2;
        const sy = y1;
        const ex = x2 - ENTITY_W / 2;
        const ey = y2;
        const mx = (sx + ex) / 2;
        points = [
            { x: 0, y: 0 },  // right edge of src
            { x: mx - sx, y: 0 },  // go right to midpoint X
            { x: mx - sx, y: ey - sy },  // go vertically
            { x: ex - sx, y: ey - sy },  // go right to left edge of tgt
        ];
        shapes.push({
            ...base(id), type: 'arrow', zIndex: -1,
            position: { x: sx, y: sy },
            points,
            size: { width: 1, height: 1 },
            style: { stroke: color, fill: 'transparent', strokeWidth: 2, opacity: 0.9, renderMode: 'vector', roughness: 0.2, seed: sh(`${sx}${sy}${ex}${ey}`), fillStyle: 'solid' },
            arrow: { startHead: 'none', endHead: 'triangle' },
        });
        if (label) {
            shapes.push(makeText(mx, (sy + y2) / 2 - 14, 48, 24, label, color, 14, '700', 'center'));
        }
    } else {
        // Connect: bottom edge of src → top edge of tgt
        const sx = x1;
        const sy = y1 + srcH / 2;
        const ex = x2;
        const ey = y2 - tgtH / 2;
        const my = (sy + ey) / 2;
        points = [
            { x: 0, y: 0 },  // bottom edge of src
            { x: 0, y: my - sy },  // go down to midpoint Y
            { x: ex - sx, y: my - sy },  // go horizontally
            { x: ex - sx, y: ey - sy },  // go down to top edge of tgt
        ];
        shapes.push({
            ...base(id), type: 'arrow', zIndex: -1,
            position: { x: sx, y: sy },
            points,
            size: { width: 1, height: 1 },
            style: { stroke: color, fill: 'transparent', strokeWidth: 2, opacity: 0.9, renderMode: 'vector', roughness: 0.2, seed: sh(`${sx}${sy}${ex}${ey}`), fillStyle: 'solid' },
            arrow: { startHead: 'none', endHead: 'triangle' },
        });
        if (label) {
            shapes.push(makeText((sx + ex) / 2, my - 14, 48, 24, label, color, 14, '700', 'center'));
        }
    }

    return shapes;
}

/**
 * Build entity box children (positions relative to group center 0,0).
 */
function buildEntityChildren(entity, colorScheme) {
    const fields = entity.fields || [];
    const boxH = HEADER_H + fields.length * FIELD_H;
    const children = [];
    const { header: HEADER_BG, border: BORDER_H } = colorScheme;

    const headerCY = -boxH / 2 + HEADER_H / 2;
    children.push(makeRect(0, headerCY, ENTITY_W, HEADER_H, HEADER_BG, BORDER_H, 0.4));
    // Text cx=0 (horizontally centered), cy=headerCY (same center as rect), full HEADER_H height
    children.push(makeText(0, headerCY, ENTITY_W, HEADER_H, entity.name, '#FFFFFF', 17, '700', 'center'));

    fields.forEach((field, fi) => {
        const rowTopY = -boxH / 2 + HEADER_H + fi * FIELD_H;
        const rowCY = rowTopY + FIELD_H / 2;
        const bg = field.isPrimary ? PK_ROW_BG : field.isForeign ? FK_ROW_BG : fi % 2 === 0 ? ROW_BG_A : ROW_BG_B;

        children.push(makeRect(0, rowCY, ENTITY_W, FIELD_H, bg, BORDER_F, 0));

        const prefix = field.isPrimary ? '🔑 ' : field.isForeign ? '🔗 ' : '     ';
        const label = `${prefix}${field.name}  :  ${field.type || ''}`.trim();
        // cx offset: shift right by half of left-pad so text is inset from left edge
        const LEFT_PAD = 12;
        children.push(makeText(LEFT_PAD / 2, rowCY, ENTITY_W - LEFT_PAD, FIELD_H, label, '#1E293B', 13, '600', 'left'));
    });

    return { children, boxH };
}

export function generateERDShapes(intent) {
    if (!intent || intent.intent_type !== 'erd' || !intent.erd) return [];
    const { title, entities = [], relationships = [] } = intent.erd;
    if (!entities.length) return [];

    // ── Dagre layout ────────────────────────────────────────────────────────────
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'LR', ranksep: RANKSEP, nodesep: NODESEP });
    g.setDefaultEdgeLabel(() => ({}));

    const heightMap = new Map();
    entities.forEach(e => {
        const h = HEADER_H + (e.fields || []).length * FIELD_H;
        heightMap.set(e.id, h);
        g.setNode(e.id, { width: ENTITY_W, height: h });
    });
    relationships.forEach(r => { if (r.from && r.to) g.setEdge(r.from, r.to); });
    dagre.layout(g);

    // ── Bounding box & centering offset ─────────────────────────────────────────
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    entities.forEach(e => {
        const n = g.node(e.id); if (!n) return;
        const h = heightMap.get(e.id);
        minX = Math.min(minX, n.x - ENTITY_W / 2); minY = Math.min(minY, n.y - h / 2);
        maxX = Math.max(maxX, n.x + ENTITY_W / 2); maxY = Math.max(maxY, n.y + h / 2);
    });
    const offX = -(minX + maxX) / 2;
    const offY = -(minY + maxY) / 2 + 40;

    // ── Build shapes ─────────────────────────────────────────────────────────────
    const allShapes = [];

    if (title) {
        const titleW = Math.max(400, maxX - minX + 80);
        allShapes.push(makeText(0, minY + offY - 52, titleW, 38, title, TITLE_CLR, 22, '700', 'center'));
    }

    // Assign colors: use entity.color token if provided, else cycle through palette
    const posMap = new Map();
    entities.forEach((entity, idx) => {
        const n = g.node(entity.id); if (!n) return;
        const cx = n.x + offX;
        const cy = n.y + offY;
        const h = heightMap.get(entity.id);
        posMap.set(entity.id, { cx, cy, h });

        const colorScheme = ENTITY_COLORS[entity.color] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
        const { children, boxH } = buildEntityChildren(entity, colorScheme);

        const gid = uid();
        allShapes.push({
            ...base(gid), type: 'group', zIndex: 1,
            position: { x: cx, y: cy },
            size: { width: ENTITY_W, height: boxH },
            style: { stroke: 'transparent', strokeWidth: 0, fill: 'transparent', opacity: 1, renderMode: 'vector', roughness: 0, seed: sh(gid), fillStyle: 'solid' },
            children,
            _entityId: entity.id, _cx: cx, _cy: cy, _h: boxH,
        });
    });

    // Relationship arrows
    relationships.forEach(rel => {
        const src = posMap.get(rel.from);
        const tgt = posMap.get(rel.to);
        if (!src || !tgt) return;

        const arrowColor = ARROW_COLORS[rel.type] ?? ARROW_FALLBACK;
        makeSmartArrow(src.cx, src.cy, tgt.cx, tgt.cy, src.h, tgt.h, rel.label || '', arrowColor)
            .forEach(s => allShapes.push(s));
    });

    // Wrap in top-level group
    const PAD = 80;
    const totalW = (maxX - minX) + PAD * 2;
    const totalH = (maxY - minY) + PAD * 2 + 70;
    const wid = uid();
    return [{
        ...base(wid), type: 'group', zIndex: 0,
        position: { x: 0, y: 0 },
        size: { width: totalW, height: totalH },
        style: { stroke: 'transparent', strokeWidth: 0, fill: 'transparent', opacity: 1, renderMode: 'vector', roughness: 0, seed: sh(wid), fillStyle: 'solid' },
        children: allShapes,
    }];
}