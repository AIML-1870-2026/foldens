import { ACTION_COLORS, CONFIDENCE_DOTS, RISK_PROFILES } from '../lib/constants.js';

export default function AIPanel({
  aiState, phase, riskProfile,
  canDouble, canSplit,
  onExecute, onHit, onStand, onDouble, onSplit,
}) {
  const { status, recommendation: rec, error } = aiState;
  const isPlayerTurn = phase === 'playerTurn';
  const profileLabel = RISK_PROFILES[riskProfile]?.label || 'Standard';

  return (
    <div className={['ai-panel', status === 'error' ? 'ai-panel--error' : ''].filter(Boolean).join(' ')}>
      <div className="ai-panel-header">
        <span className="ai-panel-title">AI Agent Analysis</span>
        <span className="risk-badge">{profileLabel}</span>
      </div>

      {/* IDLE */}
      {status === 'idle' && (
        <p className="ai-idle">Place a bet and deal to start the analysis.</p>
      )}

      {/* LOADING */}
      {status === 'loading' && (
        <div className="ai-loading">
          <div className="spinner" />
          <span>Agent is analyzing your hand...</span>
        </div>
      )}

      {/* RESULT or ERROR with recommendation */}
      {(status === 'result' || (status === 'error' && rec)) && rec && (
        <div className="ai-result">
          <div className="ai-action-row">
            <span
              className="ai-action-badge"
              style={{ background: ACTION_COLORS[rec.action] || '#666' }}
            >
              {rec.action.toUpperCase()}
            </span>
            <span className="ai-confidence" title={`Confidence: ${rec.confidence}`}>
              {CONFIDENCE_DOTS[rec.confidence] || '○○○'}
            </span>
          </div>
          <p className="ai-reasoning">{rec.reasoning}</p>
          <p className="ai-strategy-note">{rec.basic_strategy_note}</p>
          {status === 'error' && error && (
            <p className="ai-error-note">⚠ {error}</p>
          )}
        </div>
      )}

      {/* ERROR with no recommendation */}
      {status === 'error' && !rec && error && (
        <p className="ai-error-note">⚠ {error}</p>
      )}

      {/* Action Buttons */}
      {isPlayerTurn && (
        <div className="ai-actions">
          {status === 'result' && rec && (
            <button className="btn btn--execute" onClick={onExecute}>
              Execute: {rec.action.toUpperCase()}
            </button>
          )}
          <div className="manual-btns">
            <button className="btn btn--manual" disabled={status === 'loading'} onClick={() => onHit(true)}>Hit</button>
            <button className="btn btn--manual" disabled={status === 'loading'} onClick={() => onStand(true)}>Stand</button>
            <button className="btn btn--manual" disabled={status === 'loading' || !canDouble} onClick={() => onDouble(true)}>Double</button>
            <button className="btn btn--manual" disabled={status === 'loading' || !canSplit} onClick={() => onSplit(true)}>Split</button>
          </div>
        </div>
      )}
    </div>
  );
}
