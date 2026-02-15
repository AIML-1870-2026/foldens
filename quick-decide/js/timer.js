/* ============================================
   Quick, Decide! — Countdown Timer
   ============================================ */

var Timer = {
    canvas: null,
    textEl: null,
    remaining: CONFIG.ROUND_TIME,
    total: CONFIG.ROUND_TIME,
    intervalId: null,
    running: false,

    init: function(canvasEl, textEl) {
        this.canvas = canvasEl;
        this.textEl = textEl;
    },

    start: function(onTick, onExpire) {
        this.remaining = this.total;
        this.running = true;
        this.update();

        var self = this;
        this.intervalId = setInterval(function() {
            self.remaining--;
            self.update();

            if (onTick) onTick(self.remaining);

            if (self.remaining <= 0) {
                self.stop();
                if (onExpire) onExpire();
            }
        }, 1000);
    },

    stop: function() {
        this.running = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    update: function() {
        var warning = this.remaining <= 5;
        var progress = this.remaining / this.total;

        // Update text
        if (this.textEl) {
            this.textEl.textContent = this.remaining;
            if (warning) {
                this.textEl.classList.add('warning');
            } else {
                this.textEl.classList.remove('warning');
            }
        }

        // Draw timer ring
        if (this.canvas) {
            SketchUI.drawTimerRing(this.canvas, progress, warning);
        }
    },

    getElapsed: function() {
        return this.total - this.remaining;
    }
};
