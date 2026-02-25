import Hand from '../Hand/Hand.jsx';
import BettingPanel from '../BettingPanel/BettingPanel.jsx';
import ActionButtons from '../ActionButtons/ActionButtons.jsx';
import StrategyHint from '../StrategyHint/StrategyHint.jsx';
import DealerTell from '../DealerTell/DealerTell.jsx';
import ResultOverlay from '../ResultOverlay/ResultOverlay.jsx';
import styles from './Table.module.css';

export default function Table({ game, settings }) {
  const { playerHands, activeHandIndex, dealerHand, gamePhase, roundResult, message, actions, currentBet, balance, canDouble, canSplit } = game;
  const activeHand = playerHands[activeHandIndex];
  const dealerUpcard = dealerHand.cards[0];
  const tellSeed = dealerHand.cards.length > 0 ? dealerHand.cards.reduce((acc, c) => acc + c.rank.charCodeAt(0), 0) : 0;
  const showTell = settings.showTells && gamePhase === 'playerTurn' && dealerHand.cards.length > 0;

  return (
    <div className={styles.table}>
      {/* Dealer area */}
      <div className={styles.dealerArea}>
        <span className={styles.areaLabel}>Dealer</span>
        {dealerHand.cards.length > 0 && (
          <Hand hand={dealerHand} isDealer />
        )}
        {showTell && <DealerTell seed={tellSeed} visible />}
      </div>

      <div className={styles.feltDivider} />

      {/* Player area */}
      <div className={styles.playerArea}>
        <span className={styles.areaLabel}>
          {playerHands.length > 1 ? 'Your Hands' : 'Your Hand'}
        </span>
        <div className={styles.hands}>
          {playerHands.map((hand, i) => (
            <Hand
              key={i}
              hand={hand}
              active={i === activeHandIndex && gamePhase === 'playerTurn'}
            />
          ))}
        </div>
      </div>

      {/* Message / hint row */}
      <div className={styles.messageRow}>
        {message && <p className={styles.message}>{message}</p>}
        {settings.showHints && gamePhase === 'playerTurn' && activeHand && dealerUpcard && (
          <StrategyHint playerCards={activeHand.cards} dealerUpcard={dealerUpcard} canDouble={canDouble} canSplit={canSplit} />
        )}
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {gamePhase === 'betting' && (
          <BettingPanel
            currentBet={currentBet}
            balance={balance}
            onAddChip={actions.addChipToBet}
            onClearBet={actions.clearBet}
            onDeal={actions.deal}
            onReload={actions.reloadBalance}
            gamePhase={gamePhase}
          />
        )}
        <ActionButtons
          gamePhase={gamePhase}
          canDouble={canDouble}
          canSplit={canSplit}
          balance={balance}
          activeBet={activeHand?.bet}
          onHit={actions.hit}
          onStand={actions.stand}
          onDouble={actions.doubleDown}
          onSplit={actions.split}
          onNewRound={actions.deal}
        />
      </div>

      {/* Result overlay */}
      {roundResult && (
        <ResultOverlay result={roundResult} message={message} onDismiss={actions.deal} />
      )}
    </div>
  );
}
