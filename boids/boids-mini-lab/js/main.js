// ===== Main Entry Point - Game Loop =====

// Global simulation state
const Simulation = {
    // Core objects
    flock: null,
    renderer: null,
    shepherd: null,
    ui: null,
    presets: null,

    // State
    running: true,
    initialized: false,

    // Interactive spawn mode
    spawnMode: 'none', // 'none', 'boids', 'obstacles'
    isSpawning: false,
    lastSpawnPos: null,

    // Performance tracking
    lastFrameTime: 0,
    frameCount: 0,
    fps: 60,
    fpsUpdateInterval: 500, // Update FPS display every 500ms
    lastFpsUpdate: 0,

    // Canvas dimensions
    width: 0,
    height: 0,

    // Initialize the simulation
    init() {
        console.log('Initializing Boids Mini-Lab...');

        // Get canvas and container
        const canvas = document.getElementById('simulation-canvas');
        const container = document.getElementById('canvas-container');

        if (!canvas || !container) {
            console.error('Canvas or container not found!');
            return;
        }

        // Create renderer and size canvas
        this.renderer = new Renderer(canvas);
        this.resizeCanvas();

        // Create flock
        this.flock = new Flock(this.width, this.height);
        this.flock.init(CONFIG.simulation.boidCount);

        // Create shepherd (mouse handler)
        this.shepherd = new Shepherd(canvas);

        // Create presets manager
        this.presets = new Presets();

        // Check for URL config before creating UI
        const urlConfig = this.presets.getConfigFromURL();
        if (urlConfig) {
            console.log('Loading config from URL...');
            this.loadConfig(urlConfig);
        }

        // Create UI controller (must be last, after other objects exist)
        this.ui = new UI(this);

        // Set up event listeners
        this.setupEventListeners();

        // Mark as initialized
        this.initialized = true;

        // Start the game loop
        this.lastFrameTime = performance.now();
        this.lastFpsUpdate = this.lastFrameTime;
        requestAnimationFrame((time) => this.gameLoop(time));

        console.log('Boids Mini-Lab initialized successfully!');
    },

    // Set up global event listeners
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', Utils.debounce(() => {
            this.resizeCanvas();
        }, 100));

        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            // Ignore if typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    this.togglePause();
                    break;
                case 'KeyR':
                    this.reset();
                    break;
                case 'KeyB':
                    // Toggle boid spawn mode
                    this.setSpawnMode(this.spawnMode === 'boids' ? 'none' : 'boids');
                    break;
                case 'KeyO':
                    // Toggle obstacle spawn mode
                    this.setSpawnMode(this.spawnMode === 'obstacles' ? 'none' : 'obstacles');
                    break;
                case 'KeyC':
                    // Clear obstacles
                    this.flock.clearObstacles();
                    break;
                case 'KeyG':
                    // Toggle chart
                    this.renderer.toggleChart();
                    break;
            }
        });

        // Canvas interactions
        const canvas = document.getElementById('simulation-canvas');

        canvas.addEventListener('mousedown', (e) => {
            const { x, y } = this.getCanvasCoords(e);

            if (this.spawnMode !== 'none') {
                this.isSpawning = true;
                this.lastSpawnPos = { x, y };
                this.handleSpawn(x, y);
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (this.isSpawning && this.spawnMode !== 'none') {
                const { x, y } = this.getCanvasCoords(e);

                // Only spawn if moved enough from last position
                if (this.lastSpawnPos) {
                    const dist = Math.sqrt(
                        Math.pow(x - this.lastSpawnPos.x, 2) +
                        Math.pow(y - this.lastSpawnPos.y, 2)
                    );
                    if (dist > 15) {
                        this.handleSpawn(x, y);
                        this.lastSpawnPos = { x, y };
                    }
                }
            }
        });

        canvas.addEventListener('mouseup', () => {
            this.isSpawning = false;
            this.lastSpawnPos = null;
        });

        canvas.addEventListener('mouseleave', () => {
            this.isSpawning = false;
            this.lastSpawnPos = null;
        });

        // Canvas click for boid selection (only when not spawning)
        canvas.addEventListener('click', (e) => {
            if (this.spawnMode !== 'none') return;

            const { x, y } = this.getCanvasCoords(e);

            // Right-click or shift-click to remove obstacles
            if (e.shiftKey) {
                if (this.flock.removeObstacleAt(x, y)) return;
            }

            const boid = this.flock.getBoidAt(x, y);
            if (boid) {
                this.flock.selectBoid(boid);
            } else {
                this.flock.clearSelection();
            }
        });

        // Right-click to remove obstacles
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const { x, y } = this.getCanvasCoords(e);
            this.flock.removeObstacleAt(x, y);
        });
    },

    // Get canvas coordinates from mouse event
    getCanvasCoords(e) {
        const canvas = document.getElementById('simulation-canvas');
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    },

    // Handle spawn at position
    handleSpawn(x, y) {
        if (this.spawnMode === 'boids') {
            this.flock.addBoidsAt(x, y, 3, 15);
        } else if (this.spawnMode === 'obstacles') {
            this.flock.addObstacle(x, y, 30);
        }
    },

    // Set spawn mode
    setSpawnMode(mode) {
        this.spawnMode = mode;

        // Update cursor style
        const canvas = document.getElementById('simulation-canvas');
        if (mode === 'boids') {
            canvas.style.cursor = 'crosshair';
        } else if (mode === 'obstacles') {
            canvas.style.cursor = 'cell';
        } else {
            canvas.style.cursor = 'default';
        }

        // Update UI if available
        if (this.ui) {
            this.ui.updateSpawnModeButtons();
        }
    },

    // Resize canvas to fit container
    resizeCanvas() {
        const container = document.getElementById('canvas-container');
        const sidebar = document.getElementById('sidebar');

        // Account for sidebar width
        const sidebarWidth = sidebar.classList.contains('collapsed') ? 0 : sidebar.offsetWidth;
        const availableWidth = window.innerWidth - sidebarWidth;
        const availableHeight = window.innerHeight;

        const { width, height } = this.renderer.resize(availableWidth, availableHeight);
        this.width = width;
        this.height = height;

        // Update flock dimensions
        if (this.flock) {
            this.flock.resize(width, height);
        }
    },

    // Main game loop
    gameLoop(currentTime) {
        // Calculate delta time
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        // Update FPS counter
        this.frameCount++;
        if (currentTime - this.lastFpsUpdate >= this.fpsUpdateInterval) {
            this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = currentTime;
            this.updateMetrics();
        }

        // Update simulation if running
        if (this.running) {
            this.flock.update(
                this.shepherd.position,
                this.shepherd.radius,
                this.shepherd.mode,
                CONFIG.shepherd.strength
            );
        }

        // Render
        this.renderer.render(this.flock, this.shepherd);

        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    },

    // Update metrics display
    updateMetrics() {
        const fpsDisplay = document.getElementById('fps-display');
        const boidDisplay = document.getElementById('boid-display');
        const speciesDisplay = document.getElementById('species-display');

        if (fpsDisplay) {
            fpsDisplay.textContent = `FPS: ${this.fps}`;
        }

        if (boidDisplay) {
            boidDisplay.textContent = `Boids: ${this.flock.boids.length}`;
        }

        if (speciesDisplay) {
            const counts = this.flock.getSpeciesCounts();
            const palette = CONFIG.palettes[this.renderer.palette];

            let html = '';
            for (let i = 0; i < counts.length; i++) {
                const color = palette.colors[i];
                html += `<span class="species-count">
                    <span class="species-dot" style="background-color: ${color}"></span>
                    ${counts[i]}
                </span>`;
            }
            speciesDisplay.innerHTML = html;
        }
    },

    // Toggle pause state
    togglePause() {
        this.running = !this.running;
        if (this.ui) {
            this.ui.updatePlayPauseButton();
        }
    },

    // Pause simulation
    pause() {
        this.running = false;
        if (this.ui) {
            this.ui.updatePlayPauseButton();
        }
    },

    // Resume simulation
    resume() {
        this.running = true;
        if (this.ui) {
            this.ui.updatePlayPauseButton();
        }
    },

    // Reset simulation
    reset() {
        this.flock.reset(CONFIG.simulation.boidCount);
        this.shepherd.reset();
        this.setSpawnMode('none');

        // Reset to default config values
        Object.assign(CONFIG.behavior, {
            separation: 1.5,
            alignment: 1.0,
            cohesion: 1.0,
            maxSpeed: 4,
            neighborRadius: 50,
            perceptionAngle: 270
        });

        this.flock.perceptionRadius = CONFIG.behavior.neighborRadius;
        this.flock.perceptionAngle = CONFIG.behavior.perceptionAngle;
        this.flock.setSpeciesCount(CONFIG.simulation.speciesCount);

        if (this.ui) {
            this.ui.syncFromConfig();
        }

        this.running = true;
    },

    // Set boid count
    setBoidCount(count) {
        this.flock.setCount(count);
    },

    // Apply a preset
    applyPreset(presetName) {
        const preset = CONFIG.presets[presetName];
        if (!preset) return;

        // Apply behavior settings
        Object.assign(CONFIG.behavior, preset.behavior);

        // Update flock perception settings
        this.flock.perceptionRadius = preset.behavior.neighborRadius;
        this.flock.perceptionAngle = preset.behavior.perceptionAngle;

        // Sync UI
        if (this.ui) {
            this.ui.syncFromConfig();
        }
    },

    // Get current configuration for export
    getConfig() {
        return {
            version: '1.0',
            name: 'Custom Setup',
            behavior: { ...CONFIG.behavior },
            simulation: {
                boidCount: this.flock.boids.length,
                boundaryMode: this.flock.boundaryMode,
                speciesCount: this.flock.speciesCount
            },
            shepherd: {
                mode: this.shepherd.mode,
                radius: this.shepherd.radius
            },
            display: {
                theme: this.renderer.theme,
                trailOpacity: this.renderer.trailOpacity,
                quadtreeVisualization: this.renderer.quadtreeVisualization,
                palette: this.renderer.palette
            }
        };
    },

    // Load configuration from import
    loadConfig(config) {
        if (!config || !config.version) {
            console.error('Invalid config format');
            return false;
        }

        try {
            // Apply behavior
            if (config.behavior) {
                Object.assign(CONFIG.behavior, config.behavior);
                this.flock.perceptionRadius = config.behavior.neighborRadius || CONFIG.behavior.neighborRadius;
                this.flock.perceptionAngle = config.behavior.perceptionAngle || CONFIG.behavior.perceptionAngle;
            }

            // Apply simulation
            if (config.simulation) {
                if (config.simulation.speciesCount) {
                    this.flock.setSpeciesCount(config.simulation.speciesCount);
                }
                if (config.simulation.boidCount) {
                    this.flock.setCount(config.simulation.boidCount);
                }
                if (config.simulation.boundaryMode) {
                    this.flock.boundaryMode = config.simulation.boundaryMode;
                }
            }

            // Apply shepherd
            if (config.shepherd) {
                this.shepherd.mode = config.shepherd.mode || 'repel';
                this.shepherd.radius = config.shepherd.radius || 100;
            }

            // Apply display
            if (config.display) {
                this.renderer.setTheme(config.display.theme || 'nature');
                this.renderer.setTrailOpacity(config.display.trailOpacity || 0.05);
                this.renderer.setQuadtreeVisualization(config.display.quadtreeVisualization || 'off');
                this.renderer.setPalette(config.display.palette || 'warm');
            }

            // Sync UI
            if (this.ui) {
                this.ui.syncFromConfig();
            }

            return true;
        } catch (e) {
            console.error('Error loading config:', e);
            return false;
        }
    },

    // Get shareable URL for current config
    getShareableURL() {
        const config = this.getConfig();
        return this.presets.getShareableURL(config);
    },

    // Copy shareable URL to clipboard
    copyShareableURL() {
        const config = this.getConfig();
        return this.presets.copyShareableURL(config);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Simulation.init();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Simulation;
}
