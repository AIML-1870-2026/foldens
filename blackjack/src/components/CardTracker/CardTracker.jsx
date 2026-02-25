import styles from './CardTracker.module.css';

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const TOTAL = 4; // single deck: 4 of each rank

export default function CardTracker({ counts }) {
  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Card Tracker</h3>
      <div className={styles.divider} />
      <p className={styles.subtitle}>Remaining in deck</p>
      <div className={styles.grid}>
        {RANKS.map(rank => {
          const dealt = counts[rank] || 0;
          const remaining = Math.max(0, TOTAL - dealt);
          const depleted = remaining === 0;
          const low = remaining === 1;
          return (
            <div key={rank} className={`${styles.cell} ${depleted ? styles.depleted : low ? styles.low : ''}`}>
              <span className={styles.rank}>{rank}</span>
              <span className={styles.remaining}>{remaining}</span>
              <div className={styles.pips}>
                {Array.from({ length: TOTAL }).map((_, i) => (
                  <span key={i} className={`${styles.pip} ${i >= remaining ? styles.pipUsed : ''}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className={styles.note}>Resets on shuffle</p>
    </div>
  );
}
