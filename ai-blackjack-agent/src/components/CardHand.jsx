import Card from './Card.jsx';

export default function CardHand({ cards, holeHidden = false, label, score, active = false, result = null }) {
  const resultClass = result ? `hand-result--${result}` : '';
  return (
    <div className={['card-hand', active ? 'card-hand--active' : ''].filter(Boolean).join(' ')}>
      {label && <div className="hand-label">{label}</div>}
      <div className="hand-cards">
        {cards.map((card, i) => (
          <Card
            key={card.id}
            card={card}
            hidden={holeHidden && i === 1}
          />
        ))}
      </div>
      {score != null && (
        <div className={['hand-score', resultClass].filter(Boolean).join(' ')}>
          {score}
          {result && <span className="hand-result-label">{result.toUpperCase()}</span>}
        </div>
      )}
    </div>
  );
}
