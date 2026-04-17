export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 10, 'J': 10, 'Q': 10, 'K': 10, 'A': 11,
};

let _idCounter = 0;

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: RANK_VALUES[rank], id: `${suit}${rank}-${++_idCounter}` });
    }
  }
  return deck;
}

export function shuffle(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function calculateHandValue(cards) {
  let value = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === 'A') { aces++; value += 11; }
    else value += card.value;
  }
  while (value > 21 && aces > 0) { value -= 10; aces--; }
  const isBust = value > 21;
  const isSoft = aces > 0 && !isBust;
  const isBlackjack = cards.length === 2 && value === 21;
  return { value, isSoft, isBust, isBlackjack };
}

export function isRed(card) {
  return card.suit === '♥' || card.suit === '♦';
}

export function cardLabel(card) {
  return `${card.rank}${card.suit}`;
}
