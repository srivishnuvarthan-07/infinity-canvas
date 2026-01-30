export function drawLine(ctx, shape, isArrow = false) {
    // Fabric lines are often defined by x1,y1,x2,y2. 
    // But our schema normalize to center x,y and width/height? 
    // OR we kept x1,y1 logic. 
    // In our adapter we used `new fabric.Line([0, 0, w, h])` effectively implying
    // the shape is a bounding box with a line inside.
    // For simple drawing, let's assume the line goes from -w/2, -h/2 to w/2, h/2
    // IF rotation handles the angle. 
    // However, lines can have arbitrary slope inside the box.
    // Let's simplify: Draw a line from left to right of the bounding box

    const halfLen = shape.width / 2; // Assuming horizontal line rotated by `rotation`

    ctx.strokeStyle = shape.strokeColor;
    ctx.lineWidth = shape.strokeWidth;
    ctx.lineCap = 'round';

    if (shape.strokeStyle === 'dashed') {
        ctx.setLineDash([shape.strokeWidth * 3, shape.strokeWidth * 3]);
    } else if (shape.strokeStyle === 'dotted') {
        ctx.setLineDash([shape.strokeWidth, shape.strokeWidth * 2]);
    } else {
        ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(-halfLen, 0);
    ctx.lineTo(halfLen, 0);
    ctx.stroke();

    if (isArrow) {
        // Draw Arrowhead
        const headLen = shape.strokeWidth * 4;
        const angle = Math.PI / 6;

        ctx.beginPath();
        ctx.moveTo(halfLen, 0);
        ctx.lineTo(halfLen - headLen * Math.cos(angle), -headLen * Math.sin(angle));
        ctx.moveTo(halfLen, 0);
        ctx.lineTo(halfLen - headLen * Math.cos(angle), headLen * Math.sin(angle));
        ctx.stroke();
    }
}
