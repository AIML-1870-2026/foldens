// ===== Quadtree Spatial Partitioning =====

class Rectangle {
    constructor(x, y, w, h) {
        this.x = x;      // Center x
        this.y = y;      // Center y
        this.w = w;      // Half width
        this.h = h;      // Half height
    }

    // Check if this rectangle contains a point
    contains(point) {
        return (
            point.x >= this.x - this.w &&
            point.x < this.x + this.w &&
            point.y >= this.y - this.h &&
            point.y < this.y + this.h
        );
    }

    // Check if this rectangle intersects another rectangle
    intersects(range) {
        return !(
            range.x - range.w > this.x + this.w ||
            range.x + range.w < this.x - this.w ||
            range.y - range.h > this.y + this.h ||
            range.y + range.h < this.y - this.h
        );
    }

    // Check if this rectangle intersects a circle
    intersectsCircle(cx, cy, radius) {
        // Find closest point on rectangle to circle center
        const closestX = Utils.clamp(cx, this.x - this.w, this.x + this.w);
        const closestY = Utils.clamp(cy, this.y - this.h, this.y + this.h);

        const dx = cx - closestX;
        const dy = cy - closestY;
        return (dx * dx + dy * dy) < (radius * radius);
    }
}

class Quadtree {
    constructor(boundary, capacity = CONFIG.quadtree.maxBoidsPerNode, depth = 0) {
        this.boundary = boundary;    // Rectangle boundary
        this.capacity = capacity;    // Max points before subdivision
        this.depth = depth;          // Current depth level
        this.points = [];            // Points in this node
        this.divided = false;        // Has this node been subdivided?

        // Child nodes (created on subdivision)
        this.northeast = null;
        this.northwest = null;
        this.southeast = null;
        this.southwest = null;

        // Statistics
        this.totalPoints = 0;
    }

    // Subdivide this node into 4 children
    subdivide() {
        const x = this.boundary.x;
        const y = this.boundary.y;
        const w = this.boundary.w / 2;
        const h = this.boundary.h / 2;

        const ne = new Rectangle(x + w, y - h, w, h);
        const nw = new Rectangle(x - w, y - h, w, h);
        const se = new Rectangle(x + w, y + h, w, h);
        const sw = new Rectangle(x - w, y + h, w, h);

        this.northeast = new Quadtree(ne, this.capacity, this.depth + 1);
        this.northwest = new Quadtree(nw, this.capacity, this.depth + 1);
        this.southeast = new Quadtree(se, this.capacity, this.depth + 1);
        this.southwest = new Quadtree(sw, this.capacity, this.depth + 1);

        this.divided = true;

        // Redistribute existing points to children
        for (const point of this.points) {
            this.insertIntoChildren(point);
        }
        this.points = [];
    }

    // Insert a point into child nodes
    insertIntoChildren(point) {
        if (this.northeast.insert(point)) return true;
        if (this.northwest.insert(point)) return true;
        if (this.southeast.insert(point)) return true;
        if (this.southwest.insert(point)) return true;
        return false;
    }

    // Insert a point (boid) into the quadtree
    insert(point) {
        // Ignore if point is outside boundary
        if (!this.boundary.contains(point.position)) {
            return false;
        }

        this.totalPoints++;

        // If we have room and haven't subdivided, add here
        if (!this.divided) {
            if (this.points.length < this.capacity || this.depth >= CONFIG.quadtree.maxDepth) {
                this.points.push(point);
                return true;
            }

            // Otherwise, subdivide
            this.subdivide();
        }

        // Insert into appropriate child
        return this.insertIntoChildren(point);
    }

    // Query all points within a circular range
    queryCircle(cx, cy, radius, found = []) {
        // If range doesn't intersect this boundary, skip
        if (!this.boundary.intersectsCircle(cx, cy, radius)) {
            return found;
        }

        // Check points in this node
        const radiusSq = radius * radius;
        for (const point of this.points) {
            const dx = point.position.x - cx;
            const dy = point.position.y - cy;
            if (dx * dx + dy * dy <= radiusSq) {
                found.push(point);
            }
        }

        // Check children
        if (this.divided) {
            this.northeast.queryCircle(cx, cy, radius, found);
            this.northwest.queryCircle(cx, cy, radius, found);
            this.southeast.queryCircle(cx, cy, radius, found);
            this.southwest.queryCircle(cx, cy, radius, found);
        }

        return found;
    }

    // Query all points within a rectangular range
    queryRect(range, found = []) {
        // If range doesn't intersect this boundary, skip
        if (!this.boundary.intersects(range)) {
            return found;
        }

        // Check points in this node
        for (const point of this.points) {
            if (range.contains(point.position)) {
                found.push(point);
            }
        }

        // Check children
        if (this.divided) {
            this.northeast.queryRect(range, found);
            this.northwest.queryRect(range, found);
            this.southeast.queryRect(range, found);
            this.southwest.queryRect(range, found);
        }

        return found;
    }

    // Query with wrapping (for toroidal world)
    queryCircleWrapped(cx, cy, radius, width, height, found = []) {
        // Query the main position
        this.queryCircle(cx, cy, radius, found);

        // Check if we need to query wrapped positions
        const needLeft = cx - radius < 0;
        const needRight = cx + radius > width;
        const needTop = cy - radius < 0;
        const needBottom = cy + radius > height;

        // Query wrapped positions
        if (needLeft) {
            this.queryCircle(cx + width, cy, radius, found);
            if (needTop) this.queryCircle(cx + width, cy + height, radius, found);
            if (needBottom) this.queryCircle(cx + width, cy - height, radius, found);
        }
        if (needRight) {
            this.queryCircle(cx - width, cy, radius, found);
            if (needTop) this.queryCircle(cx - width, cy + height, radius, found);
            if (needBottom) this.queryCircle(cx - width, cy - height, radius, found);
        }
        if (needTop) {
            this.queryCircle(cx, cy + height, radius, found);
        }
        if (needBottom) {
            this.queryCircle(cx, cy - height, radius, found);
        }

        return found;
    }

    // Get all boundaries for visualization
    getAllBoundaries(boundaries = []) {
        boundaries.push({
            x: this.boundary.x - this.boundary.w,
            y: this.boundary.y - this.boundary.h,
            w: this.boundary.w * 2,
            h: this.boundary.h * 2,
            depth: this.depth,
            count: this.points.length
        });

        if (this.divided) {
            this.northeast.getAllBoundaries(boundaries);
            this.northwest.getAllBoundaries(boundaries);
            this.southeast.getAllBoundaries(boundaries);
            this.southwest.getAllBoundaries(boundaries);
        }

        return boundaries;
    }

    // Get statistics about the tree
    getStats() {
        let nodeCount = 1;
        let maxDepth = this.depth;
        let leafCount = this.divided ? 0 : 1;
        let totalPoints = this.points.length;

        if (this.divided) {
            const neStats = this.northeast.getStats();
            const nwStats = this.northwest.getStats();
            const seStats = this.southeast.getStats();
            const swStats = this.southwest.getStats();

            nodeCount += neStats.nodeCount + nwStats.nodeCount + seStats.nodeCount + swStats.nodeCount;
            maxDepth = Math.max(maxDepth, neStats.maxDepth, nwStats.maxDepth, seStats.maxDepth, swStats.maxDepth);
            leafCount += neStats.leafCount + nwStats.leafCount + seStats.leafCount + swStats.leafCount;
            totalPoints += neStats.totalPoints + nwStats.totalPoints + seStats.totalPoints + swStats.totalPoints;
        }

        return { nodeCount, maxDepth, leafCount, totalPoints };
    }

    // Clear the tree
    clear() {
        this.points = [];
        this.divided = false;
        this.totalPoints = 0;
        this.northeast = null;
        this.northwest = null;
        this.southeast = null;
        this.southwest = null;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Rectangle, Quadtree };
}
