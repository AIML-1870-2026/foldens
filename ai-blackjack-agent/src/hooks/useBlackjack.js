import { useState, useCallback, useRef, useEffect } from 'react';
import { createDeck, shuffle, calculateHandValue } from '../lib/cards.js';
import { STARTING_BALANCE, MIN_BET, SPEED_CONFIGS } from '../lib/constants.js';
import { getAIRecommendation } from '../lib/openai.js';

export function useBlackjack(apiKey) {
  const [deck, setDeck] = useState(() => shuffle(createDeck()));
  const [playerHands, setPlayerHands] = useState([]); // [{cards, bet, done}]
  const [dealerCards, setDealerCards] = useState([]);
  const [holeHidden, setHoleHidden] = useState(true);
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [currentBet, setCurrentBet] = useState(0);
  const [activeHandIdx, setActiveHandIdx] = useState(0);
  const [phase, setPhase] = useState('betting'); // betting | playerTurn | dealerTurn | roundOver
  const [roundNum, setRoundNum] = useState(0);
  const [history, setHistory] = useState([]);
  const [roundResult, setRoundResult] = useState(null); // {results:[{result,net}], totalNet}
  const [aiState, setAiState] = useState({ status: 'idle', recommendation: null, error: null });
  const [riskProfile, setRiskProfile] = useState('standard');
  const [autoAccept, setAutoAccept] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoBet, setAutoBet] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [cardCount, setCardCount] = useState(0);
  const [cardsPlayed, setCardsPlayed] = useState(0);
  const [stats, setStats] = useState({
    wins: 0, losses: 0, pushes: 0,
    agentFollowed: 0, agentIgnored: 0,
    balanceHistory: [STARTING_BALANCE],
  });

  // Refs — always reflect current values so async effects/timers never go stale
  const deckRef = useRef(deck);
  const aiStateRef = useRef(aiState);
  const balanceRef = useRef(balance);
  const roundNumRef = useRef(roundNum);
  const riskProfileRef = useRef(riskProfile);
  const phaseRef = useRef(phase);
  const autoAcceptRef = useRef(autoAccept);
  const autoPlayRef = useRef(autoPlay);
  const lastBetRef = useRef(MIN_BET);
  const executeRecRef = useRef(null); // set after executeRecommendation is defined
  const speedRef = useRef(speed);
  const autoBetRef = useRef(autoBet);
  const aiCallIdRef = useRef(0);     // incremented each call; stale responses are discarded
  const cardCountRef = useRef(0);    // mirrors cardCount state for use inside timers
  const cardsPlayedRef = useRef(0);  // mirrors cardsPlayed state

  aiStateRef.current = aiState;
  balanceRef.current = balance;
  roundNumRef.current = roundNum;
  riskProfileRef.current = riskProfile;
  phaseRef.current = phase;
  autoAcceptRef.current = autoAccept;
  autoPlayRef.current = autoPlay;
  speedRef.current = speed;
  autoBetRef.current = autoBet;
  cardCountRef.current = cardCount;
  cardsPlayedRef.current = cardsPlayed;

  // ── Deck helpers ──────────────────────────────────────────────────────────
  function drawFromDeck(currentDeck) {
    let d = currentDeck;
    if (d.length < 10) d = shuffle(createDeck());
    const [card, ...rest] = d;
    return { card, remaining: rest };
  }

  // ── Betting ───────────────────────────────────────────────────────────────
  const addChip = useCallback((amount) => {
    if (phase !== 'betting') return;
    setCurrentBet(prev => {
      const next = prev + amount;
      return next > balance ? prev : next;
    });
  }, [phase, balance]);

  const clearBet = useCallback(() => {
    if (phase !== 'betting') return;
    setCurrentBet(0);
  }, [phase]);

  // Suggest bet amount using Hi-Lo true count spread (1-12 units)
  // Base unit ≈ 0.5% of balance so the bankroll lasts; risk profile scales the spread
  function suggestBetAmount(currentBalance) {
    const tc = calculateTrueCount();

    // Count-based unit multiplier (classic 1-12 spread)
    let units;
    if      (tc <= 1)  units = 1;   // house edge zone — minimum
    else if (tc <= 2)  units = 2;
    else if (tc <= 3)  units = 4;
    else if (tc <= 4)  units = 8;
    else               units = 12;  // strong player edge

    // Risk profile scales the base unit size
    const riskScale = { conservative: 0.4, standard: 0.7, aggressive: 1.2 };
    const scale = riskScale[riskProfileRef.current] ?? 0.7;

    const baseUnit = Math.max(MIN_BET, Math.floor(currentBalance * 0.005));
    const raw = Math.floor(baseUnit * units * scale);
    // Round to nearest $5 for cleaner chips
    const rounded = Math.max(MIN_BET, Math.round(raw / 5) * 5);
    return Math.min(rounded, currentBalance);
  }

  // ── Card Counting (Hi-Lo strategy) ────────────────────────────────────────
  // Calculate Hi-Lo card count value for a single card
  function getCardCountValue(card) {
    const rank = card.rank;
    if (['2', '3', '4', '5', '6'].includes(rank)) return 1;  // Low cards
    if (['7', '8', '9'].includes(rank)) return 0;             // Neutral
    return -1;  // 10, J, Q, K, A
  }

  // Update card count when a card is drawn
  function updateCardCount(card) {
    const countValue = getCardCountValue(card);
    setCardCount(prev => prev + countValue);
    setCardsPlayed(prev => prev + 1);
  }

  // Calculate true count (running count / estimated decks remaining)
  // Uses refs so it's accurate when called from timer callbacks
  function calculateTrueCount() {
    const cardsInDeck = deckRef.current.length;
    const decksRemaining = Math.max(0.5, cardsInDeck / 52);
    return cardCountRef.current / decksRemaining;
  }

  // ── AI call ───────────────────────────────────────────────────────────────
  async function callAI(hand, dealerUpCard, betAmount, currentBalance, canDouble, canSplit) {
    if (!apiKey) return;
    const callId = ++aiCallIdRef.current; // claim this call; any older in-flight call becomes stale
    setAiState({ status: 'loading', recommendation: null, error: null });

    const hv = calculateHandValue(hand);
    const tc = calculateTrueCount();
    const decksRemaining = Math.max(0.5, deckRef.current.length / 52);
    const speedConfig = SPEED_CONFIGS[speedRef.current];
    const gameState = {
      playerCards: hand,
      playerTotal: hv.value,
      isSoft: hv.isSoft,
      dealerUpCard,
      canDouble,
      canSplit,
      bet: betAmount,
      balance: currentBalance,
      runningCount: cardCountRef.current,
      trueCount: Math.round(tc * 10) / 10,
      decksRemaining: Math.round(decksRemaining * 10) / 10,
    };

    const result = await getAIRecommendation(gameState, riskProfileRef.current, apiKey, speedConfig.model);

    // Discard stale response if a newer round/call has started
    if (callId !== aiCallIdRef.current) {
      console.log(`[Agent] Discarding stale response from call ${callId} (current: ${aiCallIdRef.current})`);
      return;
    }

    if (result.ok) {
      setAiState({ status: 'result', recommendation: result.recommendation, error: null });
    } else {
      setAiState({ status: 'error', recommendation: result.recommendation, error: result.error });
    }
  }

  // ── Start Round ───────────────────────────────────────────────────────────
  // Core deal logic using refs — safe to call from effects/timers without stale closure issues
  function startRound(betAmount) {
    if (phaseRef.current !== 'betting') {
      console.warn(`[startRound] Skipped - phase is ${phaseRef.current}, expected 'betting'`);
      return;
    }
    console.log(`[startRound] Starting round ${roundNumRef.current + 1} with bet $${betAmount}`);
    const bal = balanceRef.current;
    const bet = Math.min(betAmount, bal);
    if (bet < MIN_BET) return;

    lastBetRef.current = bet;
    aiCallIdRef.current++; // invalidate any in-flight AI response from the previous round

    let d = deckRef.current;
    if (d.length < 10) {
      d = shuffle(createDeck());
      setCardCount(0);  // Reset count on deck shuffle
      setCardsPlayed(0);
    }

    const draw = () => { const r = drawFromDeck(d); d = r.remaining; return r.card; };

    const p1 = draw(), d1 = draw(), p2 = draw(), d2 = draw();
    
    // Track cards in count
    updateCardCount(p1);
    updateCardCount(d1);
    updateCardCount(p2);
    updateCardCount(d2);

    const playerHand = { cards: [p1, p2], bet, done: false };
    const dCards = [d1, d2];

    const newBalance = bal - bet;
    const newRound = roundNumRef.current + 1;

    deckRef.current = d;
    setDeck(d);
    setPlayerHands([playerHand]);
    setDealerCards(dCards);
    setHoleHidden(true);
    setBalance(newBalance);
    setCurrentBet(bet);
    setActiveHandIdx(0);
    setRoundNum(newRound);
    setRoundResult(null);
    setAiState({ status: 'idle', recommendation: null, error: null });
    setPhase('playerTurn'); // Set for all cases initially

    const hv = calculateHandValue([p1, p2]);

    if (hv.isBlackjack) {
      console.log(`[Blackjack] Player dealt blackjack at round ${newRound}`);
      // For blackjack, skip player action - show dealer cards then resolve
      const speedConfig = SPEED_CONFIGS[speedRef.current];
      const cardDelay = speedRef.current >= 20 ? 10 : 100;
      setTimeout(() => {
        setHoleHidden(false);
        setDealerCards([...dCards]);
        resolveAll([{ cards: [p1, p2], bet, done: true }], dCards, newBalance, newRound);
      }, cardDelay);
      return;
    }

    // Non-blackjack: proceed to player turn with AI analysis
    const canDbl = newBalance >= bet;
    const canSpl = p1.rank === p2.rank && newBalance >= bet;
    callAI([p1, p2], d1, bet, newBalance, canDbl, canSpl);
  }

  // Button-triggered deal reads currentBet from state
  const deal = useCallback(() => {
    if (phase !== 'betting' || currentBet < MIN_BET || currentBet > balance) return;
    startRound(currentBet);
  }, [phase, currentBet, balance]);

  // ── Resolve round ─────────────────────────────────────────────────────────
  function finishRound(hands, dCards, balAfterBets, rNum) {
    setHoleHidden(false);
    setPhase('dealerTurn');

    // Dealer plays
    const speedConfig = SPEED_CONFIGS[speedRef.current];
    let dHand = [...dCards];
    let d = deckRef.current;

    function dealerStep() {
      const dv = calculateHandValue(dHand);
      if (dv.value >= 17 || dv.isBust) {
        setDealerCards([...dHand]);
        resolveAll(hands, dHand, balAfterBets, rNum);
        return;
      }
      const { card, remaining } = drawFromDeck(d);
      d = remaining;
      deckRef.current = d;
      
      // Track card in count
      updateCardCount(card);
      
      dHand = [...dHand, card];
      setDealerCards([...dHand]);
      setTimeout(dealerStep, speedConfig.dealerDelay);
    }

    setTimeout(() => { setDealerCards([...dCards]); dealerStep(); }, speedConfig.dealerDelay);
  }

  function resolveAll(hands, dCards, balAfterBets, rNum) {
    const dv = calculateHandValue(dCards);
    let totalNet = 0;
    let newWins = 0, newLosses = 0, newPushes = 0;

    const results = hands.map(hand => {
      const hv = calculateHandValue(hand.cards);
      let result, net;

      if (hv.isBlackjack && !dv.isBlackjack) {
        result = 'blackjack';
        net = Math.floor(hand.bet * 1.5);
        console.log(`[Blackjack Win] Player: 21, Dealer: ${dv.value}`);
      } else if (hv.isBlackjack && dv.isBlackjack) {
        result = 'push';
        net = 0;
        console.log(`[Blackjack Push] Both have 21`);
      } else if (hv.isBust) {
        result = 'bust'; net = -hand.bet;
      } else if (dv.isBust) {
        result = 'win'; net = hand.bet;
      } else if (hv.value > dv.value) {
        result = 'win'; net = hand.bet;
      } else if (dv.value > hv.value) {
        result = 'loss'; net = -hand.bet;
      } else {
        result = 'push'; net = 0;
      }

      totalNet += net;
      if (result === 'win' || result === 'blackjack') newWins++;
      else if (result === 'loss' || result === 'bust') newLosses++;
      else newPushes++;

      console.log(`[Hand] Result: ${result} | Payout: ${net >= 0 ? '+' : ''}$${net} | Round: ${rNum}`);
      return { result, net };
    });

    const finalBalance = balAfterBets + hands.reduce((sum, h) => sum + h.bet, 0) + totalNet;
    setBalance(finalBalance);

    const roundInfo = {
      round: rNum,
      bet: hands.reduce((s, h) => s + h.bet, 0),
      net: totalNet,
      result: results[0].result,
      balance: finalBalance,
    };

    console.log(`[Hand] New balance: $${finalBalance}`);

    setHistory(prev => [roundInfo, ...prev].slice(0, 5));
    setRoundResult({ results, totalNet, finalBalance });
    console.log(`[Round End] Phase set to roundOver for round ${rNum}, autoPlay=${autoPlayRef.current}`);
    setPhase('roundOver');

    setStats(prev => ({
      ...prev,
      wins: prev.wins + newWins,
      losses: prev.losses + newLosses,
      pushes: prev.pushes + newPushes,
      balanceHistory: [...prev.balanceHistory, finalBalance],
    }));
  }

  // ── Player Actions ────────────────────────────────────────────────────────
  function advanceOrDealer(updatedHands, handIdx, balanceSoFar, rNum) {
    // Find next undone hand
    const nextIdx = updatedHands.findIndex((h, i) => i > handIdx && !h.done);
    if (nextIdx !== -1) {
      setActiveHandIdx(nextIdx);
      setPlayerHands(updatedHands);
      const nextHand = updatedHands[nextIdx];
      const canDouble = balanceSoFar >= nextHand.bet;
      const canSplit = nextHand.cards[0].rank === nextHand.cards[1].rank && balanceSoFar >= nextHand.bet;
      callAI(nextHand.cards, dealerCards[0], nextHand.bet, balanceSoFar, canDouble, canSplit);
    } else {
      setPlayerHands(updatedHands);
      finishRound(updatedHands, dealerCards, balanceSoFar, rNum);
    }
  }

  const hit = useCallback((override = false) => {
    if (phase !== 'playerTurn') return;

    const aiRec = aiStateRef.current.recommendation;
    if (override && aiRec && aiRec.action !== 'hit') {
      console.log(`[Action] Player override: hit (agent recommended ${aiRec.action})`);
      setStats(prev => ({ ...prev, agentIgnored: prev.agentIgnored + 1 }));
    }

    const hand = playerHands[activeHandIdx];
    const { card, remaining } = drawFromDeck(deckRef.current);
    deckRef.current = remaining;
    setDeck(remaining);
    
    // Track card in count
    updateCardCount(card);

    const newCards = [...hand.cards, card];
    const hv = calculateHandValue(newCards);
    const updatedHand = { ...hand, cards: newCards, done: hv.isBust };
    const updatedHands = playerHands.map((h, i) => i === activeHandIdx ? updatedHand : h);

    if (hv.isBust) {
      // updatedHand already has done:true; updatedHands is already correct
      advanceOrDealer(updatedHands, activeHandIdx, balance, roundNum);
    } else {
      setPlayerHands(updatedHands);
      const canDouble = balance >= hand.bet && newCards.length === 2;
      callAI(newCards, dealerCards[0], hand.bet, balance, canDouble, false);
    }
  }, [phase, playerHands, activeHandIdx, balance, dealerCards, roundNum]);

  const stand = useCallback((override = false) => {
    if (phase !== 'playerTurn') return;

    const aiRec = aiStateRef.current.recommendation;
    if (override && aiRec && aiRec.action !== 'stand') {
      console.log(`[Action] Player override: stand (agent recommended ${aiRec.action})`);
      setStats(prev => ({ ...prev, agentIgnored: prev.agentIgnored + 1 }));
    }

    const updatedHands = playerHands.map((h, i) => i === activeHandIdx ? { ...h, done: true } : h);
    advanceOrDealer(updatedHands, activeHandIdx, balance, roundNum);
  }, [phase, playerHands, activeHandIdx, balance, dealerCards, roundNum]);

  const doubleDown = useCallback((override = false) => {
    if (phase !== 'playerTurn') return;
    const hand = playerHands[activeHandIdx];
    if (hand.cards.length !== 2 || balance < hand.bet) return;

    const aiRec = aiStateRef.current.recommendation;
    if (override && aiRec && aiRec.action !== 'double') {
      console.log(`[Action] Player override: double (agent recommended ${aiRec.action})`);
      setStats(prev => ({ ...prev, agentIgnored: prev.agentIgnored + 1 }));
    }

    const newBalance = balance - hand.bet;
    setBalance(newBalance);

    const { card, remaining } = drawFromDeck(deckRef.current);
    deckRef.current = remaining;
    setDeck(remaining);
    
    // Track card in count
    updateCardCount(card);

    const newCards = [...hand.cards, card];
    const updatedHand = { ...hand, cards: newCards, bet: hand.bet * 2, done: true };
    const updatedHands = playerHands.map((h, i) => i === activeHandIdx ? updatedHand : h);

    advanceOrDealer(updatedHands, activeHandIdx, newBalance, roundNum);
  }, [phase, playerHands, activeHandIdx, balance, dealerCards, roundNum]);

  const splitHand = useCallback((override = false) => {
    if (phase !== 'playerTurn') return;
    const hand = playerHands[activeHandIdx];
    if (hand.cards.length !== 2 || hand.cards[0].rank !== hand.cards[1].rank || balance < hand.bet) return;

    const aiRec = aiStateRef.current.recommendation;
    if (override && aiRec && aiRec.action !== 'split') {
      console.log(`[Action] Player override: split (agent recommended ${aiRec.action})`);
      setStats(prev => ({ ...prev, agentIgnored: prev.agentIgnored + 1 }));
    }

    const newBalance = balance - hand.bet;
    setBalance(newBalance);

    let d = deckRef.current;
    const draw = () => { const r = drawFromDeck(d); d = r.remaining; return r.card; };

    const [c1, c2] = hand.cards;
    const card1 = draw();
    const card2 = draw();
    
    // Track split cards in count
    updateCardCount(card1);
    updateCardCount(card2);
    
    const hand1 = { cards: [c1, card1], bet: hand.bet, done: false };
    const hand2 = { cards: [c2, card2], bet: hand.bet, done: false };

    deckRef.current = d;
    setDeck(d);

    const updatedHands = [
      ...playerHands.slice(0, activeHandIdx),
      hand1,
      hand2,
      ...playerHands.slice(activeHandIdx + 1),
    ];

    setPlayerHands(updatedHands);

    const canDouble = newBalance >= hand.bet && hand1.cards.length === 2;
    const canSplit2 = hand1.cards[0].rank === hand1.cards[1].rank && newBalance >= hand.bet;
    callAI(hand1.cards, dealerCards[0], hand.bet, newBalance, canDouble, canSplit2);
  }, [phase, playerHands, activeHandIdx, balance, dealerCards, roundNum]);

  const executeRecommendation = useCallback(() => {
    const rec = aiStateRef.current.recommendation;
    if (!rec) return;
    console.log(`[Action] Executing recommended action: ${rec.action}`);
    setStats(prev => ({ ...prev, agentFollowed: prev.agentFollowed + 1 }));

    const hand = playerHands[activeHandIdx];
    const canDouble = hand.cards.length === 2 && balance >= hand.bet;
    const canSplit = hand.cards.length === 2 && hand.cards[0].rank === hand.cards[1].rank && balance >= hand.bet;

    if (rec.action === 'hit') hit(false);
    else if (rec.action === 'stand') stand(false);
    else if (rec.action === 'double' && canDouble) doubleDown(false);
    else if (rec.action === 'split' && canSplit) splitHand(false);
    else stand(false);
  }, [playerHands, activeHandIdx, balance, hit, stand, doubleDown, splitHand]);

  // Keep ref always fresh so effects can call it without stale closure
  executeRecRef.current = executeRecommendation;

  const newRound = useCallback(() => {
    setPhase('betting');
    setCurrentBet(0);
    setPlayerHands([]);
    setDealerCards([]);
    setHoleHidden(true);
    setActiveHandIdx(0);
    setRoundResult(null);
    setAiState({ status: 'idle', recommendation: null, error: null });
  }, []);

  // ── Automation effects ────────────────────────────────────────────────────
  // Auto-accept: execute AI recommendation automatically after a brief display delay
  useEffect(() => {
    if (!autoAcceptRef.current) return;
    if (aiState.status !== 'result' || phase !== 'playerTurn') return;
    const speedConfig = SPEED_CONFIGS[speedRef.current];
    const timer = setTimeout(() => {
      executeRecRef.current?.();
    }, speedConfig.autoAcceptDelay);
    return () => clearTimeout(timer);
  }, [aiState.status, phase, speed]);

  // Auto-play: when a round ends, immediately start the next one
  useEffect(() => {
    if (!autoPlayRef.current) return;
    if (phase !== 'roundOver') return;
    const speedConfig = SPEED_CONFIGS[speedRef.current];
    const timer = setTimeout(() => {
      let bal = balanceRef.current;

      // Top up to starting balance if broke, rather than stopping
      if (bal < MIN_BET) {
        console.log('[AutoPlay] Balance depleted — topping up to $500');
        bal = STARTING_BALANCE;
        setBalance(STARTING_BALANCE);
        balanceRef.current = STARTING_BALANCE;
      }

      // Use count-suggested bet if autoBet is on, otherwise repeat last bet
      const bet = autoBetRef.current
        ? suggestBetAmount(bal)
        : Math.min(lastBetRef.current, bal);

      if (bet < MIN_BET) return;

      setPhase('betting');
      phaseRef.current = 'betting';
      startRound(bet);
    }, speedConfig.autoPlayDelay);
    return () => clearTimeout(timer);
  }, [phase, speed]);

  // Auto-bet: automatically place bet when in betting phase
  // autoBet is in deps so toggling it on mid-phase fires immediately
  useEffect(() => {
    if (!autoBet) return;
    if (phase !== 'betting') return;
    if (currentBet > 0) return; // already placed
    const speedConfig = SPEED_CONFIGS[speedRef.current];
    const timer = setTimeout(() => {
      const suggestedBet = suggestBetAmount(balanceRef.current);
      setCurrentBet(suggestedBet);
      lastBetRef.current = suggestedBet;
    }, Math.max(50, speedConfig.autoAcceptDelay / 2));
    return () => clearTimeout(timer);
  }, [phase, currentBet, speed, autoBet]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const activeHand = playerHands[activeHandIdx] || null;
  const activeHv = activeHand ? calculateHandValue(activeHand.cards) : null;
  const dealerHv = dealerCards.length ? calculateHandValue(holeHidden ? [dealerCards[0]] : dealerCards) : null;
  const canDouble = activeHand && activeHand.cards.length === 2 && balance >= activeHand.bet && phase === 'playerTurn';
  const canSplit = activeHand && activeHand.cards.length === 2
    && activeHand.cards[0].rank === activeHand.cards[1].rank
    && balance >= activeHand.bet && phase === 'playerTurn';

  return {
    // state
    playerHands, dealerCards, holeHidden,
    balance, currentBet, activeHandIdx,
    phase, roundNum, history, roundResult,
    aiState, riskProfile, autoAccept, autoPlay, autoBet, speed, stats,
    activeHand, activeHv, dealerHv,
    canDouble, canSplit,
    cardCount, cardsPlayed, // Card counting
    // actions
    addChip, clearBet, deal,
    hit, stand, doubleDown, splitHand,
    executeRecommendation, newRound,
    setRiskProfile, setAutoAccept, setAutoPlay, setAutoBet, setSpeed,
    calculateTrueCount, // Card counting helper
  };
}
