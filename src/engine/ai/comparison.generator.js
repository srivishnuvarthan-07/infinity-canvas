/**
 * comparison.generator.js
 * Generates a side-by-side comparison table on the Infinity Canvas.
 * NOTE: Canvas engine uses CENTER-BASED positioning for all shapes.
 */

const HAND_FONT   = 'Caveat';
const HAND_STROKE = '#000000';

const CELL_W    = 160;
const CELL_H    = 46;
const LABEL_W   = 190;
const HEADER_H  = 58;

const HEADER_BG   = '#1e293b';
const HEADER_TEXT = '#ffffff';
const LABEL_BG    = '#f1f5f9';
const LABEL_TEXT  = '#334155';
const TITLE_COLOR = '#0f172a';
const BORDER_CLR  = '#cbd5e1';

const POS_FILL = '#dcfce7'; const POS_TEXT = '#166534';
const NEG_FILL = '#fee2e2'; const NEG_TEXT = '#991b1b';
const NEU_FILL = '#f8fafc'; const NEU_TEXT = '#334155';

const POS_KW = ['✓','yes','high','fast','good','great','excellent','easy','strong','best','native','built-in'];
const NEG_KW = ['✗','no','low','slow','bad','poor','difficult','hard','weak','none','limited','manual'];

function uid() { return crypto.randomUUID(); }
function sh(s) {
    let h = 0xdeadbeef;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
    return ((h ^ (h >>> 16)) >>> 0);
}
function sentiment(v) {
    const lv = String(v).toLowerCase().trim();
    if (POS_KW.some(k => lv.includes(k))) return 'pos';
    if (NEG_KW.some(k => lv.includes(k))) return 'neg';
    return 'neu';
}

function makeBase(id) {
    return { id, rotation: 0, scale: { x: 1, y: 1 }, locked: false, visible: true, revision: { number: 1, timestamp: Date.now() } };
}

/** Make a rectangle. cx,cy = CENTER of the shape. */
function makeRect(cx, cy, w, h, fill, stroke, roughness = 0) {
    const id = uid();
    return {
        ...makeBase(id), type: 'rectangle', zIndex: 0,
        position: { x: cx, y: cy },
        size: { width: w, height: h },
        style: { stroke, fill, strokeWidth: 1.5, opacity: 1, renderMode: 'vector', roughness, seed: sh(id), fillStyle: 'solid' },
    };
}

/** Make a text label. cx,cy = CENTER of the text bounding box. */
function makeText(cx, cy, w, h, text, color, size = 14, weight = '600', align = 'center') {
    const id = uid();
    return {
        ...makeBase(id), type: 'text', text, zIndex: 1,
        position: { x: cx, y: cy },
        size: { width: w - 10, height: h },
        font: { family: HAND_FONT, size, weight, align },
        style: { stroke: HAND_STROKE, fill: color, strokeWidth: 0, opacity: 1, renderMode: 'vector', roughness: 0, seed: sh(text + id), fillStyle: 'solid' },
    };
}

export function generateComparisonShapes(intent) {
    if (!intent || intent.intent_type !== 'comparison' || !intent.comparison) return [];
    const { title, items = [], criteria = [] } = intent.comparison;
    if (!items.length || !criteria.length) return [];

    const cols   = items.length;
    const tableW = LABEL_W + cols * CELL_W;
    const tableH = HEADER_H + criteria.length * CELL_H;

    // We work in a coordinate system where (0,0) is the center of the table.
    // top-left of table = (-tableW/2, -tableH/2)
    const tl_x = -tableW / 2;
    const tl_y = -tableH / 2;

    const children = [];

    // ── Title (above table) ──────────────────────────────────────────────────
    children.push(makeText(0, tl_y - 34, tableW, 32, title || 'Comparison', TITLE_COLOR, 22, '700', 'center'));

    // ── Header row ────────────────────────────────────────────────────────────
    // Top-left corner blank cell — center at (tl_x + LABEL_W/2, tl_y + HEADER_H/2)
    children.push(makeRect(tl_x + LABEL_W / 2, tl_y + HEADER_H / 2, LABEL_W, HEADER_H, HEADER_BG, BORDER_CLR));

    items.forEach((item, ci) => {
        const cx = tl_x + LABEL_W + ci * CELL_W + CELL_W / 2;
        const cy = tl_y + HEADER_H / 2;
        children.push(makeRect(cx, cy, CELL_W, HEADER_H, HEADER_BG, BORDER_CLR));
        children.push(makeText(cx, cy, CELL_W, HEADER_H, String(item), HEADER_TEXT, 16, '700', 'center'));
    });

    // ── Data rows ─────────────────────────────────────────────────────────────
    criteria.forEach((criterion, ri) => {
        const rowTopY = tl_y + HEADER_H + ri * CELL_H; // top edge of this row
        const cy      = rowTopY + CELL_H / 2;           // center Y of cells in this row
        const rowBg   = ri % 2 === 0 ? LABEL_BG : '#ffffff';

        // Label cell
        const lcx = tl_x + LABEL_W / 2;
        children.push(makeRect(lcx, cy, LABEL_W, CELL_H, rowBg, BORDER_CLR));
        // Left-aligned text: shift center slightly right for left-align
        children.push(makeText(lcx + 5, cy, LABEL_W - 16, CELL_H, String(criterion.label), LABEL_TEXT, 14, '600', 'left'));

        // Value cells
        (criterion.values || []).forEach((val, ci) => {
            const s   = sentiment(String(val));
            const ccx = tl_x + LABEL_W + ci * CELL_W + CELL_W / 2;
            children.push(makeRect(ccx, cy, CELL_W, CELL_H, s === 'pos' ? POS_FILL : s === 'neg' ? NEG_FILL : NEU_FILL, BORDER_CLR));
            children.push(makeText(ccx, cy, CELL_W, CELL_H, String(val), s === 'pos' ? POS_TEXT : s === 'neg' ? NEG_TEXT : NEU_TEXT, 14, '700', 'center'));
        });
    });

    // Wrap everything in one group (center at 0,0)
    const gid = uid();
    return [{
        ...makeBase(gid), type: 'group', zIndex: 0,
        position: { x: 0, y: 0 },
        size: { width: tableW, height: tableH + 70 },
        style: { stroke: 'transparent', strokeWidth: 0, fill: 'transparent', opacity: 1, renderMode: 'vector', roughness: 0, seed: sh(gid), fillStyle: 'solid' },
        children,
    }];
}
