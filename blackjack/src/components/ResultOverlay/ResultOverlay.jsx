import { useEffect, useState } from 'react';
import styles from './ResultOverlay.module.css';

const CONFIG = {
  win:      { cls: 'win',       sparkle: false },
  blackjack:{ cls: 'blackjack', sparkle: true },
  loss:     { cls: 'loss',      sparkle: false },
  bust:     { cls: 'loss',      sparkle: false },
  push:     { cls: 'push',      sparkle: false },
};

export default function ResultOverlay({ result, message, onDismiss }) {
  const [visible, setVisible] = useState(true);
  const cfg = CONFIG[result] ?? { cls: 'push', sparkle: false };

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div className={`${styles.box} ${styles[cfg.cls]} ${cfg.sparkle ? styles.sparkle : ''}`}>
        <span className={styles.text}>{message}</span>
      </div>
    </div>
  );
}
