import { useMemo } from 'react';
import styles from './DealerTell.module.css';

const DEALER_TELLS = [
  { emoji: '👀', text: 'The dealer glances to the left...' },
  { emoji: '🎩', text: 'The dealer adjusts their hat.' },
  { emoji: '💧', text: 'A bead of sweat forms on their brow...' },
  { emoji: '😏', text: 'The dealer smirks ever so slightly.' },
  { emoji: '🤌', text: 'The dealer cracks their knuckles.' },
  { emoji: '🧤', text: 'The dealer tugs at their gloves.' },
  { emoji: '💨', text: 'The dealer exhales slowly.' },
  { emoji: '🪙', text: 'The dealer fingers their chip rack.' },
  { emoji: '🌝', text: "The dealer's left eye twitches." },
  { emoji: '🦷', text: 'The dealer bites their lip.' },
  { emoji: '📿', text: 'The dealer touches their cufflinks.' },
  { emoji: '🎭', text: "The dealer's expression goes carefully blank." },
];

export default function DealerTell({ seed, visible }) {
  const tell = useMemo(() => DEALER_TELLS[seed % DEALER_TELLS.length], [seed]);

  if (!visible) return null;

  return (
    <div className={styles.tell}>
      <span className={styles.emoji}>{tell.emoji}</span>
      <span className={styles.text}>{tell.text}</span>
      <span className={styles.disclaimer}>Just for fun — tells are random!</span>
    </div>
  );
}
