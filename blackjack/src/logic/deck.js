const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
  '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10, 'A': 11,
};

// Maps card rank/suit to SVG filename in /public/cards/
const SUIT_NAMES = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
const RANK_NAMES = {
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7',
  '8': '8', '9': '9', '10': '10', 'J': 'jack', 'Q': 'queen', 'K': 'king', 'A': 'ace',
};

export function getCardImagePath(card) {
  return `${import.meta.env.BASE_URL}cards/${RANK_NAMES[card.rank]}_of_${SUIT_NAMES[card.suit]}.svg`;
}

let _idCounter = 0;

export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: RANK_VALUES[rank], id: `${suit}${rank}-${_idCounter++}` });
    }
  }
  return deck;
}

export function shuffleDeck(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Returns { card, deck } — does not mutate
export function dealCard(deck) {
  if (deck.length === 0) throw new Error('Deck is empty');
  const [card, ...remaining] = deck;
  return { card, deck: remaining };
}
