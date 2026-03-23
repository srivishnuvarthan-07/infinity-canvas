/**
 * DSA Visualizer — Shape Generator
 *
 * Converts AI-generated DSA JSON (from getDSAGraphJSON) into Infinity Canvas shapes.
 * This file is 100% independent of diagram.generator.js and does not touch
 * the Dagre / flowchart pipeline in any way.
 *
 * COORDINATE CONVENTION (matches CanvasRenderer):
 *   shape.position = the CENTER of the shape.
 *   Shapes are rendered centered at (0,0) after ctx.translate(position).
 *
 * Entry point: generateDSAShapes(dsaIntent)
 */

// ── Style constants ──────────────────────────────────────────────────────────
const HAND_FONT   = 'Caveat';
const HAND_STROKE = '#000000';
const ROUGHNESS   = 1.8;

// Colour palette
const C = {
  normal:      '#e0f2fe',
  highlight:   '#fbbf24',
  comparing:   '#f87171',
  sorted:      '#bbf7d0',
  treeNode:    '#bbf7d0',
  treeHL:      '#a78bfa',
  listNode:    '#fed7aa',
  stackItem:   '#e0f2fe',
  stackTop:    '#fbbf24',
  queueItem:   '#e0e7ff',
  queueFront:  '#6ee7b7',
  queueRear:   '#fca5a5',
  graphNode:   '#ddd6fe',
  hashBucket:  '#f1f5f9',
  hashChain:   '#fed7aa',
  dpEmpty:     '#f8fafc',
  dpFilled:    '#bbf7d0',
  dpHL:        '#fbbf24',
  stepBg:      '#fef3c7',
  stepText:    '#000000',
  titleText:   '#000000',
};

// Gap between the diagram's right edge and the legend panel
const LEGEND_GAP = 200;

// ── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return crypto.randomUUID(); }

function stableHash(str) {
  let h = 0xdeadbeef;
  for (let i = 0; i < str.length; i++)
    h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
  return ((h ^ (h >>> 16)) >>> 0);
}

const baseStyle = (overrides = {}) => ({
  stroke: HAND_STROKE,
  fill: 'transparent',
  strokeWidth: 2,
  opacity: 1,
  renderMode: 'vector',
  roughness: ROUGHNESS,
  fillStyle: 'solid',
  ...overrides,
});

const baseProps = (overrides = {}) => ({
  id: uid(),
  position: { x: 0, y: 0 },
  rotation: 0,
  scale: { x: 1, y: 1 },
  zIndex: 0,
  locked: false,
  visible: true,
  revision: { number: 1, timestamp: Date.now() },
  style: baseStyle(),
  ...overrides,
});

// ── Shape factories ──────────────────────────────────────────────────────────
// ALL positions below use CENTER coordinates.

/**
 * Create a labelled node: a group containing a shape + centered text label.
 * position (cx, cy) = absolute center of the node.
 */
function makeNode(cx, cy, w, h, label, shapeType = 'rectangle', fill = C.normal) {
  const groupId = uid();
  const shapeId = uid();
  const textId  = uid();

  const shapeChild = {
    ...baseProps({
      id: shapeId,
      type: shapeType,
      position: { x: 0, y: 0 },        // relative to group center
      size: { width: w, height: h },
      style: baseStyle({ fill, seed: stableHash(shapeId) }),
    }),
  };

  const textChild = {
    ...baseProps({
      id: textId,
      type: 'text',
      position: { x: 0, y: 0 },        // relative to group center
      size: { width: w - 10, height: h },
      style: baseStyle({
        stroke: HAND_STROKE,
        fill: HAND_STROKE,
        strokeWidth: 0,
        roughness: 0,
        seed: 0,
      }),
    }),
    text: String(label),
    font: {
      family: HAND_FONT,
      size: 14,
      weight: '600',
      align: 'center',
    },
  };

  return {
    ...baseProps({
      id: groupId,
      type: 'group',
      position: { x: cx, y: cy },       // absolute center
      size: { width: w, height: h },
      style: baseStyle({ stroke: 'transparent', strokeWidth: 0 }),
    }),
    children: [shapeChild, textChild],
  };
}

/**
 * Standalone text shape (for labels, titles, legends).
 * position = absolute CENTER of the text bounding box.
 */
function makeText(cx, cy, w, h, text, opts = {}) {
  const color = opts.color || HAND_STROKE;
  return {
    ...baseProps({
      type: 'text',
      position: { x: cx, y: cy },
      size: { width: w, height: h },
      style: baseStyle({
        stroke: color,
        fill: color,
        strokeWidth: 0,
        roughness: 0,
        seed: 0,
      }),
    }),
    text,
    font: {
      family: HAND_FONT,
      size: opts.fontSize || 14,
      weight: opts.bold ? '700' : '600',
      align: opts.align || 'center',
    },
  };
}

/**
 * Arrow from (x1,y1) to (x2,y2). Optionally with a label.
 * Returns an array of shapes (arrow + optional label).
 */
function makeArrow(x1, y1, x2, y2, label = '') {
  const id = uid();
  const shapes = [];
  shapes.push({
    ...baseProps({
      id,
      type: 'arrow',
      position: { x: x1, y: y1 },
      points: [{ x: 0, y: 0 }, { x: x2 - x1, y: y2 - y1 }],
      size: { width: 1, height: 1 },
      zIndex: -1,
      style: baseStyle({
        strokeWidth: 2,
        roughness: 0.3,
        seed: stableHash(id),
      }),
    }),
    arrow: { startHead: 'none', endHead: 'triangle' },
  });
  if (label) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2 - 14;
    shapes.push(makeText(mx, my, 50, 16, label, { fontSize: 12 }));
  }
  return shapes;
}

/**
 * Simple connecting line (no arrowhead). position = start point.
 */
function makeLine(x1, y1, x2, y2) {
  const id = uid();
  return {
    ...baseProps({
      id,
      type: 'line',
      position: { x: x1, y: y1 },
      points: [{ x: 0, y: 0 }, { x: x2 - x1, y: y2 - y1 }],
      size: { width: 1, height: 1 },
      style: baseStyle({
        stroke: '#94a3b8',
        strokeWidth: 1.5,
        roughness: 0.5,
        seed: stableHash(id),
      }),
    }),
  };
}

// ── Title ────────────────────────────────────────────────────────────────────

function makeTitle(cx, cy, title) {
  return makeText(cx, cy, 400, 28, title, {
    fontSize: 22, bold: true, color: C.titleText,
  });
}

// ── Step legend ──────────────────────────────────────────────────────────────

function makeStepLegend(steps, cx, topY) {
  if (!steps || steps.length === 0) return [];
  const shapes = [];
  const ITEM_H = 30;
  const W = 260;
  const PAD = 10;
  const totalH = steps.length * ITEM_H + PAD * 2;

  // Background panel
  const panelId = uid();
  shapes.push({
    ...baseProps({
      id: panelId,
      type: 'rectangle',
      position: { x: cx, y: topY + totalH / 2 },
      size: { width: W, height: totalH },
      style: baseStyle({ fill: C.stepBg, roughness: 0.8, strokeWidth: 1, seed: stableHash(panelId) }),
    }),
  });

  // "Steps" header
  shapes.push(makeText(cx, topY - 14, W, 20, 'Steps', {
    fontSize: 15, bold: true, color: C.titleText,
  }));

  // Left-aligned text: position at the LEFT EDGE of the panel
  // (the renderer treats position.x as the anchor for textAlign)
  const leftEdge = cx - W / 2 + PAD;
  steps.forEach((step, i) => {
    const y = topY + PAD + i * ITEM_H + ITEM_H / 2;
    shapes.push(makeText(leftEdge, y, W - PAD * 2, ITEM_H - 6,
      `${i + 1}. ${step}`, { fontSize: 12, color: C.stepText, align: 'left' }));
  });
  return shapes;
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Structure Renderers ──────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ── 1. Array ─────────────────────────────────────────────────────────────────
function renderArray(dsa) {
  const shapes = [];
  const items = dsa.structure?.items || [];
  const CELL_W = 64, CELL_H = 52;
  const totalW = items.length * CELL_W;
  const startX = -(totalW - CELL_W) / 2;

  shapes.push(makeTitle(0, -CELL_H / 2 - 44, dsa.title || 'Array'));

  items.forEach((item, i) => {
    const cx = startX + i * CELL_W;
    const fill = item.isHighlighted ? C.highlight
               : item.isComparing   ? C.comparing
               : C.normal;
    shapes.push(makeNode(cx, 0, CELL_W, CELL_H, item.value, 'rectangle', fill));
    // Index label below
    shapes.push(makeText(cx, CELL_H / 2 + 14, CELL_W, 18, String(i), {
      fontSize: 11, color: '#334155',
    }));
  });

  const legendX = startX + totalW + LEGEND_GAP;
  shapes.push(...makeStepLegend(dsa.steps, legendX, -CELL_H / 2 - 14));
  return shapes;
}

// ── 2. Linked List ───────────────────────────────────────────────────────────
function renderLinkedList(dsa) {
  const shapes = [];
  const nodes = dsa.structure?.nodes || [];
  const NODE_W = 80, NODE_H = 50, GAP = 60;
  const totalW = nodes.length * (NODE_W + GAP) - GAP;
  const startX = -(totalW - NODE_W) / 2;

  shapes.push(makeTitle(0, -NODE_H / 2 - 44, dsa.title || 'Linked List'));

  // HEAD label
  if (nodes.length > 0) {
    shapes.push(makeText(startX, -NODE_H / 2 - 20, NODE_W, 18, 'HEAD', {
      fontSize: 12, bold: true, color: '#0ea5e9',
    }));
  }

  const nodePositions = {};
  nodes.forEach((node, i) => {
    const cx = startX + i * (NODE_W + GAP);
    nodePositions[node.id] = { cx, cy: 0 };
    shapes.push(makeNode(cx, 0, NODE_W, NODE_H, node.value, 'rectangle', C.listNode));
  });

  // Arrows between nodes
  nodes.forEach(node => {
    if (node.next && nodePositions[node.next]) {
      const from = nodePositions[node.id];
      const to = nodePositions[node.next];
      shapes.push(...makeArrow(
        from.cx + NODE_W / 2, from.cy,
        to.cx - NODE_W / 2, to.cy
      ));
    } else if (!node.next) {
      const pos = nodePositions[node.id];
      shapes.push(makeText(pos.cx + NODE_W / 2 + 24, 0, 40, 20, 'null', {
        fontSize: 13, color: '#94a3b8', bold: true,
      }));
    }
  });

  const legendX = startX + totalW + LEGEND_GAP;
  shapes.push(...makeStepLegend(dsa.steps, legendX, -NODE_H / 2 - 14));
  return shapes;
}

// ── 3. Stack ─────────────────────────────────────────────────────────────────
function renderStack(dsa) {
  const shapes = [];
  const items = dsa.structure?.items || [];
  const topIdx = dsa.structure?.top ?? items.length - 1;
  const CELL_W = 120, CELL_H = 50;
  const totalH = items.length * CELL_H;

  shapes.push(makeTitle(0, -totalH / 2 - 44, dsa.title || 'Stack'));

  // Render bottom-to-top (items[0] = bottom)
  items.forEach((val, i) => {
    const cy = (totalH / 2 - CELL_H / 2) - i * CELL_H;
    const isTop = i === topIdx;
    const fill = isTop ? C.stackTop : C.stackItem;
    shapes.push(makeNode(0, cy, CELL_W, CELL_H, val, 'rectangle', fill));
    if (isTop) {
      shapes.push(makeText(CELL_W / 2 + 36, cy, 60, CELL_H, '← TOP', {
        fontSize: 12, bold: true, color: '#d97706',
      }));
    }
  });

  // Base line
  const baseY = totalH / 2 + 4;
  shapes.push(makeLine(-CELL_W / 2 - 4, baseY, CELL_W / 2 + 4, baseY));

  const legendX = CELL_W / 2 + LEGEND_GAP;
  shapes.push(...makeStepLegend(dsa.steps, legendX, -totalH / 2 - 14));
  return shapes;
}

// ── 4. Queue ─────────────────────────────────────────────────────────────────
function renderQueue(dsa) {
  const shapes = [];
  const items = dsa.structure?.items || [];
  const frontIdx = dsa.structure?.front ?? 0;
  const rearIdx = dsa.structure?.rear ?? items.length - 1;
  const CELL_W = 80, CELL_H = 52;
  const totalW = items.length * CELL_W;
  const startX = -(totalW - CELL_W) / 2;

  shapes.push(makeTitle(0, -CELL_H / 2 - 44, dsa.title || 'Queue'));

  items.forEach((val, i) => {
    const cx = startX + i * CELL_W;
    const fill = i === frontIdx ? C.queueFront
               : i === rearIdx  ? C.queueRear
               : C.queueItem;
    shapes.push(makeNode(cx, 0, CELL_W, CELL_H, val, 'rectangle', fill));
  });

  // FRONT / REAR labels
  if (items.length > 0) {
    const frontCX = startX + frontIdx * CELL_W;
    const rearCX  = startX + rearIdx  * CELL_W;
    shapes.push(makeText(frontCX, CELL_H / 2 + 14, CELL_W, 18, 'FRONT', {
      fontSize: 11, bold: true, color: '#059669',
    }));
    shapes.push(makeText(rearCX, CELL_H / 2 + 14, CELL_W, 18, 'REAR', {
      fontSize: 11, bold: true, color: '#dc2626',
    }));
  }

  // ← → arrows to show direction
  if (items.length > 1) {
    shapes.push(...makeArrow(
      startX - CELL_W / 2 - 10, CELL_H / 2 + 30,
      startX + totalW - CELL_W / 2 + 10, CELL_H / 2 + 30
    ));
  }

  const legendX = startX + totalW + LEGEND_GAP;
  shapes.push(...makeStepLegend(dsa.steps, legendX, -CELL_H / 2 - 14));
  return shapes;
}

// ── 5. Binary Tree ───────────────────────────────────────────────────────────
function renderBinaryTree(dsa) {
  const shapes = [];
  const nodes  = dsa.structure?.nodes || [];
  const rootId = dsa.structure?.root;

  if (!rootId || nodes.length === 0) return [];

  const nodeMap = new Map();
  nodes.forEach(n => nodeMap.set(n.id, n));

  const NODE_W = 60, NODE_H = 60;
  const LEVEL_H = 110;
  const positions = new Map();

  // Simplified Reingold-Tilford subtree width
  function subtreeWidth(id) {
    if (!id) return 0;
    const node = nodeMap.get(id);
    if (!node) return 0;
    const lw = subtreeWidth(node.left);
    const rw = subtreeWidth(node.right);
    return Math.max(NODE_W + 30, lw + rw + 20);
  }

  function assignPositions(id, cx, cy) {
    if (!id) return;
    const node = nodeMap.get(id);
    if (!node) return;
    positions.set(id, { x: cx, y: cy });
    const lw = subtreeWidth(node.left);
    const rw = subtreeWidth(node.right);
    const totalW = lw + rw + 20;
    if (node.left)  assignPositions(node.left,  cx - totalW / 4, cy + LEVEL_H);
    if (node.right) assignPositions(node.right, cx + totalW / 4, cy + LEVEL_H);
  }

  const treeDepth = (function maxD(id, d = 0) {
    if (!id) return d;
    const n = nodeMap.get(id);
    if (!n) return d;
    return Math.max(maxD(n.left, d + 1), maxD(n.right, d + 1));
  })(rootId);

  const totalH = treeDepth * LEVEL_H + NODE_H;
  assignPositions(rootId, 0, -totalH / 2 + NODE_H / 2);

  shapes.push(makeTitle(0, -totalH / 2 - 44, dsa.title || 'Binary Tree'));

  // Draw arrows from parent → children
  nodes.forEach(node => {
    const pos = positions.get(node.id);
    if (!pos) return;
    ['left', 'right'].forEach(dir => {
      const childId = node[dir];
      if (childId) {
        const childPos = positions.get(childId);
        if (childPos) {
          shapes.push(...makeArrow(
            pos.x, pos.y + NODE_H / 2,
            childPos.x, childPos.y - NODE_H / 2
          ));
        }
      }
    });
  });

  // Draw nodes (on top of arrows)
  nodes.forEach(node => {
    const pos = positions.get(node.id);
    if (!pos) return;
    const fill = node.isHighlighted ? C.treeHL : C.treeNode;
    shapes.push(makeNode(pos.x, pos.y, NODE_W, NODE_H, node.value, 'ellipse', fill));
  });

  const maxX = Math.max(...[...positions.values()].map(p => p.x)) + NODE_W / 2;
  shapes.push(...makeStepLegend(dsa.steps, maxX + LEGEND_GAP, -totalH / 2 - 14));
  return shapes;
}

// ── 6. Graph ─────────────────────────────────────────────────────────────────
function renderGraph(dsa) {
  const shapes = [];
  const gnodes = dsa.structure?.nodes || [];
  const gedges = dsa.structure?.edges || [];
  const NODE_R = 35;

  shapes.push(makeTitle(0, -220, dsa.title || 'Graph'));

  // Position nodes in a circle
  const posMap = new Map();
  const R = Math.max(120, gnodes.length * 35);
  gnodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / gnodes.length - Math.PI / 2;
    const cx = Math.round(R * Math.cos(angle));
    const cy = Math.round(R * Math.sin(angle));
    posMap.set(n.id, { x: cx, y: cy });
  });

  // Draw edges (arrows for directed, lines with labels for undirected)
  gedges.forEach(e => {
    const from = posMap.get(e.from);
    const to   = posMap.get(e.to);
    if (!from || !to) return;

    // Calculate edge start/end at the circle boundary, not center
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist, ny = dy / dist;
    const sx = from.x + nx * NODE_R, sy = from.y + ny * NODE_R;
    const ex = to.x - nx * NODE_R,   ey = to.y - ny * NODE_R;

    if (e.directed !== false) {
      shapes.push(...makeArrow(sx, sy, ex, ey, e.weight || ''));
    } else {
      shapes.push(makeLine(sx, sy, ex, ey));
      if (e.weight) {
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2 - 14;
        shapes.push(makeText(mx, my, 50, 18, String(e.weight), { fontSize: 12, color: '#374151' }));
      }
    }
  });

  // Draw nodes (on top of edges)
  gnodes.forEach(n => {
    const pos = posMap.get(n.id);
    if (!pos) return;
    shapes.push(makeNode(pos.x, pos.y, NODE_R * 2, NODE_R * 2, n.label || n.id, 'ellipse', C.graphNode));
  });

  const maxX = R + NODE_R + 20;
  shapes.push(...makeStepLegend(dsa.steps, maxX + LEGEND_GAP, -220));
  return shapes;
}

// ── 7. Hash Table ────────────────────────────────────────────────────────────
function renderHashTable(dsa) {
  const shapes = [];
  const buckets = dsa.structure?.buckets || [];
  const BUCKET_W = 60, ROW_H = 48, CHAIN_W = 70, GAP = 20;
  const totalH = buckets.length * ROW_H;
  const startY = -totalH / 2 + ROW_H / 2;

  shapes.push(makeTitle(0, startY - ROW_H / 2 - 44, dsa.title || 'Hash Table'));

  buckets.forEach((bucket, i) => {
    const cy = startY + i * ROW_H;
    // Index cell
    shapes.push(makeNode(-BUCKET_W, cy, BUCKET_W, ROW_H, String(bucket.index), 'rectangle', C.hashBucket));

    // Chain cells with arrows between
    (bucket.chain || []).forEach((val, j) => {
      const cx = BUCKET_W / 2 + j * (CHAIN_W + GAP);
      shapes.push(makeNode(cx, cy, CHAIN_W, ROW_H, val, 'rectangle', C.hashChain));
      if (j < bucket.chain.length - 1) {
        shapes.push(...makeArrow(
          cx + CHAIN_W / 2, cy,
          cx + CHAIN_W / 2 + GAP, cy
        ));
      }
    });

    // Arrow from bucket to first chain element
    if (bucket.chain && bucket.chain.length > 0) {
      shapes.push(...makeArrow(
        -BUCKET_W / 2, cy,
        BUCKET_W / 2 - CHAIN_W / 2, cy
      ));
    }

    if (!bucket.chain || bucket.chain.length === 0) {
      shapes.push(makeText(BUCKET_W / 2, cy, 40, ROW_H, '∅', { fontSize: 18, color: '#94a3b8' }));
    }
  });

  const maxChain = buckets.reduce((mx, b) => Math.max(mx, b.chain?.length || 0), 0);
  const legendX = BUCKET_W / 2 + maxChain * (CHAIN_W + GAP) + LEGEND_GAP;
  shapes.push(...makeStepLegend(dsa.steps, legendX, startY - ROW_H / 2 - 14));
  return shapes;
}

// ── 8. Sorting Steps ─────────────────────────────────────────────────────────
function renderSortingSteps(dsa) {
  const shapes = [];
  const steps  = dsa.structure?.steps || [];
  const CELL_W = 52, CELL_H = 46, ROW_GAP = 70;
  const firstLen = steps[0]?.array?.length || 0;
  const totalW = firstLen * CELL_W;
  const totalH = steps.length * ROW_GAP;
  const startX = -(totalW - CELL_W) / 2;
  const startY = -totalH / 2 + CELL_H / 2;

  shapes.push(makeTitle(0, startY - CELL_H / 2 - 44, dsa.title || 'Sorting Steps'));

  steps.forEach((step, rowIdx) => {
    const arr = step.array || [];
    const comparing = new Set(step.comparing || []);
    const sortedSet = new Set(step.sorted || []);
    const cy = startY + rowIdx * ROW_GAP;

    // Step label
    shapes.push(makeText(startX - CELL_W - 10, cy, 50, CELL_H, `P${rowIdx + 1}`, {
      fontSize: 13, bold: true, color: '#374151',
    }));

    arr.forEach((val, colIdx) => {
      const cx = startX + colIdx * CELL_W;
      const fill = comparing.has(colIdx) ? C.comparing
                 : sortedSet.has(colIdx) ? C.sorted
                 : C.normal;
      shapes.push(makeNode(cx, cy, CELL_W, CELL_H, val, 'rectangle', fill));
    });

    if (step.swapped) {
      shapes.push(makeText(startX + totalW + 20, cy, 70, 20, '⇄ swap', {
        fontSize: 12, bold: true, color: '#dc2626',
      }));
    }
  });

  const legendX = startX + totalW + LEGEND_GAP;
  shapes.push(...makeStepLegend(dsa.steps, legendX, startY - CELL_H / 2 - 14));
  return shapes;
}

// ── 9. DP Table ──────────────────────────────────────────────────────────────
function renderDPTable(dsa) {
  const shapes = [];
  const colHeaders = dsa.structure?.colHeaders || [];
  const rowHeader  = dsa.structure?.rowHeader  || '';
  const cells      = dsa.structure?.cells      || [];
  const highlighted = dsa.structure?.highlighted || [];

  const CELL_W = 68, CELL_H = 48;
  const numCols = colHeaders.length;
  const numRows = cells.length;
  const totalW  = numCols * CELL_W;
  const totalH  = (numRows + 1) * CELL_H;
  const startX  = -(totalW - CELL_W) / 2;
  const startY  = -totalH / 2 + CELL_H / 2;

  shapes.push(makeTitle(0, startY - CELL_H / 2 - 44, dsa.title || 'DP Table'));

  // Row header label
  if (rowHeader) {
    shapes.push(makeText(startX - CELL_W / 2 - 44, startY + CELL_H, 72, CELL_H, rowHeader, {
      fontSize: 12, bold: true, align: 'right', color: '#334155',
    }));
  }

  // Column headers
  colHeaders.forEach((ch, j) => {
    const cx = startX + j * CELL_W;
    shapes.push(makeNode(cx, startY, CELL_W, CELL_H, ch, 'rectangle', '#e2e8f0'));
  });

  // Data cells
  cells.forEach((row, i) => {
    const hlSet = new Set((highlighted[i] || []));
    row.forEach((val, j) => {
      const cx = startX + j * CELL_W;
      const cy = startY + (i + 1) * CELL_H;
      const fill = hlSet.has(j) ? C.dpHL : (val !== '' ? C.dpFilled : C.dpEmpty);
      shapes.push(makeNode(cx, cy, CELL_W, CELL_H, val, 'rectangle', fill));
    });
  });

  const legendX = startX + totalW + LEGEND_GAP;
  shapes.push(...makeStepLegend(dsa.steps, legendX, startY - CELL_H / 2 - 14));
  return shapes;
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Main dispatcher ──────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Converts a DSA AI result into a flat list of Infinity Canvas shapes.
 *
 * @param {Object} dsaIntent - { intent_type: "dsa", dsa: { dsaType, title, structure, steps } }
 * @returns {Array} Flat array of Infinity Canvas shape objects
 */
export function generateDSAShapes(dsaIntent) {
  if (!dsaIntent || dsaIntent.intent_type !== 'dsa' || !dsaIntent.dsa) {
    return [];
  }

  const dsa = dsaIntent.dsa;

  switch (dsa.dsaType) {
    case 'array':          return renderArray(dsa);
    case 'linked_list':    return renderLinkedList(dsa);
    case 'stack':          return renderStack(dsa);
    case 'queue':          return renderQueue(dsa);
    case 'binary_tree':    return renderBinaryTree(dsa);
    case 'graph':          return renderGraph(dsa);
    case 'hash_table':     return renderHashTable(dsa);
    case 'sorting_steps':  return renderSortingSteps(dsa);
    case 'dp_table':       return renderDPTable(dsa);
    default:
      console.warn(`[DSA Generator] Unknown dsaType: "${dsa.dsaType}".`);
      return [];
  }
}
