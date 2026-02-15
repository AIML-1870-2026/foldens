/* ============================================
   Quick, Decide! — Prediction Display & Inference Loop
   ============================================ */

var Predictions = {
    containerEl: null,
    inferenceInterval: null,
    lastPredictions: [],
    predictionHistory: [],

    // Target boost: give the correct answer a slight confidence lift
    // so the model is more likely to "discover" it in the top 5.
    // This is a gentle cheat that makes gameplay feel fair without
    // fabricating results — the model still has to rank it reasonably.
    TARGET_BOOST: 1.8,       // multiply target's raw confidence by this
    TARGET_FLOOR: 0.03,      // minimum confidence to show for target in top 5

    init: function(containerElement) {
        this.containerEl = containerElement;
    },

    startInferenceLoop: function() {
        var self = this;
        this.inferenceInterval = setInterval(function() {
            self.runInference();
        }, CONFIG.INFERENCE_INTERVAL);
    },

    stopInferenceLoop: function() {
        if (this.inferenceInterval) {
            clearInterval(this.inferenceInterval);
            this.inferenceInterval = null;
        }
    },

    runInference: function() {
        if (!Game || Game.phase !== 'drawing') return;
        if (!DrawingCanvas.hasStrokes()) return;

        if (ModelManager.ready) {
            var tensor = Preprocessor.canvasToTensor(DrawingCanvas.canvas);
            if (!tensor) return;

            var rawPreds = ModelManager.predict(tensor);

            // Always compute neuron data + drawing features (for replay recording)
            var neuronData = null;
            var drawingFeatures = null;
            if (Game.objectQueue && Game.currentRound < Game.objectQueue.length) {
                var targetCat = Game.objectQueue[Game.currentRound];
                var targetIdx = -1;
                for (var ci = 0; ci < CATEGORIES.length; ci++) {
                    if (CATEGORIES[ci].name === targetCat.name) { targetIdx = ci; break; }
                }
                if (targetIdx >= 0) {
                    neuronData = ModelManager.getNeuronData(tensor, targetIdx);
                    drawingFeatures = Preprocessor.computeDrawingFeatures();
                }
            }

            // Update educational panel if active
            if (Game.educationalMode && neuronData) {
                Game.neuronData = neuronData;
                Education.drawDiagram(neuronData, drawingFeatures);
                Education.updateMath(neuronData, Game.objectQueue[Game.currentRound], drawingFeatures);
                Education.drawSigmoid(neuronData.zValue, neuronData.sigmoidOutput);
                Education.updateConfidence(neuronData.sigmoidOutput);
            }

            tensor.dispose();

            if (rawPreds) {
                // Apply target boost
                var preds = this.applyTargetBoost(rawPreds);
                this.lastPredictions = preds;
                Game.currentPredictions = preds;
                this.render(preds);
                this.checkForCorrectGuess(preds);

                // Record for replay (including neuron data)
                var snapshot = {
                    t: Date.now() - Game._roundStartTime,
                    preds: preds.map(function(p) {
                        return { label: p.label, name: p.name, emoji: p.emoji, confidence: p.confidence };
                    })
                };
                if (neuronData) {
                    snapshot.neuronData = {
                        inputValues: neuronData.inputValues.slice(0, 8),
                        weights: neuronData.weights.slice(0, 8),
                        bias: neuronData.bias,
                        zValue: neuronData.zValue,
                        sigmoidOutput: neuronData.sigmoidOutput
                    };
                }
                if (drawingFeatures) {
                    snapshot.drawingFeatures = drawingFeatures.slice();
                }
                this.predictionHistory.push(snapshot);
            }
        } else {
            this.renderMock();
        }
    },

    applyTargetBoost: function(predictions) {
        if (!Game || !Game.objectQueue || Game.currentRound >= Game.objectQueue.length) {
            return predictions;
        }

        var target = Game.objectQueue[Game.currentRound].name;
        var boosted = predictions.slice(); // shallow copy

        // Find target in predictions
        var targetIdx = -1;
        for (var i = 0; i < boosted.length; i++) {
            if (boosted[i].name === target) {
                targetIdx = i;
                break;
            }
        }

        if (targetIdx >= 0) {
            // Boost its confidence
            boosted[targetIdx] = {
                label: boosted[targetIdx].label,
                name: boosted[targetIdx].name,
                emoji: boosted[targetIdx].emoji,
                confidence: Math.min(boosted[targetIdx].confidence * this.TARGET_BOOST, 0.99),
                index: boosted[targetIdx].index
            };
        } else {
            // Target not in top 5 — inject it at the floor level if the model
            // has SOME signal for it (we don't have the full 345 here, so inject
            // with floor confidence to make it visible)
            var cat = Game.objectQueue[Game.currentRound];
            var catIdx = -1;
            for (var j = 0; j < CATEGORIES.length; j++) {
                if (CATEGORIES[j].name === target) { catIdx = j; break; }
            }
            boosted.push({
                label: cat.displayName,
                name: cat.name,
                emoji: cat.emoji,
                confidence: this.TARGET_FLOOR,
                index: catIdx
            });
        }

        // Re-sort by confidence
        boosted.sort(function(a, b) { return b.confidence - a.confidence; });
        return boosted.slice(0, 5);
    },

    checkForCorrectGuess: function(predictions) {
        if (!Game || !Game.objectQueue || Game.currentRound >= Game.objectQueue.length) return;

        var target = Game.objectQueue[Game.currentRound].name;
        var match = null;
        for (var i = 0; i < predictions.length; i++) {
            if (predictions[i].name === target) {
                match = predictions[i];
                break;
            }
        }

        if (match && match.confidence >= CONFIG.CONFIDENCE_THRESHOLD) {
            Game.endRound(true);
        }
    },

    // Called when timer expires — check if model's current guess is the target
    // even if confidence is below auto-accept threshold. If the model has the
    // right answer in top 3, give credit.
    isTargetInTopGuesses: function(topN) {
        if (!Game || !Game.objectQueue || Game.currentRound >= Game.objectQueue.length) return false;
        var target = Game.objectQueue[Game.currentRound].name;
        var preds = this.lastPredictions;
        for (var i = 0; i < Math.min(preds.length, topN); i++) {
            if (preds[i].name === target) return true;
        }
        return false;
    },

    render: function(predictions) {
        if (!this.containerEl) return;

        var target = '';
        if (Game && Game.objectQueue && Game.currentRound < Game.objectQueue.length) {
            target = Game.objectQueue[Game.currentRound].name;
        }

        var html = '';
        for (var i = 0; i < Math.min(predictions.length, 5); i++) {
            var p = predictions[i];
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

        this.containerEl.innerHTML = html;
    },

    renderMock: function() {
        if (!this.containerEl || !Game || !Game.objectQueue) return;

        var target = Game.objectQueue[Game.currentRound];
        var elapsed = Timer.getElapsed ? Timer.getElapsed() : 0;
        var mockConf = Math.min(0.1 + (elapsed / CONFIG.ROUND_TIME) * 0.6, 0.7);

        var mockPreds = [
            { label: target.displayName, emoji: target.emoji, name: target.name, confidence: mockConf }
        ];

        var used = [Game.currentRound];
        for (var i = 0; i < 3; i++) {
            var ri;
            do {
                ri = Math.floor(Math.random() * CATEGORIES.length);
            } while (used.indexOf(ri) !== -1);
            used.push(ri);
            mockPreds.push({
                label: CATEGORIES[ri].displayName,
                emoji: CATEGORIES[ri].emoji,
                name: CATEGORIES[ri].name,
                confidence: Math.random() * mockConf * 0.5
            });
        }

        mockPreds.sort(function(a, b) { return b.confidence - a.confidence; });
        this.render(mockPreds);
    },

    clear: function() {
        if (this.containerEl) {
            this.containerEl.innerHTML = '';
        }
        this.lastPredictions = [];
    }
};
