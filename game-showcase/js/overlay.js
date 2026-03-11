/* ============================================================
   overlay.js — In-game panel overlays (buildings, housing, supply)
   ============================================================ */

// ----- Town Buildings Panel -----
const TownBuildingsPanel = (() => {

  // All buildings across all eras — each era unlocks its pair on era advancement.
  // Each building has 3 upgrade levels; cost scales per level.
  const ALL_BUILDINGS = [
    { id: 'boneYard',        era: 1, name: 'Bone Yard',         produces: 'bone',      rate: 1.5, goldCost:  30 },
    { id: 'lumberCamp',      era: 1, name: 'Lumber Camp',       produces: 'wood',      rate: 1.5, goldCost:  30 },
    { id: 'stoneQuarry',     era: 2, name: 'Stone Quarry',      produces: 'stone',     rate: 1.5, goldCost:  45 },
    { id: 'ironMine',        era: 2, name: 'Iron Mine',         produces: 'iron',      rate: 1.5, goldCost:  45 },
    { id: 'timberMill',      era: 3, name: 'Timber Mill',       produces: 'timber',    rate: 1.5, goldCost:  60 },
    { id: 'powderMill',      era: 3, name: 'Powder Mill',       produces: 'gunpowder', rate: 1.5, goldCost:  60 },
    { id: 'steelFoundry',    era: 4, name: 'Steel Foundry',     produces: 'steel',     rate: 1.5, goldCost:  80 },
    { id: 'oilRefinery',     era: 4, name: 'Oil Refinery',      produces: 'oil',       rate: 1.5, goldCost:  80 },
    { id: 'alloyForge',      era: 5, name: 'Alloy Forge',       produces: 'alloy',     rate: 1.5, goldCost: 100 },
    { id: 'plasmaGenerator', era: 5, name: 'Plasma Generator',  produces: 'plasma',    rate: 1.5, goldCost: 100 },
  ];

  const MAX_LEVEL = 3;
  // levels[id] = 0 (unbuilt) … 3 (max)
  const levels = {};
  for (const b of ALL_BUILDINGS) levels[b.id] = 0;

  let panelEl  = null;
  const rowEls = {};

  // Cost to go from current level → next: base × (level + 1)
  function _nextCost(b) { return b.goldCost * (levels[b.id] + 1); }

  function init() {
    _buildTriggerButton();
    _buildPanel();
  }

  function _buildTriggerButton() {
    const btn = document.createElement('button');
    btn.className = 'hud-town-btn';
    btn.style.opacity = '1';
    btn.textContent = 'Buildings';
    btn.addEventListener('click', toggle);
    document.getElementById('hud-town-buttons').appendChild(btn);
  }

  function _buildPanel() {
    panelEl = document.createElement('div');
    panelEl.id = 'overlay-buildings';
    panelEl.style.display = 'none';

    const title = document.createElement('div');
    title.className = 'overlay-title';
    title.textContent = 'Town Buildings';
    panelEl.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'overlay-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', close);
    panelEl.appendChild(closeBtn);

    for (const b of ALL_BUILDINGS) {
      const row = document.createElement('div');
      row.className = 'overlay-building-row';
      row.dataset.buildingId = b.id;

      const nameEl = document.createElement('span');
      nameEl.className = 'overlay-building-name';
      nameEl.textContent = b.name;

      const prodEl = document.createElement('span');
      prodEl.className = 'overlay-building-prod';

      const levelEl = document.createElement('span');
      levelEl.className = 'overlay-building-count';

      const costEl = document.createElement('span');
      costEl.className = 'overlay-building-cost';

      const actionBtn = document.createElement('button');
      actionBtn.className = 'overlay-buy-btn';
      actionBtn.addEventListener('click', () => _onUpgrade(b));

      row.append(nameEl, prodEl, levelEl, costEl, actionBtn);
      panelEl.appendChild(row);
      rowEls[b.id] = { row, prodEl, levelEl, costEl, actionBtn };
      _refreshRow(b);
    }

    document.getElementById('hud').appendChild(panelEl);
    _refreshVisibility();
  }

  function _refreshRow(b) {
    const lv  = levels[b.id];
    const els = rowEls[b.id];
    if (!els) return;

    // Production: show current output, dim if unbuilt
    els.prodEl.textContent = lv > 0
      ? `+${b.rate * lv} ${b.produces}/s`
      : `— ${b.produces}`;
    els.prodEl.style.opacity = lv > 0 ? '1' : '0.4';

    // Level pips  ●●○
    const pips = Array.from({ length: MAX_LEVEL }, (_, i) => i < lv ? '●' : '○').join('');
    els.levelEl.textContent = lv === 0 ? 'Unbuilt' : `Lv ${lv}  ${pips}`;
    els.levelEl.style.color = lv >= MAX_LEVEL ? '#f0c040' : '';

    // Cost & button
    if (lv >= MAX_LEVEL) {
      els.costEl.textContent = 'MAX';
      els.actionBtn.textContent = 'Maxed';
      els.actionBtn.disabled = true;
    } else {
      const cost = _nextCost(b);
      els.costEl.textContent = `${cost}g`;
      els.actionBtn.textContent = lv === 0 ? 'Build' : 'Upgrade';
      els.actionBtn.disabled = !Resources.canAfford({ gold: cost });
    }
  }

  function _onUpgrade(building) {
    const lv = levels[building.id];
    if (lv >= MAX_LEVEL) return;
    const cost = _nextCost(building);
    if (!Resources.spendGold(cost)) return;
    levels[building.id]++;
    Resources.addProduction(building.produces, building.rate);
    if (building.era >= 3) Supply.addProduction(1);
    // Refresh all rows (affordability may have changed)
    for (const b of ALL_BUILDINGS) _refreshRow(b);
  }

  // Show/hide rows based on current era, and refresh affordability
  function _refreshVisibility() {
    const era = state.currentEra;
    for (const b of ALL_BUILDINGS) {
      if (rowEls[b.id]) {
        rowEls[b.id].row.style.display = b.era <= era ? '' : 'none';
        _refreshRow(b);
      }
    }
  }

  function toggle() {
    if (panelEl) {
      if (panelEl.style.display === 'none') {
        UI.closeAll();
        HousingPanel.close();
        _refreshVisibility();
        panelEl.style.display = '';
      } else {
        panelEl.style.display = 'none';
      }
    }
  }

  function close() { if (panelEl) panelEl.style.display = 'none'; }

  function refresh() { _refreshVisibility(); }

  function getLevel(id) { return levels[id] ?? 0; }

  function getBuildingInfo(id) { return ALL_BUILDINGS.find(b => b.id === id) ?? null; }

  function upgrade(id) {
    const b = ALL_BUILDINGS.find(b => b.id === id);
    if (b) _onUpgrade(b);
  }

  return { init, toggle, close, refresh, getLevel, getBuildingInfo, upgrade };
})();

// ----- Housing Panel -----
const HousingPanel = (() => {

  const ALL_HOUSING = [
    { era: 1, id: 'hut',      label: 'Hut'            },
    { era: 2, id: 'cottage',  label: 'Cottage'         },
    { era: 3, id: 'lodging',  label: 'Lodging House'   },
    { era: 4, id: 'barracks', label: 'Barracks Block'  },
    { era: 5, id: 'habitat',  label: 'Habitat Module'  },
  ];

  const ownedCounts = {};
  for (const h of ALL_HOUSING) ownedCounts[h.id] = 0;

  let panelEl  = null;
  const rowEls = {};

  function init() {
    _buildTriggerButton();
    _buildPanel();
  }

  function _buildTriggerButton() {
    const btn = document.createElement('button');
    btn.className = 'hud-town-btn';
    btn.style.opacity = '1';
    btn.textContent = 'Housing';
    btn.addEventListener('click', toggle);
    document.getElementById('hud-town-buttons').appendChild(btn);
  }

  function _buildPanel() {
    panelEl = document.createElement('div');
    panelEl.id = 'overlay-housing';
    panelEl.style.display = 'none';

    const title = document.createElement('div');
    title.className = 'overlay-title';
    title.textContent = 'Housing';
    panelEl.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'overlay-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', close);
    panelEl.appendChild(closeBtn);

    for (const h of ALL_HOUSING) {
      const def = People.ERA_HOUSING[h.era];
      const row = document.createElement('div');
      row.className = 'overlay-building-row';
      row.dataset.housingId = h.id;

      const nameEl = document.createElement('span');
      nameEl.className = 'overlay-building-name';
      nameEl.textContent = h.label;

      const capEl = document.createElement('span');
      capEl.className = 'overlay-building-prod';
      capEl.textContent = `+${def.capacity} cap`;

      const goldEl = document.createElement('span');
      goldEl.className = 'overlay-building-cost';
      goldEl.textContent = `${def.goldCost}g`;

      const matEl = document.createElement('span');
      matEl.className = 'overlay-building-cost';
      matEl.style.color = '#c8a860';
      const parts = Object.entries(def.costs).map(([k, v]) => `${v}${k[0].toUpperCase()}`);
      matEl.textContent = parts.join(' ');

      const countEl = document.createElement('span');
      countEl.className = 'overlay-building-count';
      countEl.textContent = 'Owned: 0';

      const buyBtn = document.createElement('button');
      buyBtn.className = 'overlay-buy-btn';
      buyBtn.textContent = 'Buy';
      const fullCost = { gold: def.goldCost, ...def.costs };
      buyBtn.disabled = !Resources.canAfford(fullCost);
      buyBtn.addEventListener('click', () => _onBuy(h));

      row.append(nameEl, capEl, goldEl, matEl, countEl, buyBtn);
      panelEl.appendChild(row);
      rowEls[h.id] = { countEl, buyBtn, row };
    }

    document.getElementById('hud').appendChild(panelEl);
    _refreshVisibility();
  }

  function _onBuy(h) {
    if (!People.buyHousing(h.era)) return;
    ownedCounts[h.id]++;
    rowEls[h.id].countEl.textContent = `Owned: ${ownedCounts[h.id]}`;
    // Refresh all buy button affordability after purchase
    for (const housing of ALL_HOUSING) {
      if (rowEls[housing.id]?.buyBtn) {
        const hDef = People.ERA_HOUSING[housing.era];
        const cost = { gold: hDef.goldCost, ...hDef.costs };
        rowEls[housing.id].buyBtn.disabled = !Resources.canAfford(cost);
      }
    }
  }

  function _refreshVisibility() {
    const era = state.currentEra;
    for (const h of ALL_HOUSING) {
      if (rowEls[h.id]) rowEls[h.id].row.style.display = h.era <= era ? '' : 'none';
    }
    for (const h of ALL_HOUSING) {
      if (rowEls[h.id]?.buyBtn) {
        const hDef = People.ERA_HOUSING[h.era];
        const cost = { gold: hDef.goldCost, ...hDef.costs };
        rowEls[h.id].buyBtn.disabled = !Resources.canAfford(cost);
      }
    }
  }

  function toggle() {
    if (panelEl) {
      if (panelEl.style.display === 'none') {
        UI.closeAll();
        TownBuildingsPanel.close();
        _refreshVisibility();
        panelEl.style.display = '';
      } else {
        panelEl.style.display = 'none';
      }
    }
  }

  function close() { if (panelEl) panelEl.style.display = 'none'; }

  function refresh() { _refreshVisibility(); }

  return { init, toggle, close, refresh };
})();

// ----- Supply Overlay -----
const SupplyOverlay = (() => {

  const NS     = 'http://www.w3.org/2000/svg';
  const SVG_W  = 1580;
  const SVG_H  = 1080;
  const TH_X   = 1340;
  const TH_Y   = 540;
  const TH_R   = 36;
  const NODE_R = 22;

  let overlayEl   = null;
  let svgEl       = null;
  let statsEl     = null;
  let hudBtn      = null;
  let visible     = false;

  let dragging    = false;
  let previewLine = null;
  let svgRect     = null;

  function _towerPos(gx, gy) {
    return {
      x: 60 + (gx / 47) * 840,
      y: 60 + (gy / 53) * 960,
    };
  }

  function init() {
    _buildHudButton();
    _buildPanel();
  }

  function _buildHudButton() {
    hudBtn = document.createElement('button');
    hudBtn.id = 'hud-supply-btn';
    hudBtn.textContent = 'Supply';
    hudBtn.disabled = true;
    hudBtn.title = 'Available from Era 3';
    hudBtn.addEventListener('click', toggle);
    document.getElementById('hud').appendChild(hudBtn);
  }

  function _buildPanel() {
    overlayEl = document.createElement('div');
    overlayEl.id = 'overlay-supply';
    overlayEl.style.display = 'none';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'overlay-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', close);
    overlayEl.appendChild(closeBtn);

    const leftPanel = document.createElement('div');
    leftPanel.id = 'supply-left-panel';
    const leftTitle = document.createElement('div');
    leftTitle.className = 'overlay-title';
    leftTitle.textContent = 'Supply Network';
    leftPanel.appendChild(leftTitle);
    const hintEl = document.createElement('div');
    hintEl.className = 'supply-hint';
    hintEl.textContent =
      'Drag from Town Hall \u2192 tower to connect.\n' +
      'Left-click a line to cycle priority.\n' +
      'Right-click a line to disconnect.';
    leftPanel.appendChild(hintEl);
    overlayEl.appendChild(leftPanel);

    statsEl = document.createElement('div');
    statsEl.id = 'supply-stats';
    overlayEl.appendChild(statsEl);

    svgEl = document.createElementNS(NS, 'svg');
    svgEl.id = 'supply-network-svg';
    svgEl.setAttribute('viewBox', `0 0 ${SVG_W} ${SVG_H}`);
    svgEl.setAttribute('width', SVG_W);
    svgEl.setAttribute('height', SVG_H);
    svgEl.addEventListener('contextmenu', e => e.preventDefault());
    svgEl.addEventListener('mousemove', _onSvgMouseMove);
    svgEl.addEventListener('mouseup',   _onSvgMouseUp);
    overlayEl.appendChild(svgEl);

    document.getElementById('hud').appendChild(overlayEl);
  }

  function _rebuildSvg() {
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);

    const towers   = Towers.getAll();
    const allConns = Supply.getAllConnections();

    for (const [towerId, conn] of allConns) {
      const tower = towers.find(t => t.id === towerId);
      if (!tower) continue;
      const tp = _towerPos(tower.gx, tower.gy);

      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', TH_X); line.setAttribute('y1', TH_Y);
      line.setAttribute('x2', tp.x); line.setAttribute('y2', tp.y);
      line.setAttribute('stroke', _priorityColor(conn.priority));
      line.setAttribute('stroke-width', '3');
      line.setAttribute('stroke-linecap', 'round');
      line.style.cursor = 'pointer';
      line.addEventListener('click', e => {
        e.stopPropagation();
        Supply.cyclePriority(towerId);
        _rebuildSvg(); _refreshStats();
      });
      line.addEventListener('contextmenu', e => {
        e.preventDefault(); e.stopPropagation();
        Supply.disconnect(towerId);
        _rebuildSvg(); _refreshStats();
      });
      svgEl.appendChild(line);

      const lbl = document.createElementNS(NS, 'text');
      lbl.setAttribute('x', (TH_X + tp.x) / 2);
      lbl.setAttribute('y', (TH_Y + tp.y) / 2 - 6);
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('fill', _priorityColor(conn.priority));
      lbl.setAttribute('font-size', '13');
      lbl.setAttribute('font-family', 'monospace');
      lbl.setAttribute('pointer-events', 'none');
      lbl.textContent = conn.priority.toUpperCase();
      svgEl.appendChild(lbl);
    }

    for (const tower of towers) {
      const tp   = _towerPos(tower.gx, tower.gy);
      const conn = Supply.getConnection(tower.id);

      if (conn) {
        const ring = document.createElementNS(NS, 'circle');
        ring.setAttribute('cx', tp.x); ring.setAttribute('cy', tp.y);
        ring.setAttribute('r', NODE_R + 5);
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', _supplyColor(conn.supplyHealth));
        ring.setAttribute('stroke-width', '3');
        ring.setAttribute('pointer-events', 'none');
        svgEl.appendChild(ring);
      }

      const circle = document.createElementNS(NS, 'circle');
      circle.setAttribute('cx', tp.x); circle.setAttribute('cy', tp.y);
      circle.setAttribute('r', NODE_R);
      circle.setAttribute('fill', conn ? 'rgba(70,45,18,0.95)' : 'rgba(28,18,8,0.9)');
      circle.setAttribute('stroke', conn ? 'rgba(210,160,60,0.9)' : 'rgba(100,80,40,0.4)');
      circle.setAttribute('stroke-width', '2');
      circle.addEventListener('mouseup', e => {
        if (!dragging) return;
        e.stopPropagation();
        Supply.connect(tower.id);
        _stopDrag(); _rebuildSvg(); _refreshStats();
      });
      svgEl.appendChild(circle);

      const tlbl = document.createElementNS(NS, 'text');
      tlbl.setAttribute('x', tp.x); tlbl.setAttribute('y', tp.y + 4);
      tlbl.setAttribute('text-anchor', 'middle');
      tlbl.setAttribute('fill', 'rgba(210,180,140,0.9)');
      tlbl.setAttribute('font-size', '11');
      tlbl.setAttribute('font-family', 'monospace');
      tlbl.setAttribute('pointer-events', 'none');
      tlbl.textContent = tower.label[0];
      svgEl.appendChild(tlbl);
    }

    const thCircle = document.createElementNS(NS, 'circle');
    thCircle.setAttribute('cx', TH_X); thCircle.setAttribute('cy', TH_Y);
    thCircle.setAttribute('r', TH_R);
    thCircle.setAttribute('fill', 'rgba(85,58,22,0.95)');
    thCircle.setAttribute('stroke', 'rgba(220,185,80,0.95)');
    thCircle.setAttribute('stroke-width', '3');
    thCircle.style.cursor = 'crosshair';
    thCircle.addEventListener('mousedown', _onThMouseDown);
    svgEl.appendChild(thCircle);

    const thText = document.createElementNS(NS, 'text');
    thText.setAttribute('x', TH_X); thText.setAttribute('y', TH_Y + 5);
    thText.setAttribute('text-anchor', 'middle');
    thText.setAttribute('fill', 'rgba(220,185,80,0.95)');
    thText.setAttribute('font-size', '13');
    thText.setAttribute('font-family', 'Cinzel, serif');
    thText.setAttribute('font-weight', '700');
    thText.setAttribute('pointer-events', 'none');
    thText.textContent = 'TH';
    svgEl.appendChild(thText);

    if (towers.length === 0) {
      const noTowers = document.createElementNS(NS, 'text');
      noTowers.setAttribute('x', SVG_W / 2 - 120); noTowers.setAttribute('y', SVG_H / 2);
      noTowers.setAttribute('fill', 'rgba(180,140,80,0.35)');
      noTowers.setAttribute('font-size', '16');
      noTowers.setAttribute('font-family', 'monospace');
      noTowers.setAttribute('pointer-events', 'none');
      noTowers.textContent = 'No towers placed yet';
      svgEl.appendChild(noTowers);
    }
  }

  function _onThMouseDown(e) {
    e.preventDefault();
    dragging = true;
    svgRect  = svgEl.getBoundingClientRect();
    const { mx, my } = _svgPos(e);
    previewLine = document.createElementNS(NS, 'line');
    previewLine.setAttribute('x1', TH_X); previewLine.setAttribute('y1', TH_Y);
    previewLine.setAttribute('x2', mx);   previewLine.setAttribute('y2', my);
    previewLine.setAttribute('stroke', 'rgba(200,180,100,0.55)');
    previewLine.setAttribute('stroke-width', '2');
    previewLine.setAttribute('stroke-dasharray', '8 4');
    previewLine.setAttribute('pointer-events', 'none');
    svgEl.appendChild(previewLine);
  }

  function _onSvgMouseMove(e) {
    if (!dragging || !previewLine) return;
    const { mx, my } = _svgPos(e);
    previewLine.setAttribute('x2', mx);
    previewLine.setAttribute('y2', my);
  }

  function _onSvgMouseUp() { if (dragging) _stopDrag(); }

  function _stopDrag() {
    dragging = false;
    if (previewLine) { previewLine.remove(); previewLine = null; }
  }

  function _svgPos(e) {
    if (!svgRect) svgRect = svgEl.getBoundingClientRect();
    return {
      mx: (e.clientX - svgRect.left) * (SVG_W / svgRect.width),
      my: (e.clientY - svgRect.top)  * (SVG_H / svgRect.height),
    };
  }

  function _priorityColor(p) {
    return { low: '#8888bb', medium: '#ccaa33', high: '#44cc66' }[p] ?? '#888';
  }

  function _supplyColor(h) {
    if (h >= 0.75) return '#44cc66';
    if (h >= 0.30) return '#ccaa33';
    if (h  >  0)   return '#cc4444';
    return '#555555';
  }

  function _refreshStats() {
    if (!statsEl) return;
    const prod = Supply.getTotalProduction();
    const draw = Supply.getTotalDraw();
    statsEl.textContent = prod > 0
      ? `Production: ${prod}/s  \u00b7  Draw: ${draw} tower${draw === 1 ? '' : 's'}  \u00b7  ${draw > prod ? '\u26a0 Over capacity' : 'OK'}`
      : 'Supply network \u2014 active from Era 3';
  }

  function open() {
    visible = true;
    overlayEl.style.display = '';
    svgRect = null;
    _rebuildSvg();
    _refreshStats();
  }

  function close() {
    visible = false;
    _stopDrag();
    overlayEl.style.display = 'none';
  }

  function toggle() { if (visible) close(); else open(); }

  function refresh() { if (visible) { _rebuildSvg(); _refreshStats(); } }

  return { init, open, close, toggle, refresh };
})();
