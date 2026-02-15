/* ============================================
   Quick, Decide! — Scoring & Persistence
   ============================================ */

var Scoring = {
    stats: {
        totalGames: 0,
        totalCorrect: 0,
        bestScore: 0,
        categoriesAttempted: [],
        fastestGuess: Infinity,
        currentStreak: 0,
        bestStreak: 0
    },

    load: function() {
        try {
            var saved = localStorage.getItem(CONFIG.STORAGE_KEYS.stats);
            if (saved) {
                var parsed = JSON.parse(saved);
                // Merge with defaults to handle new fields
                for (var key in parsed) {
                    if (this.stats.hasOwnProperty(key)) {
                        this.stats[key] = parsed[key];
                    }
                }
            }
        } catch (e) {
            console.warn('Could not load stats:', e);
        }
    },

    save: function() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.stats, JSON.stringify(this.stats));
        } catch (e) {
            console.warn('Could not save stats:', e);
        }
    },

    recordRound: function(categoryName, correct, timeUsed) {
        if (correct) {
            this.stats.totalCorrect++;
            this.stats.currentStreak++;
            if (this.stats.currentStreak > this.stats.bestStreak) {
                this.stats.bestStreak = this.stats.currentStreak;
            }
            if (timeUsed < this.stats.fastestGuess) {
                this.stats.fastestGuess = timeUsed;
            }
        } else {
            this.stats.currentStreak = 0;
        }

        if (this.stats.categoriesAttempted.indexOf(categoryName) === -1) {
            this.stats.categoriesAttempted.push(categoryName);
        }

        this.save();
    },

    recordGame: function(score) {
        this.stats.totalGames++;
        if (score > this.stats.bestScore) {
            this.stats.bestScore = score;
        }
        this.save();
    },

    getShareText: function(roundResults, score) {
        var lines = ['Quick, Decide! 🧠 — ' + score + '/6\n'];
        roundResults.forEach(function(r) {
            var icon = r.guessedCorrectly ? '✅' : '❌';
            var time = r.guessedCorrectly ? ' (' + r.timeUsed + 's)' : '';
            lines.push(r.category.emoji + ' ' + r.category.displayName + ' ' + icon + time);
        });
        lines.push('\nPlay at: ' + window.location.href);
        return lines.join('\n');
    },

    getStatsHTML: function() {
        var s = this.stats;
        if (s.totalGames === 0) {
            return '<p>No games played yet!</p>';
        }
        var fastest = s.fastestGuess === Infinity ? '--' : s.fastestGuess + 's';
        return '<p>Games played: <strong>' + s.totalGames + '</strong></p>' +
               '<p>Total correct: <strong>' + s.totalCorrect + '</strong></p>' +
               '<p>Best score: <strong>' + s.bestScore + '/6</strong></p>' +
               '<p>Best streak: <strong>🔥 ' + s.bestStreak + '</strong></p>' +
               '<p>Fastest guess: <strong>' + fastest + '</strong></p>' +
               '<p>Categories drawn: <strong>' + s.categoriesAttempted.length + '/345</strong></p>';
    }
};
