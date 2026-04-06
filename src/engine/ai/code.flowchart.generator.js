/**
 * code.flowchart.generator.js
 * Converts a code_flowchart AI intent into Infinity Canvas shapes.
 * Uses dagre for layout. Each node type maps to a distinctive shape + color.
 */

import dagre from 'dagre';

const HAND_FONT   = 'Caveat';
const ROUGHNESS   = 1.2;
const ARROW_ROUGH = 0.3;

// ── Colors per node type ────────────────────────────────────────────────────
const TYPE_STYLE = {
  terminal:    { fill: '#e2e8f0', stroke: '#475569', text: '#0f172a' }, // gray pill
  process:     { fill: '#dbeafe', stroke: '#2563eb', text: '#1e3a8a' }, // blue rect
  decision:    { fill: '#ede9fe', stroke: '#7c3aed', text: '#3b0764' }, // purple diamond
  loop_init:   { fill: '#ccfbf1', stroke: '#0d9488', text: '#134e4a' }, // teal rect
  loop_update: { fill: '#ccfbf1', stroke: '#0d9488', text: '#134e4a' }, // teal rect
  io:          { fill: '#fef3c7', stroke: '#d97706', text: '#78350f' }, // amber parallelogram
  subprocess:  { fill: '#dcfce7', stroke: '#16a34a', text: '#14532d' }, // green double-rect
};

// ── Canonical size per node type ────────────────────────────────────────────
const TYPE_SIZE = {
  terminal:    { w: 200, h: 52 },
  process:     { w: 200, h: 64 },
  decision:    { w: 200, h: 100 },
  loop_init:   { w: 200, h: 56 },
  loop_update: { w: 200, h: 56 },
  io:          { w: 200, h: 64 },
  subprocess:  { w: 200, h: 64 },
};

// ── Shape type mapping ───────────────────────────────────────────────────────
const TYPE_SHAPE = {
  terminal:    'ellipse',
  process:     'rectangle',
  decision:    'diamond',
  loop_init:   'rectangle',
  loop_update: 'rectangle',
  io:          'parallelogram',
  subprocess:  'rectangle',
};

function uid()  { return crypto.randomUUID(); }
function hash(s) {
  let h = 0xdeadbeef;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
  return ((h ^ (h >>> 16)) >>> 0);
}
function base(id) {
  return { id, rotation: 0, scale: { x: 1, y: 1 }, locked: false, visible: true, revision: { number: 1, timestamp: Date.now() } };
}

function makeShape(id, type, cx, cy, w, h, fill, stroke) {
  return {
    ...base(id), type, zIndex: 0,
    position: { x: cx, y: cy },
    size: { width: w, height: h },
    style: { stroke, fill, strokeWidth: 2, opacity: 1, renderMode: 'vector', roughness: ROUGHNESS, seed: hash(id), fillStyle: 'solid' },
  };
}

function makeText(id, cx, cy, w, h, text, color, size = 14) {
  return {
    ...base(id), type: 'text', text, zIndex: 1,
    position: { x: cx, y: cy },
    size: { width: Math.max(w - 16, 60), height: Math.max(h, 24) },
    font: { family: HAND_FONT, size, weight: '700', align: 'center' },
    // stroke = text color (canvas engine uses stroke for text rendering)
    style: { stroke: color, fill: color, strokeWidth: 0, opacity: 1, renderMode: 'vector', roughness: 0, seed: hash(text + id), fillStyle: 'solid' },
  };
}

function makeGroup(gid, cx, cy, w, h, children) {
  return {
    ...base(gid), type: 'group', zIndex: 1,
    position: { x: cx, y: cy },
    size: { width: w, height: h },
    style: { stroke: 'transparent', strokeWidth: 0, fill: 'transparent', opacity: 1, renderMode: 'vector', roughness: 0, seed: hash(gid), fillStyle: 'solid' },
    children,
  };
}

function makeArrow(id, sx, sy, ex, ey, label = '', isBack = false, color = '#334155') {
  const shapes = [];
  const arrowId = uid();
  shapes.push({
    ...base(arrowId), type: 'arrow', zIndex: -1,
    position: { x: sx, y: sy },
    points: [{ x: 0, y: 0 }, { x: ex - sx, y: ey - sy }],
    size: { width: 1, height: 1 },
    style: {
      stroke: isBack ? '#ef4444' : color,
      fill: 'transparent', strokeWidth: 2, opacity: 0.9,
      renderMode: 'vector', roughness: ARROW_ROUGH,
      seed: hash(`${sx}${sy}${ex}${ey}`), fillStyle: 'solid',
      strokeStyle: isBack ? 'dashed' : 'solid',
    },
    arrow: { startHead: 'none', endHead: 'triangle' },
  });
  if (label) {
    const lx = (sx + ex) / 2;
    const ly = (sy + ey) / 2 - 12;
    shapes.push(makeText(uid(), lx, ly, 80, 20, label, isBack ? '#ef4444' : '#334155', 12));
  }
  return shapes;
}

/**
 * Main entry point.
 * @param {object} intent - { intent_type: 'code_flowchart', code_flowchart: { nodes, edges, title, ... } }
 */
export function generateCodeFlowchartShapes(intent) {
  if (!intent?.code_flowchart) return [];
  const { nodes = [], edges = [], title = '' } = intent.code_flowchart;
  if (!nodes.length) return [];

  // ── Dagre layout ───────────────────────────────────────────────────────────
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 60, marginx: 60, marginy: 60 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach(n => {
    const sz = TYPE_SIZE[n.type] || TYPE_SIZE.process;
    g.setNode(n.id, { width: sz.w, height: sz.h });
  });

  // Only add forward edges to dagre (back-edges break layout)
  edges.forEach(e => {
    if (!e.isBackEdge) g.setEdge(e.from, e.to, {});
  });

  dagre.layout(g);

  // ── Bounding box / centering ───────────────────────────────────────────────
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(n => {
    const dn = g.node(n.id); if (!dn) return;
    const sz = TYPE_SIZE[n.type] || TYPE_SIZE.process;
    minX = Math.min(minX, dn.x - sz.w / 2); minY = Math.min(minY, dn.y - sz.h / 2);
    maxX = Math.max(maxX, dn.x + sz.w / 2); maxY = Math.max(maxY, dn.y + sz.h / 2);
  });
  const offX = -(minX + maxX) / 2;
  const offY = -(minY + maxY) / 2 + (title ? 36 : 0);

  // ── Build node shapes ──────────────────────────────────────────────────────
  const allShapes = [];
  const posMap = new Map(); // nodeId → {cx, cy, w, h}

  if (title) {
    const titleW = Math.max(400, maxX - minX + 80);
    allShapes.push(makeText(uid(), 0, minY + offY - 48, titleW, 36, title, '#0f172a', 20));
  }

  nodes.forEach(n => {
    const dn = g.node(n.id); if (!dn) return;
    const sz = TYPE_SIZE[n.type] || TYPE_SIZE.process;
    const style = TYPE_STYLE[n.type] || TYPE_STYLE.process;
    const shapeType = TYPE_SHAPE[n.type] || 'rectangle';
    const cx = dn.x + offX;
    const cy = dn.y + offY;

    posMap.set(n.id, { cx, cy, w: sz.w, h: sz.h });

    const shpId = uid();
    const txtId = uid();

    // subprocess gets a double-border indicator
    const strokeW = n.type === 'subprocess' ? 3 : 2;
    const shp = makeShape(shpId, shapeType, 0, 0, sz.w, sz.h, style.fill, style.stroke);
    shp.style.strokeWidth = strokeW;

    const txt = makeText(txtId, 0, 0, sz.w, sz.h, n.label || '', style.text, 13);

    const gid = uid();
    allShapes.push(makeGroup(gid, cx, cy, sz.w, sz.h, [shp, txt]));
  });

  // ── Draw arrows ────────────────────────────────────────────────────────────
  edges.forEach(e => {
    const src = posMap.get(e.from);
    const tgt = posMap.get(e.to);
    if (!src || !tgt) return;

    const sx = src.cx;
    const sy = e.isBackEdge ? src.cy - src.h / 2 : src.cy + src.h / 2;
    const ex = tgt.cx;
    const ey = e.isBackEdge ? tgt.cy - tgt.h / 2 - 10 : tgt.cy - tgt.h / 2;

    makeArrow(uid(), sx, sy, ex, ey, e.label || '', e.isBackEdge)
      .forEach(s => allShapes.push(s));
  });

  // ── Wrap in outer group ────────────────────────────────────────────────────
  const PAD = 80;
  const totalW = (maxX - minX) + PAD * 2;
  const totalH = (maxY - minY) + PAD * 2 + (title ? 50 : 0);
  const wid = uid();
  return [{
    ...base(wid), type: 'group', zIndex: 0,
    position: { x: 0, y: 0 },
    size: { width: totalW, height: totalH },
    style: { stroke: 'transparent', strokeWidth: 0, fill: 'transparent', opacity: 1, renderMode: 'vector', roughness: 0, seed: hash(wid), fillStyle: 'solid' },
    children: allShapes,
  }];
}
