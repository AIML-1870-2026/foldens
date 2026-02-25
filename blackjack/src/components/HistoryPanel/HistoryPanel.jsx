import styles from './HistoryPanel.module.css';

const RESULT_BADGE = {
  win:      { label: 'WIN',  cls: 'win' },
  blackjack:{ label: 'BJ',   cls: 'blackjack' },
  loss:     { label: 'LOSS', cls: 'loss' },
  bust:     { label: 'BUST', cls: 'bust' },
  push:     { label: 'PUSH', cls: 'push' },
};

export default function HistoryPanel({ history }) {
  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>History</h3>
      <div className={styles.divider} />
      <div className={styles.list}>
        {history.length === 0 && (
          <p className={styles.empty}>No rounds played yet</p>
        )}
        {history.map((entry, i) => {
          const badge = RESULT_BADGE[entry.result] ?? { label: entry.result.toUpperCase(), cls: 'push' };
          const sign = entry.netChange >= 0 ? '+' : '';
          return (
            <div key={i} className={styles.entry}>
              <span className={styles.round}>#{entry.round}</span>
              <span className={`${styles.badge} ${styles[badge.cls]}`}>{badge.label}</span>
              <span className={styles.bet}>${entry.bet}</span>
              <span className={`${styles.net} ${entry.netChange >= 0 ? styles.pos : styles.neg}`}>
                {sign}${entry.netChange}
              </span>
              <span className={styles.balance}>${entry.balanceAfter.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
