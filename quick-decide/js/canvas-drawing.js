/* ============================================
   Quick, Decide! — Drawing Canvas
   ============================================ */

var DrawingCanvas = {
    canvas: null,
    ctx: null,
    strokes: [],       // [[{x,y,t},...], ...]
    currentStroke: [],
    isDrawing: false,
    enabled: true,
    onStrokeEnd: null, // callback after each stroke

    init: function(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.setupEvents();
        this.clear();
    },

    setupEvents: function() {
        var self = this;

        this.canvas.addEventListener('pointerdown', function(e) {
            self.onPointerDown(e);
        });
        this.canvas.addEventListener('pointermove', function(e) {
            self.onPointerMove(e);
        });
        this.canvas.addEventListener('pointerup', function(e) {
            self.onPointerUp(e);
        });
        this.canvas.addEventListener('pointerleave', function(e) {
            self.onPointerUp(e);
        });
        this.canvas.addEventListener('pointercancel', function(e) {
            self.onPointerUp(e);
        });

        // Prevent context menu on long press
        this.canvas.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
    },

    getCanvasCoords: function(e) {
        var rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height),
            t: Date.now()
        };
    },

    onPointerDown: function(e) {
        if (!this.enabled) return;
        e.preventDefault();
        this.canvas.setPointerCapture(e.pointerId);
        this.isDrawing = true;

        var pt = this.getCanvasCoords(e);
        this.currentStroke = [pt];

        this.ctx.beginPath();
        this.ctx.moveTo(pt.x, pt.y);
    },

    onPointerMove: function(e) {
        if (!this.isDrawing || !this.enabled) return;
        e.preventDefault();

        var pt = this.getCanvasCoords(e);
        this.currentStroke.push(pt);

        // Draw segment
        var prev = this.currentStroke[this.currentStroke.length - 2];
        this.ctx.beginPath();
        this.ctx.moveTo(prev.x, prev.y);
        this.ctx.lineTo(pt.x, pt.y);
        this.ctx.strokeStyle = CONFIG.STROKE_COLOR;
        this.ctx.lineWidth = CONFIG.STROKE_WIDTH;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
    },

    onPointerUp: function(e) {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        if (this.currentStroke.length > 1) {
            this.strokes.push(this.currentStroke);
            if (this.onStrokeEnd) {
                this.onStrokeEnd();
            }
        }
        this.currentStroke = [];
    },

    undo: function() {
        if (this.strokes.length === 0) return;
        this.strokes.pop();
        this.redrawAll();
        if (this.onStrokeEnd) {
            this.onStrokeEnd();
        }
    },

    clear: function() {
        this.strokes = [];
        this.currentStroke = [];
        this.isDrawing = false;
        var ctx = this.ctx;
        ctx.fillStyle = CONFIG.COLORS.paper;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    redrawAll: function() {
        var ctx = this.ctx;
        ctx.fillStyle = CONFIG.COLORS.paper;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.strokeStyle = CONFIG.STROKE_COLOR;
        ctx.lineWidth = CONFIG.STROKE_WIDTH;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (var s = 0; s < this.strokes.length; s++) {
            var stroke = this.strokes[s];
            if (stroke.length < 2) continue;
            ctx.beginPath();
            ctx.moveTo(stroke[0].x, stroke[0].y);
            for (var p = 1; p < stroke.length; p++) {
                ctx.lineTo(stroke[p].x, stroke[p].y);
            }
            ctx.stroke();
        }
    },

    enable: function() {
        this.enabled = true;
        this.canvas.classList.remove('disabled');
    },

    disable: function() {
        this.enabled = false;
        this.isDrawing = false;
        this.canvas.classList.add('disabled');
    },

    getDataURL: function() {
        return this.canvas.toDataURL('image/png');
    },

    hasStrokes: function() {
        return this.strokes.length > 0;
    },

    copyToCanvas: function(targetCanvas) {
        var tctx = targetCanvas.getContext('2d');
        tctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        tctx.drawImage(this.canvas, 0, 0, targetCanvas.width, targetCanvas.height);
    }
};
