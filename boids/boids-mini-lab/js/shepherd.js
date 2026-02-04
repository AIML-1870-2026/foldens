// ===== Shepherd - Mouse Interaction System =====

class Shepherd {
    constructor(canvas) {
        this.canvas = canvas;
        this.position = null;     // Current mouse position (Vector or null)
        this.isOnCanvas = false;  // Is mouse over canvas?

        // Settings (synced with CONFIG)
        this.mode = CONFIG.shepherd.mode;     // 'repel', 'attract', 'neutral'
        this.radius = CONFIG.shepherd.radius; // Influence radius

        // Set up mouse tracking
        this.setupMouseTracking();
    }

    // Set up mouse event listeners
    setupMouseTracking() {
        // Mouse move - track position
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            this.position = new Vector(x, y);
            this.isOnCanvas = true;
        });

        // Mouse enter
        this.canvas.addEventListener('mouseenter', () => {
            this.isOnCanvas = true;
        });

        // Mouse leave - clear position
        this.canvas.addEventListener('mouseleave', () => {
            this.isOnCanvas = false;
            // Keep last position for smooth transition, but mark as off-canvas
        });

        // Touch support
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;

            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;

            this.position = new Vector(x, y);
            this.isOnCanvas = true;
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => {
            this.isOnCanvas = false;
        });
    }

    // Set shepherd mode
    setMode(mode) {
        if (['repel', 'attract', 'neutral'].includes(mode)) {
            this.mode = mode;
        }
    }

    // Set influence radius
    setRadius(radius) {
        this.radius = Utils.clamp(radius, 50, 200);
    }

    // Get position (only if on canvas and not neutral)
    getActivePosition() {
        if (this.mode === 'neutral' || !this.isOnCanvas) {
            return null;
        }
        return this.position;
    }

    // Reset to default state
    reset() {
        this.mode = CONFIG.shepherd.mode;
        this.radius = CONFIG.shepherd.radius;
        this.position = null;
        this.isOnCanvas = false;
    }

    // Get current state for saving
    getState() {
        return {
            mode: this.mode,
            radius: this.radius
        };
    }

    // Apply state from loading
    applyState(state) {
        if (state.mode) this.setMode(state.mode);
        if (state.radius) this.setRadius(state.radius);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Shepherd;
}
