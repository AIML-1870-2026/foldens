export default function HistoryLog({ history }) {
  if (!history.length) return null;

  const resultSymbol = (r) => {
    if (r === 'win' || r === 'blackjack') return '✓';
    if (r === 'loss' || r === 'bust') return '✗';
    return '=';
  };
  const resultClass = (r) => {
    if (r === 'win' || r === 'blackjack') return 'history-win';
    if (r === 'loss' || r === 'bust') return 'history-loss';
    return 'history-push';
  };

  return (
    <div className="history-log">
      <h3 className="history-title">Hand History</h3>
      <div className="history-rows">
        {history.map((h) => (
          <div key={h.round} className="history-row">
            <span className="history-round">Rd {h.round}</span>
            <span className="history-bet">Bet ${h.bet}</span>
            <span className={resultClass(h.result)}>
              {resultSymbol(h.result)} {h.result.charAt(0).toUpperCase() + h.result.slice(1)}
            </span>
            <span className={h.net >= 0 ? 'history-win' : 'history-loss'}>
              {h.net >= 0 ? '+' : ''}${h.net}
            </span>
            <span className="history-balance">Balance: ${h.balance}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
