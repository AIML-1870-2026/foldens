import { SPEED_CONFIGS } from '../lib/constants.js';

export default function SpeedSelector({ speed, onSpeedChange }) {
  return (
    <div className="speed-selector">
      <label className="speed-label">Game Speed:</label>
      <div className="speed-buttons">
        {Object.entries(SPEED_CONFIGS).map(([key, config]) => (
          <button
            key={key}
            className={['speed-button', speed === parseInt(key) ? 'speed-button--active' : ''].filter(Boolean).join(' ')}
            onClick={() => onSpeedChange(parseInt(key))}
            title={`${config.label} — Uses ${config.model}`}
          >
            {config.label}
          </button>
        ))}
      </div>
      <p className="speed-hint">
        Higher speeds use faster models for quicker analysis
      </p>
    </div>
  );
}
