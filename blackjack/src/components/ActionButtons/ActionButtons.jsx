import styles from './ActionButtons.module.css';

export default function ActionButtons({ gamePhase, canDouble, canSplit, balance, activeBet, onHit, onStand, onDouble, onSplit, onNewRound }) {
  if (gamePhase === 'roundOver') {
    return (
      <div className={styles.container}>
        <button className={`${styles.btn} ${styles.primary}`} onClick={onNewRound} aria-label="New round">
          New Round [D]
        </button>
      </div>
    );
  }

  if (gamePhase !== 'playerTurn') return null;

  const needForDouble = activeBet ?? 0;
  const shortfall = needForDouble - (balance ?? 0);
  const doubleTitle = !canDouble && shortfall > 0
    ? `Need $${shortfall} more to double (requires $${needForDouble})`
    : !canDouble
    ? 'Double only available on first two cards'
    : 'Double your bet and receive one card';

  const splitTitle = !canSplit
    ? 'Split only available on matching pairs'
    : 'Split into two hands';

  return (
    <div className={styles.container}>
      <button className={`${styles.btn} ${styles.hit}`} onClick={onHit} aria-label="Hit" title="Take another card">
        Hit [H]
      </button>
      <button className={`${styles.btn} ${styles.stand}`} onClick={onStand} aria-label="Stand" title="Keep your hand">
        Stand [S]
      </button>
      <button
        className={`${styles.btn} ${styles.double}`}
        onClick={onDouble}
        disabled={!canDouble}
        aria-label="Double down"
        title={doubleTitle}
      >
        Double [X]
        {!canDouble && shortfall > 0 && (
          <span className={styles.disabledNote}>−${shortfall}</span>
        )}
      </button>
      <button
        className={`${styles.btn} ${styles.split}`}
        onClick={onSplit}
        disabled={!canSplit}
        aria-label="Split"
        title={splitTitle}
      >
        Split [P]
      </button>
    </div>
  );
}
