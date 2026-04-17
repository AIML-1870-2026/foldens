import React from 'react';

export function CardCounter({ cardCount, cardsPlayed, totalDeckCards, calculateTrueCount }) {
  // Calculate true count
  const trueCount = calculateTrueCount();
  
  // Calculate percent of deck used
  const totalCards = totalDeckCards + cardsPlayed;
  const decksPassed = cardsPlayed / 52;
  const deckPercent = Math.max(0, Math.min(100, (cardsPlayed / (totalCards || 52)) * 100));

  // Determine color based on count (green for high, red for low, neutral for near-zero)
  let countColor = '#888';
  if (cardCount > 5) countColor = '#4ade80'; // green
  else if (cardCount < -5) countColor = '#ef4444'; // red
  else if (cardsPlayed > 0) countColor = '#f59e0b'; // amber

  return (
    <div className="card-counter">
      <div className="counter-section">
        <div className="counter-label">Running Count</div>
        <div className="counter-value" style={{ color: countColor }}>
          {cardCount > 0 ? '+' : ''}{cardCount}
        </div>
      </div>

      <div className="counter-section">
        <div className="counter-label">True Count</div>
        <div className="counter-value" style={{ color: countColor }}>
          {trueCount > 0 ? '+' : ''}{trueCount.toFixed(1)}
        </div>
      </div>

      <div className="counter-section">
        <div className="counter-label">Deck Usage</div>
        <div className="deck-bar">
          <div 
            className="deck-bar-fill" 
            style={{ width: `${deckPercent}%` }}
          />
        </div>
        <div className="deck-percent">
          {deckPercent.toFixed(0)}%
        </div>
      </div>

      <div className="counter-info">
        <div className="info-item">
          <span className="info-label">Cards:</span>
          <span className="info-value">{cardsPlayed}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Remaining:</span>
          <span className="info-value">{Math.max(0, totalCards - cardsPlayed)}</span>
        </div>
      </div>
    </div>
  );
}
