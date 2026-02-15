/* ============================================
   Quick, Decide! — Replay Engine
   "Watch the AI think"
   ============================================ */

var Replay = {
    // DOM elements
    modalEl: null,
    canvasEl: null,
    ctx: null,
    guessListEl: null,
    modelEyeEl: null,
    timerTextEl: null,
    promptEl: null,
    playBtnEl: null,
    speedBtnEl: null,
    progressEl: null,

    // Neuron education elements
    neuronCanvasEl: null,
    sigmoidCanvasEl: null,
    neuronMathEl: null,
    confidenceBarEl: null,
    confidenceValueEl: null,

    // Replay state
    playing: false,
    roundData: null,
    startTime: 0,
    elapsed: 0,
    speed: 1,
    animFrameId: null,
    strokeIndex: 0,
    pointIndex: 0,
    predIndex: 0,
    _lastModelEyeT: -1,
    _lastNeuronIdx: -1,   // track which snapshot is currently shown
    _tempCanvas: null,
    _tempCtx: null,

    init: function() {
        this.modalEl = document.getElementById('replay-modal');
        this.canvasEl = document.getElementById('replay-canvas');
        this.ctx = this.canvasEl ? this.canvasEl.getContext('2d') : null;
        this.guessListEl = document.getElementById('replay-guess-list');
        this.modelEyeEl = document.getElementById('replay-model-eye');
        this.timerTextEl = document.getElementById('replay-timer');
        this.promptEl = document.getElementById('replay-prompt');
        this.playBtnEl = document.getElementById('replay-play-btn');
        this.speedBtnEl = document.getElementById('replay-speed-btn');
        this.progressEl = document.getElementById('replay-progress');

        // Neuron elements
        this.neuronCanvasEl = document.getElementById('replay-neuron-canvas');
        this.sigmoidCanvasEl = document.getElementById('replay-sigmoid-canvas');
        this.neuronMathEl = document.getElementById('replay-neuron-math');
        this.confidenceBarEl = document.getElementById('replay-confidence-fill');
        this.confidenceValueEl = document.getElementById('replay-confidence-value');
    },

    open: function(roundResult) {
        if (!this.modalEl) this.init();
        if (!this.modalEl) return;

        this.roundData = roundResult;
        this.modalEl.classList.remove('hidden');

        // Set prompt
        if (this.promptEl) {
            this.promptEl.textContent = roundResult.category.emoji + ' ' +
                roundResult.category.displayName;
        }

        // Reset
        this.speed = 1;
        if (this.speedBtnEl) this.speedBtnEl.textContent = '1x';
        this.reset();
        this.play();
    },

    close: function() {
        this.pause();
        if (this.modalEl) this.modalEl.classList.add('hidden');
        this.roundData = null;
    },

    reset: function() {
        this.elapsed = 0;
        this.strokeIndex = 0;
        this.pointIndex = 0;
        this.predIndex = 0;
        this._lastModelEyeT = -1;
        this._lastNeuronIdx = -1;
        this.clearCanvas();
        this.clearGuesses();
        this.clearNeuron();
        this.updateTimer(0);
        if (this.progressEl) this.progressEl.value = 0;
    },

    play: function() {
        if (this.playing) return;
        this.playing = true;
        this.startTime = Date.now() - (this.elapsed / this.speed);
        if (this.playBtnEl) this.playBtnEl.textContent = '⏸';

        var self = this;
        function tick() {
            if (!self.playing) return;
            self.elapsed = (Date.now() - self.startTime) * self.speed;
            self.drawFrame();
            self.animFrameId = requestAnimationFrame(tick);
        }
        this.animFrameId = requestAnimationFrame(tick);
    },

    pause: function() {
        this.playing = false;
        if (this.playBtnEl) this.playBtnEl.textContent = '▶';
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    },

    togglePlay: function() {
        if (this.playing) {
            this.pause();
        } else {
            var duration = this.getDuration();
            if (this.elapsed >= duration) {
                this.reset();
            }
            this.play();
        }
    },

    cycleSpeed: function() {
        var speeds = [1, 2, 4, 0.5];
        var idx = speeds.indexOf(this.speed);
        this.speed = speeds[(idx + 1) % speeds.length];
        if (this.speedBtnEl) this.speedBtnEl.textContent = this.speed + 'x';

        if (this.playing) {
            this.startTime = Date.now() - (this.elapsed / this.speed);
        }
    },

    getDuration: function() {
        if (!this.roundData) return 0;
        var strokes = this.roundData.strokes;
        if (strokes.length === 0) return 1000;
        var lastStroke = strokes[strokes.length - 1];
        if (lastStroke.length === 0) return 1000;
        return lastStroke[lastStroke.length - 1].t + 500;
    },

    drawFrame: function() {
        if (!this.roundData) return;

        var duration = this.getDuration();
        var t = this.elapsed;

        if (t >= duration) {
            t = duration;
            this.elapsed = duration;
            this.pause();
        }

        if (this.progressEl) {
            this.progressEl.value = duration > 0 ? (t / duration) * 100 : 0;
        }

        this.updateTimer(t);
        this.drawStrokesUpTo(t);
        this.showPredictionsAt(t);
        this.showNeuronAt(t);
        this.updateModelEye(t);
    },

    clearCanvas: function() {
        if (!this.ctx) return;
        this.ctx.fillStyle = CONFIG.COLORS.paper;
        this.ctx.fillRect(0, 0, this.canvasEl.width, this.canvasEl.height);
    },

    drawStrokesUpTo: function(t) {
        if (!this.ctx || !this.roundData) return;

        this.clearCanvas();
        var strokes = this.roundData.strokes;

        this.ctx.strokeStyle = CONFIG.STROKE_COLOR;
        this.ctx.lineWidth = CONFIG.STROKE_WIDTH;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        for (var s = 0; s < strokes.length; s++) {
            var stroke = strokes[s];
            if (stroke.length < 2) continue;
            if (stroke[0].t > t) break;

            this.ctx.beginPath();
            this.ctx.moveTo(stroke[0].x, stroke[0].y);

            for (var p = 1; p < stroke.length; p++) {
                if (stroke[p].t > t) break;
                this.ctx.lineTo(stroke[p].x, stroke[p].y);
            }
            this.ctx.stroke();
        }
    },

    // Find the snapshot index at time t
    _findSnapshotAt: function(t) {
        var history = this.roundData.predictionHistory;
        if (!history || history.length === 0) return -1;
        for (var i = history.length - 1; i >= 0; i--) {
            if (history[i].t <= t) return i;
        }
        return -1;
    },

    showPredictionsAt: function(t) {
        if (!this.guessListEl || !this.roundData) return;

        var idx = this._findSnapshotAt(t);
        if (idx < 0) {
            this.guessListEl.innerHTML = '<div class="replay-waiting">Waiting for strokes...</div>';
            return;
        }

        var snapshot = this.roundData.predictionHistory[idx];
        var target = this.roundData.category.name;
        var html = '';
        var preds = snapshot.preds;
        for (var j = 0; j < Math.min(preds.length, 5); j++) {
            var p = preds[j];
            var pct = Math.round(p.confidence * 100);
            var isCorrect = p.name === target;
            var correctClass = isCorrect ? ' correct' : '';

            html += '<div class="guess-item' + correctClass + '">' +
                '<span class="guess-emoji">' + p.emoji + '</span>' +
                '<span class="guess-name">' + p.label + '</span>' +
                '<div class="guess-bar-track">' +
                    '<div class="guess-bar-fill" style="width:' + pct + '%"></div>' +
                '</div>' +
                '<span class="guess-percent">' + pct + '%</span>' +
            '</div>';
        }

        this.guessListEl.innerHTML = html;
    },

    showNeuronAt: function(t) {
        if (!this.roundData) return;

        var idx = this._findSnapshotAt(t);
        if (idx < 0 || idx === this._lastNeuronIdx) return;
        this._lastNeuronIdx = idx;

        var snapshot = this.roundData.predictionHistory[idx];
        if (!snapshot.neuronData) {
            this.clearNeuron();
            return;
        }

        var nd = snapshot.neuronData;
        var df = snapshot.drawingFeatures;
        var category = this.roundData.category;

        // Draw neuron diagram
        this.drawNeuronDiagram(nd, df);

        // Draw sigmoid curve
        this.drawSigmoidCurve(nd.zValue, nd.sigmoidOutput);

        // Update math
        this.updateNeuronMath(nd, category, df);

        // Update confidence bar
        this.updateConfidence(nd.sigmoidOutput);
    },

    drawNeuronDiagram: function(data, drawingFeatures) {
        if (!this.neuronCanvasEl) return;

        // Build displayData matching what SketchUI.drawNeuronDiagram expects
        var displayData = {
            inputValues: data.inputValues.slice(0, 6),
            weights: data.weights.slice(0, 6),
            bias: data.bias,
            zValue: data.zValue,
            sigmoidOutput: data.sigmoidOutput,
            featureNames: null
        };

        if (drawingFeatures && drawingFeatures.length > 0) {
            var count = Math.min(drawingFeatures.length, 6);
            displayData.inputValues = [];
            displayData.featureNames = [];
            for (var i = 0; i < count; i++) {
                displayData.inputValues.push(drawingFeatures[i].value);
                displayData.featureNames.push(drawingFeatures[i].name);
            }
            displayData.weights = data.weights.slice(0, count);
        }

        SketchUI.drawNeuronDiagram(this.neuronCanvasEl, displayData);
    },

    drawSigmoidCurve: function(z, output) {
        if (!this.sigmoidCanvasEl) return;
        SketchUI.drawSigmoidCurve(this.sigmoidCanvasEl, z, output);
    },

    updateNeuronMath: function(data, category, drawingFeatures) {
        if (!this.neuronMathEl) return;

        var html = '<div class="math-line">' +
            '<strong>Target:</strong> ' + category.emoji + ' ' + category.displayName +
            '</div>';

        // Show interpretable features
        if (drawingFeatures && drawingFeatures.length > 0) {
            html += '<div class="math-line" style="margin-top:6px">' +
                '<strong>What the AI sees:</strong></div>';
            for (var i = 0; i < Math.min(drawingFeatures.length, 6); i++) {
                var f = drawingFeatures[i];
                var barWidth = Math.round(f.value * 100);
                html += '<div class="math-line feature-line">' +
                    '<span class="feature-name">' + f.name + ':</span> ' +
                    '<span class="feature-bar-mini">' +
                        '<span class="feature-bar-fill-mini" style="width:' + barWidth + '%"></span>' +
                    '</span> ' +
                    '<span class="feature-raw">' + f.raw + '</span>' +
                    '</div>';
            }
        }

        // Show the neuron math
        html += '<div class="math-line" style="margin-top:8px">' +
            '<strong>Neuron computation:</strong></div>' +
            '<div class="math-line">' +
            'z = Σ(features × weights) + bias = <strong>' + data.zValue.toFixed(2) + '</strong>' +
            '</div>' +
            '<div class="math-line">' +
            'σ(z) = 1 / (1 + e<sup>−z</sup>) = <strong>' +
            data.sigmoidOutput.toFixed(3) + '</strong>' +
            '</div>';

        this.neuronMathEl.innerHTML = html;
    },

    updateConfidence: function(value) {
        if (!this.confidenceBarEl || !this.confidenceValueEl) return;

        var pct = Math.round(value * 100);
        this.confidenceBarEl.style.width = pct + '%';
        this.confidenceValueEl.textContent = pct + '%';

        if (value > 0.5) {
            this.confidenceBarEl.classList.add('high');
        } else {
            this.confidenceBarEl.classList.remove('high');
        }
    },

    clearNeuron: function() {
        if (this.neuronMathEl) this.neuronMathEl.innerHTML = '';
        if (this.confidenceBarEl) this.confidenceBarEl.style.width = '0%';
        if (this.confidenceValueEl) this.confidenceValueEl.textContent = '--';
        if (this.neuronCanvasEl) {
            var ctx = this.neuronCanvasEl.getContext('2d');
            ctx.clearRect(0, 0, this.neuronCanvasEl.width, this.neuronCanvasEl.height);
        }
        if (this.sigmoidCanvasEl) {
            var ctx2 = this.sigmoidCanvasEl.getContext('2d');
            ctx2.clearRect(0, 0, this.sigmoidCanvasEl.width, this.sigmoidCanvasEl.height);
        }
    },

    updateModelEye: function(t) {
        if (!this.modelEyeEl || !this.roundData) return;

        // Throttle: update every ~150ms of replay time
        if (Math.abs(t - this._lastModelEyeT) < 150 && this._lastModelEyeT >= 0) return;
        this._lastModelEyeT = t;

        var strokes = this.roundData.strokes;
        var size = CONFIG.MODEL_INPUT_SIZE;

        var activeStrokes = [];
        for (var s = 0; s < strokes.length; s++) {
            var stroke = strokes[s];
            if (stroke.length < 2 || stroke[0].t > t) break;
            var pts = [];
            for (var p = 0; p < stroke.length; p++) {
                if (stroke[p].t > t) break;
                pts.push(stroke[p]);
            }
            if (pts.length >= 2) activeStrokes.push(pts);
        }

        if (activeStrokes.length === 0) return;

        var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (var s2 = 0; s2 < activeStrokes.length; s2++) {
            for (var p2 = 0; p2 < activeStrokes[s2].length; p2++) {
                var pt = activeStrokes[s2][p2];
                if (pt.x < minX) minX = pt.x;
                if (pt.x > maxX) maxX = pt.x;
                if (pt.y < minY) minY = pt.y;
                if (pt.y > maxY) maxY = pt.y;
            }
        }

        if (minX >= maxX && minY >= maxY) return;

        var bboxW = maxX - minX || 1;
        var bboxH = maxY - minY || 1;
        var maxDim = Math.max(bboxW, bboxH);
        var padding = Math.max(maxDim * 0.15, 8);
        var cropSize = maxDim + padding * 2;
        var cx = (minX + maxX) / 2;
        var cy = (minY + maxY) / 2;
        var scale = (size - 4) / cropSize;

        if (!this._tempCanvas) {
            this._tempCanvas = document.createElement('canvas');
            this._tempCanvas.width = size;
            this._tempCanvas.height = size;
            this._tempCtx = this._tempCanvas.getContext('2d', { willReadFrequently: true });
        }
        var tctx = this._tempCtx;
        tctx.fillStyle = '#FFFFFF';
        tctx.fillRect(0, 0, size, size);
        tctx.strokeStyle = '#000000';
        tctx.lineWidth = 2;
        tctx.lineCap = 'round';
        tctx.lineJoin = 'round';

        for (var s3 = 0; s3 < activeStrokes.length; s3++) {
            var st = activeStrokes[s3];
            tctx.beginPath();
            tctx.moveTo((st[0].x - cx) * scale + size / 2, (st[0].y - cy) * scale + size / 2);
            for (var p3 = 1; p3 < st.length; p3++) {
                tctx.lineTo((st[p3].x - cx) * scale + size / 2, (st[p3].y - cy) * scale + size / 2);
            }
            tctx.stroke();
        }

        var imgData = tctx.getImageData(0, 0, size, size);
        var eyeCtx = this.modelEyeEl.getContext('2d');
        var outData = eyeCtx.createImageData(size, size);
        for (var i = 0; i < size * size; i++) {
            var v = 255 - imgData.data[i * 4];
            outData.data[i * 4 + 0] = v;
            outData.data[i * 4 + 1] = v;
            outData.data[i * 4 + 2] = v;
            outData.data[i * 4 + 3] = 255;
        }
        eyeCtx.putImageData(outData, 0, 0);
    },

    updateTimer: function(t) {
        if (!this.timerTextEl) return;
        var seconds = Math.floor(t / 1000);
        this.timerTextEl.textContent = seconds + 's';
    },

    clearGuesses: function() {
        if (this.guessListEl) {
            this.guessListEl.innerHTML = '<div class="replay-waiting">Ready to replay...</div>';
        }
    },

    seekTo: function(pct) {
        var duration = this.getDuration();
        this.elapsed = (pct / 100) * duration;
        this._lastNeuronIdx = -1; // force neuron redraw on seek
        this._lastModelEyeT = -1;
        if (this.playing) {
            this.startTime = Date.now() - (this.elapsed / this.speed);
        }
        this.drawFrame();
    }
};
