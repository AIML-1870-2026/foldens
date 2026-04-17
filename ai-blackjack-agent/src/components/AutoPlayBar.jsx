export default function AutoPlayBar({ autoAccept, autoPlay, autoBet, onToggleAccept, onTogglePlay, onToggleBet }) {
  return (
    <div className="autoplay-bar">
      <label className="toggle-row">
        <span className="toggle-label">
          Auto-Accept AI
          <span className="toggle-hint">Execute recommendation automatically</span>
        </span>
        <button
          className={['toggle-switch', autoAccept ? 'toggle-switch--on' : ''].filter(Boolean).join(' ')}
          onClick={onToggleAccept}
          aria-pressed={autoAccept}
        >
          <span className="toggle-knob" />
        </button>
      </label>

      <label className="toggle-row">
        <span className="toggle-label">
          Auto-Bet AI
          <span className="toggle-hint">AI calculates bet amount</span>
        </span>
        <button
          className={['toggle-switch', autoBet ? 'toggle-switch--on' : ''].filter(Boolean).join(' ')}
          onClick={onToggleBet}
          aria-pressed={autoBet}
        >
          <span className="toggle-knob" />
        </button>
      </label>

      <label className="toggle-row">
        <span className="toggle-label">
          Auto-Play
          <span className="toggle-hint">Start new hands automatically</span>
        </span>
        <button
          className={['toggle-switch', autoPlay ? 'toggle-switch--on' : ''].filter(Boolean).join(' ')}
          onClick={onTogglePlay}
          aria-pressed={autoPlay}
        >
          <span className="toggle-knob" />
        </button>
      </label>

      {autoAccept && autoPlay && autoBet && (
        <p className="autoplay-notice">Fully automated — AI handles bets, decisions, and next rounds.</p>
      )}
    </div>
  );
}
