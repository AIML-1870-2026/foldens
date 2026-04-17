import { isRed } from '../lib/cards.js';

export default function Card({ card, hidden = false, small = false }) {
  const cls = ['card', small ? 'card--small' : '', hidden ? 'card--hidden' : ''].filter(Boolean).join(' ');

  if (hidden) {
    return (
      <div className={cls}>
        <div className="card-back">?</div>
      </div>
    );
  }

  const red = isRed(card);
  return (
    <div className={cls} style={{ color: red ? '#c0392b' : '#1a1a1a' }}>
      <div className="card-corner card-corner--tl">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit">{card.suit}</span>
      </div>
      <div className="card-center">{card.suit}</div>
      <div className="card-corner card-corner--br">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit">{card.suit}</span>
      </div>
    </div>
  );
}
