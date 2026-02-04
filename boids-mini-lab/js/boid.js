// ===== Boid Class - Individual Agent =====

class Boid {
    constructor(x, y, species = 0) {
        this.position = new Vector(x, y);
        this.velocity = Vector.random().mult(Utils.random(2, CONFIG.behavior.maxSpeed));
        this.acceleration = new Vector(0, 0);
        this.species = species;

        // Unique ID for selection/tracking
        this.id = Boid.nextId++;

        // Cache for optimization
        this.neighbors = [];
        this.sameSpeciesNeighbors = [];
    }

    // Static ID counter
    static nextId = 0;

    // Apply a force to the boid
    applyForce(force) {
        this.acceleration.add(force);
    }

    // Calculate steering force toward a target
    seek(target) {
        const desired = Vector.sub(target, this.position);
        desired.setMag(CONFIG.behavior.maxSpeed);
        const steer = Vector.sub(desired, this.velocity);
        steer.limit(CONFIG.behavior.maxForce);
        return steer;
    }

    // Calculate steering force away from a target
    flee(target) {
        const desired = Vector.sub(this.position, target);
        desired.setMag(CONFIG.behavior.maxSpeed);
        const steer = Vector.sub(desired, this.velocity);
        steer.limit(CONFIG.behavior.maxForce);
        return steer;
    }

    // Check if another boid is within perception cone
    canSee(other, perceptionAngle, width, height, boundaryMode) {
        const halfFov = Utils.degToRad(perceptionAngle) / 2;
        const heading = this.velocity.heading();

        // Get direction to other boid (handle wrapping if needed)
        let direction;
        if (boundaryMode === 'wrap') {
            direction = Utils.wrappedDirection(this.position, other.position, width, height);
        } else {
            direction = Vector.sub(other.position, this.position);
        }

        const angleToOther = direction.heading();

        // Check if within field of view
        return Utils.isInPerceptionCone(heading, angleToOther, halfFov * 2);
    }

    // Get distance to another boid (handling wrap)
    distanceTo(other, width, height, boundaryMode) {
        if (boundaryMode === 'wrap') {
            return Utils.wrappedDistance(
                this.position.x, this.position.y,
                other.position.x, other.position.y,
                width, height
            );
        }
        return this.position.dist(other.position);
    }

    // SEPARATION: Steer away from nearby boids (all species)
    separation(neighbors, width, height, boundaryMode) {
        const steering = new Vector(0, 0);
        let count = 0;

        for (const other of neighbors) {
            if (other === this) continue;

            let diff;
            if (boundaryMode === 'wrap') {
                diff = Utils.wrappedDirection(other.position, this.position, width, height);
            } else {
                diff = Vector.sub(this.position, other.position);
            }

            const distSq = diff.magSq();
            if (distSq > 0) {
                // Weight by inverse distance (closer = stronger repulsion)
                diff.normalize();
                diff.div(Math.sqrt(distSq));
                steering.add(diff);
                count++;
            }
        }

        if (count > 0) {
            steering.div(count);
            if (steering.magSq() > 0) {
                steering.setMag(CONFIG.behavior.maxSpeed);
                steering.sub(this.velocity);
                steering.limit(CONFIG.behavior.maxForce);
            }
        }

        return steering;
    }

    // ALIGNMENT: Steer toward average heading of same-species neighbors
    alignment(sameSpeciesNeighbors) {
        const steering = new Vector(0, 0);
        let count = 0;

        for (const other of sameSpeciesNeighbors) {
            if (other === this) continue;
            steering.add(other.velocity);
            count++;
        }

        if (count > 0) {
            steering.div(count);
            steering.setMag(CONFIG.behavior.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(CONFIG.behavior.maxForce);
        }

        return steering;
    }

    // COHESION: Steer toward center of same-species neighbors
    cohesion(sameSpeciesNeighbors, width, height, boundaryMode) {
        const center = new Vector(0, 0);
        let count = 0;

        for (const other of sameSpeciesNeighbors) {
            if (other === this) continue;

            if (boundaryMode === 'wrap') {
                // Add wrapped direction for proper averaging
                const dir = Utils.wrappedDirection(this.position, other.position, width, height);
                center.add(dir);
            } else {
                center.add(other.position);
            }
            count++;
        }

        if (count > 0) {
            if (boundaryMode === 'wrap') {
                // Average direction, then add to current position
                center.div(count);
                const target = Vector.add(this.position, center);
                return this.seek(target);
            } else {
                center.div(count);
                return this.seek(center);
            }
        }

        return new Vector(0, 0);
    }

    // Apply flocking behavior
    flock(quadtree, width, height, boundaryMode, perceptionRadius, perceptionAngle) {
        // Find nearby boids using quadtree
        let nearbyBoids;
        if (boundaryMode === 'wrap') {
            nearbyBoids = quadtree.queryCircleWrapped(
                this.position.x, this.position.y,
                perceptionRadius, width, height
            );
        } else {
            nearbyBoids = quadtree.queryCircle(
                this.position.x, this.position.y,
                perceptionRadius
            );
        }

        // Filter to only boids within perception cone
        this.neighbors = [];
        this.sameSpeciesNeighbors = [];

        for (const other of nearbyBoids) {
            if (other === this) continue;

            // Check if within perception cone
            if (perceptionAngle < 360) {
                if (!this.canSee(other, perceptionAngle, width, height, boundaryMode)) {
                    continue;
                }
            }

            this.neighbors.push(other);
            if (other.species === this.species) {
                this.sameSpeciesNeighbors.push(other);
            }
        }

        // Calculate steering forces
        const sep = this.separation(this.neighbors, width, height, boundaryMode);
        const ali = this.alignment(this.sameSpeciesNeighbors);
        const coh = this.cohesion(this.sameSpeciesNeighbors, width, height, boundaryMode);

        // Apply weights from config
        sep.mult(CONFIG.behavior.separation);
        ali.mult(CONFIG.behavior.alignment);
        coh.mult(CONFIG.behavior.cohesion);

        // Apply forces
        this.applyForce(sep);
        this.applyForce(ali);
        this.applyForce(coh);
    }

    // React to the shepherd (mouse cursor)
    reactToShepherd(shepherdPos, shepherdRadius, shepherdMode, shepherdStrength, width, height, boundaryMode) {
        if (shepherdMode === 'neutral' || !shepherdPos) return;

        let distance;
        let direction;

        if (boundaryMode === 'wrap') {
            distance = Utils.wrappedDistance(
                this.position.x, this.position.y,
                shepherdPos.x, shepherdPos.y,
                width, height
            );
            if (shepherdMode === 'repel') {
                direction = Utils.wrappedDirection(shepherdPos, this.position, width, height);
            } else {
                direction = Utils.wrappedDirection(this.position, shepherdPos, width, height);
            }
        } else {
            distance = this.position.dist(shepherdPos);
            if (shepherdMode === 'repel') {
                direction = Vector.sub(this.position, shepherdPos);
            } else {
                direction = Vector.sub(shepherdPos, this.position);
            }
        }

        if (distance < shepherdRadius && distance > 0) {
            // Stronger effect when closer
            const strength = Utils.map(distance, 0, shepherdRadius, shepherdStrength, 0);
            direction.normalize();
            direction.mult(strength);
            direction.limit(CONFIG.behavior.maxForce * 2);
            this.applyForce(direction);
        }
    }

    // Update position
    update() {
        this.velocity.add(this.acceleration);
        this.velocity.limit(CONFIG.behavior.maxSpeed);
        this.position.add(this.velocity);
        this.acceleration.mult(0); // Reset acceleration
    }

    // Handle boundary behavior
    handleBoundaries(width, height, boundaryMode) {
        if (boundaryMode === 'wrap') {
            // Wrap around edges
            if (this.position.x < 0) this.position.x += width;
            if (this.position.x >= width) this.position.x -= width;
            if (this.position.y < 0) this.position.y += height;
            if (this.position.y >= height) this.position.y -= height;
        } else {
            // Bounce off edges
            const margin = 50;
            const turnForce = 0.5;

            if (this.position.x < margin) {
                this.velocity.x += turnForce;
            }
            if (this.position.x > width - margin) {
                this.velocity.x -= turnForce;
            }
            if (this.position.y < margin) {
                this.velocity.y += turnForce;
            }
            if (this.position.y > height - margin) {
                this.velocity.y -= turnForce;
            }

            // Hard boundary
            this.position.x = Utils.clamp(this.position.x, 0, width);
            this.position.y = Utils.clamp(this.position.y, 0, height);
        }
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Boid;
}
