/* ============================================================
   main.js — Game entry point & rAF loop
   ============================================================ */

// ----- Global state -----
const state = {
  currentEra:  1,
  currentWave: 1,
  phase:       'prep',   // 'prep' | 'wave' | 'gameover'
};

let canvas, ctx;
let lastTimestamp = 0;
let assetsReady   = false;

// ----- Init -----
function init() {
  canvas = document.getElementById('game-canvas');
  ctx    = canvas.getContext('2d');

  Renderer.init(ctx);
  Town.init(state.currentEra);
  UI.init();
  TownBuildingsPanel.init();
  HousingPanel.init();
  SupplyOverlay.init();

  Events.on('test', d => console.log('[Events] received:', d));
  Events.emit('test', { message: 'Event bus OK', state });

  // Wave complete — advance counter or era
  Events.on('wave:complete', () => {
    if (state.currentWave >= 5) {
      // Era complete
      Events.emit('era:advance', { era: state.currentEra });

      if (state.currentEra >= 5) {
        // Win condition
        state.phase = 'gameover';
        UI.update(state);
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        return;
      }

      state.currentEra++;
      state.currentWave = 1;
      Town.reset(state.currentEra);
      Abilities.reset();
      Barricades.setEra(state.currentEra);

      // Load new era assets then show advancement overlay
      Assets.loadEra(state.currentEra).then(() => {
        EraAdvancementOverlay.show(state.currentEra, () => {
          PeopleArrivalPopup.show(state.currentEra, () => {
            state.phase = 'prep';
            UI.update(state);
          });
        });
      });
    } else {
      state.currentWave++;
      PeopleArrivalPopup.show(state.currentEra, () => {
        state.phase = 'prep';
        UI.update(state);
      });
    }
  });

  // Enemy killed — award gold reward
  Events.on('enemy:killed', ({ goldReward }) => Resources.addGold(goldReward));

  // Game over — brief pause then redirect to home page
  Events.on('game:over', () => {
    state.phase = 'gameover';
    UI.update(state);
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
  });

  // Load Era 1 assets; unlock the Start Wave button when ready
  Assets.loadEra(1).then(() => {
    assetsReady = true;
    UI.enableStartButton();
  });

  requestAnimationFrame(loop);
}

// ----- Main loop -----
function loop(timestamp) {
  const delta = Math.min(timestamp - lastTimestamp, 100);
  lastTimestamp = timestamp;

  update(delta);
  render();

  requestAnimationFrame(loop);
}

// ----- Update -----
function update(delta) {
  if (!assetsReady || state.phase === 'gameover') return;

  Resources.update(delta);
  Waves.update(delta);
  Enemies.update(delta);
  Barricades.update(delta);
  Towers.update(delta);
  Supply.update();
  Abilities.update(delta);
}

// ----- Render -----
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  Renderer.drawZones();
  Renderer.drawPath();
  Renderer.drawGrid();
  Renderer.drawBarricades();
  Renderer.drawTowers();
  Renderer.drawBuildHighlight();
  Renderer.drawEnemies();
  Renderer.drawWall();

  UI.renderHUD();
}

// ----- Boot -----
window.addEventListener('DOMContentLoaded', init);
