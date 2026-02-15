/* ============================================
   Quick, Decide! — UI Manager
   ============================================ */

var UI = {
    screens: {},

    init: function() {
        this.screens = {
            splash:    document.getElementById('screen-splash'),
            prompt:    document.getElementById('screen-prompt'),
            countdown: document.getElementById('screen-countdown'),
            drawing:   document.getElementById('screen-drawing'),
            result:    document.getElementById('screen-result'),
            summary:   document.getElementById('screen-summary')
        };
    },

    showScreen: function(name) {
        for (var key in this.screens) {
            this.screens[key].classList.remove('active');
        }
        if (this.screens[name]) {
            this.screens[name].classList.add('active');
        }
    },


    showModelStatus: function(msg, state) {
        var el = document.getElementById('model-status');
        if (!el) return;
        el.innerHTML = '<span class="loading-dot"></span> ' + msg;
        el.className = 'model-status';
        if (state) el.classList.add(state);
    },

    showPrompt: function(category, round) {
        document.getElementById('prompt-emoji').textContent = category.emoji;
        document.getElementById('prompt-object').textContent = category.displayName.toUpperCase();
        document.getElementById('round-num').textContent = round;
    },

    showDrawingHeader: function(category, round) {
        document.getElementById('draw-prompt-mini').textContent =
            '✏️ ' + category.emoji + ' ' + category.displayName;
        document.getElementById('draw-round-mini').textContent = 'Round ' + round + '/6';
    },

    updateScore: function(score) {
        var el = document.getElementById('score-display');
        if (el) el.textContent = '⭐ ' + score + '/6';
    },

    showResult: function(correct, topGuess, category, timeUsed) {
        var textEl = document.getElementById('result-text');
        var subEl = document.getElementById('result-subtext');
        var resultDrawing = document.getElementById('result-drawing');

        if (correct) {
            textEl.textContent = 'I knew it was a ' + category.displayName + '! ✨';
            textEl.className = 'result-text correct';
            subEl.textContent = 'Got it in ' + timeUsed + ' seconds!';
            if (resultDrawing) {
                resultDrawing.classList.add('correct-glow');
                setTimeout(function() { resultDrawing.classList.remove('correct-glow'); }, 2500);
            }
        } else {
            var guessText = topGuess ? topGuess.label : 'something else';
            textEl.textContent = 'Hmm, I thought that was a ' + guessText + '... 🤔';
            textEl.className = 'result-text incorrect';
            subEl.textContent = "That's a tough one!";
            if (resultDrawing) {
                resultDrawing.classList.add('incorrect-glow');
                setTimeout(function() { resultDrawing.classList.remove('incorrect-glow'); }, 2500);
            }
        }

        // Copy drawing to result canvas
        var resultCanvas = document.getElementById('result-canvas');
        if (resultCanvas) {
            DrawingCanvas.copyToCanvas(resultCanvas);
        }
    },

    showSummary: function(roundResults, score) {
        // Score header
        var scoreEl = document.getElementById('summary-score');
        if (scoreEl) {
            scoreEl.textContent = '⭐ You scored ' + score + ' out of 6! ⭐';
        }

        // Round list
        var roundsEl = document.getElementById('summary-rounds');
        if (roundsEl) {
            var html = '';
            roundResults.forEach(function(r, i) {
                var icon = r.guessedCorrectly ? '✅' : '❌';
                var timeText = r.guessedCorrectly ? r.timeUsed + 's' : '';
                var resultClass = r.guessedCorrectly ? 'correct' : 'incorrect';

                html += '<div class="summary-round-item">' +
                    '<div class="summary-round-left">' +
                        '<canvas class="summary-round-thumb" data-round="' + i + '" width="40" height="40"></canvas>' +
                        '<span>' + r.category.emoji + ' ' + r.category.displayName + '</span>' +
                    '</div>' +
                    '<div class="summary-round-right">' +
                        '<span class="summary-round-result ' + resultClass + '">' +
                            icon + ' ' + timeText +
                        '</span>' +
                        '<button class="summary-replay-btn" data-round="' + i + '">🔬 Replay</button>' +
                    '</div>' +
                '</div>';
            });
            roundsEl.innerHTML = html;

            // Draw thumbnails
            roundResults.forEach(function(r, i) {
                if (r.drawingDataURL) {
                    var thumbCanvas = roundsEl.querySelector('[data-round="' + i + '"]');
                    if (thumbCanvas) {
                        var ctx = thumbCanvas.getContext('2d');
                        var img = new Image();
                        img.onload = function() {
                            ctx.drawImage(img, 0, 0, 40, 40);
                        };
                        img.src = r.drawingDataURL;
                    }
                }
            });
        }

        // Stats
        var statsEl = document.getElementById('summary-stats');
        if (statsEl) {
            var fastest = null;
            var fastestTime = Infinity;
            roundResults.forEach(function(r) {
                if (r.guessedCorrectly && r.timeUsed < fastestTime) {
                    fastestTime = r.timeUsed;
                    fastest = r;
                }
            });

            var statsHtml = '';
            if (fastest) {
                statsHtml = 'Fastest guess: ' + fastest.category.emoji + ' ' +
                    fastest.category.displayName + ' (' + fastest.timeUsed + 's!)';
            }
            statsEl.innerHTML = statsHtml;
        }
    },

    showStreak: function(count) {
        var el = document.getElementById('streak-notification');
        var countEl = document.getElementById('streak-count');
        if (!el || !countEl || count < 2) {
            if (el) el.classList.add('hidden');
            return;
        }

        countEl.textContent = count;
        el.classList.remove('hidden');

        setTimeout(function() {
            el.classList.add('hidden');
        }, 2500);
    },

    updateSettings: function() {
        var statsContent = document.getElementById('stats-content');
        if (statsContent) {
            statsContent.innerHTML = Scoring.getStatsHTML();
        }
    }
};
