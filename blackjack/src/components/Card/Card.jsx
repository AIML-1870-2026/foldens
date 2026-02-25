import { useState, useEffect } from 'react';
import { getCardImagePath } from '../../logic/deck.js';
import styles from './Card.module.css';

export default function Card({ card, hidden = false, delay = 0, small = false }) {
  const [visible, setVisible] = useState(false);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    // Entrance animation
    const t1 = setTimeout(() => setVisible(true), delay);
    // Flip to face-up (unless hidden)
    const t2 = setTimeout(() => setFlipped(!hidden), delay + 60);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // When hidden changes to false (hole card reveal)
  useEffect(() => {
    if (!hidden) setFlipped(true);
  }, [hidden]);

  return (
    <div className={`${styles.wrapper} ${visible ? styles.visible : ''} ${small ? styles.small : ''}`}>
      <div className={`${styles.inner} ${flipped ? styles.flipped : ''}`}>
        <div className={styles.front}>
          {card && (
            <img
              src={getCardImagePath(card)}
              alt={`${card.rank} of ${card.suit}`}
              className={styles.svgCard}
              draggable={false}
            />
          )}
        </div>
        <div className={styles.back}>
          <div className={styles.backInner} />
        </div>
      </div>
    </div>
  );
}
