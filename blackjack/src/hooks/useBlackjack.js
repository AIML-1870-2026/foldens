import { useState, useCallback, useRef } from 'react';
import { createDeck, shuffleDeck, dealCard } from '../logic/deck.js';
import { calculateHandValue } from '../logic/scoring.js';
import { getHiLoValue } from '../logic/hiLo.js';

const BALANCE_KEY = 'blackjack_balance';
const MIN_CARDS = 15;

function loadBalance() {
  try { return parseInt(localStorage.getItem(BALANCE_KEY), 10) || 1000; } catch { return 1000; }
}
function saveBalance(b) {
  try { localStorage.setItem(BALANCE_KEY, String(b)); } catch {}
}

function freshDeck() {
  return shuffleDeck(createDeck());
}

function makeHand(cards = [], bet = 0) {
  return { cards, bet, done: false };
}

export function useBlackjack({ playSound, recordRound }) {
  // Mutable deck ref so callbacks always see the latest deck without stale closures
  const deckRef = useRef(freshDeck());
  const [, setDeckVersion] = useState(0);

  const [playerHands, setPlayerHands] = useState([makeHand()]);
  const [activeHandIndex, setActiveHandIndex] = useState(0);
  const [dealerHand, setDealerHand] = useState({ cards: [], holeCardHidden: true });
  const [balance, setBalance] = useState(loadBalance);
  const [currentBet, setCurrentBet] = useState(0);
  const [gamePhase, setGamePhase] = useState('betting');
  const [roundResult, setRoundResult] = useState(null);
  const [runningCount, setRunningCount] = useState(0);
  const [cardCounts, setCardCounts] = useState({});
  const [message, setMessage] = useState('Place your bet to begin');
  const [shuffleFlash, setShuffleFlash] = useState(false);

  const balanceRef = useRef(loadBalance());
  const runningCountRef = useRef(0);
  const cardCountsRef = useRef({});
  const gamePhasRef = useRef('betting');
  const activeHandIndexRef = useRef(0);
  const dealerHandRef = useRef({ cards: [], holeCardHidden: true });
  const playerHandsRef = useRef([makeHand()]);
  const currentBetRef = useRef(0);

  // ─── Sync refs ────────────────────────────────────────────────────────────

  function syncBalance(v) { balanceRef.current = v; setBalance(v); }
  function syncGamePhase(v) { gamePhasRef.current = v; setGamePhase(v); }
  function syncActiveHand(v) { activeHandIndexRef.current = v; setActiveHandIndex(v); }
  function syncDealerHand(v) { dealerHandRef.current = v; setDealerHand(v); }
  function syncPlayerHands(v) { playerHandsRef.current = v; setPlayerHands(v); }
  function syncCurrentBet(v) { currentBetRef.current = v; setCurrentBet(v); }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function addToCount(card) {
    const delta = getHiLoValue(card);
    runningCountRef.current += delta;
    setRunningCount(runningCountRef.current);
    // Track per-rank frequency
    const next = { ...cardCountsRef.current, [card.rank]: (cardCountsRef.current[card.rank] || 0) + 1 };
    cardCountsRef.current = next;
    setCardCounts(next);
  }

  function drawCard() {
    let d = deckRef.current;
    if (d.length < MIN_CARDS) {
      d = freshDeck();
      runningCountRef.current = 0;
      setRunningCount(0);
      cardCountsRef.current = {};
      setCardCounts({});
      setShuffleFlash(true);
      setTimeout(() => setShuffleFlash(false), 1500);
    }
    const { card, deck: remaining } = dealCard(d);
    deckRef.current = remaining;
    setDeckVersion(v => v + 1);
    return card;
  }

  function findNextHand(hands, currentIdx) {
    for (let i = currentIdx + 1; i < hands.length; i++) {
      if (!hands[i].done) return i;
    }
    return -1;
  }

  // ─── Resolve round ─────────────────────────────────────────────────────────

  function resolveRound(result, hands, dHand, bal, bet) {
    const pv = calculateHandValue(hands[0].cards);
    const dv = calculateHandValue(dHand.cards);

    let finalResult = result;
    let netChange = 0;
    let msg = '';

    if (finalResult === 'blackjack') {
      const profit = Math.floor(bet * 1.5);
      netChange = profit;
      msg = `Blackjack! +$${profit}`;
      playSound('blackjack');
    } else if (finalResult === 'push') {
      netChange = 0;
      msg = 'Push — Bet Returned';
      playSound('push');
    } else {
      const playerBust = pv.isBust;
      const dealerBust = dv.isBust;

      if (playerBust) {
        finalResult = 'bust';
        netChange = -bet;
        msg = `Bust! −$${bet}`;
        playSound('bust');
      } else if (dealerBust) {
        finalResult = 'win';
        netChange = bet;
        msg = `Dealer Busts! You Win! +$${bet}`;
        playSound('win');
      } else if (pv.value > dv.value) {
        finalResult = 'win';
        netChange = bet;
        msg = `You Win! +$${bet}`;
        playSound('win');
      } else if (dv.value > pv.value) {
        finalResult = 'loss';
        netChange = -bet;
        msg = `Dealer Wins. −$${bet}`;
        playSound('lose');
      } else {
        finalResult = 'push';
        netChange = 0;
        msg = 'Push — Bet Returned';
        playSound('push');
      }
    }

    let payout = 0;
    if (finalResult === 'blackjack') payout = bet + Math.floor(bet * 1.5);
    else if (finalResult === 'push') payout = bet;
    else if (finalResult === 'win') payout = bet * 2;

    const finalBalance = bal + payout;
    syncBalance(finalBalance);
    saveBalance(finalBalance);
    setRoundResult(finalResult);
    setMessage(msg);
    syncGamePhase('roundOver');
    syncDealerHand({ ...dHand, holeCardHidden: false });

    recordRound({ result: finalResult, bet, netChange, balanceAfter: finalBalance });
  }

  // ─── Dealer turn ────────────────────────────────────────────────────────────

  function runDealerTurn(playerHandsSnapshot, dHand, bal, bet) {
    syncGamePhase('dealerTurn');
    const holeCard = dHand.cards[1];
    addToCount(holeCard);
    syncDealerHand({ ...dHand, holeCardHidden: false });
    playSound('cardFlip');

    let dealerCards = [...dHand.cards];

    function dealerStep() {
      const dv = calculateHandValue(dealerCards);
      if (dv.value >= 17 || dv.isBust) {
        const finalDH = { cards: dealerCards, holeCardHidden: false };
        syncDealerHand(finalDH);
        const activeHand = playerHandsSnapshot.find(h => !calculateHandValue(h.cards).isBust)
          ?? playerHandsSnapshot[0];
        resolveRound('auto', [activeHand], finalDH, bal, activeHand.bet);
        return;
      }
      const card = drawCard();
      addToCount(card);
      dealerCards = [...dealerCards, card];
      syncDealerHand({ cards: dealerCards, holeCardHidden: false });
      playSound('cardDeal');
      setTimeout(dealerStep, 600);
    }

    setTimeout(dealerStep, 600);
  }

  // ─── Bet actions ───────────────────────────────────────────────────────────

  const addChipToBet = useCallback((amount) => {
    if (gamePhasRef.current !== 'betting') return;
    const newBet = currentBetRef.current + amount;
    if (newBet > balanceRef.current) return;
    playSound('chipPlace');
    syncCurrentBet(newBet);
  }, [playSound]);

  const clearBet = useCallback(() => {
    if (gamePhasRef.current !== 'betting') return;
    syncCurrentBet(0);
  }, []);

  // ─── Deal ──────────────────────────────────────────────────────────────────

  const deal = useCallback(() => {
    const phase = gamePhasRef.current;

    if (phase === 'roundOver') {
      // Reset to betting for a new round
      syncGamePhase('betting');
      setRoundResult(null);
      syncPlayerHands([makeHand()]);
      syncDealerHand({ cards: [], holeCardHidden: true });
      syncActiveHand(0);
      setMessage('Place your bet to begin');
      return;
    }

    if (phase !== 'betting') return;

    const bet = currentBetRef.current;
    const bal = balanceRef.current;

    if (bet < 5) { setMessage('Minimum bet is $5'); return; }
    if (bet > bal) { setMessage('Not enough balance'); return; }

    const newBalance = bal - bet;
    syncBalance(newBalance);
    saveBalance(newBalance);

    const p1 = drawCard();
    const d1 = drawCard();
    const p2 = drawCard();
    const d2 = drawCard();

    addToCount(p1);
    addToCount(d1);
    addToCount(p2);

    const newPlayerHand = makeHand([p1, p2], bet);
    const newDealerHand = { cards: [d1, d2], holeCardHidden: true };

    syncPlayerHands([newPlayerHand]);
    syncDealerHand(newDealerHand);
    syncActiveHand(0);
    syncGamePhase('playerTurn');
    setRoundResult(null);
    setMessage('');
    playSound('cardDeal');

    // Check for blackjack
    const pv = calculateHandValue([p1, p2]);
    if (pv.isBlackjack) {
      const dv = calculateHandValue([d1, d2]);
      if (dv.isBlackjack) {
        resolveRound('push', [newPlayerHand], newDealerHand, newBalance, bet);
      } else {
        resolveRound('blackjack', [newPlayerHand], newDealerHand, newBalance, bet);
      }
    }
  }, [playSound]);

  // ─── Player actions ────────────────────────────────────────────────────────

  const hit = useCallback(() => {
    if (gamePhasRef.current !== 'playerTurn') return;

    const card = drawCard();
    addToCount(card);
    playSound('cardDeal');

    const idx = activeHandIndexRef.current;
    const hands = playerHandsRef.current.map((h, i) =>
      i === idx ? { ...h, cards: [...h.cards, card] } : h
    );
    const hand = hands[idx];
    const hv = calculateHandValue(hand.cards);

    if (hv.isBust) {
      const updated = hands.map((h, i) => i === idx ? { ...h, done: true } : h);
      syncPlayerHands(updated);
      const nextIdx = findNextHand(updated, idx);
      if (nextIdx !== -1) {
        syncActiveHand(nextIdx);
      } else {
        const dSnap = dealerHandRef.current;
        const bal = balanceRef.current;
        const bet = updated[idx].bet;
        setTimeout(() => runDealerTurn(updated, dSnap, bal, bet), 400);
      }
    } else {
      syncPlayerHands(hands);
    }
  }, [playSound]);

  const stand = useCallback(() => {
    if (gamePhasRef.current !== 'playerTurn') return;

    const idx = activeHandIndexRef.current;
    const hands = playerHandsRef.current.map((h, i) => i === idx ? { ...h, done: true } : h);
    syncPlayerHands(hands);

    const nextIdx = findNextHand(hands, idx);
    if (nextIdx !== -1) {
      syncActiveHand(nextIdx);
    } else {
      const dSnap = dealerHandRef.current;
      const bal = balanceRef.current;
      const bet = hands[idx].bet;
      setTimeout(() => runDealerTurn(hands, dSnap, bal, bet), 300);
    }
  }, []);

  const doubleDown = useCallback(() => {
    if (gamePhasRef.current !== 'playerTurn') return;
    const idx = activeHandIndexRef.current;
    const hand = playerHandsRef.current[idx];
    if (!hand || hand.cards.length !== 2) return;
    if (balanceRef.current < hand.bet) return;

    const extraBet = hand.bet;
    const newBalance = balanceRef.current - extraBet;
    syncBalance(newBalance);
    saveBalance(newBalance);

    const card = drawCard();
    addToCount(card);
    playSound('cardDeal');

    const hands = playerHandsRef.current.map((h, i) =>
      i === idx ? { ...h, cards: [...h.cards, card], bet: h.bet + extraBet, done: true } : h
    );
    syncPlayerHands(hands);

    const dSnap = dealerHandRef.current;
    setTimeout(() => runDealerTurn(hands, dSnap, newBalance, hands[idx].bet), 500);
  }, [playSound]);

  const split = useCallback(() => {
    if (gamePhasRef.current !== 'playerTurn') return;
    const idx = activeHandIndexRef.current;
    const hand = playerHandsRef.current[idx];
    if (!hand || hand.cards.length !== 2) return;
    if (hand.cards[0].rank !== hand.cards[1].rank) return;
    if (balanceRef.current < hand.bet) return;

    const extraBet = hand.bet;
    const newBalance = balanceRef.current - extraBet;
    syncBalance(newBalance);
    saveBalance(newBalance);

    const c1 = drawCard();
    const c2 = drawCard();
    addToCount(c1);
    addToCount(c2);
    playSound('cardDeal');

    const [first, second] = hand.cards;
    const hand1 = makeHand([first, c1], extraBet);
    const hand2 = makeHand([second, c2], extraBet);
    const hands = [...playerHandsRef.current];
    hands.splice(idx, 1, hand1, hand2);
    syncPlayerHands(hands);
  }, [playSound]);

  const newRound = useCallback(() => {
    syncGamePhase('betting');
    setRoundResult(null);
    syncPlayerHands([makeHand()]);
    syncDealerHand({ cards: [], holeCardHidden: true });
    syncActiveHand(0);
    syncCurrentBet(0);
    setMessage('Place your bet to begin');
  }, []);

  const reloadBalance = useCallback(() => {
    syncBalance(1000);
    saveBalance(1000);
    syncCurrentBet(0);
    setMessage('Balance reloaded. Good luck!');
  }, []);

  // Derived
  const activeHand = playerHands[activeHandIndex];
  const canDouble = gamePhase === 'playerTurn' && activeHand?.cards.length === 2 && balance >= (activeHand?.bet ?? 0);
  const canSplit =
    gamePhase === 'playerTurn' &&
    activeHand?.cards.length === 2 &&
    activeHand.cards[0].rank === activeHand.cards[1].rank &&
    balance >= (activeHand?.bet ?? 0);

  return {
    deck: deckRef.current,
    playerHands,
    activeHandIndex,
    dealerHand,
    balance,
    currentBet,
    gamePhase,
    roundResult,
    runningCount,
    message,
    shuffleFlash,
    cardCounts,
    canDouble,
    canSplit,
    actions: {
      addChipToBet,
      clearBet,
      deal,
      hit,
      stand,
      doubleDown,
      split,
      newRound,
      reloadBalance,
    },
  };
}
