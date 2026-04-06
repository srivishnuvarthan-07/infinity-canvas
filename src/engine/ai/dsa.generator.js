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
// ── MODE: compare ────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Renders two DSA diagrams side-by-side with a differences table below.
 * Layout:
 *   [LEFT diagram]   [RIGHT diagram]
 *          [differences table]
 */
function renderCompare(dsa) {
  const shapes = [];
  const { left, right, differences = [] } = dsa.compare || {};
  if (!left || !right) return [];

  const GAP = 160; // horizontal gap between the two sub-diagrams

  // Render left sub-diagram offset to the left
  const leftShapes  = renderByType({ ...left,  title: left.title  || 'Left'  });
  const rightShapes = renderByType({ ...right, title: right.title || 'Right' });

  // Estimate bounding width of each sub-diagram for positioning
  const SUB_W = 520;

  // Shift left group to -SUB_W/2 - GAP/2, right group to +SUB_W/2 + GAP/2
  const offsetShapes = (shapeArr, dx, dy = 0) =>
    shapeArr.map(s => ({ ...s, position: { x: s.position.x + dx, y: s.position.y + dy } }));

  shapes.push(...offsetShapes(leftShapes,  -(SUB_W / 2 + GAP / 2)));
  shapes.push(...offsetShapes(rightShapes,  (SUB_W / 2 + GAP / 2)));

  // VS divider label
  shapes.push(makeText(0, 0, 60, 36, 'VS', { fontSize: 20, bold: true, color: '#6366f1' }));

  // Differences table below both diagrams
  if (differences.length > 0) {
    const TABLE_Y  = 260;
    const COL_W    = 220;
    const ROW_H    = 36;
    const CRIT_W   = 200;
    const startY   = TABLE_Y;

    // Header row
    shapes.push(makeNode(-CRIT_W / 2 - COL_W / 2, startY, CRIT_W, ROW_H, 'Criterion', 'rectangle', '#e2e8f0'));
    shapes.push(makeNode(CRIT_W / 2 - COL_W / 2 + COL_W * 0.5, startY, COL_W, ROW_H, left.title  || 'Left',  'rectangle', '#bfdbfe'));
    shapes.push(makeNode(CRIT_W / 2 - COL_W / 2 + COL_W * 1.5, startY, COL_W, ROW_H, right.title || 'Right', 'rectangle', '#bbf7d0'));

    differences.forEach((row, i) => {
      const cy = startY + (i + 1) * ROW_H;
      const bg = i % 2 === 0 ? '#f8fafc' : '#f1f5f9';
      shapes.push(makeNode(-CRIT_W / 2 - COL_W / 2,             cy, CRIT_W, ROW_H, row.criterion, 'rectangle', bg));
      shapes.push(makeNode(CRIT_W / 2 - COL_W / 2 + COL_W * 0.5, cy, COL_W,  ROW_H, row.left,      'rectangle', bg));
      shapes.push(makeNode(CRIT_W / 2 - COL_W / 2 + COL_W * 1.5, cy, COL_W,  ROW_H, row.right,     'rectangle', bg));
    });
  }

  return shapes;
}

// ═════════════════════════════════════════════════════════════════════════════
// ── MODE: leetcode ───────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

const DIFF_COLORS = { Easy: '#86efac', Medium: '#fcd34d', Hard: '#fca5a5' };

/**
 * Renders a LeetCode problem as 3 vertical sections on the canvas:
 *   1. Problem Card  (title, difficulty, statement, example I/O)
 *   2. Algorithm trace (the normal DSA diagram for the example)
 *   3. Complexity badge
 */
function renderLeetcode(dsa) {
  const shapes = [];
  const lc = dsa.leetcode || {};

  // ── 1. Problem card ────────────────────────────────────────────
  const CARD_W   = 520;
  const CARD_H   = 180;
  const CARD_Y   = -320;

  const cardId = uid();
  shapes.push({
    ...baseProps({
      id: cardId, type: 'rectangle',
      position: { x: 0, y: CARD_Y },
      size: { width: CARD_W, height: CARD_H },
      style: baseStyle({ fill: '#1e293b', stroke: '#334155', strokeWidth: 2, roughness: 0.3, seed: stableHash(cardId) }),
    }),
  });

  // Difficulty badge
  const diffColor = DIFF_COLORS[lc.difficulty] || '#e2e8f0';
  const badgeId = uid();
  shapes.push({
    ...baseProps({
      id: badgeId, type: 'rectangle',
      position: { x: CARD_W / 2 - 56, y: CARD_Y - CARD_H / 2 + 16 },
      size: { width: 88, height: 24 },
      style: baseStyle({ fill: diffColor, stroke: 'transparent', strokeWidth: 0, roughness: 0, seed: stableHash(badgeId) }),
    }),
  });
  shapes.push(makeText(CARD_W / 2 - 56, CARD_Y - CARD_H / 2 + 16, 88, 24,
    lc.difficulty || 'Medium', { fontSize: 11, bold: true, color: '#1e293b' }));

  // Title
  shapes.push(makeText(0, CARD_Y - CARD_H / 2 + 30, CARD_W - 20, 28,
    lc.title || dsa.title || 'LeetCode Problem', { fontSize: 18, bold: true, color: '#f8fafc' }));

  // Category + approach
  shapes.push(makeText(0, CARD_Y - CARD_H / 2 + 62, CARD_W - 20, 20,
    `${lc.category || ''}  ·  ${lc.approach || ''}`, { fontSize: 12, color: '#94a3b8' }));

  // Problem statement (truncate if long)
  const stmt = (lc.problemStatement || '').slice(0, 120);
  shapes.push(makeText(0, CARD_Y - CARD_H / 2 + 90, CARD_W - 24, 36,
    stmt, { fontSize: 12, color: '#cbd5e1' }));

  // Example I/O
  if (lc.example) {
    shapes.push(makeText(-60, CARD_Y + CARD_H / 2 - 28, 240, 20,
      `Input: ${lc.example.input}`, { fontSize: 12, bold: true, color: '#6ee7b7' }));
    shapes.push(makeText(160, CARD_Y + CARD_H / 2 - 28, 200, 20,
      `Output: ${lc.example.output}`, { fontSize: 12, bold: true, color: '#fbbf24' }));
  }

  // ── 2. Algorithm trace diagram ─────────────────────────────────
  const traceShapes = renderByType(dsa);
  // traceShapes are already centered at 0,0 — they sit below the card naturally
  shapes.push(...traceShapes);

  // ── 3. Complexity badge row ────────────────────────────────────
  const BADGE_Y = 260;
  if (lc.complexity) {
    const timeBadgeId = uid();
    const spaceBadgeId = uid();
    shapes.push({
      ...baseProps({
        id: timeBadgeId, type: 'rectangle',
        position: { x: -90, y: BADGE_Y },
        size: { width: 160, height: 36 },
        style: baseStyle({ fill: '#dbeafe', stroke: '#93c5fd', roughness: 0.3, seed: stableHash(timeBadgeId) }),
      }),
    });
    shapes.push(makeText(-90, BADGE_Y, 160, 36,
      `⏱ Time: ${lc.complexity.time}`, { fontSize: 13, bold: true, color: '#1e40af' }));

    shapes.push({
      ...baseProps({
        id: spaceBadgeId, type: 'rectangle',
        position: { x: 90, y: BADGE_Y },
        size: { width: 160, height: 36 },
        style: baseStyle({ fill: '#dcfce7', stroke: '#86efac', roughness: 0.3, seed: stableHash(spaceBadgeId) }),
      }),
    });
    shapes.push(makeText(90, BADGE_Y, 160, 36,
      `💾 Space: ${lc.complexity.space}`, { fontSize: 13, bold: true, color: '#166534' }));
  }

  return shapes;
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Internal type dispatcher (used by compare + leetcode) ────────────────────
// ═════════════════════════════════════════════════════════════════════════════

function renderByType(dsa) {
  switch (dsa.dsaType) {
    case 'array':         return renderArray(dsa);
    case 'linked_list':   return renderLinkedList(dsa);
    case 'stack':         return renderStack(dsa);
    case 'queue':         return renderQueue(dsa);
    case 'binary_tree':   return renderBinaryTree(dsa);
    case 'graph':         return renderGraph(dsa);
    case 'hash_table':    return renderHashTable(dsa);
    case 'sorting_steps': return renderSortingSteps(dsa);
    case 'dp_table':      return renderDPTable(dsa);
    default: return [];
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Main dispatcher ──────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Converts a DSA AI result into a flat list of Infinity Canvas shapes.
 *
 * Supports 4 modes via dsa.dsaMode:
 *   "snapshot"  → single static diagram (original behaviour)
 *   "trace"     → step-by-step diagram  (original behaviour, steps[] populated)
 *   "compare"   → two diagrams side-by-side with differences table
 *   "leetcode"  → problem card + algorithm trace + complexity badges
 *
 * @param {Object} dsaIntent - { intent_type: "dsa", dsa: { dsaMode, dsaType, title, structure, steps, compare?, leetcode? } }
 * @returns {Array} Flat array of Infinity Canvas shape objects
 */
export function generateDSAShapes(dsaIntent) {
  if (!dsaIntent || dsaIntent.intent_type !== 'dsa' || !dsaIntent.dsa) {
    return [];
  }

  const dsa  = dsaIntent.dsa;
  const mode = dsa.dsaMode || 'snapshot';

  if (mode === 'compare')  return renderCompare(dsa);
  if (mode === 'leetcode') return renderLeetcode(dsa);

  // trace mode → route to rich step-card renderers based on dsaType
  if (mode === 'trace') {
    switch (dsa.dsaType) {
      case 'sorting_steps': return renderSortingTrace(dsa);
      case 'binary_tree':   return renderTreeTrace(dsa);
      case 'graph':         return renderGraphTrace(dsa);
      case 'dp_table':      return renderDPTrace(dsa);
      // linked_list / stack / queue / array / hash_table fall through to snapshot renderers
      default:              return renderByType(dsa);
    }
  }

  // snapshot mode (and anything else) → original static renderers
  return renderByType(dsa);
}
// ═════════════════════════════════════════════════════════════════════════════
// ── RICH TRACE RENDERERS ─────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

// ── Shared: Step card container ───────────────────────────────────────────────
// Each step card = a labelled border box containing a mini-diagram.
// Cards are laid left→right, connected by arrows.
// offsetX = left edge of the card; returns shapes offset to card center.

const CARD_PAD   = 16;
const CARD_GAP   = 56;   // gap between cards
const CARD_HDR   = 32;   // header height inside card

function makeStepCard(offsetX, cardW, cardH, stepLabel, stepDesc) {
  const shapes = [];
  const cx = offsetX + cardW / 2;
  const cy = 0;

  // Card border
  const cardId = uid();
  shapes.push({
    ...baseProps({
      id: cardId, type: 'rectangle',
      position: { x: cx, y: cy },
      size: { width: cardW, height: cardH },
      style: baseStyle({ fill: '#f8fafc', stroke: '#cbd5e1', strokeWidth: 1.5, roughness: 0.4, seed: stableHash(cardId) }),
    }),
  });

  // Header strip
  const hdrId = uid();
  shapes.push({
    ...baseProps({
      id: hdrId, type: 'rectangle',
      position: { x: cx, y: cy - cardH / 2 + CARD_HDR / 2 },
      size: { width: cardW, height: CARD_HDR },
      style: baseStyle({ fill: '#1e293b', stroke: 'transparent', strokeWidth: 0, roughness: 0, seed: stableHash(hdrId) }),
    }),
  });

  // Step number
  shapes.push(makeText(cx - cardW / 2 + 30, cy - cardH / 2 + CARD_HDR / 2, 44, CARD_HDR,
    stepLabel, { fontSize: 12, bold: true, color: '#fbbf24' }));

  // Step description
  shapes.push(makeText(cx + 24, cy - cardH / 2 + CARD_HDR / 2, cardW - 56, CARD_HDR,
    stepDesc, { fontSize: 11, color: '#e2e8f0', align: 'left' }));

  return shapes;
}

function connectCards(cards) {
  // cards = array of { offsetX, cardW, cardH }
  const arrows = [];
  for (let i = 0; i < cards.length - 1; i++) {
    const a = cards[i];
    const b = cards[i + 1];
    const x1 = a.offsetX + a.cardW;
    const x2 = b.offsetX;
    const y  = 0;
    arrows.push(...makeArrow(x1, y, x2, y));
  }
  return arrows;
}

// ── RICH: Sorting Trace ───────────────────────────────────────────────────────
// Schema expected:
// structure.steps[] = [{ array, comparing:[], swapped, sorted:[], pointers:{i,j,pivot} }]
// steps[] = human labels per step

export function renderSortingTrace(dsa) {
  const shapes  = [];
  const rawSteps = dsa.structure?.steps || [];
  const labels   = dsa.steps || [];

  const CELL_W = 48, CELL_H = 44;
  const CARD_H = CELL_H + CARD_HDR + CARD_PAD * 3 + 24; // array + pointers row
  const firstLen = rawSteps[0]?.array?.length || 1;
  const CARD_W   = Math.max(180, firstLen * CELL_W + CARD_PAD * 2);
  const stride   = CARD_W + CARD_GAP;
  const totalW   = rawSteps.length * stride - CARD_GAP;

  shapes.push(makeTitle(-totalW / 2 + CARD_W / 2, -CARD_H / 2 - 48, dsa.title || 'Sorting'));

  const cardMetas = [];

  rawSteps.forEach((step, si) => {
    const arr      = step.array     || [];
    const cmpSet   = new Set(step.comparing || []);
    const sortedSet= new Set(step.sorted    || []);
    const pointers = step.pointers  || {};
    const offsetX  = -totalW / 2 + si * stride;
    const cx       = offsetX + CARD_W / 2;
    const label    = `S${si + 1}`;
    const desc     = labels[si] || (step.swapped ? 'swap' : 'compare');

    shapes.push(...makeStepCard(offsetX, CARD_W, CARD_H, label, desc));
    cardMetas.push({ offsetX, cardW: CARD_W, cardH: CARD_H });

    // Array cells — vertically centered inside card body
    const bodyCY  = CARD_HDR / 2 + CARD_PAD + CELL_H / 2;  // relative to card center
    const arrStartX = cx - (arr.length * CELL_W) / 2 + CELL_W / 2;

    arr.forEach((val, ci) => {
      const cellCX = arrStartX + ci * CELL_W;
      const cellCY = bodyCY;
      const fill   = cmpSet.has(ci)    ? C.comparing
                   : sortedSet.has(ci) ? C.sorted
                   : C.normal;
      shapes.push(makeNode(cellCX, cellCY, CELL_W, CELL_H, String(val), 'rectangle', fill));

      // Pointer labels below cell
      const ptrLabels = Object.entries(pointers)
        .filter(([, v]) => v === ci)
        .map(([k]) => k);
      if (ptrLabels.length) {
        shapes.push(makeText(cellCX, bodyCY + CELL_H / 2 + 12, CELL_W, 16,
          ptrLabels.join(','), { fontSize: 11, bold: true, color: '#6366f1' }));
      }
    });

    // Swap badge
    if (step.swapped) {
      shapes.push(makeText(cx, bodyCY + CELL_H / 2 + 28, 70, 18, '⇄ swap',
        { fontSize: 11, bold: true, color: '#dc2626' }));
    }
  });

  shapes.push(...connectCards(cardMetas));
  return shapes;
}

// ── RICH: Tree Traversal Trace ────────────────────────────────────────────────
// Schema expected:
// structure.nodes[]         = full node list (id, value, left, right)
// structure.root            = root id
// structure.traversalSteps[]= [{ visitedIds:[], currentId, queueOrStack:[] }]
// steps[]                   = human labels per step

// Estimate ellipse width needed to fit a text label (approx 7.5px per char at 11px font)
function estimateNodeSize(label) {
  const text  = String(label || '');
  // Split on newline or '|' separator the AI may use
  const lines = text.split(/[\n|]/).map(l => l.trim()).filter(Boolean);
  const longest = Math.max(...lines.map(l => l.length), 1);
  // Ellipse needs ~1.42x its text width to contain the text (ellipse geometry)
  const w = Math.max(90, Math.ceil(longest * 7.8 * 1.42));
  const h = Math.max(60, lines.length > 1 ? 76 : 60);
  return { w, h, lines };
}

function buildTreePositions(nodeMap, rootId) {
  const LEVEL_H  = 110; // vertical gap between levels
  const H_MARGIN = 24;  // extra horizontal margin between siblings
  const positions = new Map();
  const sizeMap   = new Map(); // node id → { w, h }

  // Pre-compute each node's ellipse size from its label
  nodeMap.forEach((n, id) => {
    const label = n.nodeLabel || n.value || id;
    sizeMap.set(id, estimateNodeSize(label));
  });

  // Returns minimum width this subtree needs
  function subtreeWidth(id) {
    if (!id || !nodeMap.has(id)) return 0;
    const n    = nodeMap.get(id);
    const nw   = (sizeMap.get(id) || {}).w || 90;
    const lw   = subtreeWidth(n.left);
    const rw   = subtreeWidth(n.right);
    if (!n.left && !n.right) return nw;
    if (!n.left  || !n.right) return Math.max(nw, (lw || rw) + nw + H_MARGIN);
    return Math.max(nw, lw + rw + H_MARGIN);
  }

  function assign(id, cx, cy) {
    if (!id || !nodeMap.has(id)) return;
    const n    = nodeMap.get(id);
    const nw   = (sizeMap.get(id) || {}).w || 90;
    positions.set(id, { x: cx, y: cy });
    const lw   = subtreeWidth(n.left);
    const rw   = subtreeWidth(n.right);
    if (n.left)  assign(n.left,  cx - (lw / 2 + nw / 2 + H_MARGIN / 2), cy + LEVEL_H);
    if (n.right) assign(n.right, cx + (rw / 2 + nw / 2 + H_MARGIN / 2), cy + LEVEL_H);
  }

  const depth = (function d(id, lv = 0) {
    if (!id || !nodeMap.has(id)) return lv;
    const n = nodeMap.get(id);
    return Math.max(d(n.left, lv + 1), d(n.right, lv + 1));
  })(rootId);

  // Use max node height for level height calculation
  let maxNodeH = 60;
  sizeMap.forEach(s => { if (s.h > maxNodeH) maxNodeH = s.h; });

  const treeH = depth * LEVEL_H + maxNodeH;
  assign(rootId, 0, -treeH / 2 + maxNodeH / 2);
  return { positions, treeH, sizeMap, LEVEL_H };
}

export function renderTreeTrace(dsa) {
  const shapes   = [];
  const allNodes = dsa.structure?.nodes || [];
  const rootId   = dsa.structure?.root;
  const tSteps   = dsa.structure?.traversalSteps || [];
  const labels   = dsa.steps || [];

  if (!rootId || allNodes.length === 0) return renderBinaryTree(dsa); // fallback

  const nodeMap = new Map();
  allNodes.forEach(n => nodeMap.set(n.id, n));

  const { positions, treeH, sizeMap } = buildTreePositions(nodeMap, rootId);

  // Compute true bounding box from every node's actual center + its own size
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  positions.forEach((pos, id) => {
    const sz = sizeMap.get(id) || { w: 90, h: 60 };
    minX = Math.min(minX, pos.x - sz.w / 2);
    maxX = Math.max(maxX, pos.x + sz.w / 2);
    minY = Math.min(minY, pos.y - sz.h / 2);
    maxY = Math.max(maxY, pos.y + sz.h / 2);
  });

  const realTreeW = maxX - minX;
  const realTreeH = maxY - minY;

  const auxH      = 44;   // queue/stack row height
  const INNER_PAD = 28;   // breathing room on each side inside card

  // Card must fit the full tree width (minX..maxX are relative to tree center 0,0)
  // Both left and right extremes must be padded, so use the larger half × 2
  const halfSpread = Math.max(Math.abs(minX), Math.abs(maxX));
  const CARD_W = Math.max(320, halfSpread * 2 + INNER_PAD * 2);
  const CARD_H = realTreeH + CARD_HDR + INNER_PAD * 2 + auxH;
  const stride   = CARD_W + CARD_GAP;
  const steps    = tSteps.length > 0 ? tSteps : [{ visitedIds: [], currentId: null, queueOrStack: [] }];
  const totalW   = steps.length * stride - CARD_GAP;

  shapes.push(makeTitle(-totalW / 2 + CARD_W / 2, -CARD_H / 2 - 48, dsa.title || 'Tree Traversal'));

  const cardMetas = [];

  steps.forEach((step, si) => {
    const visitedSet = new Set(step.visitedIds || []);
    const currentId  = step.currentId || null;
    const aux        = step.queueOrStack || [];
    const offsetX    = -totalW / 2 + si * stride;
    const cx         = offsetX + CARD_W / 2;
    // treeOriginY: shift so topmost node edge sits at header-bottom + padding
    // nodes are stored relative to (0,0); minY is the top of the topmost node
    const treeOriginY = -CARD_H / 2 + CARD_HDR + INNER_PAD + (-minY);
    // treeOriginX: tree (0,0) is already horizontally centered in card (cx)
    // no extra X offset needed — nodes draw at cx + pos.x

    shapes.push(...makeStepCard(offsetX, CARD_W, CARD_H, `S${si + 1}`, labels[si] || `Visit ${currentId || '—'}`));
    cardMetas.push({ offsetX, cardW: CARD_W, cardH: CARD_H });

    // Draw edges — use per-node sizes for exact top/bottom offsets
    allNodes.forEach(node => {
      const pos  = positions.get(node.id); if (!pos) return;
      const pSz  = sizeMap.get(node.id) || { w: 90, h: 60 };
      ['left', 'right'].forEach(dir => {
        const childId = node[dir];
        if (childId) {
          const cPos = positions.get(childId); if (!cPos) return;
          const cSz  = sizeMap.get(childId) || { w: 90, h: 60 };
          shapes.push(...makeArrow(
            cx + pos.x,  treeOriginY + pos.y  + pSz.h / 2,
            cx + cPos.x, treeOriginY + cPos.y - cSz.h / 2
          ));
        }
      });
    });

    // Draw nodes with traversal coloring
    allNodes.forEach(node => {
      const pos = positions.get(node.id); if (!pos) return;
      const isVisited = visitedSet.has(node.id);
      const isCurrent = node.id === currentId;
      const fill = isCurrent ? C.highlight
                 : isVisited ? C.sorted
                 : C.treeNode;

      // Auto-size ellipse to fit the full label text
      const { w: NW, h: NH, lines } = sizeMap.get(node.id) || estimateNodeSize(node.nodeLabel || node.value || node.id);

      // Draw ellipse background
      const ellId = uid();
      shapes.push({
        ...baseProps({
          id: ellId, type: 'ellipse',
          position: { x: cx + pos.x, y: treeOriginY + pos.y },
          size: { width: NW, height: NH },
          style: baseStyle({ fill, stroke: HAND_STROKE, strokeWidth: 2, roughness: ROUGHNESS, seed: stableHash(ellId) }),
        }),
      });

      // Render each line of text centered inside the ellipse
      // For ellipse: usable width ≈ NW * 0.70 (chord at mid-height)
      const usableW = Math.floor(NW * 0.70);
      const lineH   = 15;
      const totalTH = lines.length * lineH;
      lines.forEach((line, li) => {
        const textY = treeOriginY + pos.y - totalTH / 2 + li * lineH + lineH / 2;
        shapes.push(makeText(
          cx + pos.x, textY, usableW, lineH, line,
          { fontSize: 11, bold: false, color: '#1e293b', align: 'center' }
        ));
      });

      // Visit order badge (top-right of ellipse)
      const visitOrder = [...visitedSet].indexOf(node.id);
      if (visitOrder >= 0) {
        const badgeId = uid();
        shapes.push({
          ...baseProps({
            id: badgeId, type: 'ellipse',
            position: { x: cx + pos.x + NW / 2 - 10, y: treeOriginY + pos.y - NH / 2 + 10 },
            size: { width: 20, height: 20 },
            style: baseStyle({ fill: '#6366f1', stroke: 'transparent', strokeWidth: 0, roughness: 0, seed: stableHash(badgeId) }),
          }),
        });
        shapes.push(makeText(
          cx + pos.x + NW / 2 - 10, treeOriginY + pos.y - NH / 2 + 10,
          20, 20, String(visitOrder + 1),
          { fontSize: 9, bold: true, color: '#ffffff' }
        ));
      }
    });

    // Queue / stack row — anchored to card bottom edge
    const auxY = CARD_H / 2 - auxH / 2 - 4;
    const auxLabel = step.auxLabel || 'Queue';
    shapes.push(makeText(cx - CARD_W / 2 + 28, auxY, 50, auxH, auxLabel,
      { fontSize: 10, bold: true, color: '#475569' }));
    aux.forEach((val, ai) => {
      shapes.push(makeNode(cx - CARD_W / 2 + 70 + ai * 34, auxY, 30, 24,
        String(val), 'rectangle', '#e0e7ff'));
    });
    if (aux.length === 0) {
      shapes.push(makeText(cx - CARD_W / 2 + 80, auxY, 40, auxH, '∅',
        { fontSize: 13, color: '#94a3b8' }));
    }
  });

  shapes.push(...connectCards(cardMetas));
  return shapes;
}

// ── RICH: Graph Traversal Trace ───────────────────────────────────────────────
// Schema expected:
// structure.nodes[]          = [{ id, label }]
// structure.edges[]          = [{ from, to, directed }]
// structure.traversalSteps[] = [{ visitedIds:[], currentId, queueOrStack:[], auxLabel }]
// steps[]                    = human labels

export function renderGraphTrace(dsa) {
  const shapes   = [];
  const gnodes   = dsa.structure?.nodes || [];
  const gedges   = dsa.structure?.edges || [];
  const tSteps   = dsa.structure?.traversalSteps || [];
  const labels   = dsa.steps || [];

  if (tSteps.length === 0) return renderGraph(dsa); // fallback to snapshot

  const NODE_R   = 28;
  const R        = Math.max(90, gnodes.length * 28);

  // Build fixed circular positions (same for every card)
  const posMap = new Map();
  gnodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / gnodes.length - Math.PI / 2;
    posMap.set(n.id, { x: Math.round(R * Math.cos(angle)), y: Math.round(R * Math.sin(angle)) });
  });

  const graphW = (R + NODE_R) * 2 + 8;
  const graphH = (R + NODE_R) * 2 + 8;
  const auxH   = 36;
  const CARD_H = graphH + CARD_HDR + CARD_PAD * 2 + auxH;
  const CARD_W = Math.max(220, graphW + CARD_PAD * 2);
  const stride = CARD_W + CARD_GAP;
  const totalW = tSteps.length * stride - CARD_GAP;

  shapes.push(makeTitle(-totalW / 2 + CARD_W / 2, -CARD_H / 2 - 48, dsa.title || 'Graph Traversal'));

  const cardMetas = [];

  tSteps.forEach((step, si) => {
    const visitedSet = new Set(step.visitedIds || []);
    const currentId  = step.currentId || null;
    const aux        = step.queueOrStack || [];
    const offsetX    = -totalW / 2 + si * stride;
    const cx         = offsetX + CARD_W / 2;
    const graphCY    = CARD_HDR / 2 + CARD_PAD + graphH / 2;

    shapes.push(...makeStepCard(offsetX, CARD_W, CARD_H, `S${si + 1}`, labels[si] || `Visit ${currentId || '—'}`));
    cardMetas.push({ offsetX, cardW: CARD_W, cardH: CARD_H });

    // Draw edges
    gedges.forEach(e => {
      const from = posMap.get(e.from); const to = posMap.get(e.to);
      if (!from || !to) return;
      const dx = to.x - from.x, dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / dist, ny = dy / dist;
      const sx = cx + from.x + nx * NODE_R, sy = graphCY + from.y + ny * NODE_R;
      const ex = cx + to.x   - nx * NODE_R, ey = graphCY + to.y   - ny * NODE_R;
      if (e.directed !== false) shapes.push(...makeArrow(sx, sy, ex, ey));
      else shapes.push(makeLine(sx, sy, ex, ey));
    });

    // Draw nodes
    gnodes.forEach(n => {
      const pos = posMap.get(n.id); if (!pos) return;
      const isVisited = visitedSet.has(n.id);
      const isCurrent = n.id === currentId;
      const fill = isCurrent ? C.highlight
                 : isVisited ? C.sorted
                 : '#f1f5f9';
      shapes.push(makeNode(cx + pos.x, graphCY + pos.y, NODE_R * 2, NODE_R * 2,
        n.label || n.id, 'ellipse', fill));
    });

    // Queue / stack row
    const auxY = graphCY + graphH / 2 + CARD_PAD + auxH / 2;
    const auxLabel = step.auxLabel || 'Queue';
    shapes.push(makeText(cx - CARD_W / 2 + 30, auxY, 52, auxH, auxLabel,
      { fontSize: 10, bold: true, color: '#475569' }));
    aux.forEach((val, ai) => {
      shapes.push(makeNode(cx - CARD_W / 2 + 76 + ai * 34, auxY, 30, 24,
        String(val), 'rectangle', '#e0e7ff'));
    });
    if (aux.length === 0) {
      shapes.push(makeText(cx - CARD_W / 2 + 80, auxY, 40, auxH, '∅',
        { fontSize: 13, color: '#94a3b8' }));
    }
  });

  shapes.push(...connectCards(cardMetas));
  return shapes;
}

// ── RICH: DP Table Trace ──────────────────────────────────────────────────────
// Schema expected:
// structure.colHeaders[]
// structure.rowHeaders[]   (array of row labels; 1 row = 1D DP, N rows = 2D)
// structure.tableSteps[]   = [{ cells:[][], currentCell:[r,c], formula, filledSoFar:[[r,c],...] }]
// steps[]                  = human labels

export function renderDPTrace(dsa) {
  const shapes     = [];
  const colHeaders = dsa.structure?.colHeaders || [];
  const rowHeaders = dsa.structure?.rowHeaders || [dsa.structure?.rowHeader || 'dp'];
  const tSteps     = dsa.structure?.tableSteps || [];
  const labels     = dsa.steps || [];

  if (tSteps.length === 0) return renderDPTable(dsa); // fallback

  const CELL_W = 52, CELL_H = 40;
  const numCols = colHeaders.length;
  const numRows = rowHeaders.length;
  const tableW  = (numCols + 1) * CELL_W; // +1 for row header col
  const tableH  = (numRows + 1) * CELL_H; // +1 for col header row
  const formulaH = 28;
  const CARD_H  = tableH + formulaH + CARD_HDR + CARD_PAD * 3;
  const CARD_W  = Math.max(240, tableW + CARD_PAD * 2);
  const stride  = CARD_W + CARD_GAP;
  const totalW  = tSteps.length * stride - CARD_GAP;

  shapes.push(makeTitle(-totalW / 2 + CARD_W / 2, -CARD_H / 2 - 48, dsa.title || 'DP Trace'));

  const cardMetas = [];

  tSteps.forEach((step, si) => {
    const cells      = step.cells      || [];
    const [cr, cc]   = step.currentCell || [-1, -1];
    const filledSet  = new Set((step.filledSoFar || []).map(([r, c]) => `${r},${c}`));
    const formula    = step.formula    || '';
    const offsetX    = -totalW / 2 + si * stride;
    const cx         = offsetX + CARD_W / 2;

    shapes.push(...makeStepCard(offsetX, CARD_W, CARD_H, `S${si + 1}`, labels[si] || formula));
    cardMetas.push({ offsetX, cardW: CARD_W, cardH: CARD_H });

    // Table origin (top-left of table relative to card center)
    const tblOriginX = cx - tableW / 2;
    const tblOriginY = -CARD_H / 2 + CARD_HDR + CARD_PAD + CELL_H / 2;

    // Formula row above table body
    if (formula) {
      shapes.push(makeText(cx, tblOriginY - CELL_H / 2 - formulaH / 2 + 4, CARD_W - CARD_PAD * 2, formulaH,
        formula, { fontSize: 11, bold: true, color: '#7c3aed' }));
    }

    // Column headers
    colHeaders.forEach((ch, j) => {
      shapes.push(makeNode(tblOriginX + (j + 1) * CELL_W, tblOriginY, CELL_W, CELL_H,
        String(ch), 'rectangle', '#e2e8f0'));
    });

    // Row headers + cells
    rowHeaders.forEach((rh, i) => {
      const rowCY = tblOriginY + (i + 1) * CELL_H;
      // Row header
      shapes.push(makeNode(tblOriginX, rowCY, CELL_W, CELL_H, String(rh), 'rectangle', '#e2e8f0'));

      // Data cells
      (cells[i] || []).forEach((val, j) => {
        const key    = `${i},${j}`;
        const isCurr = i === cr && j === cc;
        const isFilld= filledSet.has(key);
        const fill   = isCurr ? C.dpHL
                     : isFilld ? C.dpFilled
                     : C.dpEmpty;
        shapes.push(makeNode(tblOriginX + (j + 1) * CELL_W, rowCY, CELL_W, CELL_H,
          val !== undefined ? String(val) : '', 'rectangle', fill));
      });
    });
  });

  shapes.push(...connectCards(cardMetas));
  return shapes;
}