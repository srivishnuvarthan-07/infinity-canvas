import { getBounds } from "../geometry/geometry";

/**
 * Quadtree Implementation for Spatial Indexing
 */

export class Rectangle {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    contains(point) {
        return (
            point.x >= this.x - this.w / 2 &&
            point.x <= this.x + this.w / 2 &&
            point.y >= this.y - this.h / 2 &&
            point.y <= this.y + this.h / 2
        );
    }

    intersects(range) {
        return !(
            range.x - range.w / 2 > this.x + this.w / 2 ||
            range.x + range.w / 2 < this.x - this.w / 2 ||
            range.y - range.h / 2 > this.y + this.h / 2 ||
            range.y + range.h / 2 < this.y - this.h / 2
        );
    }
}

export class Quadtree {
    constructor(boundary, capacity) {
        this.boundary = boundary; // Rectangle
        this.capacity = capacity; // number
        this.shapes = [];
        this.divided = false;
    }

    subdivide() {
        const x = this.boundary.x;
        const y = this.boundary.y;
        const w = this.boundary.w / 2;
        const h = this.boundary.h / 2;

        const nw = new Rectangle(x - w / 2, y - h / 2, w, h);
        const ne = new Rectangle(x + w / 2, y - h / 2, w, h);
        const sw = new Rectangle(x - w / 2, y + h / 2, w, h);
        const se = new Rectangle(x + w / 2, y + h / 2, w, h);

        this.northwest = new Quadtree(nw, this.capacity);
        this.northeast = new Quadtree(ne, this.capacity);
        this.southwest = new Quadtree(sw, this.capacity);
        this.southeast = new Quadtree(se, this.capacity);

        this.divided = true;
    }

    insert(shape) {
        // Shape uses V2 nested schema, but might be legacy. Handle uniformly via geometry layer.
        const bounds = getBounds(shape);
        // Quadtree Rectangle expects center x, y and width, height
        const x = bounds.minX + bounds.width / 2;
        const y = bounds.minY + bounds.height / 2;
        const w = bounds.width;
        const h = bounds.height;

        if (!this.boundary.intersects(new Rectangle(x, y, w, h))) {
            return false;
        }

        if (this.shapes.length < this.capacity) {
            this.shapes.push(shape);
            return true;
        }

        if (!this.divided) {
            this.subdivide();
        }

        if (this.northwest.insert(shape)) return true;
        if (this.northeast.insert(shape)) return true;
        if (this.southwest.insert(shape)) return true;
        if (this.southeast.insert(shape)) return true;

        // Should not happen?
        // Actually for overlapping shapes it might trickle down.
        // For simplicity, we just push to children.
        return false;
    }

    query(range, found) {
        if (!found) found = [];

        if (!this.boundary.intersects(range)) {
            return found;
        }

        for (let shape of this.shapes) {
            // Check intersection (AABB) using geometry layer
            const bounds = getBounds(shape);
            const x = bounds.minX + bounds.width / 2;
            const y = bounds.minY + bounds.height / 2;
            const w = bounds.width;
            const h = bounds.height;

            const shapeRect = new Rectangle(x, y, w, h);
            if (range.intersects(shapeRect)) {
                found.push(shape);
            }
        }

        if (this.divided) {
            this.northwest.query(range, found);
            this.northeast.query(range, found);
            this.southwest.query(range, found);
            this.southeast.query(range, found);
        }

        return found;
    }
}
