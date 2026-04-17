export default function AnalyticsPanel({ stats }) {
  const { wins, losses, pushes, agentFollowed, agentIgnored, balanceHistory } = stats;
  const total = wins + losses + pushes;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const decisions = agentFollowed + agentIgnored;
  const agreementRate = decisions > 0 ? Math.round((agentFollowed / decisions) * 100) : 0;

  // Sparkline
  const W = 260, H = 50, PAD = 4;
  let sparkline = null;
  if (balanceHistory.length >= 2) {
    const min = Math.min(...balanceHistory);
    const max = Math.max(...balanceHistory);
    const range = max - min || 1;
    const pts = balanceHistory.map((b, i) => {
      const x = PAD + ((i / (balanceHistory.length - 1)) * (W - PAD * 2));
      const y = PAD + ((1 - (b - min) / range) * (H - PAD * 2));
      return `${x},${y}`;
    }).join(' ');
    sparkline = pts;
  }

  return (
    <details className="analytics-panel">
      <summary className="analytics-summary">Performance Analytics</summary>
      <div className="analytics-body">
        <div className="analytics-stats">
          <div className="analytics-stat">
            <span className="analytics-label">Win Rate</span>
            <span className="analytics-value">{winRate}%</span>
            <span className="analytics-sub">{wins}W / {losses}L / {pushes}P</span>
          </div>
          <div className="analytics-stat">
            <span className="analytics-label">Agent Agreement</span>
            <span className="analytics-value">{agreementRate}%</span>
            <span className="analytics-sub">{agentFollowed} followed / {agentIgnored} overridden</span>
          </div>
        </div>

        {sparkline && (
          <div className="sparkline-wrap">
            <span className="analytics-label">Balance History</span>
            <svg width={W} height={H} className="sparkline">
              <polyline
                points={sparkline}
                fill="none"
                stroke="#c9a84c"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
    </details>
  );
}
