import { useState, useCallback } from 'react';

const STATS_KEY = 'blackjack_stats';
const HISTORY_KEY = 'blackjack_history';

const DEFAULT_STATS = {
  roundsPlayed: 0,
  wins: 0,
  losses: 0,
  pushes: 0,
  blackjacks: 0,
  biggestWin: 0,
  currentStreak: 0, // positive = win streak, negative = loss streak
  netPnL: 0,
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function useStats() {
  const [stats, setStats] = useState(() => load(STATS_KEY, DEFAULT_STATS));
  const [history, setHistory] = useState(() => load(HISTORY_KEY, []));

  const recordRound = useCallback(({ result, bet, netChange, balanceAfter }) => {
    setStats(prev => {
      const next = { ...prev };
      next.roundsPlayed += 1;
      next.netPnL += netChange;

      if (result === 'win' || result === 'blackjack') {
        next.wins += 1;
        if (result === 'blackjack') next.blackjacks += 1;
        if (netChange > next.biggestWin) next.biggestWin = netChange;
        next.currentStreak = next.currentStreak > 0 ? next.currentStreak + 1 : 1;
      } else if (result === 'loss' || result === 'bust') {
        next.losses += 1;
        next.currentStreak = next.currentStreak < 0 ? next.currentStreak - 1 : -1;
      } else if (result === 'push') {
        next.pushes += 1;
        next.currentStreak = 0;
      }

      save(STATS_KEY, next);
      return next;
    });

    setHistory(prev => {
      const entry = {
        round: (prev[0]?.round ?? 0) + 1,
        bet,
        result,
        netChange,
        balanceAfter,
        timestamp: Date.now(),
      };
      const next = [entry, ...prev].slice(0, 20);
      save(HISTORY_KEY, next);
      return next;
    });
  }, []);

  const resetStats = useCallback(() => {
    setStats(DEFAULT_STATS);
    setHistory([]);
    save(STATS_KEY, DEFAULT_STATS);
    save(HISTORY_KEY, []);
  }, []);

  return { stats, history, recordRound, resetStats };
}
