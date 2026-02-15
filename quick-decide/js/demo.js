/* ============================================
   Quick, Decide! — AI Demo Mode
   Slow-motion auto-drawing with live inference
   ============================================ */

var DemoMode = {
    // DOM elements
    modalEl: null,
    canvasEl: null,
    ctx: null,
    guessListEl: null,
    promptEl: null,
    stepEl: null,
    narrationEl: null,
    neuronCanvasEl: null,
    sigmoidCanvasEl: null,
    neuronMathEl: null,
    confidenceBarEl: null,
    confidenceValueEl: null,
    modelEyeEl: null,
    nextBtn: null,
    playBtn: null,
    skipBtn: null,

    // State
    running: false,
    currentIdx: 0,
    elapsed: 0,
    startTime: 0,
    animFrameId: null,
    _lastInferenceT: 0,
    _savedStrokes: null,  // backup of DrawingCanvas.strokes

    // Demo drawings data
    demos: null,

    init: function() {
        this.modalEl = document.getElementById('demo-modal');
        this.canvasEl = document.getElementById('demo-canvas');
        if (this.canvasEl) this.ctx = this.canvasEl.getContext('2d');
        this.guessListEl = document.getElementById('demo-guess-list');
        this.promptEl = document.getElementById('demo-prompt');
        this.stepEl = document.getElementById('demo-step');
        this.narrationEl = document.getElementById('demo-narration');
        this.neuronCanvasEl = document.getElementById('demo-neuron-canvas');
        this.sigmoidCanvasEl = document.getElementById('demo-sigmoid-canvas');
        this.neuronMathEl = document.getElementById('demo-neuron-math');
        this.confidenceBarEl = document.getElementById('demo-confidence-fill');
        this.confidenceValueEl = document.getElementById('demo-confidence-value');
        this.modelEyeEl = document.getElementById('demo-model-eye');
        this.nextBtn = document.getElementById('btn-demo-next');
        this.playBtn = document.getElementById('btn-demo-play');
        this.skipBtn = document.getElementById('btn-demo-skip');

        this.demos = this.buildDemoData();
    },

    start: function() {
        if (!this.modalEl) return;
        this.currentIdx = 0;
        this.modalEl.classList.remove('hidden');
        this.startDrawing(0);
    },

    close: function() {
        this.stopAnimation();
        this.restoreStrokes();
        if (this.modalEl) this.modalEl.classList.add('hidden');
    },

    startDrawing: function(idx) {
        this.currentIdx = idx;
        this.stopAnimation();

        var demo = this.demos[idx];
        if (!demo) return;

        // Update UI
        this.stepEl.textContent = (idx + 1) + ' / ' + this.demos.length;
        this.promptEl.textContent = demo.category.emoji + ' ' + demo.category.displayName;
        this.narrationEl.textContent = 'Watch as the AI processes each stroke...';

        // Show/hide buttons
        this.nextBtn.classList.add('hidden');
        this.playBtn.classList.add('hidden');
        this.skipBtn.classList.remove('hidden');

        // Clear canvas and visuals
        this.clearCanvas();
        this.clearGuesses();
        this.clearNeuron();

        // Start animation
        this.elapsed = 0;
        this._lastInferenceT = -600; // ensure first inference runs immediately
        this.running = true;
        this.startTime = performance.now();
        this.animate();
    },

    stopAnimation: function() {
        this.running = false;
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    },

    animate: function() {
        if (!this.running) return;

        var now = performance.now();
        this.elapsed = now - this.startTime;
        var demo = this.demos[this.currentIdx];
        var duration = this.getDuration(demo);

        // Draw strokes up to current time (slowed down — 0.5x speed)
        var drawT = this.elapsed * 0.5;
        this.drawStrokesUpTo(demo.strokes, drawT);

        // Run inference every 500ms
        if (drawT - this._lastInferenceT >= 500 && this.hasDrawnSomething(demo.strokes, drawT)) {
            this._lastInferenceT = drawT;
            this.runDemoInference(demo, drawT);
        }

        // Check if drawing is complete
        if (drawT >= duration) {
            // One final inference
            this.runDemoInference(demo, duration);
            this.onDrawingComplete(demo);
            return;
        }

        var self = this;
        this.animFrameId = requestAnimationFrame(function() {
            self.animate();
        });
    },

    getDuration: function(demo) {
        var maxT = 0;
        for (var s = 0; s < demo.strokes.length; s++) {
            var stroke = demo.strokes[s];
            if (stroke.length > 0 && stroke[stroke.length - 1].t > maxT) {
                maxT = stroke[stroke.length - 1].t;
            }
        }
        return maxT;
    },

    hasDrawnSomething: function(strokes, t) {
        for (var s = 0; s < strokes.length; s++) {
            if (strokes[s].length > 1 && strokes[s][0].t <= t) return true;
        }
        return false;
    },

    drawStrokesUpTo: function(strokes, t) {
        if (!this.ctx) return;
        var w = this.canvasEl.width;
        var h = this.canvasEl.height;
        this.ctx.clearRect(0, 0, w, h);

        // Scale from 500×500 coordinate space to canvas size
        var scaleX = w / 500;
        var scaleY = h / 500;

        this.ctx.strokeStyle = CONFIG.COLORS.charcoal;
        this.ctx.lineWidth = CONFIG.STROKE_WIDTH * scaleX;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        for (var s = 0; s < strokes.length; s++) {
            var stroke = strokes[s];
            if (stroke.length < 2 || stroke[0].t > t) continue;

            this.ctx.beginPath();
            this.ctx.moveTo(stroke[0].x * scaleX, stroke[0].y * scaleY);

            for (var p = 1; p < stroke.length; p++) {
                if (stroke[p].t > t) break;
                this.ctx.lineTo(stroke[p].x * scaleX, stroke[p].y * scaleY);
            }
            this.ctx.stroke();
        }
    },

    runDemoInference: function(demo, t) {
        if (!ModelManager.ready) return;

        // Build partial strokes array (only points drawn so far)
        var partialStrokes = [];
        for (var s = 0; s < demo.strokes.length; s++) {
            var stroke = demo.strokes[s];
            if (stroke.length < 2 || stroke[0].t > t) continue;

            var partial = [];
            for (var p = 0; p < stroke.length; p++) {
                if (stroke[p].t > t) break;
                partial.push(stroke[p]);
            }
            if (partial.length >= 2) {
                partialStrokes.push(partial);
            }
        }
        if (partialStrokes.length === 0) return;

        // Temporarily set DrawingCanvas.strokes for the preprocessor
        this._savedStrokes = DrawingCanvas.strokes;
        DrawingCanvas.strokes = partialStrokes;

        var tensor = Preprocessor.canvasToTensor(null);
        if (!tensor) {
            DrawingCanvas.strokes = this._savedStrokes;
            return;
        }

        // Run prediction
        var rawPreds = ModelManager.predict(tensor);

        // Get neuron data for target category
        var targetIdx = -1;
        for (var ci = 0; ci < CATEGORIES.length; ci++) {
            if (CATEGORIES[ci].name === demo.category.name) {
                targetIdx = ci;
                break;
            }
        }

        var neuronData = null;
        var drawingFeatures = null;
        if (targetIdx >= 0) {
            neuronData = ModelManager.getNeuronData(tensor, targetIdx);
            drawingFeatures = Preprocessor.computeDrawingFeatures();
        }

        // Update model eye
        this.updateModelEye(partialStrokes);

        tensor.dispose();
        DrawingCanvas.strokes = this._savedStrokes;

        // Update prediction display
        if (rawPreds) {
            this.renderPredictions(rawPreds, demo.category.name);
        }

        // Update neuron display
        if (neuronData) {
            this.drawNeuronDiagram(neuronData, drawingFeatures);
            this.drawSigmoidCurve(neuronData.zValue, neuronData.sigmoidOutput);
            this.updateNeuronMath(neuronData, demo.category, drawingFeatures);
            this.updateConfidence(neuronData.sigmoidOutput);
        }

        // Update narration based on confidence
        if (rawPreds && rawPreds.length > 0) {
            var topGuess = rawPreds[0];
            if (topGuess.name === demo.category.name && topGuess.confidence > 0.5) {
                this.narrationEl.textContent = 'The AI recognizes it! Confidence is rising...';
            } else if (topGuess.confidence > 0.3) {
                this.narrationEl.textContent = 'The model is starting to see a pattern...';
            } else {
                this.narrationEl.textContent = 'Processing features: curviness, density, shape...';
            }
        }
    },

    onDrawingComplete: function(demo) {
        this.running = false;

        // Check if model got it right
        // Re-run final inference to get result
        var gotIt = false;
        if (this.guessListEl) {
            var items = this.guessListEl.querySelectorAll('.guess-item.correct');
            gotIt = items.length > 0;
        }

        if (gotIt) {
            this.narrationEl.textContent = 'The AI got it! It recognized the ' + demo.category.displayName + '!';
        } else {
            this.narrationEl.textContent = 'Interesting — the AI found this one tricky!';
        }

        // Show appropriate button
        if (this.currentIdx < this.demos.length - 1) {
            this.nextBtn.classList.remove('hidden');
            this.skipBtn.classList.add('hidden');
        } else {
            this.playBtn.classList.remove('hidden');
            this.skipBtn.classList.add('hidden');
            this.narrationEl.textContent = 'Now try drawing yourself and see if you can fool the AI!';
        }
    },

    nextDrawing: function() {
        if (this.currentIdx < this.demos.length - 1) {
            this.startDrawing(this.currentIdx + 1);
        }
    },

    restoreStrokes: function() {
        if (this._savedStrokes !== null) {
            DrawingCanvas.strokes = this._savedStrokes;
            this._savedStrokes = null;
        }
    },

    // ---- Rendering helpers ----

    renderPredictions: function(predictions, targetName) {
        if (!this.guessListEl) return;

        var html = '';
        var count = Math.min(predictions.length, 5);
        for (var i = 0; i < count; i++) {
            var p = predictions[i];
            var pct = Math.round(p.confidence * 100);
            var isCorrect = p.name === targetName;
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

    drawNeuronDiagram: function(data, drawingFeatures) {
        if (!this.neuronCanvasEl) return;

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

    updateModelEye: function(strokes) {
        if (!this.modelEyeEl) return;
        var size = 28;

        // Compute bounding box
        var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (var s = 0; s < strokes.length; s++) {
            for (var p = 0; p < strokes[s].length; p++) {
                var pt = strokes[s][p];
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

        // Draw at 28×28
        var tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        var tCtx = tempCanvas.getContext('2d');
        tCtx.fillStyle = '#FFFFFF';
        tCtx.fillRect(0, 0, size, size);

        var scale = (size - 4) / cropSize;
        tCtx.strokeStyle = '#000000';
        tCtx.lineWidth = 2;
        tCtx.lineCap = 'round';
        tCtx.lineJoin = 'round';

        for (var s2 = 0; s2 < strokes.length; s2++) {
            var stroke = strokes[s2];
            if (stroke.length < 2) continue;
            tCtx.beginPath();
            tCtx.moveTo((stroke[0].x - cx) * scale + size / 2, (stroke[0].y - cy) * scale + size / 2);
            for (var p2 = 1; p2 < stroke.length; p2++) {
                tCtx.lineTo((stroke[p2].x - cx) * scale + size / 2, (stroke[p2].y - cy) * scale + size / 2);
            }
            tCtx.stroke();
        }

        // Invert to model eye
        var data = tCtx.getImageData(0, 0, size, size);
        var eyeCtx = this.modelEyeEl.getContext('2d');
        var eyeData = eyeCtx.createImageData(size, size);
        for (var i = 0; i < size * size; i++) {
            var v = 255 - data.data[i * 4]; // invert
            eyeData.data[i * 4 + 0] = v;
            eyeData.data[i * 4 + 1] = v;
            eyeData.data[i * 4 + 2] = v;
            eyeData.data[i * 4 + 3] = 255;
        }
        eyeCtx.putImageData(eyeData, 0, 0);
    },

    clearCanvas: function() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
        }
    },

    clearGuesses: function() {
        if (this.guessListEl) {
            this.guessListEl.innerHTML = '<div class="replay-waiting">Getting ready...</div>';
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
        if (this.modelEyeEl) {
            var ctx3 = this.modelEyeEl.getContext('2d');
            ctx3.clearRect(0, 0, this.modelEyeEl.width, this.modelEyeEl.height);
        }
    },

    // ---- Procedural stroke generators ----

    buildDemoData: function() {
        return [
            {
                category: this.findCategory('circle') || { name: 'circle', displayName: 'Circle', emoji: '⭕' },
                strokes: this.generateCircle()
            },
            {
                category: this.findCategory('star') || { name: 'star', displayName: 'Star', emoji: '⭐' },
                strokes: this.generateStar()
            },
            {
                category: this.findCategory('smiley face') || { name: 'smiley face', displayName: 'Smiley Face', emoji: '😊' },
                strokes: this.generateSmiley()
            }
        ];
    },

    findCategory: function(name) {
        for (var i = 0; i < CATEGORIES.length; i++) {
            if (CATEGORIES[i].name === name) return CATEGORIES[i];
        }
        return null;
    },

    generateCircle: function() {
        var cx = 250, cy = 250, r = 140;
        var numPoints = 60;
        var duration = 3000;
        var stroke = [];

        for (var i = 0; i <= numPoints; i++) {
            var angle = (i / numPoints) * Math.PI * 2 - Math.PI / 2;
            // Add slight hand-drawn wobble
            var wobble = Math.sin(i * 0.7) * 3 + Math.cos(i * 1.3) * 2;
            stroke.push({
                x: cx + Math.cos(angle) * (r + wobble),
                y: cy + Math.sin(angle) * (r + wobble),
                t: (i / numPoints) * duration
            });
        }

        return [stroke];
    },

    generateStar: function() {
        var cx = 250, cy = 260;
        var outerR = 150, innerR = 60;
        var points = 5;
        var duration = 3500;
        var stroke = [];
        var totalPts = points * 2;

        for (var i = 0; i <= totalPts; i++) {
            var angle = (i / totalPts) * Math.PI * 2 - Math.PI / 2;
            var r = (i % 2 === 0) ? outerR : innerR;
            var wobble = Math.sin(i * 1.5) * 2;
            stroke.push({
                x: cx + Math.cos(angle) * (r + wobble),
                y: cy + Math.sin(angle) * (r + wobble),
                t: (i / totalPts) * duration
            });
        }

        return [stroke];
    },

    generateSmiley: function() {
        var cx = 250, cy = 250;
        var strokes = [];

        // Stroke 1: Head circle
        var head = [];
        var headPts = 50;
        for (var i = 0; i <= headPts; i++) {
            var angle = (i / headPts) * Math.PI * 2 - Math.PI / 2;
            var wobble = Math.sin(i * 0.8) * 3;
            head.push({
                x: cx + Math.cos(angle) * (140 + wobble),
                y: cy + Math.sin(angle) * (140 + wobble),
                t: (i / headPts) * 2000
            });
        }
        strokes.push(head);

        // Stroke 2: Left eye (small filled-looking circle)
        var leftEye = [];
        var eyePts = 20;
        for (var j = 0; j <= eyePts; j++) {
            var a = (j / eyePts) * Math.PI * 2;
            leftEye.push({
                x: cx - 55 + Math.cos(a) * 18,
                y: cy - 35 + Math.sin(a) * 18,
                t: 2200 + (j / eyePts) * 400
            });
        }
        strokes.push(leftEye);

        // Stroke 3: Right eye
        var rightEye = [];
        for (var k = 0; k <= eyePts; k++) {
            var a2 = (k / eyePts) * Math.PI * 2;
            rightEye.push({
                x: cx + 55 + Math.cos(a2) * 18,
                y: cy - 35 + Math.sin(a2) * 18,
                t: 2700 + (k / eyePts) * 400
            });
        }
        strokes.push(rightEye);

        // Stroke 4: Smile (arc across bottom half)
        var smile = [];
        var smilePts = 30;
        for (var m = 0; m <= smilePts; m++) {
            var a3 = (m / smilePts) * Math.PI;
            var wobble2 = Math.sin(m * 0.5) * 2;
            smile.push({
                x: cx - 70 + (m / smilePts) * 140,
                y: cy + 30 + Math.sin(a3) * 55 + wobble2,
                t: 3300 + (m / smilePts) * 800
            });
        }
        strokes.push(smile);

        return strokes;
    }
};
