import { getBasicStrategyHint } from '../../logic/basicStrategy.js';
import styles from './StrategyHint.module.css';

const ACTION_ICONS = {
  hit: '👊',
  stand: '✋',
  double: '⬆️',
  split: '✂️',
};

// When the ideal action isn't available, fall back to the next best
function applyFallback(hint, canDouble, canSplit) {
  if (!hint) return null;
  if (hint.action === 'double' && !canDouble) {
    return { action: 'hit', label: 'Basic Strategy: Hit (can\'t double)' };
  }
  if (hint.action === 'split' && !canSplit) {
    // Treat the pair as a hard total → hint will usually be hit or stand
    return { action: 'hit', label: 'Basic Strategy: Hit (can\'t split)' };
  }
  return hint;
}

export default function StrategyHint({ playerCards, dealerUpcard, canDouble, canSplit }) {
  const raw = getBasicStrategyHint(playerCards, dealerUpcard);
  const hint = applyFallback(raw, canDouble, canSplit);
  if (!hint) return null;

  return (
    <div className={styles.banner}>
      <span className={styles.icon}>{ACTION_ICONS[hint.action] ?? '🃏'}</span>
      <span className={styles.text}>{hint.label}</span>
    </div>
  );
}
