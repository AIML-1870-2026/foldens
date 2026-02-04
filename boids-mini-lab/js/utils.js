// ===== Vector & Math Utilities =====

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    // Create a copy of this vector
    copy() {
        return new Vector(this.x, this.y);
    }

    // Add another vector
    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    // Subtract another vector
    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    // Multiply by a scalar
    mult(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }

    // Divide by a scalar
    div(n) {
        if (n !== 0) {
            this.x /= n;
            this.y /= n;
        }
        return this;
    }

    // Get magnitude (length)
    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    // Get magnitude squared (faster, no sqrt)
    magSq() {
        return this.x * this.x + this.y * this.y;
    }

    // Normalize to unit vector
    normalize() {
        const m = this.mag();
        if (m > 0) {
            this.div(m);
        }
        return this;
    }

    // Set magnitude
    setMag(n) {
        return this.normalize().mult(n);
    }

    // Limit magnitude to a maximum
    limit(max) {
        const magSq = this.magSq();
        if (magSq > max * max) {
            this.div(Math.sqrt(magSq)).mult(max);
        }
        return this;
    }

    // Get heading angle in radians
    heading() {
        return Math.atan2(this.y, this.x);
    }

    // Rotate by an angle in radians
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = this.x * cos - this.y * sin;
        const y = this.x * sin + this.y * cos;
        this.x = x;
        this.y = y;
        return this;
    }

    // Distance to another vector
    dist(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Distance squared (faster)
    distSq(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return dx * dx + dy * dy;
    }

    // Dot product
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    // Angle between this vector and another
    angleBetween(v) {
        const dot = this.dot(v);
        const mag1 = this.mag();
        const mag2 = v.mag();
        if (mag1 === 0 || mag2 === 0) return 0;
        const cosAngle = dot / (mag1 * mag2);
        // Clamp to handle floating point errors
        return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    }

    // Static methods for creating vectors without mutation

    static add(v1, v2) {
        return new Vector(v1.x + v2.x, v1.y + v2.y);
    }

    static sub(v1, v2) {
        return new Vector(v1.x - v2.x, v1.y - v2.y);
    }

    static mult(v, n) {
        return new Vector(v.x * n, v.y * n);
    }

    static div(v, n) {
        if (n === 0) return new Vector(v.x, v.y);
        return new Vector(v.x / n, v.y / n);
    }

    static dist(v1, v2) {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static fromAngle(angle) {
        return new Vector(Math.cos(angle), Math.sin(angle));
    }

    static random() {
        const angle = Math.random() * Math.PI * 2;
        return Vector.fromAngle(angle);
    }
}

// ===== Utility Functions =====

const Utils = {
    // Convert degrees to radians
    degToRad(degrees) {
        return degrees * (Math.PI / 180);
    },

    // Convert radians to degrees
    radToDeg(radians) {
        return radians * (180 / Math.PI);
    },

    // Random number between min and max
    random(min, max) {
        return Math.random() * (max - min) + min;
    },

    // Random integer between min and max (inclusive)
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Map a value from one range to another
    map(value, start1, stop1, start2, stop2) {
        return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
    },

    // Constrain a value between min and max
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    // Linear interpolation
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    // Check if a point is within a rectangle
    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    // Check if two rectangles intersect
    rectsIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    },

    // Check if a circle and rectangle intersect
    circleRectIntersect(cx, cy, radius, rx, ry, rw, rh) {
        const closestX = Utils.clamp(cx, rx, rx + rw);
        const closestY = Utils.clamp(cy, ry, ry + rh);
        const dx = cx - closestX;
        const dy = cy - closestY;
        return (dx * dx + dy * dy) < (radius * radius);
    },

    // Wrap a value around boundaries (for toroidal world)
    wrap(value, min, max) {
        const range = max - min;
        if (value < min) return value + range;
        if (value >= max) return value - range;
        return value;
    },

    // Check if angle2 is within the perception cone of angle1
    // angle1: heading direction, angle2: direction to other object
    // fov: field of view in radians
    isInPerceptionCone(angle1, angle2, fov) {
        let diff = angle2 - angle1;
        // Normalize to -PI to PI
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return Math.abs(diff) <= fov / 2;
    },

    // Smooth step function for smooth transitions
    smoothStep(t) {
        return t * t * (3 - 2 * t);
    },

    // Ease out quad
    easeOutQuad(t) {
        return t * (2 - t);
    },

    // Get wrapped distance (for toroidal world)
    wrappedDistance(x1, y1, x2, y2, width, height) {
        let dx = Math.abs(x2 - x1);
        let dy = Math.abs(y2 - y1);
        if (dx > width / 2) dx = width - dx;
        if (dy > height / 2) dy = height - dy;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // Get wrapped direction vector (for toroidal world)
    wrappedDirection(from, to, width, height) {
        let dx = to.x - from.x;
        let dy = to.y - from.y;

        if (dx > width / 2) dx -= width;
        else if (dx < -width / 2) dx += width;

        if (dy > height / 2) dy -= height;
        else if (dy < -height / 2) dy += height;

        return new Vector(dx, dy);
    },

    // Throttle function calls
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Debounce function calls
    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Vector, Utils };
}
