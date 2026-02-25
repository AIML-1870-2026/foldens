// Full single-deck Basic Strategy lookup table
// Actions: H = Hit, S = Stand, D = Double (else Hit), Ds = Double (else Stand), P = Split

// Dealer upcard index: 2,3,4,5,6,7,8,9,10,A
const UPCARDS = ['2','3','4','5','6','7','8','9','10','A'];
const idx = (c) => UPCARDS.indexOf(c);

// Hard totals (8–17) vs dealer upcard
const HARD = {
   8: ['H','H','H','H','H','H','H','H','H','H'],
   9: ['D','D','D','D','D','H','H','H','H','H'],
  10: ['D','D','D','D','D','D','D','D','H','H'],
  11: ['D','D','D','D','D','D','D','D','D','H'],
  12: ['H','H','S','S','S','H','H','H','H','H'],
  13: ['S','S','S','S','S','H','H','H','H','H'],
  14: ['S','S','S','S','S','H','H','H','H','H'],
  15: ['S','S','S','S','S','H','H','H','H','H'],
  16: ['S','S','S','S','S','H','H','H','H','H'],
  17: ['S','S','S','S','S','S','S','S','S','S'],
};

// Soft totals (soft 13 = A+2 through soft 20 = A+9) vs dealer upcard
const SOFT = {
  13: ['H','H','H','D','D','H','H','H','H','H'], // A+2
  14: ['H','H','H','D','D','H','H','H','H','H'], // A+3
  15: ['H','H','D','D','D','H','H','H','H','H'], // A+4
  16: ['H','H','D','D','D','H','H','H','H','H'], // A+5
  17: ['H','D','D','D','D','H','H','H','H','H'], // A+6
  18: ['Ds','Ds','Ds','Ds','Ds','S','S','H','H','H'], // A+7
  19: ['S','S','S','S','S','S','S','S','S','S'], // A+8
  20: ['S','S','S','S','S','S','S','S','S','S'], // A+9
};

// Pairs vs dealer upcard
const PAIRS = {
  '2': ['P','P','P','P','P','P','H','H','H','H'],
  '3': ['P','P','P','P','P','P','H','H','H','H'],
  '4': ['H','H','H','P','P','H','H','H','H','H'],
  '5': ['D','D','D','D','D','D','D','D','H','H'], // treat like hard 10
  '6': ['P','P','P','P','P','H','H','H','H','H'],
  '7': ['P','P','P','P','P','P','H','H','H','H'],
  '8': ['P','P','P','P','P','P','P','P','P','P'],
  '9': ['P','P','P','P','P','S','P','P','S','S'],
  '10': ['S','S','S','S','S','S','S','S','S','S'],
  'J': ['S','S','S','S','S','S','S','S','S','S'],
  'Q': ['S','S','S','S','S','S','S','S','S','S'],
  'K': ['S','S','S','S','S','S','S','S','S','S'],
  'A': ['P','P','P','P','P','P','P','P','P','P'],
};

const ACTION_LABELS = {
  H: 'Hit',
  S: 'Stand',
  D: 'Double Down',
  Ds: 'Double Down',
  P: 'Split',
};

function getDealerUpcardRank(card) {
  return card.rank;
}

export function getBasicStrategyHint(playerCards, dealerUpcard) {
  if (!playerCards || playerCards.length < 2 || !dealerUpcard) return null;

  const di = idx(getDealerUpcardRank(dealerUpcard));
  if (di === -1) return null;

  const ranks = playerCards.map(c => c.rank);

  // Check for pair
  if (playerCards.length === 2 && ranks[0] === ranks[1]) {
    const pairRank = ranks[0];
    const action = PAIRS[pairRank]?.[di] ?? 'H';
    return { action: actionKey(action), label: `Basic Strategy: ${ACTION_LABELS[action] ?? 'Hit'}` };
  }

  // Check for soft total
  const hasAce = ranks.includes('A');
  let total = 0;
  let aces = 0;
  for (const c of playerCards) {
    if (c.rank === 'A') { aces++; total += 11; }
    else total += c.value;
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }

  const isSoft = aces > 0 && total <= 21;

  if (isSoft && SOFT[total]) {
    const action = SOFT[total][di];
    return { action: actionKey(action), label: `Basic Strategy: ${ACTION_LABELS[action] ?? 'Hit'}` };
  }

  // Hard total
  const hardTotal = Math.min(total, 17); // cap at 17 (always stand above)
  const tableTotal = total <= 8 ? 8 : total >= 17 ? 17 : total;
  if (HARD[tableTotal]) {
    const action = HARD[tableTotal][di];
    return { action: actionKey(action), label: `Basic Strategy: ${ACTION_LABELS[action] ?? 'Hit'}` };
  }

  return { action: 'stand', label: 'Basic Strategy: Stand' };
}

function actionKey(code) {
  if (code === 'H') return 'hit';
  if (code === 'S' || code === 'Ds') return 'stand';
  if (code === 'D') return 'double';
  if (code === 'P') return 'split';
  return 'hit';
}
