// ===== Flock Manager - Manages All Boids =====

class Flock {
    constructor(width, height) {
        this.boids = [];
        this.width = width;
        this.height = height;
        this.quadtree = null;

        // Settings (synced with CONFIG)
        this.boundaryMode = CONFIG.simulation.boundaryMode;
        this.speciesCount = CONFIG.simulation.speciesCount;
        this.perceptionRadius = CONFIG.behavior.neighborRadius;
        this.perceptionAngle = CONFIG.behavior.perceptionAngle;

        // Selected boid for inspection
        this.selectedBoid = null;
    }

    // Initialize flock with boids
    init(count) {
        this.boids = [];
        Boid.nextId = 0; // Reset ID counter

        for (let i = 0; i < count; i++) {
            this.addBoid();
        }
    }

    // Add a single boid at random position
    addBoid(x = null, y = null) {
        const px = x !== null ? x : Utils.random(0, this.width);
        const py = y !== null ? y : Utils.random(0, this.height);

        // Assign species evenly
        const species = this.boids.length % this.speciesCount;

        const boid = new Boid(px, py, species);
        this.boids.push(boid);
        return boid;
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
    }

    // Build quadtree from current boid positions
    buildQuadtree() {
        const boundary = new Rectangle(
            this.width / 2,
            this.height / 2,
            this.width / 2,
            this.height / 2
        );
        this.quadtree = new Quadtree(boundary);

        for (const boid of this.boids) {
            this.quadtree.insert(boid);
        }
    }

    // Update all boids
    update(shepherdPos, shepherdRadius, shepherdMode, shepherdStrength) {
        // Rebuild quadtree each frame
        this.buildQuadtree();

        // Update each boid
        for (const boid of this.boids) {
            // Apply flocking behavior
            boid.flock(
                this.quadtree,
                this.width,
                this.height,
                this.boundaryMode,
                this.perceptionRadius,
                this.perceptionAngle
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
