import { RISK_PROFILES } from '../lib/constants.js';

export default function RiskToggle({ value, onChange }) {
  return (
    <div className="risk-toggle">
      <span className="risk-label">Risk Profile:</span>
      <div className="risk-buttons">
        {Object.entries(RISK_PROFILES).map(([key, { label }]) => (
          <button
            key={key}
            className={['risk-btn', value === key ? 'risk-btn--active' : ''].filter(Boolean).join(' ')}
            onClick={() => onChange(key)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
