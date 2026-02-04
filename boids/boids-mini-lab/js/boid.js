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
        this.neighborDistances = new Map(); // Cache distances for smoothing

        // Visual state tracking
        this.previousHeading = this.velocity.heading();
        this.headingChangeRate = 0; // For "turn waves" visual effect
        this.currentSpeed = this.velocity.mag();
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

    // Calculate perception smoothing factor based on distance
    // Uses smoothStep to gradually apply forces as neighbors enter perception zone
    getPerceptionWeight(distance, perceptionRadius) {
        // Inner zone (full effect) to outer zone (fading effect)
        const innerRadius = perceptionRadius * 0.3;
        const outerRadius = perceptionRadius;

        if (distance <= innerRadius) return 1.0;
        if (distance >= outerRadius) return 0.0;

        // Smooth transition using smoothStep
        const t = (distance - innerRadius) / (outerRadius - innerRadius);
        return 1.0 - Utils.smoothStep(t);
    }

    // SEPARATION: Steer away from nearby boids (all species)
    // Uses non-linear weighting for very close boids to prevent overlap
    separation(neighbors, width, height, boundaryMode, perceptionRadius) {
        const steering = new Vector(0, 0);
        let totalWeight = 0;

        // Critical distance threshold - exponential repulsion below this
        const criticalDistance = CONFIG.boid.baseSize * 3;

        for (const other of neighbors) {
            if (other === this) continue;

            let diff;
            let distance;

            if (boundaryMode === 'wrap') {
                diff = Utils.wrappedDirection(other.position, this.position, width, height);
                distance = diff.mag();
            } else {
                diff = Vector.sub(this.position, other.position);
                distance = diff.mag();
            }

            if (distance > 0) {
                diff.normalize();

                // Non-linear weighting: exponential when very close
                let weight;
                if (distance < criticalDistance) {
                    // Exponential repulsion for very close boids (prevents overlap)
                    const normalizedDist = distance / criticalDistance;
                    weight = Math.pow(1 - normalizedDist, 2) * 3 + 1; // Strong push when close
                } else {
                    // Standard inverse distance with perception smoothing
                    const perceptionWeight = this.getPerceptionWeight(distance, perceptionRadius);
                    weight = perceptionWeight / distance;
                }

                diff.mult(weight);
                steering.add(diff);
                totalWeight += weight;
            }
        }

        if (totalWeight > 0) {
            steering.div(totalWeight);
            if (steering.magSq() > 0) {
                steering.setMag(CONFIG.behavior.maxSpeed);
                steering.sub(this.velocity);
                steering.limit(CONFIG.behavior.maxForce);
            }
        }

        return steering;
    }

    // ALIGNMENT: Steer toward average heading of same-species neighbors
    // With perception smoothing
    alignment(sameSpeciesNeighbors, perceptionRadius, width, height, boundaryMode) {
        const steering = new Vector(0, 0);
        let totalWeight = 0;

        for (const other of sameSpeciesNeighbors) {
            if (other === this) continue;

            const distance = this.distanceTo(other, width, height, boundaryMode);
            const weight = this.getPerceptionWeight(distance, perceptionRadius);

            const weightedVel = other.velocity.copy().mult(weight);
            steering.add(weightedVel);
            totalWeight += weight;
        }

        if (totalWeight > 0) {
            steering.div(totalWeight);
            steering.setMag(CONFIG.behavior.maxSpeed);
            steering.sub(this.velocity);
            steering.limit(CONFIG.behavior.maxForce);
        }

        return steering;
    }

    // COHESION: Steer toward center of same-species neighbors
    // With perception smoothing
    cohesion(sameSpeciesNeighbors, width, height, boundaryMode, perceptionRadius) {
        const center = new Vector(0, 0);
        let totalWeight = 0;

        for (const other of sameSpeciesNeighbors) {
            if (other === this) continue;

            const distance = this.distanceTo(other, width, height, boundaryMode);
            const weight = this.getPerceptionWeight(distance, perceptionRadius);

            if (boundaryMode === 'wrap') {
                const dir = Utils.wrappedDirection(this.position, other.position, width, height);
                center.add(dir.mult(weight));
            } else {
                const weightedPos = other.position.copy().mult(weight);
                center.add(weightedPos);
            }
            totalWeight += weight;
        }

        if (totalWeight > 0) {
            if (boundaryMode === 'wrap') {
                center.div(totalWeight);
                const target = Vector.add(this.position, center);
                return this.seek(target);
            } else {
                center.div(totalWeight);
                return this.seek(center);
            }
        }

        return new Vector(0, 0);
    }

    // Predictive obstacle avoidance using look-ahead vector
    avoidObstacles(obstacles, width, height, boundaryMode) {
        if (!obstacles || obstacles.length === 0) return new Vector(0, 0);

        const steering = new Vector(0, 0);

        // Look-ahead distance based on current speed
        const lookAhead = Math.max(30, this.currentSpeed * 15);

        // Project future position
        const futurePos = this.velocity.copy().normalize().mult(lookAhead).add(this.position);

        for (const obstacle of obstacles) {
            // Calculate distance from future position to obstacle center
            let distToObstacle;
            if (boundaryMode === 'wrap') {
                distToObstacle = Utils.wrappedDistance(
                    futurePos.x, futurePos.y,
                    obstacle.x, obstacle.y,
                    width, height
                );
            } else {
                distToObstacle = Math.sqrt(
                    Math.pow(futurePos.x - obstacle.x, 2) +
                    Math.pow(futurePos.y - obstacle.y, 2)
                );
            }

            // Check if collision is imminent
            const collisionBuffer = obstacle.radius + CONFIG.boid.baseSize * 2;

            if (distToObstacle < collisionBuffer) {
                // Calculate avoidance direction (perpendicular to velocity)
                let avoidDir;
                if (boundaryMode === 'wrap') {
                    avoidDir = Utils.wrappedDirection(obstacle, this.position, width, height);
                } else {
                    avoidDir = Vector.sub(this.position, new Vector(obstacle.x, obstacle.y));
                }

                // Stronger avoidance when closer to collision
                const urgency = 1 - (distToObstacle / collisionBuffer);
                avoidDir.normalize().mult(urgency * CONFIG.behavior.maxForce * 3);
                steering.add(avoidDir);
            }
        }

        return steering;
    }

    // Apply flocking behavior
    flock(quadtree, width, height, boundaryMode, perceptionRadius, perceptionAngle, obstacles = []) {
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

        // Calculate steering forces with perception smoothing
        const sep = this.separation(this.neighbors, width, height, boundaryMode, perceptionRadius);
        const ali = this.alignment(this.sameSpeciesNeighbors, perceptionRadius, width, height, boundaryMode);
        const coh = this.cohesion(this.sameSpeciesNeighbors, width, height, boundaryMode, perceptionRadius);
        const avoid = this.avoidObstacles(obstacles, width, height, boundaryMode);

        // Apply weights from config
        sep.mult(CONFIG.behavior.separation);
        ali.mult(CONFIG.behavior.alignment);
        coh.mult(CONFIG.behavior.cohesion);

        // Apply forces
        this.applyForce(sep);
        this.applyForce(ali);
        this.applyForce(coh);
        this.applyForce(avoid);
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
            // Use smoothStep for gradual effect at edges
            const normalizedDist = distance / shepherdRadius;
            const smoothFactor = 1 - Utils.smoothStep(normalizedDist);
            const strength = shepherdStrength * smoothFactor;

            direction.normalize();
            direction.mult(strength);
            direction.limit(CONFIG.behavior.maxForce * 2);
            this.applyForce(direction);
        }
    }

    // Update position and track visual state
    update() {
        // Store previous heading for turn wave calculation
        this.previousHeading = this.velocity.heading();

        this.velocity.add(this.acceleration);
        this.velocity.limit(CONFIG.behavior.maxSpeed);
        this.position.add(this.velocity);

        // Update visual state tracking
        const currentHeading = this.velocity.heading();
        let headingDiff = currentHeading - this.previousHeading;

        // Normalize angle difference to -PI to PI
        while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
        while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;

        // Smooth the heading change rate (for turn waves visual)
        this.headingChangeRate = Utils.lerp(this.headingChangeRate, Math.abs(headingDiff), 0.3);
        this.currentSpeed = this.velocity.mag();

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
