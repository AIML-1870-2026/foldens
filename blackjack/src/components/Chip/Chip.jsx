import styles from './Chip.module.css';

const CHIP_COLORS = {
  5: 'red',
  25: 'green',
  50: 'blue',
  100: 'black',
  500: 'purple',
};

export default function Chip({ amount, onClick, disabled = false }) {
  const color = CHIP_COLORS[amount] ?? 'red';
  return (
    <button
      className={`${styles.chip} ${styles[color]} ${disabled ? styles.disabled : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={`Add $${amount} chip`}
      title={`$${amount}`}
    >
      <span className={styles.label}>${amount}</span>
    </button>
  );
}
