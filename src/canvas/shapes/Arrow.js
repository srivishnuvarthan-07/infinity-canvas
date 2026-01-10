import { Line } from "fabric";

export class Arrow extends Line {
    static type = "arrow";

    _render(ctx) {
        super._render(ctx);
        ctx.save();

        // The line is drawn from -width/2 to width/2 (or similar depending on origin)
        // But implementation of Line in Fabric can be tricky regarding coordinates.
        // It's safer to calculate the arrow head in the local coordinate system of the object.

        // In Fabric.js Line, x1/y1 and x2/y2 are relative to the center or top-left depending on origin.
        // Actually, simple Line typically sets coords based on the points array.

        // Let's rely on the fact that we render at (0,0) of the object's context
        // and the line extends from x1,y1 to x2,y2 *in local coords*.
        // BUT, standard Line render behavior often centers the line.

        // Strategy: Calculate the angle of the line and draw the head at the end.

        const xDiff = this.x2 - this.x1;
        const yDiff = this.y2 - this.y1;
        const angle = Math.atan2(yDiff, xDiff);

        // Move to the end point
        // Note: When fabric renders, it translates to the center of the object.
        // We need to draw relative to that.
        // However, since we are inside _render, we are already transformed.
        // We need to find where the "end" of the line is in this local space.

        // A safer way is to rely on x2, y2 property if it renders relative to valid coords.
        // But Fabric Line objects are sized by a bounding box.
        // Let's try drawing effectively at the "end" of the line length.

        // Since we don't know exactly how the Line was centered by Fabric's default logic without diving deep,
        // let's calculate the head position based on the line length and Angle.
        // Actually, let's just use the absolute coordinates converted to local? No.

        // Re-evaluating: 'this.calcLinePoints()' returns {x1, y1, x2, y2} relative to the object center.
        const points = this.calcLinePoints();

        const headLength = 15; // Or proportional to strokeWidth
        const arrowAngle = Math.PI / 6; // 30 degrees

        ctx.translate(points.x2, points.y2);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-headLength, headLength / 2); // approximate 
        ctx.lineTo(-headLength, -headLength / 2);
        ctx.closePath();

        ctx.fillStyle = this.stroke;
        ctx.fill();

        ctx.restore();
    }
}
