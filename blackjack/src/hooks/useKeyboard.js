import { useEffect } from 'react';

export function useKeyboard({ gamePhase, actions, canDouble, canSplit, settingsOpen, setSettingsOpen }) {
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const key = e.key.toUpperCase();

      if (key === 'ESCAPE') {
        if (settingsOpen) setSettingsOpen(false);
        return;
      }

      if (gamePhase === 'betting' || gamePhase === 'roundOver') {
        if (key === 'D') { actions.deal(); return; }
      }
      if (gamePhase === 'betting') {
        if (key === '1') { actions.addChipToBet(5); return; }
        if (key === '2') { actions.addChipToBet(25); return; }
        if (key === '3') { actions.addChipToBet(50); return; }
        if (key === '4') { actions.addChipToBet(100); return; }
        if (key === '5') { actions.addChipToBet(500); return; }
        if (key === 'C') { actions.clearBet(); return; }
      }
      if (gamePhase === 'playerTurn') {
        if (key === 'H') { actions.hit(); return; }
        if (key === 'S') { actions.stand(); return; }
        if (key === 'X' && canDouble) { actions.doubleDown(); return; }
        if (key === 'P' && canSplit) { actions.split(); return; }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gamePhase, actions, canDouble, canSplit, settingsOpen, setSettingsOpen]);
}
