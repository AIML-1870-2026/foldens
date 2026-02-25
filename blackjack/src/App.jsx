import { useState, useEffect, useCallback } from 'react';
import { useBlackjack } from './hooks/useBlackjack.js';
import { useAudio } from './hooks/useAudio.js';
import { useStats } from './hooks/useStats.js';
import { useKeyboard } from './hooks/useKeyboard.js';
import { applyTheme } from './constants/themes.js';

import Header from './components/Header/Header.jsx';
import Table from './components/Table/Table.jsx';
import StatsPanel from './components/StatsPanel/StatsPanel.jsx';
import HistoryPanel from './components/HistoryPanel/HistoryPanel.jsx';
import CountDisplay from './components/CountDisplay/CountDisplay.jsx';
import CardTracker from './components/CardTracker/CardTracker.jsx';
import SettingsPanel from './components/SettingsPanel/SettingsPanel.jsx';
import KeyboardLegend from './components/KeyboardLegend/KeyboardLegend.jsx';

import styles from './App.module.css';

const SETTINGS_KEY = 'blackjack_settings';
const DEFAULT_SETTINGS = {
  soundEnabled: true,
  showCount: true,
  showHints: true,
  showTells: true,
  theme: 'classic',
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

function saveSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('stats'); // for mobile tab panel

  // Apply theme on mount and when changed
  useEffect(() => { applyTheme(settings.theme); }, [settings.theme]);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
  }, []);

  const { stats, history, recordRound, resetStats } = useStats();
  const { playSound } = useAudio(settings.soundEnabled);
  const game = useBlackjack({ playSound, recordRound });

  useKeyboard({
    gamePhase: game.gamePhase,
    actions: game.actions,
    canDouble: game.canDouble,
    canSplit: game.canSplit,
    settingsOpen,
    setSettingsOpen,
  });

  return (
    <div className={styles.app}>
      <Header
        soundEnabled={settings.soundEnabled}
        onToggleSound={() => updateSetting('soundEnabled', !settings.soundEnabled)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className={styles.layout}>
        {/* Left sidebar — desktop only */}
        <aside className={`${styles.sidebar} ${styles.leftSidebar}`}>
          {settings.showCount && (
            <div className={styles.countWrap}>
              <CountDisplay count={game.runningCount} shuffleFlash={game.shuffleFlash} />
            </div>
          )}
          <CardTracker counts={game.cardCounts} />
          <StatsPanel stats={stats} onReset={resetStats} />
        </aside>

        {/* Main table */}
        <main className={styles.main}>
          <Table game={game} settings={settings} />
        </main>

        {/* Right sidebar — desktop only */}
        <aside className={`${styles.sidebar} ${styles.rightSidebar}`}>
          <HistoryPanel history={history} />
        </aside>
      </div>

      {/* Mobile tab panel */}
      <div className={styles.mobilePanel}>
        <div className={styles.tabBar}>
          <button className={`${styles.tab} ${activeTab === 'stats' ? styles.activeTab : ''}`} onClick={() => setActiveTab('stats')}>Stats</button>
          <button className={`${styles.tab} ${activeTab === 'cards' ? styles.activeTab : ''}`} onClick={() => setActiveTab('cards')}>Cards</button>
          <button className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`} onClick={() => setActiveTab('history')}>History</button>
          {settings.showCount && (
            <button className={`${styles.tab} ${activeTab === 'count' ? styles.activeTab : ''}`} onClick={() => setActiveTab('count')}>Count</button>
          )}
        </div>
        <div className={styles.tabContent}>
          {activeTab === 'stats' && <StatsPanel stats={stats} onReset={resetStats} />}
          {activeTab === 'cards' && <CardTracker counts={game.cardCounts} />}
          {activeTab === 'history' && <HistoryPanel history={history} />}
          {activeTab === 'count' && settings.showCount && (
            <div className={styles.countCenter}>
              <CountDisplay count={game.runningCount} shuffleFlash={game.shuffleFlash} />
            </div>
          )}
        </div>
      </div>

      {/* Keyboard legend — desktop only */}
      <div className={styles.legendWrap}>
        <KeyboardLegend gamePhase={game.gamePhase} />
      </div>

      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onUpdateSetting={updateSetting}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
