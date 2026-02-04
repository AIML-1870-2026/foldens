// ===== Renderer - Canvas Drawing with Performance Optimizations =====

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

        // Performance: Offscreen canvas for quadtree visualization
        this.quadtreeCanvas = document.createElement('canvas');
        this.quadtreeCtx = this.quadtreeCanvas.getContext('2d');
        this.quadtreeFrameCounter = 0;
        this.quadtreeUpdateInterval = 6; // Update every 6 frames

        // Performance: Offscreen boid shape cache
        this.boidShapeCache = new Map();
        this.shapeCacheSize = 16; // Size of cached boid images

        // Dynamic trails based on speed
        this.dynamicTrails = true;

        // Turn waves visualization
        this.turnWaves = true;

        // Chart rendering
        this.showChart = false;
        this.chartMetric = 'speedVariance'; // 'speedVariance', 'compactness', 'alignment'

        // Performance tracking
        this.lastDrawTime = 0;

        // Initialize shape cache
        this.initShapeCache();
    }

    // Initialize offscreen boid shape cache for performance
    initShapeCache() {
        const shapes = ['bird', 'fish', 'arrow'];
        const palettes = ['warm', 'cool', 'colorblind'];

        for (const paletteName of palettes) {
            const paletteColors = CONFIG.palettes[paletteName].colors;

            for (let speciesIndex = 0; speciesIndex < 3; speciesIndex++) {
                const color = paletteColors[speciesIndex % paletteColors.length];
                const shape = shapes[speciesIndex % shapes.length];

                // Create variations for different darkness levels (for turn waves)
                for (let darkness = 0; darkness <= 3; darkness++) {
                    const key = `${paletteName}-${speciesIndex}-${darkness}`;
                    const cache = this.createBoidShapeCanvas(shape, color, darkness * 0.15);
                    this.boidShapeCache.set(key, cache);
                }
            }
        }
    }

    // Create a cached boid shape on an offscreen canvas
    createBoidShapeCanvas(shape, color, darkenAmount = 0) {
        const size = this.shapeCacheSize;
        const canvas = document.createElement('canvas');
        canvas.width = size * 2;
        canvas.height = size * 2;
        const ctx = canvas.getContext('2d');

        ctx.translate(size, size);

        // Darken color for turn waves effect
        let drawColor = color;
        if (darkenAmount > 0) {
            drawColor = this.darkenColor(color, darkenAmount);
        }

        ctx.fillStyle = drawColor;
        ctx.beginPath();

        if (shape === 'bird') {
            ctx.moveTo(size, 0);
            ctx.lineTo(-size * 0.5, -size * 0.6);
            ctx.lineTo(-size * 0.2, 0);
            ctx.lineTo(-size * 0.5, size * 0.6);
            ctx.closePath();
        } else if (shape === 'fish') {
            ctx.moveTo(size, 0);
            ctx.quadraticCurveTo(0, -size * 0.5, -size * 0.6, -size * 0.3);
            ctx.lineTo(-size * 0.8, -size * 0.5);
            ctx.lineTo(-size * 0.6, 0);
            ctx.lineTo(-size * 0.8, size * 0.5);
            ctx.lineTo(-size * 0.6, size * 0.3);
            ctx.quadraticCurveTo(0, size * 0.5, size, 0);
            ctx.closePath();
        } else {
            ctx.moveTo(size, 0);
            ctx.lineTo(-size * 0.7, -size * 0.5);
            ctx.lineTo(-size * 0.4, 0);
            ctx.lineTo(-size * 0.7, size * 0.5);
            ctx.closePath();
        }

        ctx.fill();

        return canvas;
    }

    // Darken a hex color
    darkenColor(hex, amount) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);

        r = Math.max(0, Math.floor(r * (1 - amount)));
        g = Math.max(0, Math.floor(g * (1 - amount)));
        b = Math.max(0, Math.floor(b * (1 - amount)));

        return `rgb(${r}, ${g}, ${b})`;
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

        // Resize quadtree canvas too
        this.quadtreeCanvas.width = width;
        this.quadtreeCanvas.height = height;

        return { width, height };
    }

    // Clear canvas with trail effect
    clear(flock) {
        const themeColors = CONFIG.themes[this.theme];

        if (this.trailOpacity > 0) {
            // Dynamic trail based on average speed
            let trailMult = 1.0;
            if (this.dynamicTrails && flock && flock.boids.length > 0) {
                let avgSpeed = 0;
                for (const boid of flock.boids) {
                    avgSpeed += boid.currentSpeed;
                }
                avgSpeed /= flock.boids.length;
                // Faster average = longer trails
                trailMult = Utils.map(avgSpeed, 1, CONFIG.behavior.maxSpeed, 0.7, 1.3);
            }

            const opacity = (1 - this.trailOpacity * trailMult);
            this.ctx.fillStyle = themeColors.trailOverlay + Math.max(0.5, opacity) + ')';
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

    // Draw a single boid using cached shapes for performance
    drawBoid(boid, isSelected = false) {
        const { x, y } = boid.position;
        const angle = boid.velocity.heading();
        const speed = boid.currentSpeed;

        // Size varies slightly with speed
        const baseSize = CONFIG.boid.baseSize;
        const elongation = 1 + (speed / CONFIG.behavior.maxSpeed) * CONFIG.boid.speedElongation;
        const scale = (baseSize * elongation) / this.shapeCacheSize;

        // Turn waves: calculate darkness based on heading change rate
        let darknessLevel = 0;
        if (this.turnWaves) {
            // Map heading change rate to darkness level (0-3)
            darknessLevel = Math.min(3, Math.floor(boid.headingChangeRate * 20));
        }

        // Get cached shape
        const cacheKey = `${this.palette}-${boid.species}-${darknessLevel}`;
        const cachedShape = this.boidShapeCache.get(cacheKey);

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        this.ctx.scale(scale, scale);

        if (cachedShape) {
            // Use cached bitmap for performance
            this.ctx.drawImage(cachedShape, -this.shapeCacheSize, -this.shapeCacheSize);
        } else {
            // Fallback to direct drawing
            this.drawBoidShape(boid, 0, 0, this.shapeCacheSize);
        }

        this.ctx.restore();

        // Draw selection highlight
        if (isSelected) {
            const color = this.getSpeciesColor(boid.species);
            const size = baseSize * elongation;

            this.ctx.save();
            this.ctx.translate(x, y);

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

            this.ctx.restore();
        }
    }

    // Fallback boid shape drawing
    drawBoidShape(boid, x, y, size) {
        const color = this.getSpeciesColor(boid.species);
        const shape = CONFIG.shapes[boid.species % CONFIG.shapes.length];

        this.ctx.fillStyle = color;
        this.ctx.beginPath();

        if (shape === 'bird') {
            this.ctx.moveTo(x + size, y);
            this.ctx.lineTo(x - size * 0.5, y - size * 0.6);
            this.ctx.lineTo(x - size * 0.2, y);
            this.ctx.lineTo(x - size * 0.5, y + size * 0.6);
            this.ctx.closePath();
        } else if (shape === 'fish') {
            this.ctx.moveTo(x + size, y);
            this.ctx.quadraticCurveTo(x, y - size * 0.5, x - size * 0.6, y - size * 0.3);
            this.ctx.lineTo(x - size * 0.8, y - size * 0.5);
            this.ctx.lineTo(x - size * 0.6, y);
            this.ctx.lineTo(x - size * 0.8, y + size * 0.5);
            this.ctx.lineTo(x - size * 0.6, y + size * 0.3);
            this.ctx.quadraticCurveTo(x, y + size * 0.5, x + size, y);
            this.ctx.closePath();
        } else {
            this.ctx.moveTo(x + size, y);
            this.ctx.lineTo(x - size * 0.7, y - size * 0.5);
            this.ctx.lineTo(x - size * 0.4, y);
            this.ctx.lineTo(x - size * 0.7, y + size * 0.5);
            this.ctx.closePath();
        }

        this.ctx.fill();
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

    // Draw quadtree visualization (on separate canvas, updated less frequently)
    updateQuadtreeVisualization(quadtree) {
        if (this.quadtreeVisualization === 'off' || !quadtree) return;

        this.quadtreeFrameCounter++;
        if (this.quadtreeFrameCounter < this.quadtreeUpdateInterval) return;
        this.quadtreeFrameCounter = 0;

        const ctx = this.quadtreeCtx;
        ctx.clearRect(0, 0, this.quadtreeCanvas.width, this.quadtreeCanvas.height);

        const boundaries = quadtree.getAllBoundaries();

        for (const bound of boundaries) {
            if (this.quadtreeVisualization === 'grid') {
                ctx.strokeStyle = this.theme === 'nature' ? '#1a3a5a' : '#cccccc';
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.5;
            } else if (this.quadtreeVisualization === 'active') {
                const intensity = bound.count > 0 ? 0.3 : 0.1;
                ctx.strokeStyle = this.theme === 'nature' ? '#4ECDC4' : '#0066CC';
                ctx.lineWidth = bound.count > 0 ? 2 : 1;
                ctx.globalAlpha = intensity;
            } else if (this.quadtreeVisualization === 'heatmap') {
                const hue = Utils.map(bound.count, 0, 10, 200, 0);
                ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.2)`;
                ctx.fillRect(bound.x, bound.y, bound.w, bound.h);
                ctx.strokeStyle = `hsla(${hue}, 70%, 50%, 0.5)`;
                ctx.lineWidth = 1;
                ctx.globalAlpha = 1;
            }

            ctx.strokeRect(bound.x, bound.y, bound.w, bound.h);
        }
    }

    // Draw quadtree layer
    drawQuadtree() {
        if (this.quadtreeVisualization === 'off') return;
        this.ctx.drawImage(this.quadtreeCanvas, 0, 0);
    }

    // Draw obstacles
    drawObstacles(obstacles) {
        if (!obstacles || obstacles.length === 0) return;

        this.ctx.save();

        for (const obs of obstacles) {
            // Gradient fill
            const gradient = this.ctx.createRadialGradient(
                obs.x, obs.y, 0,
                obs.x, obs.y, obs.radius
            );

            if (this.theme === 'nature') {
                gradient.addColorStop(0, 'rgba(255, 100, 100, 0.6)');
                gradient.addColorStop(0.7, 'rgba(200, 50, 50, 0.4)');
                gradient.addColorStop(1, 'rgba(150, 30, 30, 0.2)');
            } else {
                gradient.addColorStop(0, 'rgba(100, 100, 100, 0.6)');
                gradient.addColorStop(0.7, 'rgba(70, 70, 70, 0.4)');
                gradient.addColorStop(1, 'rgba(50, 50, 50, 0.2)');
            }

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Border
            this.ctx.strokeStyle = this.theme === 'nature' ? '#ff6666' : '#666666';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
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
        gradient.addColorStop(0, color.replace(')', ', 0.2)').replace('rgb', 'rgba').replace('#FF6B6B', 'rgba(255,107,107').replace('#4ECDC4', 'rgba(78,205,196'));
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

    // Draw live metrics chart
    drawChart(flock) {
        if (!this.showChart || !flock.metrics.history.length) return;

        const chartWidth = 200;
        const chartHeight = 60;
        const padding = 10;
        const x = this.canvas.width - chartWidth - padding;
        const y = this.canvas.height - chartHeight - padding;

        this.ctx.save();

        // Background
        this.ctx.fillStyle = this.theme === 'nature' ? 'rgba(10, 22, 40, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(x, y, chartWidth, chartHeight);

        // Border
        this.ctx.strokeStyle = this.theme === 'nature' ? '#4ECDC4' : '#0066CC';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, chartWidth, chartHeight);

        // Draw the metric line
        const history = flock.metrics.history;
        if (history.length < 2) {
            this.ctx.restore();
            return;
        }

        // Find min/max for scaling
        let min = Infinity, max = -Infinity;
        for (const m of history) {
            const val = m[this.chartMetric];
            if (val < min) min = val;
            if (val > max) max = val;
        }

        // Add some padding to range
        const range = max - min || 1;
        min -= range * 0.1;
        max += range * 0.1;

        // Draw line
        this.ctx.strokeStyle = this.theme === 'nature' ? '#4ECDC4' : '#0066CC';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        for (let i = 0; i < history.length; i++) {
            const px = x + (i / (history.length - 1)) * chartWidth;
            const py = y + chartHeight - ((history[i][this.chartMetric] - min) / (max - min)) * chartHeight;

            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.stroke();

        // Label
        this.ctx.fillStyle = this.theme === 'nature' ? '#ffffff' : '#333333';
        this.ctx.font = '10px monospace';
        this.ctx.fillText(this.chartMetric, x + 4, y + 12);

        this.ctx.restore();
    }

    // Main render function
    render(flock, shepherd) {
        this.clear(flock);

        // Update and draw quadtree visualization (on separate layer)
        this.updateQuadtreeVisualization(flock.quadtree);
        this.drawQuadtree();

        // Draw obstacles
        this.drawObstacles(flock.obstacles);

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

        // Draw live chart
        this.drawChart(flock);
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
        // Reset frame counter to update immediately
        this.quadtreeFrameCounter = this.quadtreeUpdateInterval;
    }

    // Set color palette and rebuild cache
    setPalette(palette) {
        this.palette = palette;
    }

    // Toggle chart display
    toggleChart(show = null) {
        this.showChart = show !== null ? show : !this.showChart;
    }

    // Set chart metric
    setChartMetric(metric) {
        this.chartMetric = metric;
    }

    // Toggle dynamic trails
    setDynamicTrails(enabled) {
        this.dynamicTrails = enabled;
    }

    // Toggle turn waves effect
    setTurnWaves(enabled) {
        this.turnWaves = enabled;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Renderer;
}
