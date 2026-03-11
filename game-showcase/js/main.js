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

// ----- Viewport scaling -----
function scaleGame() {
  const wrapper = document.getElementById('game-wrapper');
  const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  const left  = Math.floor((window.innerWidth  - 1920 * scale) / 2);
  const top   = Math.floor((window.innerHeight - 1080 * scale) / 2);
  wrapper.style.transform = `scale(${scale})`;
  wrapper.style.left      = `${left}px`;
  wrapper.style.top       = `${top}px`;
}

// ----- Init -----
function init() {
  canvas = document.getElementById('game-canvas');
  ctx    = canvas.getContext('2d');
  scaleGame();
  window.addEventListener('resize', scaleGame);

  Renderer.init(ctx);
  AbilityEffects.init();
  Town.init(state.currentEra);
  UI.init();
  TownBuildingsPanel.init();
  HousingPanel.init();
  UI.adoptPanels();
  SupplyOverlay.init();

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

      // Refresh panels so new era's buildings/housing become visible
      TownBuildingsPanel.refresh();
      HousingPanel.refresh();

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

  // Preload all eras in background so dev-tool era skipping never shows circles
  assetsReady = true;
  UI.enableStartButton();
  for (let era = 1; era <= 5; era++) Assets.loadEra(era);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      UI.closeAll();
      UI.clearSelection();
      SupplyOverlay.close();
    }
  });

  _initDevPanel();
  requestAnimationFrame(loop);
}

// ----- Dev Panel -----
function _initDevPanel() {
  const panel = document.createElement('div');
  panel.id = 'dev-panel';
  panel.style.cssText = `
    position: fixed; bottom: 12px; left: 12px; z-index: 9999;
    background: rgba(0,0,0,0.82); border: 1px solid #888;
    border-radius: 6px; padding: 8px 12px;
    font-family: monospace; font-size: 13px; color: #ccc;
    display: flex; align-items: center; gap: 8px;
    pointer-events: auto;
  `;

  const label = document.createElement('span');
  label.textContent = 'DEV Era:';
  panel.appendChild(label);

  for (let era = 1; era <= 5; era++) {
    const btn = document.createElement('button');
    btn.textContent = era;
    btn.dataset.era = era;
    btn.style.cssText = `
      padding: 3px 10px; font-family: monospace; font-size: 13px;
      background: #333; color: #ccc; border: 1px solid #666;
      border-radius: 3px; cursor: pointer;
    `;
    btn.addEventListener('click', () => _devSwitchEra(era));
    panel.appendChild(btn);
  }

  const sep = document.createElement('span');
  sep.textContent = '|';
  sep.style.color = '#555';
  panel.appendChild(sep);

  const fillBtn = document.createElement('button');
  fillBtn.textContent = 'Fill $';
  fillBtn.title = 'Max out gold and all resources';
  fillBtn.style.cssText = `
    padding: 3px 10px; font-family: monospace; font-size: 13px;
    background: #1a3a1a; color: #6f6; border: 1px solid #4a4;
    border-radius: 3px; cursor: pointer;
  `;
  fillBtn.addEventListener('click', () => { Resources.devFill(); UI.update(state); });
  panel.appendChild(fillBtn);

  document.body.appendChild(panel);
}

function _devSwitchEra(era) {
  if (era < 1 || era > 5) return;
  Enemies.clear();
  Barricades.clear();
  Projectiles.clear();
  state.currentEra  = era;
  state.currentWave = 1;
  state.phase       = 'prep';
  Town.reset(era);
  Abilities.reset();
  Barricades.setEra(era);
  TownBuildingsPanel.refresh();
  HousingPanel.refresh();
  Assets.loadEra(era).then(() => { UI.update(state); });
  UI.update(state);
}

// ----- Path Editor (dev tool) -----
function _initPathEditor() {
  const devPanel = document.getElementById('dev-panel');

  // Separator
  const sep = document.createElement('span');
  sep.textContent = '|';
  sep.style.color = '#555';
  devPanel.appendChild(sep);

  // Toggle button
  const editBtn = document.createElement('button');
  editBtn.textContent = 'Edit Path';
  editBtn.style.cssText = `
    padding: 3px 10px; font-family: monospace; font-size: 13px;
    background: #333; color: #ccc; border: 1px solid #666;
    border-radius: 3px; cursor: pointer;
  `;
  devPanel.appendChild(editBtn);

  // Copy button
  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy Path';
  copyBtn.style.cssText = `
    padding: 3px 10px; font-family: monospace; font-size: 13px;
    background: #1a2a3a; color: #8cf; border: 1px solid #4af;
    border-radius: 3px; cursor: pointer; display: none;
  `;
  devPanel.appendChild(copyBtn);

  // Invisible overlay layer inside game-wrapper for node divs
  const nodeLayer = document.createElement('div');
  nodeLayer.style.cssText = `
    position: absolute; top: 0; left: 0;
    width: 1920px; height: 1080px;
    pointer-events: none; z-index: 50;
    display: none;
  `;
  document.getElementById('game-wrapper').appendChild(nodeLayer);

  let editing = false;
  let dragging = null; // { nodeEl, index }

  function gameCoords(screenX, screenY) {
    const rect = document.getElementById('game-wrapper').getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1920, (screenX - rect.left) * (1920 / rect.width))),
      y: Math.max(0, Math.min(1080, (screenY - rect.top)  * (1080 / rect.height))),
    };
  }

  function rebuildNodes() {
    nodeLayer.innerHTML = '';
    Path.WAYPOINTS.forEach((wp, i) => {
      const node = document.createElement('div');
      node.style.cssText = `
        position: absolute;
        width: 22px; height: 22px; border-radius: 50%;
        background: rgba(255,210,60,0.92); border: 2px solid #fff;
        box-shadow: 0 0 10px rgba(0,0,0,0.85), 0 0 6px rgba(255,200,50,0.6);
        cursor: grab; transform: translate(-50%,-50%);
        pointer-events: auto; user-select: none;
        display: flex; align-items: center; justify-content: center;
        font-size: 9px; font-family: monospace; font-weight: bold; color: #000;
      `;
      node.textContent = i;
      node.style.left = `${wp.x}px`;
      node.style.top  = `${wp.y}px`;
      node.addEventListener('mousedown', e => {
        e.preventDefault();
        dragging = { nodeEl: node, index: i };
        node.style.cursor = 'grabbing';
        node.style.background = 'rgba(255,120,40,0.95)';
      });
      nodeLayer.appendChild(node);
    });
  }

  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const { x, y } = gameCoords(e.clientX, e.clientY);
    Path.WAYPOINTS[dragging.index].x = x;
    Path.WAYPOINTS[dragging.index].y = y;
    dragging.nodeEl.style.left = `${x}px`;
    dragging.nodeEl.style.top  = `${y}px`;
    Path.refreshLUT();
  });

  window.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging.nodeEl.style.cursor = 'grab';
    dragging.nodeEl.style.background = 'rgba(255,210,60,0.92)';
    dragging = null;
    Path.refresh();
  });

  editBtn.addEventListener('click', () => {
    editing = !editing;
    editBtn.style.background  = editing ? '#1a3a1a' : '#333';
    editBtn.style.borderColor = editing ? '#4a4'    : '#666';
    editBtn.style.color       = editing ? '#8f8'    : '#ccc';
    nodeLayer.style.display   = editing ? '' : 'none';
    copyBtn.style.display     = editing ? '' : 'none';
    if (editing) rebuildNodes();
  });

  copyBtn.addEventListener('click', () => {
    const lines = Path.WAYPOINTS.map(wp =>
      `    { x: ${Math.round(wp.x)}, y: ${Math.round(wp.y)} }`
    ).join(',\n');
    const text = `[\n${lines}\n]`;
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = 'Copied!';
      copyBtn.style.background = '#1a3a1a';
      setTimeout(() => {
        copyBtn.textContent = 'Copy Path';
        copyBtn.style.background = '#1a2a3a';
      }, 1800);
    });
  });
}

// ----- Main loop -----
function loop(timestamp) {
  const delta = Math.min(timestamp - lastTimestamp, 100);
  lastTimestamp = timestamp;

  try { update(delta); } catch(e) { console.error('[update] crash:', e); }
  try { render(); } catch(e) { console.error('[render] crash:', e); }

  requestAnimationFrame(loop);
}

// ----- Update -----
function update(delta) {
  if (!assetsReady || state.phase === 'gameover') return;

  if (Waves.isActive()) Resources.update(delta);
  Waves.update(delta);
  Enemies.update(delta);
  Barricades.update(delta);
  Towers.update(delta);
  Projectiles.update(delta);
  if (typeof Supply !== 'undefined') Supply.update(delta);
  Abilities.update(delta);
  AbilityEffects.update(delta);
}

// ----- Render -----
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  Renderer.drawZones();
  Renderer.drawSettlementBuildings();
  Renderer.drawGrid();
  Renderer.drawPath();
  Renderer.drawBarricades();
  Renderer.drawTowers();
  Renderer.drawBuildHighlight();
  Renderer.drawEnemies();
  Renderer.drawProjectiles();
  AbilityEffects.draw(ctx);

  UI.renderHUD();
}

// ----- Boot -----
window.addEventListener('DOMContentLoaded', init);
