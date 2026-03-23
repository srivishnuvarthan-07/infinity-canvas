/**
 * erd.generator.js
 * Generates Entity-Relationship Diagram shapes for the Infinity Canvas.
 * NOTE: Canvas engine uses CENTER-BASED positioning for all shapes.
 * Arrows use orthogonal routing (right → down/up → right) to avoid overlapping entity boxes.
 */

import dagre from 'dagre';

const HAND_FONT = 'Caveat';
const HAND_STROKE = '#000000';

const ENTITY_W      = 230;
const HEADER_H      = 46;
const FIELD_H       = 32;
const RANKSEP       = 200;
const NODESEP       = 120;

const HEADER_BG   = '#3730a3';
const HEADER_TEXT = '#ffffff';
const PK_ROW_BG   = '#eef2ff';
const FK_ROW_BG   = '#fef9c3';
const ROW_BG_A    = '#ffffff';
const ROW_BG_B    = '#f8fafc';
const BORDER_H    = '#312e81';
const BORDER_F    = '#e2e8f0';
const ARROW_CLR   = '#6366f1';
const TITLE_CLR   = '#0f172a';

function uid() { return crypto.randomUUID(); }
function sh(s) {
    let h = 0xdeadbeef;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
    return ((h ^ (h >>> 16)) >>> 0);
}
function base(id) {
    return { id, rotation: 0, scale: { x: 1, y: 1 }, locked: false, visible: true, revision: { number: 1, timestamp: Date.now() } };
}

/** cx,cy = CENTER of shape (canvas engine convention) */
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
        position: { x: cx, y: cy },
        size: { width: w - 10, height: h },
        font: { family: HAND_FONT, size, weight, align },
        style: { stroke: HAND_STROKE, fill: color, strokeWidth: 0, opacity: 1, renderMode: 'vector', roughness: 0, seed: sh(text + id), fillStyle: 'solid' },
    };
}

/**
 * Orthogonal arrow: start → mid-X → mid-Y → end
 * Creates an L-shaped or Z-shaped path so arrows never pass through entity boxes.
 * Points are relative to start position.
 */
function makeOrthoArrow(x1, y1, x2, y2, label = '') {
    const id  = uid();
    const mid = (x1 + x2) / 2; // horizontal midpoint
    const dx  = x2 - x1;
    const dy  = y2 - y1;

    const shapes = [];
    shapes.push({
        ...base(id), type: 'arrow', zIndex: -1,
        position: { x: x1, y: y1 },
        points: [
            { x: 0,   y: 0   },   // start
            { x: mid - x1, y: 0   },  // go right to midpoint
            { x: mid - x1, y: dy  },  // go vertically
            { x: dx,  y: dy  },   // go right to target
        ],
        size: { width: 1, height: 1 },
        style: { stroke: ARROW_CLR, fill: 'transparent', strokeWidth: 2, opacity: 0.9, renderMode: 'vector', roughness: 0.3, seed: sh(`${x1}${y1}${x2}${y2}`), fillStyle: 'solid' },
        arrow: { startHead: 'none', endHead: 'triangle' },
    });

    if (label) {
        const tid = uid();
        shapes.push({
            ...base(tid), type: 'text', text: label, zIndex: 2,
            position: { x: mid, y: (y1 + y2) / 2 },
            size: { width: 48, height: 24 },
            font: { family: HAND_FONT, size: 14, weight: '700', align: 'center' },
            style: { stroke: HAND_STROKE, fill: ARROW_CLR, strokeWidth: 0, opacity: 1, renderMode: 'vector', roughness: 0, seed: sh(tid), fillStyle: 'solid' },
        });
    }
    return shapes;
}

/**
 * Build entity box children (all positions relative to group center 0,0).
 * Group size = (ENTITY_W, boxH).
 * Children positions use center-based coords relative to group center.
 */
function buildEntityChildren(entity) {
    const fields = entity.fields || [];
    const boxH   = HEADER_H + fields.length * FIELD_H;
    const children = [];

    // Header: center at (0, -boxH/2 + HEADER_H/2)
    const headerCY = -boxH / 2 + HEADER_H / 2;
    children.push(makeRect(0, headerCY, ENTITY_W, HEADER_H, HEADER_BG, BORDER_H, 0.5));
    children.push(makeText(0, headerCY, ENTITY_W, HEADER_H, entity.name, HEADER_TEXT, 17, '700', 'center'));

    // Field rows
    fields.forEach((field, fi) => {
        const rowTopY = -boxH / 2 + HEADER_H + fi * FIELD_H;
        const rowCY   = rowTopY + FIELD_H / 2; // center Y of this row
        const bg = field.isPrimary ? PK_ROW_BG : field.isForeign ? FK_ROW_BG : fi % 2 === 0 ? ROW_BG_A : ROW_BG_B;

        children.push(makeRect(0, rowCY, ENTITY_W, FIELD_H, bg, BORDER_F, 0));

        const prefix = field.isPrimary ? '🔑 ' : field.isForeign ? '🔗 ' : '    ';
        const label  = `${prefix}${field.name}  :  ${field.type || ''}`.trim();
        // Left-align: shift text center left by adjusting x
        children.push(makeText(5, rowCY, ENTITY_W - 8, FIELD_H, label, '#1e293b', 13, '600', 'left'));
    });

    return { children, boxH };
}

export function generateERDShapes(intent) {
    if (!intent || intent.intent_type !== 'erd' || !intent.erd) return [];
    const { title, entities = [], relationships = [] } = intent.erd;
    if (!entities.length) return [];

    // ── Dagre layout ─────────────────────────────────────────────────────────
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

    // ── Compute bounding box & centering offset ───────────────────────────────
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    entities.forEach(e => {
        const n = g.node(e.id); if (!n) return;
        const h = heightMap.get(e.id);
        minX = Math.min(minX, n.x - ENTITY_W / 2); minY = Math.min(minY, n.y - h / 2);
        maxX = Math.max(maxX, n.x + ENTITY_W / 2); maxY = Math.max(maxY, n.y + h / 2);
    });
    const offX = -(minX + maxX) / 2;
    const offY = -(minY + maxY) / 2 + 40; // +40 to make room for title

    // ── Build shapes ─────────────────────────────────────────────────────────
    const allShapes = [];

    // Title text (above the diagram)
    if (title) {
        const titleW = Math.max(400, maxX - minX + 80);
        allShapes.push(makeText(0, minY + offY - 52, titleW, 38, title, TITLE_CLR, 22, '700', 'center'));
    }

    // Entity groups
    const posMap = new Map(); // entity id → { cx, cy, h }
    entities.forEach(entity => {
        const n = g.node(entity.id); if (!n) return;
        const cx = n.x + offX;
        const cy = n.y + offY;
        const h  = heightMap.get(entity.id);
        posMap.set(entity.id, { cx, cy, h });

        const { children, boxH } = buildEntityChildren(entity);
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

    // Relationship arrows (orthogonal, avoid entity bodies)
    relationships.forEach(rel => {
        const src = posMap.get(rel.from);
        const tgt = posMap.get(rel.to);
        if (!src || !tgt) return;

        // Connect right edge of source to left edge of target
        const x1 = src.cx + ENTITY_W / 2;
        const y1 = src.cy;
        const x2 = tgt.cx - ENTITY_W / 2;
        const y2 = tgt.cy;

        makeOrthoArrow(x1, y1, x2, y2, rel.label || '').forEach(s => allShapes.push(s));
    });

    // Wrap everything in one top-level group
    const PAD   = 80;
    const totalW = (maxX - minX) + PAD * 2;
    const totalH = (maxY - minY) + PAD * 2 + 70;
    const wid   = uid();
    return [{
        ...base(wid), type: 'group', zIndex: 0,
        position: { x: 0, y: 0 },
        size: { width: totalW, height: totalH },
        style: { stroke: 'transparent', strokeWidth: 0, fill: 'transparent', opacity: 1, renderMode: 'vector', roughness: 0, seed: sh(wid), fillStyle: 'solid' },
        children: allShapes,
    }];
}
