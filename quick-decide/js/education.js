/* ============================================
   Quick, Decide! — Educational Panel
   "Peek Inside the Neuron"
   ============================================ */

var Education = {
    panelEl: null,
    contentEl: null,
    diagramCanvas: null,
    sigmoidCanvas: null,
    mathEl: null,
    confidenceBarEl: null,
    confidenceValueEl: null,

    init: function() {
        this.panelEl = document.getElementById('neuron-panel');
        this.contentEl = document.getElementById('neuron-content');
        this.diagramCanvas = document.getElementById('neuron-diagram-canvas');
        this.sigmoidCanvas = document.getElementById('sigmoid-plot-canvas');
        this.mathEl = document.getElementById('neuron-math');
        this.confidenceBarEl = document.getElementById('confidence-bar-fill');
        this.confidenceValueEl = document.getElementById('confidence-value');
    },

    toggle: function() {
        if (!this.panelEl) return;
        this.panelEl.classList.toggle('collapsed');
        Game.educationalMode = !this.panelEl.classList.contains('collapsed');

        var checkbox = document.getElementById('setting-education');
        if (checkbox) checkbox.checked = Game.educationalMode;
    },

    setExpanded: function(expanded) {
        if (!this.panelEl) return;
        if (expanded) {
            this.panelEl.classList.remove('collapsed');
        } else {
            this.panelEl.classList.add('collapsed');
        }
        Game.educationalMode = expanded;
    },

    updateWithTensor: function(tensor) {
        if (!Game.educationalMode) return;
        if (!ModelManager.ready) return;
        if (!Game.objectQueue || Game.currentRound >= Game.objectQueue.length) return;

        var targetCategory = Game.objectQueue[Game.currentRound];
        var targetIndex = -1;
        for (var i = 0; i < CATEGORIES.length; i++) {
            if (CATEGORIES[i].name === targetCategory.name) {
                targetIndex = i;
                break;
            }
        }

        if (targetIndex < 0) return;

        var data = ModelManager.getNeuronData(tensor, targetIndex);
        if (!data) return;

        // Compute real interpretable drawing features
        var drawingFeatures = Preprocessor.computeDrawingFeatures();

        Game.neuronData = data;
        this.drawDiagram(data, drawingFeatures);
        this.updateMath(data, targetCategory, drawingFeatures);
        this.drawSigmoid(data.zValue, data.sigmoidOutput);
        this.updateConfidence(data.sigmoidOutput);
    },

    drawDiagram: function(data, drawingFeatures) {
        if (!this.diagramCanvas) return;

        // Build a modified data object that uses the interpretable feature names
        var displayData = {
            inputValues: data.inputValues.slice(0, 6),
            weights: data.weights.slice(0, 6),
            bias: data.bias,
            zValue: data.zValue,
            sigmoidOutput: data.sigmoidOutput,
            featureNames: null
        };

        // Replace raw neuron values with interpretable features in the diagram
        if (drawingFeatures && drawingFeatures.length > 0) {
            var count = Math.min(drawingFeatures.length, 6);
            displayData.inputValues = [];
            displayData.featureNames = [];
            for (var i = 0; i < count; i++) {
                displayData.inputValues.push(drawingFeatures[i].value);
                displayData.featureNames.push(drawingFeatures[i].name);
            }
            // Keep the actual model weights for the connections (they're still real)
            displayData.weights = data.weights.slice(0, count);
        }

        SketchUI.drawNeuronDiagram(this.diagramCanvas, displayData);
    },

    updateMath: function(data, category, drawingFeatures) {
        if (!this.mathEl) return;

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

        // Show the neuron math (simplified)
        html += '<div class="math-line" style="margin-top:8px">' +
            '<strong>Neuron computation:</strong></div>' +
            '<div class="math-line">' +
            'z = Σ(features × weights) + bias = <strong>' + data.zValue.toFixed(2) + '</strong>' +
            '</div>' +
            '<div class="math-line">' +
            'σ(z) = 1 / (1 + e<sup>−z</sup>) = <strong>' +
            data.sigmoidOutput.toFixed(3) + '</strong>' +
            '</div>';

        this.mathEl.innerHTML = html;
    },

    drawSigmoid: function(z, output) {
        if (!this.sigmoidCanvas) return;
        SketchUI.drawSigmoidCurve(this.sigmoidCanvas, z, output);
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

    reset: function() {
        if (this.mathEl) this.mathEl.innerHTML = '';
        if (this.confidenceBarEl) this.confidenceBarEl.style.width = '0%';
        if (this.confidenceValueEl) this.confidenceValueEl.textContent = '--';
        if (this.diagramCanvas) {
            var ctx = this.diagramCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.diagramCanvas.width, this.diagramCanvas.height);
        }
        if (this.sigmoidCanvas) {
            var ctx2 = this.sigmoidCanvas.getContext('2d');
            ctx2.clearRect(0, 0, this.sigmoidCanvas.width, this.sigmoidCanvas.height);
        }
    }
};
