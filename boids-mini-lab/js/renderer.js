// ===== Renderer - Canvas Drawing =====

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Display settings (synced with CONFIG)
        this.theme = CONFIG.display.theme;
        this.trailOpacity = CONFIG.display.trailOpacity;
        this.quadtreeVisualization = CONFIG.display.quadtreeVisualization;
        this.palette = 'warm';

        // Boid inspection overlays
        this.showPerceptionCone = true;
        this.showNeighborConnections = true;
        this.showVelocity = true;

        // Performance
        this.lastDrawTime = 0;
    }

    // Resize canvas maintaining aspect ratio
    resize(containerWidth, containerHeight) {
        const aspectRatio = CONFIG.canvas.aspectRatio;

        let width = containerWidth;
        let height = containerWidth / aspectRatio;

        if (height > containerHeight) {
            height = containerHeight;
            width = containerHeight * aspectRatio;
        }

        // Ensure minimum size
        width = Math.max(width, CONFIG.canvas.minWidth);
        height = Math.max(height, CONFIG.canvas.minHeight);

        this.canvas.width = width;
        this.canvas.height = height;

        return { width, height };
    }

    // Clear canvas with trail effect
    clear() {
        const themeColors = CONFIG.themes[this.theme];

        if (this.trailOpacity > 0) {
            // Semi-transparent overlay for trail effect
            const opacity = 1 - this.trailOpacity;
            this.ctx.fillStyle = themeColors.trailOverlay + opacity + ')';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Full clear
            this.ctx.fillStyle = themeColors.background;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // Get color for species
    getSpeciesColor(species) {
        const paletteColors = CONFIG.palettes[this.palette].colors;
        return paletteColors[species % paletteColors.length];
    }

    // Draw a single boid
    drawBoid(boid, isSelected = false) {
        const { x, y } = boid.position;
        const angle = boid.velocity.heading();
        const speed = boid.velocity.mag();

        // Size varies slightly with speed
        const baseSize = CONFIG.boid.baseSize;
        const elongation = 1 + (speed / CONFIG.behavior.maxSpeed) * CONFIG.boid.speedElongation;
        const size = baseSize * elongation;

        const color = this.getSpeciesColor(boid.species);

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);

        // Draw shape based on species
        this.ctx.fillStyle = color;
        this.ctx.beginPath();

        const shape = CONFIG.shapes[boid.species % CONFIG.shapes.length];

        if (shape === 'bird') {
            // Bird silhouette
            this.ctx.moveTo(size, 0);
            this.ctx.lineTo(-size * 0.5, -size * 0.6);
            this.ctx.lineTo(-size * 0.2, 0);
            this.ctx.lineTo(-size * 0.5, size * 0.6);
            this.ctx.closePath();
        } else if (shape === 'fish') {
            // Fish shape
            this.ctx.moveTo(size, 0);
            this.ctx.quadraticCurveTo(0, -size * 0.5, -size * 0.6, -size * 0.3);
            this.ctx.lineTo(-size * 0.8, -size * 0.5);
            this.ctx.lineTo(-size * 0.6, 0);
            this.ctx.lineTo(-size * 0.8, size * 0.5);
            this.ctx.lineTo(-size * 0.6, size * 0.3);
            this.ctx.quadraticCurveTo(0, size * 0.5, size, 0);
            this.ctx.closePath();
        } else {
            // Arrow/triangle
            this.ctx.moveTo(size, 0);
            this.ctx.lineTo(-size * 0.7, -size * 0.5);
            this.ctx.lineTo(-size * 0.4, 0);
            this.ctx.lineTo(-size * 0.7, size * 0.5);
            this.ctx.closePath();
        }

        this.ctx.fill();

        // Draw selection highlight
        if (isSelected) {
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size * 1.5, 0, Math.PI * 2);
            this.ctx.stroke();

            // Outer glow
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.5;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size * 2, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }

        this.ctx.restore();
    }

    // Draw perception cone for selected boid
    drawPerceptionCone(boid, perceptionRadius, perceptionAngle) {
        if (!this.showPerceptionCone) return;

        const { x, y } = boid.position;
        const heading = boid.velocity.heading();
        const halfFov = Utils.degToRad(perceptionAngle) / 2;

        this.ctx.save();
        this.ctx.globalAlpha = 0.15;
        this.ctx.fillStyle = this.getSpeciesColor(boid.species);

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.arc(x, y, perceptionRadius, heading - halfFov, heading + halfFov);
        this.ctx.closePath();
        this.ctx.fill();

        // Cone outline
        this.ctx.globalAlpha = 0.4;
        this.ctx.strokeStyle = this.getSpeciesColor(boid.species);
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        this.ctx.restore();
    }

    // Draw connections to neighbors
    drawNeighborConnections(boid) {
        if (!this.showNeighborConnections) return;

        const color = this.getSpeciesColor(boid.species);

        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;

        // Draw to same-species neighbors (solid)
        this.ctx.globalAlpha = 0.4;
        for (const neighbor of boid.sameSpeciesNeighbors) {
            this.ctx.beginPath();
            this.ctx.moveTo(boid.position.x, boid.position.y);
            this.ctx.lineTo(neighbor.position.x, neighbor.position.y);
            this.ctx.stroke();
        }

        // Draw to other-species neighbors (dashed)
        this.ctx.setLineDash([4, 4]);
        this.ctx.globalAlpha = 0.2;
        for (const neighbor of boid.neighbors) {
            if (neighbor.species !== boid.species) {
                this.ctx.beginPath();
                this.ctx.moveTo(boid.position.x, boid.position.y);
                this.ctx.lineTo(neighbor.position.x, neighbor.position.y);
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }

    // Draw velocity vector
    drawVelocityVector(boid) {
        if (!this.showVelocity) return;

        const { x, y } = boid.position;
        const vel = boid.velocity.copy().mult(10);

        this.ctx.save();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.8;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + vel.x, y + vel.y);
        this.ctx.stroke();

        // Arrowhead
        const angle = vel.heading();
        const arrowSize = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(x + vel.x, y + vel.y);
        this.ctx.lineTo(
            x + vel.x - arrowSize * Math.cos(angle - 0.5),
            y + vel.y - arrowSize * Math.sin(angle - 0.5)
        );
        this.ctx.moveTo(x + vel.x, y + vel.y);
        this.ctx.lineTo(
            x + vel.x - arrowSize * Math.cos(angle + 0.5),
            y + vel.y - arrowSize * Math.sin(angle + 0.5)
        );
        this.ctx.stroke();

        this.ctx.restore();
    }

    // Draw quadtree visualization
    drawQuadtree(quadtree) {
        if (this.quadtreeVisualization === 'off' || !quadtree) return;

        const boundaries = quadtree.getAllBoundaries();
        const maxDepth = Math.max(...boundaries.map(b => b.depth));

        this.ctx.save();

        for (const bound of boundaries) {
            if (this.quadtreeVisualization === 'grid') {
                // Simple grid lines
                this.ctx.strokeStyle = this.theme === 'nature' ? '#1a3a5a' : '#cccccc';
                this.ctx.lineWidth = 1;
                this.ctx.globalAlpha = 0.5;
            } else if (this.quadtreeVisualization === 'active') {
                // Highlight nodes with boids
                const intensity = bound.count > 0 ? 0.3 : 0.1;
                this.ctx.strokeStyle = this.theme === 'nature' ? '#4ECDC4' : '#0066CC';
                this.ctx.lineWidth = bound.count > 0 ? 2 : 1;
                this.ctx.globalAlpha = intensity;
            } else if (this.quadtreeVisualization === 'heatmap') {
                // Color by boid count
                const hue = Utils.map(bound.count, 0, 10, 200, 0); // Blue to red
                this.ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.2)`;
                this.ctx.fillRect(bound.x, bound.y, bound.w, bound.h);
                this.ctx.strokeStyle = `hsla(${hue}, 70%, 50%, 0.5)`;
                this.ctx.lineWidth = 1;
                this.ctx.globalAlpha = 1;
            }

            this.ctx.strokeRect(bound.x, bound.y, bound.w, bound.h);
        }

        this.ctx.restore();
    }

    // Draw shepherd influence circle
    drawShepherd(position, radius, mode) {
        if (mode === 'neutral' || !position) return;

        this.ctx.save();

        const color = mode === 'repel' ? '#FF6B6B' : '#4ECDC4';

        // Outer circle
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.4;
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
        this.ctx.stroke();

        // Inner glow
        const gradient = this.ctx.createRadialGradient(
            position.x, position.y, 0,
            position.x, position.y, radius
        );
        gradient.addColorStop(0, color.replace(')', ', 0.2)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, 'transparent');

        this.ctx.fillStyle = gradient;
        this.ctx.globalAlpha = 0.3;
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Center dot
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    // Main render function
    render(flock, shepherd) {
        this.clear();

        // Draw quadtree first (background layer)
        this.drawQuadtree(flock.quadtree);

        // Draw shepherd influence
        if (shepherd) {
            this.drawShepherd(shepherd.position, shepherd.radius, shepherd.mode);
        }

        // Draw selected boid overlays first (so boids draw on top)
        if (flock.selectedBoid) {
            this.drawPerceptionCone(
                flock.selectedBoid,
                flock.perceptionRadius,
                flock.perceptionAngle
            );
            this.drawNeighborConnections(flock.selectedBoid);
        }

        // Draw all boids
        for (const boid of flock.boids) {
            this.drawBoid(boid, boid === flock.selectedBoid);
        }

        // Draw velocity vector for selected boid (on top)
        if (flock.selectedBoid) {
            this.drawVelocityVector(flock.selectedBoid);
        }
    }

    // Set theme
    setTheme(theme) {
        this.theme = theme;
    }

    // Set trail opacity
    setTrailOpacity(opacity) {
        this.trailOpacity = opacity;
    }

    // Set quadtree visualization mode
    setQuadtreeVisualization(mode) {
        this.quadtreeVisualization = mode;
    }

    // Set color palette
    setPalette(palette) {
        this.palette = palette;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}
