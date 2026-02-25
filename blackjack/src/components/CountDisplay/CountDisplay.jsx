import { useState } from 'react';
import styles from './CountDisplay.module.css';

export default function CountDisplay({ count, shuffleFlash }) {
  const [showTip, setShowTip] = useState(false);
  const colorClass = count > 0 ? styles.positive : count < 0 ? styles.negative : styles.neutral;

  return (
    <div className={`${styles.wrap} ${shuffleFlash ? styles.flash : ''}`}>
      {shuffleFlash && <span className={styles.shuffleMsg}>Deck Shuffled</span>}
      <span className={styles.label}>Hi-Lo Count</span>
      <span className={`${styles.count} ${colorClass}`}>
        {count > 0 ? `+${count}` : count}
      </span>
      <button
        className={styles.info}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onClick={() => setShowTip(v => !v)}
        aria-label="Hi-Lo count info"
      >
        ℹ️
      </button>
      {showTip && (
        <div className={styles.tooltip}>
          <strong>Hi-Lo Card Counting</strong>
          <p>+1 for low cards (2–6)</p>
          <p>0 for neutral cards (7–9)</p>
          <p>−1 for high cards (10, J, Q, K, A)</p>
          <p>Higher count = player advantage</p>
        </div>
      )}
    </div>
  );
}
