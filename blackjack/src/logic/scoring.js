export function calculateHandValue(cards) {
  let value = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.rank === 'A') {
      aces += 1;
      value += 11;
    } else {
      value += card.value;
    }
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }

  const isBust = value > 21;
  const isSoft = aces > 0 && !isBust;
  const isBlackjack = cards.length === 2 && value === 21;

  return { value, isSoft, isBust, isBlackjack };
}

export function getHandLabel(handResult) {
  if (handResult.isBlackjack) return 'BLACKJACK';
  if (handResult.isBust) return 'BUST';
  if (handResult.isSoft) return `Soft ${handResult.value}`;
  return String(handResult.value);
}
