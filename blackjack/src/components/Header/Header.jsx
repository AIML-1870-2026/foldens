import styles from './Header.module.css';

export default function Header({ soundEnabled, onToggleSound, onOpenSettings }) {
  return (
    <header className={styles.header}>
      <div className={styles.ornamentLeft} aria-hidden />
      <h1 className={styles.title}>Blackjack</h1>
      <div className={styles.ornamentRight} aria-hidden />
      <div className={styles.controls}>
        <button
          className={styles.iconBtn}
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
          title={soundEnabled ? 'Sound On' : 'Sound Off'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
        <button
          className={styles.iconBtn}
          onClick={onOpenSettings}
          aria-label="Open settings"
          title="Settings"
        >
          ⚙️
        </button>
      </div>
    </header>
  );
}
