
import dagre from 'dagre';

/**
 * Common shape defaults
 */
const defaultShapeProps = {
    strokeColor: '#000000',
    fillColor: 'transparent',
    strokeWidth: 2,
    strokeStyle: 'solid',
    sloppiness: 'architect',
};

const defaultTextProps = {
    ...defaultShapeProps,
    type: 'text',
    fillColor: '#000000', // Text color
    fontSize: 16,
    fontFamily: 'Inter',
    textAlign: 'center',
};

const defaultNodeProps = {
    ...defaultShapeProps,
    width: 130,
    height: 70,
    fillColor: '#ffffff',
};

/**
 * Creates a grouped node containing the shape and text so they drag together
 */
function createNode(id, text, x, y, type = 'rectangle', width = 130, height = 70) {
    const groupId = crypto.randomUUID();
    // Use the parsed ID if available, otherwise generate one
    const nodeId = id || crypto.randomUUID();
    const textId = crypto.randomUUID();

    const nodeShape = {
        ...defaultNodeProps,
        id: nodeId,
        type,
        x: 0, // Relative to group center
        y: 0,
        rotation: 0,
        opacity: 1,
        width,
        height,
    };

    const textShape = {
        ...defaultTextProps,
        id: textId,
        text,
        x: 0, // Relative to group center
        y: 0,
        rotation: 0,
        opacity: 1,
        width: width - 10,
        height: 20,
    };

    const groupShape = {
        id: groupId,
        type: 'group',
        x,
        y,
        width,
        height,
        rotation: 0,
        opacity: 1,
        strokeColor: 'transparent',
        strokeWidth: 0,
        strokeStyle: 'solid',
        sloppiness: 'architect',
        children: [nodeShape, textShape],
        // Save the raw id to map edges later
        rawId: id
    };

    return groupShape;
}

/**
 * Creates a connector line between two nodes
 */
function createEdge(fromNode, toNode, label = '') {
    const edgeId = crypto.randomUUID();

    const midX = (fromNode.x + toNode.x) / 2;
    const midY = (fromNode.y + toNode.y) / 2;

    const lineShape = {
        ...defaultShapeProps,
        id: edgeId,
        type: 'arrow',
        x: fromNode.x,
        y: fromNode.y,
        rotation: 0,
        opacity: 1,
        points: [
            { x: 0, y: 0 },
            { x: toNode.x - fromNode.x, y: toNode.y - fromNode.y }
        ],
        width: toNode.x - fromNode.x,
        height: toNode.y - fromNode.y
    };

    const shapes = [lineShape];

    if (label) {
        const textId = crypto.randomUUID();
        shapes.push({
            ...defaultTextProps,
            id: textId,
            text: label,
            x: midX,
            y: midY,
            rotation: 0,
            opacity: 1,
            width: 100,
            height: 20,
            fontSize: 12,
            fillColor: '#666666'
        });
    }

    return shapes;
}

/**
 * Main generator function that transforms Mermaid string to canvas shapes
 * Architecture:
 * AI Mermaid -> Parser -> Dagre Graph -> Layout -> Render Nodes & Edges -> Auto Center
 */
export function generateDiagramShapes(intent) {
    if (intent.intent_type === 'non_visual' || !intent.mermaid) {
        return [];
    }

    const { mermaid } = intent;
    const lines = mermaid.split('\n').map(l => l.trim()).filter(l => l);

    // 1. Initialize Dagre Graph
    const g = new dagre.graphlib.Graph();
    g.setGraph({
        rankdir: lines[0]?.includes('LR') ? 'LR' : 'TB',
        nodesep: 100,
        ranksep: 100,
        marginx: 50,
        marginy: 50
    });
    g.setDefaultEdgeLabel(() => ({}));

    // 2. Parse Nodes and Edges
    const nodes = new Map();
    const edges = [];

    // Regex defaults
    // Matches: A[Label] or A((Label)) or A{Label} or just A
    const nodeRegex = /^([a-zA-Z0-9_-]+)(?:\[(.*?)\]|\(\((.*?)\)\)|\{(.*?)\})?$/;
    // Matches: A --> B or A -->|Label| B
    const edgeRegex = /^([a-zA-Z0-9_-]+)\s*-->\s*(?:\|(.*?)\|\s*)?([a-zA-Z0-9_-]+)$/;

    lines.slice(1).forEach(line => {
        // Skip comments and empty
        if (line.startsWith('%') || !line) return;

        const edgeMatch = line.match(edgeRegex);
        if (edgeMatch) {
            const [_, fromId, label, toId] = edgeMatch;
            edges.push({ fromId, toId, label: label || '' });

            // Ensure nodes exist even if implicitly declared
            if (!nodes.has(fromId)) nodes.set(fromId, { id: fromId, label: fromId, type: 'rectangle' });
            if (!nodes.has(toId)) nodes.set(toId, { id: toId, label: toId, type: 'rectangle' });
        } else {
            const nodeMatch = line.match(nodeRegex);
            if (nodeMatch) {
                const [_, id, rectLabel, circleLabel, diamondLabel] = nodeMatch;
                let type = 'rectangle';
                let label = id;
                if (rectLabel) { label = rectLabel; type = 'rectangle'; }
                else if (circleLabel) { label = circleLabel; type = 'ellipse'; }
                else if (diamondLabel) { label = diamondLabel; type = 'diamond'; }

                nodes.set(id, { id, label, type });
            }
        }
    });

    // 3. Populate Dagre Graph
    nodes.forEach(node => {
        let w = 150, h = 80; // Standard Rectangle
        if (node.type === 'ellipse') { w = 120; h = 120; } // Circles need equal W/H
        if (node.type === 'diamond') { w = 160; h = 100; }

        // CRITICAL: Dagre needs these exact values to calculate spacing
        g.setNode(node.id, {
            label: node.label,
            width: w,
            height: h,
            type: node.type
        });
    });

    edges.forEach(edge => {
        g.setEdge(edge.fromId, edge.toId, { label: edge.label });
    });

    // 4. Run Layout
    try {
        dagre.layout(g);
    } catch (e) {
        console.error("Dagre Layout Error:", e);
        return [];
    }

    // 5. Convert to Canvas Shapes
    let shapes = [];
    const groupMap = new Map();

    // Nodes
    g.nodes().forEach(v => {
        const node = g.node(v);
        // Only valid nodes
        if (node && node.x !== undefined && node.y !== undefined) {
            let fillColor = '#ffffff';
            if (node.type === 'diamond') fillColor = '#fff3cd';

            // Base jitter for organic feel
            const jitterX = Math.random() * 8 - 4;
            const jitterY = Math.random() * 8 - 4;
            const rotation = Math.random() * 2 - 1;

            const groupShape = createNode(v, node.label, node.x + jitterX, node.y + jitterY, node.type, node.width, node.height);
            groupShape.rotation = rotation;
            groupShape.children[0].fillColor = fillColor;

            shapes.push(groupShape);
            groupMap.set(v, groupShape);
        }
    });

    const isHorizontal = g.graph().rankdir === 'LR';

    // Edges
    g.edges().forEach(e => {
        const edge = g.edge(e);
        const sourceGroup = groupMap.get(e.v);
        const targetGroup = groupMap.get(e.w);

        if (sourceGroup && targetGroup) {
            // Pass the already jittered and rotated group positions
            const edgeShapes = createEdge(sourceGroup, targetGroup, edge.label);
            const reqEdge = edgeShapes[0];

            // Adjust the start/end positions based on rankdir so arrows don't start at the very center of nodes
            const dir = g.graph().rankdir;
            const w1 = sourceGroup.width / 2;
            const h1 = sourceGroup.height / 2;
            const w2 = targetGroup.width / 2;
            const h2 = targetGroup.height / 2;

            let startX = sourceGroup.x;
            let startY = sourceGroup.y;
            let endX = targetGroup.x;
            let endY = targetGroup.y;

            if (dir === 'LR') {
                startX += w1;
                endX -= w2;
            } else {
                startY += h1;
                endY -= h2;
            }

            const cx = startX + (endX - startX) / 2;
            const cy = startY + (endY - startY) / 2;
            reqEdge.x = cx;
            reqEdge.y = cy;
            reqEdge.width = Math.abs(endX - startX);
            reqEdge.height = Math.abs(endY - startY);
            reqEdge.points = [
                { x: startX - cx, y: startY - cy },
                { x: endX - cx, y: endY - cy }
            ];

            if (edgeShapes[1]) {
                edgeShapes[1].x = startX + reqEdge.width / 2;
                edgeShapes[1].y = startY + reqEdge.height / 2;
            }

            shapes.push(...edgeShapes);
        }
    });

    // 6. Auto Centering
    if (shapes.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        shapes.forEach(s => {
            if (s.type === 'arrow') return; // skip for bounding box of nodes
            const hw = (s.width || 0) / 2;
            const hh = (s.height || 0) / 2;
            minX = Math.min(minX, s.x - hw);
            minY = Math.min(minY, s.y - hh);
            maxX = Math.max(maxX, s.x + hw);
            maxY = Math.max(maxY, s.y + hh);
        });

        if (minX !== Infinity) {
            const centerX = minX + (maxX - minX) / 2;
            const centerY = minY + (maxY - minY) / 2;

            // Shift everything to 0,0 center
            shapes.forEach(s => {
                s.x -= centerX;
                s.y -= centerY;
            });
        }
    }

    return shapes;
}
