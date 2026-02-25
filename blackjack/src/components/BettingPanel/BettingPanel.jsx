import Chip from '../Chip/Chip.jsx';
import styles from './BettingPanel.module.css';

const CHIPS = [5, 25, 50, 100, 500];

export default function BettingPanel({ currentBet, balance, onAddChip, onClearBet, onDeal, onReload, gamePhase }) {
  const canBet = gamePhase === 'betting';
  const broke = balance < 5;
  const canDeal = canBet && currentBet >= 5 && !broke;

  if (broke) {
    return (
      <div className={styles.panel}>
        <div className={styles.brokeMsg}>
          <span className={styles.brokeIcon}>💸</span>
          <span className={styles.brokeText}>You're out of chips!</span>
          <span className={styles.balanceAmount}>${balance.toLocaleString()} remaining</span>
        </div>
        <button className={`${styles.btn} ${styles.reloadBtn}`} onClick={onReload} aria-label="Reload balance">
          Reload $1,000
        </button>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.betDisplay}>
        <span className={styles.betLabel}>Current Bet</span>
        <span className={styles.betAmount}>${currentBet}</span>
      </div>

      <div className={styles.chips}>
        {CHIPS.map(amount => (
          <Chip
            key={amount}
            amount={amount}
            onClick={() => onAddChip(amount)}
            disabled={!canBet || balance < amount}
          />
        ))}
      </div>

      <div className={styles.balanceRow}>
        <span className={styles.balanceLabel}>Balance</span>
        <span className={styles.balanceAmount}>${balance.toLocaleString()}</span>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.btn} ${styles.clearBtn}`}
          onClick={onClearBet}
          disabled={!canBet || currentBet === 0}
          aria-label="Clear bet"
        >
          Clear [C]
        </button>
        <button
          className={`${styles.btn} ${styles.dealBtn}`}
          onClick={onDeal}
          disabled={!canDeal}
          aria-label="Deal cards"
        >
          Deal [D]
        </button>
      </div>
    </div>
  );
}
