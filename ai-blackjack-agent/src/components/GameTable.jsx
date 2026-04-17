import CardHand from './CardHand.jsx';
import BetBar from './BetBar.jsx';
import AIPanel from './AIPanel.jsx';
import HistoryLog from './HistoryLog.jsx';
import AnalyticsPanel from './AnalyticsPanel.jsx';
import RiskToggle from './RiskToggle.jsx';
import AutoPlayBar from './AutoPlayBar.jsx';
import SpeedSelector from './SpeedSelector.jsx';
import { CardCounter } from './CardCounter.jsx';
import { calculateHandValue } from '../lib/cards.js';

export default function GameTable({ game }) {
  const {
    playerHands, dealerCards, holeHidden,
    balance, currentBet, activeHandIdx,
    phase, history, roundResult,
    aiState, riskProfile, autoAccept, autoPlay, autoBet, speed, stats,
    canDouble, canSplit,
    cardCount, cardsPlayed, calculateTrueCount, // Card counting
    addChip, clearBet, deal,
    hit, stand, doubleDown, splitHand,
    executeRecommendation, newRound,
    setRiskProfile, setAutoAccept, setAutoPlay, setAutoBet, setSpeed,
    dealerHv,
  } = game;

  const dealerScoreLabel = holeHidden
    ? (dealerCards[0] ? `${dealerCards[0].value} + ?` : '')
    : (dealerHv ? dealerHv.value : '');

  return (
    <div className="game-layout">
      {/* Left Sidebar - AI Controls */}
      <div className="game-controls">
        {/* Risk Toggle */}
        <RiskToggle value={riskProfile} onChange={setRiskProfile} />

        {/* Speed Selector */}
        <SpeedSelector speed={speed} onSpeedChange={setSpeed} />

        {/* Automation Controls */}
        <AutoPlayBar
          autoAccept={autoAccept}
          autoPlay={autoPlay}
          autoBet={autoBet}
          onToggleAccept={() => setAutoAccept(v => !v)}
          onTogglePlay={() => setAutoPlay(v => !v)}
          onToggleBet={() => setAutoBet(v => !v)}
        />

        {/* Card Counter */}
        <CardCounter
          cardCount={cardCount}
          cardsPlayed={cardsPlayed}
          totalDeckCards={52 * 8} // Standard 8-deck shoe
          calculateTrueCount={calculateTrueCount}
        />
      </div>

      {/* Center - Main Game Content */}
      <div className="game-content">
        {/* Header */}
        <header className="game-header">
          <h1 className="game-title">AI Blackjack Agent</h1>
          <div className="balance-badge">Balance: <strong>${balance}</strong></div>
        </header>

        {/* Dealer */}
        <section className="table-section">
          <div className="section-label">Dealer {dealerCards.length > 0 && `— ${dealerScoreLabel}`}</div>
          {dealerCards.length > 0 && (
            <CardHand
              cards={dealerCards}
              holeHidden={holeHidden}
            />
          )}
        </section>

        {/* Player hands */}
        <section className="table-section">
          {playerHands.map((hand, idx) => {
            const hv = calculateHandValue(hand.cards);
            const handResult = roundResult?.results?.[idx]?.result || null;
            return (
              <div key={idx} className="player-hand-wrap">
                {playerHands.length > 1 && (
                  <div className="section-label">Hand {idx + 1}</div>
                )}
                <CardHand
                  cards={hand.cards}
                  label={playerHands.length === 1 ? 'Player' : undefined}
                  score={hv.value}
                  active={idx === activeHandIdx && phase === 'playerTurn'}
                  result={handResult}
                />
              </div>
            );
          })}
          {playerHands.length === 0 && (
            <div className="empty-hand-placeholder">Your hand will appear here</div>
          )}
        </section>

        {/* Bet bar */}
        {phase === 'betting' && (
          <BetBar
            currentBet={currentBet}
            balance={balance}
            phase={phase}
            onAddChip={addChip}
            onClearBet={clearBet}
            onDeal={deal}
          />
        )}

        {/* Round over — next round button */}
        {phase === 'roundOver' && roundResult && (
          <div className="round-result-bar">
            <span className={`round-result-label ${roundResult.totalNet > 0 ? 'result-win' : roundResult.totalNet < 0 ? 'result-loss' : 'result-push'}`}>
              {roundResult.totalNet > 0 ? `+$${roundResult.totalNet} — Win!` :
               roundResult.totalNet < 0 ? `-$${Math.abs(roundResult.totalNet)} — Loss` :
               'Push — Bet returned'}
            </span>
            {balance < 5 ? (
              autoPlay
                ? <p className="autoplay-notice">Balance depleted — topping up to $500…</p>
                : <p className="game-over">Game Over — <button className="btn btn--secondary" onClick={() => window.location.reload()}>Reload to restart</button></p>
            ) : (
              <button className="btn btn--deal" onClick={newRound}>New Hand</button>
            )}
          </div>
        )}

        {/* AI Panel */}
        <AIPanel
          aiState={aiState}
          phase={phase}
          riskProfile={riskProfile}
          canDouble={canDouble}
          canSplit={canSplit}
          onExecute={executeRecommendation}
          onHit={(override) => hit(override)}
          onStand={(override) => stand(override)}
          onDouble={(override) => doubleDown(override)}
          onSplit={(override) => splitHand(override)}
        />
      </div>

      {/* Right Sidebar - Stats & History */}
      <div className="game-stats">
        {/* History */}
        <HistoryLog history={history} />

        {/* Analytics */}
        <AnalyticsPanel stats={stats} />
      </div>
    </div>
  );
}
