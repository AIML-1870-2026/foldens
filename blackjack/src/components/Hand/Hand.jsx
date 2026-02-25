import Card from '../Card/Card.jsx';
import { calculateHandValue, getHandLabel } from '../../logic/scoring.js';
import styles from './Hand.module.css';

export default function Hand({ hand, isDealer = false, active = false, small = false }) {
  const { cards, holeCardHidden } = isDealer
    ? hand
    : { cards: hand.cards, holeCardHidden: false };

  const visibleCards = isDealer && holeCardHidden ? [cards[0]] : cards;
  const result = calculateHandValue(visibleCards);
  const label = getHandLabel(result);

  return (
    <div className={`${styles.hand} ${active ? styles.active : ''} ${isDealer ? styles.dealer : ''}`}>
      <div className={styles.cards}>
        {cards.map((card, i) => {
          const isHole = isDealer && i === 1;
          return (
            <Card
              key={card.id}
              card={card}
              hidden={isHole && holeCardHidden}
              delay={i * 150}
              small={small}
            />
          );
        })}
      </div>
      <div className={`${styles.score} ${result.isBust ? styles.bust : ''} ${result.isBlackjack ? styles.blackjack : ''}`}>
        {cards.length > 0 && label}
      </div>
    </div>
  );
}
