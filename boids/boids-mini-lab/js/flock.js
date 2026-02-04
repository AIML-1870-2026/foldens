// ===== Flock Manager - Manages All Boids =====

class Flock {
    constructor(width, height) {
        this.boids = [];
        this.width = width;
        this.height = height;

        // Persistent quadtree (reused each frame to reduce GC)
        this.quadtree = null;
        this.quadtreeBoundary = null;

        // Obstacles for predictive avoidance
        this.obstacles = [];

        // Settings (synced with CONFIG)
        this.boundaryMode = CONFIG.simulation.boundaryMode;
        this.speciesCount = CONFIG.simulation.speciesCount;
        this.perceptionRadius = CONFIG.behavior.neighborRadius;
        this.perceptionAngle = CONFIG.behavior.perceptionAngle;

        // Selected boid for inspection
        this.selectedBoid = null;

        // Metrics tracking for live charts
        this.metrics = {
            history: [],
            maxHistory: 120, // ~2 seconds at 60fps
            lastUpdate: 0
        };
    }

    // Initialize flock with boids
    init(count) {
        this.boids = [];
        Boid.nextId = 0; // Reset ID counter

        for (let i = 0; i < count; i++) {
            this.addBoid();
        }

        // Initialize quadtree
        this.initQuadtree();
    }

    // Initialize or resize quadtree boundary
    initQuadtree() {
        this.quadtreeBoundary = new Rectangle(
            this.width / 2,
            this.height / 2,
            this.width / 2,
            this.height / 2
        );
        this.quadtree = new Quadtree(this.quadtreeBoundary);
    }

    // Add a single boid at random position
    addBoid(x = null, y = null, species = null) {
        const px = x !== null ? x : Utils.random(0, this.width);
        const py = y !== null ? y : Utils.random(0, this.height);

        // Assign species evenly unless specified
        const sp = species !== null ? species : this.boids.length % this.speciesCount;

        const boid = new Boid(px, py, sp);
        this.boids.push(boid);
        return boid;
    }

    // Add multiple boids at position (for interactive spawn)
    addBoidsAt(x, y, count = 1, spread = 20) {
        for (let i = 0; i < count; i++) {
            const offsetX = Utils.random(-spread, spread);
            const offsetY = Utils.random(-spread, spread);
            this.addBoid(x + offsetX, y + offsetY);
        }
    }

    // Remove boids to reach target count
    removeBoids(targetCount) {
        while (this.boids.length > targetCount) {
            // Remove random boid (not biased toward any position)
            const index = Utils.randomInt(0, this.boids.length - 1);

            // Clear selection if removed boid was selected
            if (this.boids[index] === this.selectedBoid) {
                this.selectedBoid = null;
            }

            this.boids.splice(index, 1);
        }
    }

    // Set boid count (add or remove as needed)
    setCount(count) {
        if (count > this.boids.length) {
            const toAdd = count - this.boids.length;
            for (let i = 0; i < toAdd; i++) {
                this.addBoid();
            }
        } else if (count < this.boids.length) {
            this.removeBoids(count);
        }
    }

    // Set species count and reassign boids
    setSpeciesCount(count) {
        this.speciesCount = count;
        // Reassign species to existing boids
        for (let i = 0; i < this.boids.length; i++) {
            this.boids[i].species = i % count;
        }
    }

    // Update canvas dimensions
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.initQuadtree(); // Recreate quadtree with new bounds
    }

    // Add an obstacle
    addObstacle(x, y, radius = 30) {
        this.obstacles.push({ x, y, radius, id: Date.now() });
    }

    // Remove obstacle by id or position
    removeObstacleAt(x, y) {
        const threshold = 40;
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            const dist = Math.sqrt(Math.pow(x - obs.x, 2) + Math.pow(y - obs.y, 2));
            if (dist < obs.radius + threshold) {
                this.obstacles.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    // Clear all obstacles
    clearObstacles() {
        this.obstacles = [];
    }

    // Build quadtree from current boid positions (reusing existing tree)
    buildQuadtree() {
        // Clear and reuse existing quadtree to reduce garbage collection
        if (this.quadtree) {
            this.quadtree.clear();
        } else {
            this.initQuadtree();
        }

        for (const boid of this.boids) {
            this.quadtree.insert(boid);
        }
    }

    // Calculate flock metrics for live charting
    calculateMetrics() {
        if (this.boids.length === 0) return null;

        let totalSpeed = 0;
        let speedSqSum = 0;
        let centerX = 0;
        let centerY = 0;

        for (const boid of this.boids) {
            const speed = boid.currentSpeed;
            totalSpeed += speed;
            speedSqSum += speed * speed;
            centerX += boid.position.x;
            centerY += boid.position.y;
        }

        const n = this.boids.length;
        const avgSpeed = totalSpeed / n;
        centerX /= n;
        centerY /= n;

        // Speed variance
        const speedVariance = (speedSqSum / n) - (avgSpeed * avgSpeed);

        // Flock compactness (average distance from center)
        let totalDist = 0;
        for (const boid of this.boids) {
            totalDist += Math.sqrt(
                Math.pow(boid.position.x - centerX, 2) +
                Math.pow(boid.position.y - centerY, 2)
            );
        }
        const compactness = totalDist / n;

        // Heading variance (how aligned the flock is)
        let headingX = 0;
        let headingY = 0;
        for (const boid of this.boids) {
            const heading = boid.velocity.heading();
            headingX += Math.cos(heading);
            headingY += Math.sin(heading);
        }
        const alignment = Math.sqrt(headingX * headingX + headingY * headingY) / n;

        return {
            avgSpeed,
            speedVariance,
            compactness,
            alignment,
            timestamp: performance.now()
        };
    }

    // Update metrics history
    updateMetrics() {
        const metrics = this.calculateMetrics();
        if (metrics) {
            this.metrics.history.push(metrics);

            // Keep only recent history
            while (this.metrics.history.length > this.metrics.maxHistory) {
                this.metrics.history.shift();
            }
        }
    }

    // Update all boids
    update(shepherdPos, shepherdRadius, shepherdMode, shepherdStrength) {
        // Rebuild quadtree each frame (reusing existing tree)
        this.buildQuadtree();

        // Update each boid
        for (const boid of this.boids) {
            // Apply flocking behavior with obstacles
            boid.flock(
                this.quadtree,
                this.width,
                this.height,
                this.boundaryMode,
                this.perceptionRadius,
                this.perceptionAngle,
                this.obstacles
            );

            // React to shepherd
            boid.reactToShepherd(
                shepherdPos,
                shepherdRadius,
                shepherdMode,
                shepherdStrength,
                this.width,
                this.height,
                this.boundaryMode
            );

            // Update position
            boid.update();

            // Handle boundaries
            boid.handleBoundaries(this.width, this.height, this.boundaryMode);
        }

        // Update metrics for charting
        this.updateMetrics();
    }

    // Find boid at position (for selection)
    getBoidAt(x, y, threshold = 15) {
        let closest = null;
        let closestDist = threshold;

        for (const boid of this.boids) {
            const dist = boid.position.dist(new Vector(x, y));
            if (dist < closestDist) {
                closestDist = dist;
                closest = boid;
            }
        }

        return closest;
    }

    // Select a boid for inspection
    selectBoid(boid) {
        this.selectedBoid = boid;
    }

    // Clear boid selection
    clearSelection() {
        this.selectedBoid = null;
    }

    // Get count by species
    getSpeciesCounts() {
        const counts = new Array(this.speciesCount).fill(0);
        for (const boid of this.boids) {
            if (boid.species < counts.length) {
                counts[boid.species]++;
            }
        }
        return counts;
    }

    // Reset flock to initial state
    reset(count) {
        this.selectedBoid = null;
        this.obstacles = [];
        this.metrics.history = [];
        this.init(count);
    }

    // Get current state for preset saving
    getState() {
        return {
            boidCount: this.boids.length,
            boundaryMode: this.boundaryMode,
            speciesCount: this.speciesCount
        };
    }

    // Apply state from preset
    applyState(state) {
        if (state.boundaryMode) this.boundaryMode = state.boundaryMode;
        if (state.speciesCount) this.setSpeciesCount(state.speciesCount);
        if (state.boidCount) this.setCount(state.boidCount);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Flock;
}
