/* ============================================
   Quick, Decide! — Game State Machine
   ============================================ */

var Game = {
    // State
    phase: 'splash',
    currentRound: 0,
    score: 0,
    objectQueue: [],
    roundResults: [],
    currentPredictions: [],

    // UI state
    educationalMode: false,
    neuronData: null,

    // Internal timers
    _phaseTimeout: null,
    _roundStartTime: 0,

    startNewGame: function() {
        this.currentRound = 0;
        this.score = 0;
        this.roundResults = [];
        this.currentPredictions = [];
        this.objectQueue = this.selectRandomCategories(CONFIG.ROUNDS_PER_GAME);

        UI.updateScore(this.score);
        this.startRound();
    },

    selectRandomCategories: function(count) {
        // Prefer categories not yet attempted by the user
        var attempted = Scoring.stats.categoriesAttempted;
        var unattempted = [];
        var all = [];

        for (var i = 0; i < CATEGORIES.length; i++) {
            var cat = CATEGORIES[i];
            all.push(cat);
            if (attempted.indexOf(cat.name) === -1) {
                unattempted.push(cat);
            }
        }

        // Shuffle preference: unattempted first, then all
        var pool = unattempted.length >= count ? unattempted : all;
        var shuffled = pool.slice().sort(function() { return Math.random() - 0.5; });

        // Pick 'count' unique items, prefer easy/medium over hard
        var selected = [];
        var hardCount = 0;
        var maxHard = 1; // at most 1 hard category per game

        for (var j = 0; j < shuffled.length && selected.length < count; j++) {
            if (shuffled[j].difficulty === 'hard') {
                if (hardCount >= maxHard) continue;
                hardCount++;
            }
            selected.push(shuffled[j]);
        }

        // If still need more, fill from remainder
        while (selected.length < count && selected.length < all.length) {
            var idx = Math.floor(Math.random() * all.length);
            var already = selected.some(function(s) { return s.name === all[idx].name; });
            if (!already) selected.push(all[idx]);
        }

        return selected;
    },

    startRound: function() {
        this.transitionTo('prompt');
    },

    transitionTo: function(phase) {
        // Clear any pending timeout
        if (this._phaseTimeout) {
            clearTimeout(this._phaseTimeout);
            this._phaseTimeout = null;
        }

        this.phase = phase;
        var self = this;

        switch (phase) {
            case 'prompt':
                var cat = this.objectQueue[this.currentRound];
                UI.showScreen('prompt');
                UI.showPrompt(cat, this.currentRound + 1);

                this._phaseTimeout = setTimeout(function() {
                    self.transitionTo('countdown');
                }, CONFIG.PROMPT_DISPLAY_TIME);
                break;

            case 'countdown':
                UI.showScreen('countdown');
                this._runCountdown(3);
                break;

            case 'drawing':
                var cat2 = this.objectQueue[this.currentRound];
                UI.showScreen('drawing');
                UI.showDrawingHeader(cat2, this.currentRound + 1);

                // Reset canvas and predictions
                DrawingCanvas.clear();
                DrawingCanvas.enable();
                Predictions.clear();
                Predictions.predictionHistory = [];
                Education.reset();
                this._roundStartTime = Date.now();

                // Start timer
                Timer.start(
                    function(remaining) {
                        // onTick — nothing special
                    },
                    function() {
                        // onExpire — run one last inference, then check if the
                        // model's #1 guess is the target
                        Predictions.runInference();
                        var gotIt = Predictions.isTargetInTopGuesses(1);
                        self.endRound(gotIt);
                    }
                );

                // Start inference loop
                Predictions.startInferenceLoop();

                // Also run inference on stroke end
                DrawingCanvas.onStrokeEnd = function() {
                    Predictions.runInference();
                };
                break;

            case 'result':
                UI.showScreen('result');
                DrawingCanvas.disable();
                Predictions.stopInferenceLoop();
                Timer.stop();
                DrawingCanvas.onStrokeEnd = null;

                this._phaseTimeout = setTimeout(function() {
                    if (self.currentRound >= CONFIG.ROUNDS_PER_GAME - 1) {
                        self.transitionTo('summary');
                    } else {
                        self.currentRound++;
                        self.startRound();
                    }
                }, CONFIG.RESULT_DISPLAY_TIME);
                break;

            case 'summary':
                UI.showScreen('summary');
                UI.showSummary(this.roundResults, this.score);
                Scoring.recordGame(this.score);
                break;

            case 'splash':
                UI.showScreen('splash');
                break;
        }
    },

    _runCountdown: function(n) {
        var el = document.getElementById('countdown-number');
        var self = this;

        if (n <= 0) {
            this.transitionTo('drawing');
            return;
        }

        el.textContent = n;
        el.style.animation = 'none';
        // Trigger reflow
        void el.offsetHeight;
        el.style.animation = 'countPulse 0.8s ease';

        this._phaseTimeout = setTimeout(function() {
            self._runCountdown(n - 1);
        }, 1000);
    },

    endRound: function(guessedCorrectly) {
        if (this.phase !== 'drawing') return;

        Timer.stop();
        Predictions.stopInferenceLoop();
        DrawingCanvas.disable();
        DrawingCanvas.onStrokeEnd = null;

        var timeUsed = Timer.getElapsed();
        var cat = this.objectQueue[this.currentRound];
        var topGuess = this.currentPredictions.length > 0 ? this.currentPredictions[0] : null;

        // Deep-copy strokes with timestamps relative to round start
        var roundStart = this._roundStartTime;
        var savedStrokes = DrawingCanvas.strokes.map(function(stroke) {
            return stroke.map(function(pt) {
                return { x: pt.x, y: pt.y, t: pt.t - roundStart };
            });
        });

        // Record result (including replay data)
        var result = {
            category: cat,
            guessedCorrectly: guessedCorrectly,
            timeUsed: timeUsed,
            topGuesses: this.currentPredictions.slice(0, 5),
            drawingDataURL: DrawingCanvas.getDataURL(),
            strokes: savedStrokes,
            predictionHistory: Predictions.predictionHistory.slice()
        };
        this.roundResults.push(result);

        if (guessedCorrectly) {
            this.score++;
            UI.updateScore(this.score);
        }

        // Record in scoring
        Scoring.recordRound(cat.name, guessedCorrectly, timeUsed);

        // Show streak
        if (Scoring.stats.currentStreak >= 2) {
            UI.showStreak(Scoring.stats.currentStreak);
        }

        // Show result UI
        UI.showResult(guessedCorrectly, topGuess, cat, timeUsed);
        this.transitionTo('result');
    }
};
