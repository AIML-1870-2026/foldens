import { CHIPS, MIN_BET } from '../lib/constants.js';

export default function BetBar({ currentBet, balance, phase, onAddChip, onClearBet, onDeal }) {
  const isBetting = phase === 'betting';
  const canDeal = isBetting && currentBet >= MIN_BET && currentBet <= balance;

  return (
    <div className="bet-bar">
      <div className="bet-display">
        <span className="bet-label">Bet</span>
        <span className="bet-amount">${currentBet}</span>
      </div>

      <div className="chip-row">
        {CHIPS.map(chip => (
          <button
            key={chip.value}
            className="chip"
            style={{ background: chip.color }}
            disabled={!isBetting || currentBet + chip.value > balance}
            onClick={() => onAddChip(chip.value)}
          >
            {chip.label}
          </button>
        ))}
        <button
          className="btn btn--secondary"
          disabled={!isBetting || currentBet === 0}
          onClick={onClearBet}
        >
          Clear
        </button>
      </div>

      <button
        className="btn btn--deal"
        disabled={!canDeal}
        onClick={onDeal}
      >
        Deal
      </button>

      {isBetting && balance < MIN_BET && (
        <p className="warning">Game over — you&apos;re out of chips!</p>
      )}
    </div>
  );
}
