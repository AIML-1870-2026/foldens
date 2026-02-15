/* ============================================
   Quick, Decide! — Entry Point
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Quick, Decide! initializing...');

    // Initialize modules
    UI.init();
    Preprocessor.init();
    DrawingCanvas.init(document.getElementById('drawing-canvas'));
    Timer.init(
        document.getElementById('timer-canvas'),
        document.getElementById('timer-text')
    );
    Predictions.init(document.getElementById('guess-list'));
    Scoring.load();
    Education.init();
    DemoMode.init();

    // ---- Button Events ----
    document.getElementById('btn-start').addEventListener('click', function() {
        Game.startNewGame();
    });

    document.getElementById('btn-undo').addEventListener('click', function() {
        DrawingCanvas.undo();
    });

    document.getElementById('btn-clear').addEventListener('click', function() {
        DrawingCanvas.clear();
    });

    document.getElementById('btn-play-again').addEventListener('click', function() {
        Game.startNewGame();
    });

    document.getElementById('btn-toggle-neuron').addEventListener('click', function() {
        Education.toggle();
    });

    document.getElementById('btn-share').addEventListener('click', function() {
        var text = Scoring.getShareText(Game.roundResults, Game.score);
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function() {
                alert('Results copied to clipboard!');
            });
        } else {
            // Fallback
            prompt('Copy your results:', text);
        }
    });

    document.getElementById('btn-explore-ai').addEventListener('click', function() {
        DemoMode.start();
    });

    // ---- Settings ----
    document.getElementById('btn-settings').addEventListener('click', function() {
        document.getElementById('settings-modal').classList.remove('hidden');
        UI.updateSettings();
    });

    document.getElementById('btn-close-settings').addEventListener('click', function() {
        document.getElementById('settings-modal').classList.add('hidden');
    });

    document.getElementById('settings-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.add('hidden');
        }
    });

    document.getElementById('setting-education').addEventListener('change', function() {
        Education.setExpanded(this.checked);
    });

    // ---- Replay Modal ----
    Replay.init();

    document.getElementById('btn-close-replay').addEventListener('click', function() {
        Replay.close();
    });

    document.getElementById('replay-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            Replay.close();
        }
    });

    document.getElementById('replay-play-btn').addEventListener('click', function() {
        Replay.togglePlay();
    });

    document.getElementById('replay-speed-btn').addEventListener('click', function() {
        Replay.cycleSpeed();
    });

    document.getElementById('replay-progress').addEventListener('input', function() {
        Replay.seekTo(parseFloat(this.value));
    });

    // Replay buttons are added dynamically — use event delegation
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('summary-replay-btn')) {
            var roundIdx = parseInt(e.target.dataset.round, 10);
            if (Game.roundResults[roundIdx]) {
                Replay.open(Game.roundResults[roundIdx]);
            }
        }
    });

    // ---- Demo Modal ----
    document.getElementById('btn-close-demo').addEventListener('click', function() {
        DemoMode.close();
    });

    document.getElementById('demo-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            DemoMode.close();
        }
    });

    document.getElementById('btn-demo-skip').addEventListener('click', function() {
        DemoMode.close();
    });

    document.getElementById('btn-demo-next').addEventListener('click', function() {
        DemoMode.nextDrawing();
    });

    document.getElementById('btn-demo-play').addEventListener('click', function() {
        DemoMode.close();
        Game.startNewGame();
    });

    // ---- Load ML Model ----
    UI.showModelStatus('Loading neural network...', '');

    ModelManager.init().then(function(success) {
        if (success) {
            UI.showModelStatus('Brain ready! 🧠', 'ready');
        } else {
            UI.showModelStatus('Practice mode (model unavailable)', 'error');
        }
    }).catch(function(err) {
        console.error('Model init error:', err);
        UI.showModelStatus('Practice mode (model unavailable)', 'error');
    });

    // Show splash
    Game.transitionTo('splash');

    console.log('Quick, Decide! ready.');
});
