import { useState } from 'react';
import styles from './StatsPanel.module.css';

export default function StatsPanel({ stats, onReset }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const winRate = (stats.wins + stats.losses) > 0
    ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1)
    : '—';

  const streakLabel = () => {
    if (stats.currentStreak > 0) return `🔥 W${stats.currentStreak}`;
    if (stats.currentStreak < 0) return `❄️ L${Math.abs(stats.currentStreak)}`;
    return '—';
  };

  const rows = [
    { label: 'Rounds Played', value: stats.roundsPlayed },
    { label: 'Wins', value: stats.wins },
    { label: 'Losses', value: stats.losses },
    { label: 'Pushes', value: stats.pushes },
    { label: 'Win Rate', value: winRate === '—' ? '—' : `${winRate}%` },
    { label: 'Blackjacks', value: stats.blackjacks },
    { label: 'Biggest Win', value: `$${stats.biggestWin}` },
    { label: 'Streak', value: streakLabel() },
    { label: 'Net P&L', value: `${stats.netPnL >= 0 ? '+' : ''}$${stats.netPnL}`, highlight: stats.netPnL >= 0 ? 'win' : 'loss' },
  ];

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Statistics</h3>
      <div className={styles.divider} />
      <div className={styles.rows}>
        {rows.map(r => (
          <div key={r.label} className={styles.row}>
            <span className={styles.rowLabel}>{r.label}</span>
            <span className={`${styles.rowValue} ${r.highlight ? styles[r.highlight] : ''}`}>{r.value}</span>
          </div>
        ))}
      </div>
      <div className={styles.divider} />
      {confirmReset ? (
        <div className={styles.confirm}>
          <span className={styles.confirmText}>Reset all stats?</span>
          <div className={styles.confirmBtns}>
            <button className={`${styles.btn} ${styles.danger}`} onClick={() => { onReset(); setConfirmReset(false); }}>Yes</button>
            <button className={styles.btn} onClick={() => setConfirmReset(false)}>No</button>
          </div>
        </div>
      ) : (
        <button className={`${styles.btn} ${styles.resetBtn}`} onClick={() => setConfirmReset(true)}>Reset Stats</button>
      )}
    </div>
  );
}
