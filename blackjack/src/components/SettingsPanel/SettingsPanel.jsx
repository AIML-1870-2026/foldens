import styles from './SettingsPanel.module.css';

const THEMES = [
  { key: 'classic', label: 'Classic Vegas' },
  { key: 'midnight', label: 'Midnight' },
  { key: 'crimson', label: 'Crimson' },
];

export default function SettingsPanel({ settings, onUpdateSetting, onClose }) {
  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.title}>Settings</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <div className={styles.divider} />

        <div className={styles.rows}>
          <ToggleRow
            label="Sound"
            icon={settings.soundEnabled ? '🔊' : '🔇'}
            checked={settings.soundEnabled}
            onChange={v => onUpdateSetting('soundEnabled', v)}
          />
          <ToggleRow
            label="Show Card Count"
            icon="🔢"
            checked={settings.showCount}
            onChange={v => onUpdateSetting('showCount', v)}
          />
          <ToggleRow
            label="Strategy Hints"
            icon="💡"
            checked={settings.showHints}
            onChange={v => onUpdateSetting('showHints', v)}
          />
          <ToggleRow
            label="Dealer Tells"
            icon="🎭"
            checked={settings.showTells}
            onChange={v => onUpdateSetting('showTells', v)}
          />
        </div>

        <div className={styles.divider} />

        <div className={styles.themeSection}>
          <span className={styles.themeLabel}>Theme</span>
          <div className={styles.themeButtons}>
            {THEMES.map(t => (
              <button
                key={t.key}
                className={`${styles.themeBtn} ${settings.theme === t.key ? styles.active : ''} ${styles[t.key]}`}
                onClick={() => onUpdateSetting('theme', t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, icon, checked, onChange }) {
  return (
    <div className={styles.toggleRow}>
      <span className={styles.toggleIcon}>{icon}</span>
      <span className={styles.toggleLabel}>{label}</span>
      <button
        className={`${styles.toggle} ${checked ? styles.on : styles.off}`}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span className={styles.thumb} />
      </button>
    </div>
  );
}
