

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
    width: 120,
    height: 60,
    fillColor: '#ffffff',
};

/**
 * Creates a grouped node containing the shape and text so they drag together
 */
function createNode(text, x, y, type = 'rectangle', width = 120, height = 60) {
    const groupId = crypto.randomUUID();
    const nodeId = crypto.randomUUID();
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
        children: [nodeShape, textShape]
    };

    return groupShape;
}

/**
 * Creates a connector line between two nodes
 */
function createEdge(fromNode, toNode, label = '') {
    const edgeId = crypto.randomUUID();

    // Using connector schema properties instead of SVG line properties
    const lineShape = {
        ...defaultShapeProps,
        id: edgeId,
        type: 'connector',
        x: 0, // Connectors use start/end
        y: 0,
        rotation: 0,
        opacity: 1,
        variant: 'arrow',
        arrowType: 'straight',
        start: {
            x: fromNode.x,
            y: fromNode.y + fromNode.height / 2,
            shapeId: fromNode.id,
            anchor: 'bottom'
        },
        end: {
            x: toNode.x,
            y: toNode.y - toNode.height / 2,
            shapeId: toNode.id,
            anchor: 'top'
        },
        mid: {
            x: (fromNode.x + toNode.x) / 2,
            y: (fromNode.y + fromNode.height / 2 + toNode.y - toNode.height / 2) / 2,
            isManual: false
        }
    };

    const shapes = [lineShape];

    if (label) {
        const textId = crypto.randomUUID();
        const midX = lineShape.mid.x;
        const midY = lineShape.mid.y;
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
/**
/**
 * Main generator function that transforms AI intent to canvas shapes (Creative Whiteboard)
 * Architecture:
 * AI Scene -> Scene Validator -> Layout Resolver -> Layout Normalization -> Arrow Router -> Organic Noise -> Render -> Auto Center
 */
export function generateDiagramShapes(intent) {
    if (intent.intent_type === 'non_visual' || !intent.scene) {
        return [];
    }

    const { scene, layout_intent } = intent;
    let shapes = [];
    const nodeMap = new Map();

    const isHorizontal = layout_intent === 'horizontal_flow';
    const isVertical = layout_intent === 'vertical_stack';

    // ====== 1. Render & Organic Noise ======
    scene.forEach(item => {
        if (item.type === 'arrow') return;

        // Use AI-provided hybrid hints (-1.0 to 1.0), defaulting to center
        const xHint = item.x_hint || 0;
        const yHint = item.y_hint || 0;

        // Scale hints to a virtual viewport size (e.g., 800x600 spread)
        const SCALE_X = 400;
        const SCALE_Y = 300;

        const rawX = xHint * SCALE_X;
        const rawY = yHint * SCALE_Y;

        // Strict Mode vs Organic Mode noise
        let jitterX = 0, jitterY = 0, rotation = 0;

        if (isHorizontal || isVertical) {
            // Strictly controlled noise
            jitterX = Math.random() * 8 - 4;
            jitterY = Math.random() * 8 - 4;
            rotation = Math.random() * 1.5 - 0.75;
        } else {
            // Organic whiteboard noise
            jitterX = Math.random() * 24 - 12;
            jitterY = Math.random() * 24 - 12;
            rotation = Math.random() * 3 - 1.5;
        }

        // Apply jitter directly to AI coordinates
        const MathX = rawX + jitterX;
        const MathY = rawY + jitterY;

        // Note: The AI returns hints that we scaled, now these are pixels
        const worldX = MathX;
        const worldY = MathY;

        let type = item.type;
        let width = 120;
        let height = 60;
        let fillColor = '#ffffff';

        if (type === 'circle') { type = 'ellipse'; width = 80; height = 80; }
        if (type === 'diamond') { type = 'diamond'; width = 120; height = 100; fillColor = '#fff3cd'; }
        if (type === 'text') {
            type = 'text';
            width = Math.min(300, Math.max(100, (item.label?.length || 10) * 12));
            height = 60; // Give text more height clearance out of the box
            fillColor = 'transparent';
        }
        if (type === 'group') { type = 'rectangle'; width = 450; height = 350; fillColor = '#f0f4f8'; }

        const text = item.label || item.id;

        if (type === 'text') {
            const textId = crypto.randomUUID();
            const textShape = {
                ...defaultTextProps,
                id: textId,
                text,
                x: worldX,
                y: worldY - 20, // Nudge bare text up slightly so it doesn't overlap arrows as much
                rotation: rotation,
                opacity: 1,
                width: width,
                height: height,
                fontSize: 24,
                fontWeight: 'bold',
                fillColor: '#1a1a1a' // Ensure text is visible
            };
            nodeMap.set(item.id, textShape);
            shapes.push(textShape);
        } else {
            const groupShape = createNode(text, worldX, worldY, type, width, height);
            groupShape.rotation = rotation;

            if (item.type === 'group') {
                groupShape.children[0].opacity = 0.5;
                groupShape.children[0].strokeStyle = 'dashed';
                shapes.unshift(groupShape);
            } else {
                groupShape.children[0].fillColor = fillColor;
                shapes.push(groupShape);
            }
            nodeMap.set(item.id, groupShape);
        }
    });

    // ====== 2. Arrow Router ======
    scene.forEach(item => {
        if (item.type !== 'arrow') return;
        const sourceNode = nodeMap.get(item.from);
        const targetNode = nodeMap.get(item.to);

        if (sourceNode && targetNode) {
            const edgeShapes = createEdge(sourceNode, targetNode, item.label);
            const reqEdge = edgeShapes[0]; // the connector

            // Normalization: Snap arrows based on flow
            if (isHorizontal && reqEdge.type === 'connector') {
                reqEdge.start.anchor = 'right';
                reqEdge.end.anchor = 'left';
            } else if (isVertical && reqEdge.type === 'connector') {
                reqEdge.start.anchor = 'bottom';
                reqEdge.end.anchor = 'top';
            }

            shapes.push(...edgeShapes);
        }
    });

    // ====== 3. Auto Centering ======
    if (shapes.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        shapes.forEach(s => {
            if (s.type === 'connector') return; // skip for bounding box of nodes
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
                if (s.type === 'connector') {
                    // Update manual midpoints if any
                    if (s.mid && s.mid.isManual) {
                        s.mid.x -= centerX;
                        s.mid.y -= centerY;
                    }
                } else {
                    s.x -= centerX;
                    s.y -= centerY;
                }
            });
        }
    }

    return shapes;
}
