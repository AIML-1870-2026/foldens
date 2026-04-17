import { useState, useCallback } from 'react';
import SetupScreen from './components/SetupScreen.jsx';
import GameTable from './components/GameTable.jsx';
import { useBlackjack } from './hooks/useBlackjack.js';

function GameWrapper({ apiKey }) {
  const game = useBlackjack(apiKey);
  return <GameTable game={game} />;
}

export default function App() {
  const [apiKey, setApiKey] = useState(null);

  const handleKeyLoaded = useCallback((key) => {
    setApiKey(key);
  }, []);

  if (!apiKey) {
    return <SetupScreen onKeyLoaded={handleKeyLoaded} />;
  }

  return <GameWrapper apiKey={apiKey} />;
}
