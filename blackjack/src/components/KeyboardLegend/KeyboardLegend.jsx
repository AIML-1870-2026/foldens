import styles from './KeyboardLegend.module.css';

const KEYS = [
  { key: 'D', action: 'Deal', phases: ['betting', 'roundOver'] },
  { key: 'H', action: 'Hit', phases: ['playerTurn'] },
  { key: 'S', action: 'Stand', phases: ['playerTurn'] },
  { key: 'X', action: 'Double', phases: ['playerTurn'] },
  { key: 'P', action: 'Split', phases: ['playerTurn'] },
  { key: 'C', action: 'Clear', phases: ['betting'] },
  { key: '1–5', action: 'Chips', phases: ['betting'] },
];

export default function KeyboardLegend({ gamePhase }) {
  return (
    <div className={styles.legend}>
      {KEYS.map(({ key, action, phases }) => {
        const active = phases.includes(gamePhase);
        return (
          <span key={key} className={`${styles.item} ${active ? '' : styles.dim}`}>
            <kbd className={styles.kbd}>{key}</kbd>
            <span className={styles.label}>{action}</span>
          </span>
        );
      })}
    </div>
  );
}
