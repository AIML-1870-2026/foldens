/* ============================================================
   ui.js — HUD rendering, phase controls, build mode
   ============================================================ */

const UI = (() => {
  let eraWaveEl    = null;
  let startWaveBtn = null;

  let townHealthFill = null;
  let townHealthText = null;

  let townButtons = null;

  let buildModeBtn  = null;
  let towerSelector = null;

  let resourcesEl = null;
  let populationEl = null;

  let selectedTower    = null;
  let towerPanelEl     = null;
  let selectedBarricade = null;
  let barricadePanelEl  = null;

  // Town panel (upgrade / repair)
  let townPanelEl = null;

  // Low-supply warning
  let lowSupplyWarnEl = null;

  // Ability button
  let abilityBtnEl  = null;
  let abilityFillEl = null;
  let abilityTargeting = false;

  let buildMode    = false;
  let selectedType = 'club';
  let hoverCell    = null;
  let canvasEl     = null;

  // ----- Init -----
  function init() {
    const hud = document.getElementById('hud');
    canvasEl  = document.getElementById('game-canvas');

    // Town health bar
    const healthWidget = document.createElement('div');
    healthWidget.id = 'hud-town-health';
    const healthLabel = document.createElement('div');
    healthLabel.id = 'hud-town-health-label';
    healthLabel.textContent = 'Town';
    const track = document.createElement('div');
    track.id = 'hud-town-health-track';
    townHealthFill = document.createElement('div');
    townHealthFill.id = 'hud-town-health-fill';
    townHealthText = document.createElement('div');
    townHealthText.id = 'hud-town-health-text';
    track.appendChild(townHealthFill);
    track.appendChild(townHealthText);
    healthWidget.appendChild(healthLabel);
    healthWidget.appendChild(track);
    hud.appendChild(healthWidget);

    // Era/wave label
    eraWaveEl = document.createElement('div');
    eraWaveEl.id = 'hud-era-wave';
    hud.appendChild(eraWaveEl);

    // Resource display
    resourcesEl = document.createElement('div');
    resourcesEl.id = 'hud-resources';
    hud.appendChild(resourcesEl);

    // Population counter
    populationEl = document.createElement('div');
    populationEl.id = 'hud-population';
    hud.appendChild(populationEl);

    // Low-supply warning (Step 15)
    lowSupplyWarnEl = document.createElement('div');
    lowSupplyWarnEl.id = 'hud-low-supply-warn';
    lowSupplyWarnEl.style.display = 'none';
    hud.appendChild(lowSupplyWarnEl);

    // Town buttons (upgrade / repair)
    townButtons = document.createElement('div');
    townButtons.id = 'hud-town-buttons';

    const upgradeBtn = document.createElement('button');
    upgradeBtn.className = 'hud-town-btn';
    upgradeBtn.textContent = 'Upgrade Town';
    upgradeBtn.addEventListener('click', () => _openTownPanel('upgrade'));

    const repairBtn = document.createElement('button');
    repairBtn.className = 'hud-town-btn';
    repairBtn.textContent = 'Repair Town';
    repairBtn.addEventListener('click', () => _openTownPanel('repair'));

    townButtons.appendChild(upgradeBtn);
    townButtons.appendChild(repairBtn);
    hud.appendChild(townButtons);

    // Build mode toggle
    buildModeBtn = document.createElement('button');
    buildModeBtn.id = 'hud-build-mode-btn';
    buildModeBtn.textContent = 'Build Mode';
    buildModeBtn.addEventListener('click', onToggleBuildMode);
    hud.appendChild(buildModeBtn);

    // Tower/barricade type selector
    towerSelector = document.createElement('div');
    towerSelector.id = 'hud-tower-selector';
    _rebuildTowerSelector();
    hud.appendChild(towerSelector);

    // Ability button (Step 16)
    abilityBtnEl = document.createElement('div');
    abilityBtnEl.id = 'hud-ability-btn';
    abilityBtnEl.addEventListener('click', _onAbilityClick);
    const abilityLabel = document.createElement('div');
    abilityLabel.className = 'ability-btn-label';
    abilityBtnEl.appendChild(abilityLabel);
    const abilityTrack = document.createElement('div');
    abilityTrack.className = 'ability-btn-track';
    abilityFillEl = document.createElement('div');
    abilityFillEl.className = 'ability-btn-fill';
    abilityTrack.appendChild(abilityFillEl);
    abilityBtnEl.appendChild(abilityTrack);
    hud.appendChild(abilityBtnEl);

    // Start Wave button
    startWaveBtn = document.createElement('button');
    startWaveBtn.id = 'hud-start-wave';
    startWaveBtn.textContent = 'Start Wave';
    startWaveBtn.disabled = true;
    startWaveBtn.addEventListener('click', onStartWave);
    hud.appendChild(startWaveBtn);

    // Canvas listeners
    canvasEl.addEventListener('mousemove', onCanvasMouseMove);
    canvasEl.addEventListener('mouseleave', () => { hoverCell = null; });
    canvasEl.addEventListener('click', onCanvasClick);

    update(state);
  }

  // ----- Tower selector builder (era-aware) -----
  function _rebuildTowerSelector() {
    towerSelector.innerHTML = '';
    const era = state.currentEra;
    const allTypes = [];

    // Add all towers up to current era
    for (const [type, def] of Object.entries(Towers.DEFS)) {
      if (def.era <= era) {
        const costStr = Object.entries(def.cost).map(([k, v]) => `${v}${k[0].toUpperCase()}`).join(' ');
        allTypes.push({ type, label: `${def.label} (${costStr})` });
      }
    }

    // Barricade label
    const barDef = Barricades.DEFS[era] ?? Barricades.DEFS[1];
    const barCostStr = Object.entries(barDef.cost).map(([k, v]) => `${v}${k[0].toUpperCase()}`).join(' ');
    allTypes.push({ type: 'barricade', label: `${barDef.label} (${barCostStr})` });

    for (const { type, label } of allTypes) {
      const btn = document.createElement('button');
      btn.className = 'hud-tower-type-btn';
      btn.dataset.towerType = type;
      btn.textContent = label;
      btn.addEventListener('click', () => { selectedType = type; _refreshTowerSelector(); });
      towerSelector.appendChild(btn);
    }

    // Reset to first available type for this era
    if (!allTypes.find(t => t.type === selectedType)) {
      selectedType = allTypes[0]?.type ?? 'club';
    }
    _refreshTowerSelector();
  }

  // ----- Button handlers -----

  function onStartWave() {
    if (state.phase !== 'prep') return;
    buildMode = false;
    _closeTownPanel();
    state.phase = 'wave';
    Waves.startWave(state.currentEra, state.currentWave);
    update(state);
  }

  function onToggleBuildMode() {
    buildMode = !buildMode;
    if (!buildMode) hoverCell = null;
    if (buildMode) { _closeTowerPanel(); _closeBarricadePanel(); _closeTownPanel(); }
    _refreshBuildModeBtn();
    _refreshTowerSelector();
  }

  // ----- Ability click handler (Step 16) -----
  function _onAbilityClick() {
    if (!Abilities.isReady() || state.phase !== 'wave') return;
    if (Abilities.isTargeted()) {
      abilityTargeting = true;
      canvasEl.style.cursor = 'crosshair';
    } else {
      Abilities.activate();
    }
  }

  // ----- Canvas event handlers -----

  function _canvasCoords(e) {
    const rect   = canvasEl.getBoundingClientRect();
    const scaleX = canvasEl.width  / rect.width;
    const scaleY = canvasEl.height / rect.height;
    return {
      cx: (e.clientX - rect.left) * scaleX,
      cy: (e.clientY - rect.top)  * scaleY,
    };
  }

  function onCanvasMouseMove(e) {
    if (!buildMode || state.phase !== 'prep') { hoverCell = null; return; }
    const { cx, cy } = _canvasCoords(e);
    const gx = Math.floor(cx / Map.CELL);
    const gy = Math.floor(cy / Map.CELL);
    if (gx < 0 || gx >= Map.COLS || gy < 0 || gy >= Map.ROWS) {
      hoverCell = null;
    } else {
      hoverCell = { gx, gy };
    }
  }

  function onCanvasClick(e) {
    const { cx, cy } = _canvasCoords(e);

    // Ability targeting interception (Step 16)
    if (abilityTargeting) {
      abilityTargeting = false;
      canvasEl.style.cursor = '';
      Abilities.activate(cx, cy);
      return;
    }

    const gx = Math.floor(cx / Map.CELL);
    const gy = Math.floor(cy / Map.CELL);

    // Build mode
    if (buildMode && state.phase === 'prep') {
      let result;
      if (selectedType === 'barricade') {
        result = Barricades.place(gx, gy);
      } else {
        result = Towers.place(selectedType, gx, gy);
      }
      if (result === 'insufficient') _flashResourceError();
      return;
    }

    // Select tower
    const tower = Towers.getAt(gx, gy);
    if (tower) {
      _closeBarricadePanel();
      _closeTownPanel();
      _openTowerPanel(tower);
      return;
    }

    // Select barricade
    const barricade = Barricades.getAt(gx, gy);
    if (barricade) {
      _closeTowerPanel();
      _closeTownPanel();
      _openBarricadePanel(barricade);
      return;
    }

    _closeTowerPanel();
    _closeBarricadePanel();
    _closeTownPanel();
  }

  // ----- renderHUD — called every frame -----
  function renderHUD() {
    _updateHealthBar();
    _updateResourceDisplay();
    _updatePopulationDisplay();
    _updateLowSupplyWarning();
    _updateAbilityButton();
  }

  function renderStartWaveButton() {
    if (!startWaveBtn) return;
    startWaveBtn.style.display = (state.phase === 'prep') ? '' : 'none';
  }

  // ----- update — sync all HUD elements to state -----
  function update(s) {
    if (eraWaveEl) eraWaveEl.textContent = `Era ${s.currentEra} \u2014 Wave ${s.currentWave}`;
    const isPrep = s.phase === 'prep';
    if (townButtons) townButtons.style.display = isPrep ? '' : 'none';
    if (buildModeBtn) buildModeBtn.style.display = isPrep ? '' : 'none';
    if (!isPrep) { buildMode = false; hoverCell = null; }
    _refreshBuildModeBtn();
    _rebuildTowerSelector();
    _refreshTowerSelector();
    renderStartWaveButton();
    _updateHealthBar();
    _updateResourceDisplay();
    // Enable Supply button from Era 3
    const supplyBtn = document.getElementById('hud-supply-btn');
    if (supplyBtn) supplyBtn.disabled = (s.currentEra < 3);
  }

  function enableStartButton() {
    if (startWaveBtn) startWaveBtn.disabled = false;
  }

  function getBuildState() { return { buildMode, hoverCell, selectedType }; }

  // ----- Internal -----

  function _refreshBuildModeBtn() {
    if (!buildModeBtn) return;
    buildModeBtn.classList.toggle('active', buildMode);
  }

  function _refreshTowerSelector() {
    if (!towerSelector) return;
    towerSelector.style.display = buildMode ? '' : 'none';
    for (const btn of towerSelector.querySelectorAll('.hud-tower-type-btn')) {
      btn.classList.toggle('active', btn.dataset.towerType === selectedType);
    }
  }

  function _updateHealthBar() {
    if (!townHealthFill || !townHealthText) return;
    const hp    = Town.getHealth();
    const maxHp = Town.getMaxHealth();
    const pct   = maxHp > 0 ? hp / maxHp : 0;
    townHealthFill.style.width = `${(pct * 100).toFixed(1)}%`;
    townHealthText.textContent = `${hp} / ${maxHp}`;
    if (pct > 0.6)      townHealthFill.style.backgroundColor = '#3fa025';
    else if (pct > 0.3) townHealthFill.style.backgroundColor = '#c0900a';
    else                townHealthFill.style.backgroundColor = '#c02020';
  }

  function _updateResourceDisplay() {
    if (!resourcesEl) return;
    const g = Resources.getGold();
    const s = Resources.getStockpile();
    const LABELS = {
      bone:'Bone', wood:'Wood', stone:'Stone', iron:'Iron',
      timber:'Timber', gunpowder:'Powder', steel:'Steel',
      oil:'Oil', alloy:'Alloy', plasma:'Plasma',
    };
    let text = `Gold: ${g}`;
    for (const [key, label] of Object.entries(LABELS)) {
      text += `\n${label}: ${s[key]}`;
    }
    resourcesEl.textContent = text;
  }

  function _updatePopulationDisplay() {
    if (!populationEl) return;
    const unassigned = People.getUnassigned();
    const total      = People.getTotalPeople();
    populationEl.textContent = `People: ${unassigned} / ${total}`;
  }

  // Step 15 — show supply warning when any Era 3+ tower has low supply
  function _updateLowSupplyWarning() {
    if (!lowSupplyWarnEl || state.currentEra < 3) {
      if (lowSupplyWarnEl) lowSupplyWarnEl.style.display = 'none';
      return;
    }
    let warn = false;
    for (const t of Towers.getAll()) {
      if (Towers.DEFS[t.type].era < 3) continue;
      const conn = Supply.getConnection(t.id);
      if (!conn || conn.supplyHealth < 0.30) { warn = true; break; }
    }
    lowSupplyWarnEl.style.display = warn ? '' : 'none';
    if (warn) lowSupplyWarnEl.textContent = '\u26a0 Low Supply! Some towers are weakened.';
  }

  // Step 16 — update ability charge button
  function _updateAbilityButton() {
    if (!abilityBtnEl) return;
    const pct = Abilities.getProgress();
    abilityFillEl.style.width = `${(pct * 100).toFixed(1)}%`;
    abilityBtnEl.querySelector('.ability-btn-label').textContent = Abilities.getName();
    abilityBtnEl.classList.toggle('ready', Abilities.isReady());
    abilityBtnEl.classList.toggle('targeting', abilityTargeting);
  }

  // ----- Tower selection panel -----

  function _openTowerPanel(tower) { selectedTower = tower; _buildTowerPanel(tower); }

  function _closeTowerPanel() {
    if (towerPanelEl) { towerPanelEl.remove(); towerPanelEl = null; }
    selectedTower = null;
  }

  function _buildTowerPanel(tower) {
    _closeTowerPanel();
    towerPanelEl = document.createElement('div');
    towerPanelEl.id = 'overlay-tower-panel';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'overlay-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', _closeTowerPanel);
    towerPanelEl.appendChild(closeBtn);

    const def = Towers.DEFS[tower.type];
    const title = document.createElement('div');
    title.className = 'overlay-title';
    title.textContent = `${tower.label}  \u2014  Era ${def.era}`;
    towerPanelEl.appendChild(title);

    // Supply display (Step 15) — only for Era 3+ towers
    if (def.era >= 3) {
      const supplyRow = document.createElement('div');
      supplyRow.className = 'tower-panel-supply';
      const conn = Supply.getConnection(tower.id);
      const h    = conn ? conn.supplyHealth : 0;
      const supplyRing = document.createElement('div');
      supplyRing.className = 'supply-ring';
      supplyRing.style.backgroundColor = h >= 0.75 ? '#44cc66' : h >= 0.30 ? '#ccaa33' : h > 0 ? '#cc4444' : '#555';
      const supplyLabel = document.createElement('span');
      supplyLabel.textContent = conn ? `Supply: ${Math.round(h * 100)}%` : 'No supply line';
      supplyRow.append(supplyRing, supplyLabel);
      towerPanelEl.appendChild(supplyRow);
    }

    // Staffing
    const staffRow = document.createElement('div');
    staffRow.className = 'tower-panel-staff-row';
    const minusBtn = document.createElement('button');
    minusBtn.className = 'tower-panel-staff-btn';
    minusBtn.textContent = '\u2212';
    const staffLabel = document.createElement('span');
    staffLabel.className = 'tower-panel-staff-label';
    const plusBtn = document.createElement('button');
    plusBtn.className = 'tower-panel-staff-btn';
    plusBtn.textContent = '+';

    function refreshStaff() {
      const assigned = People.getAssigned(tower.id);
      const required = tower.peopleRequired;
      staffLabel.textContent = `${assigned} / ${required} people`;
      minusBtn.disabled = assigned <= 0;
      plusBtn.disabled  = People.getUnassigned() <= 0;
    }
    refreshStaff();

    minusBtn.addEventListener('click', () => { People.removeFromTower(tower.id); refreshStaff(); });
    plusBtn.addEventListener('click',  () => { People.assignToTower(tower.id);  refreshStaff(); });

    staffRow.append(minusBtn, staffLabel, plusBtn);
    towerPanelEl.appendChild(staffRow);

    const dmgEl = document.createElement('div');
    dmgEl.className = 'tower-panel-damage';
    const ratio = tower.staffingRatio;
    const effectiveDmg = (tower.damage * ratio).toFixed(0);
    dmgEl.textContent = ratio < 1
      ? `Damage: ${effectiveDmg} (${Math.round(ratio * 100)}% staffed)`
      : `Damage: ${effectiveDmg}`;
    towerPanelEl.appendChild(dmgEl);

    const demolishBtn = document.createElement('button');
    demolishBtn.className = 'tower-panel-demolish-btn';
    demolishBtn.textContent = 'Demolish';
    demolishBtn.addEventListener('click', () => { Towers.demolish(tower); _closeTowerPanel(); });
    towerPanelEl.appendChild(demolishBtn);

    document.getElementById('hud').appendChild(towerPanelEl);
  }

  // ----- Barricade selection panel -----

  function _openBarricadePanel(barricade) { selectedBarricade = barricade; _buildBarricadePanel(barricade); }

  function _closeBarricadePanel() {
    if (barricadePanelEl) { barricadePanelEl.remove(); barricadePanelEl = null; }
    selectedBarricade = null;
  }

  function _buildBarricadePanel(barricade) {
    _closeBarricadePanel();
    barricadePanelEl = document.createElement('div');
    barricadePanelEl.id = 'overlay-barricade-panel';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'overlay-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', _closeBarricadePanel);
    barricadePanelEl.appendChild(closeBtn);

    const title = document.createElement('div');
    title.className = 'overlay-title';
    title.textContent = 'Barricade';
    barricadePanelEl.appendChild(title);

    const hpEl = document.createElement('div');
    hpEl.className = 'barricade-panel-hp';
    hpEl.textContent = `HP: ${Math.ceil(barricade.hp)} / ${barricade.maxHp}`;
    barricadePanelEl.appendChild(hpEl);

    const hpTrack = document.createElement('div');
    hpTrack.className = 'barricade-panel-hp-track';
    const hpFill = document.createElement('div');
    hpFill.className = 'barricade-panel-hp-fill';
    hpFill.style.width = `${(barricade.hp / barricade.maxHp) * 100}%`;
    hpTrack.appendChild(hpFill);
    barricadePanelEl.appendChild(hpTrack);

    const slowEl = document.createElement('div');
    slowEl.className = 'barricade-panel-info';
    slowEl.textContent = `Slows enemies to ${Math.round(Barricades.DEFS[state.currentEra]?.slowFactor * 100 ?? 35)}% speed`;
    barricadePanelEl.appendChild(slowEl);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'tower-panel-demolish-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => { Barricades.remove(barricade); _closeBarricadePanel(); });
    barricadePanelEl.appendChild(removeBtn);

    document.getElementById('hud').appendChild(barricadePanelEl);
  }

  // ----- Town panel (Step 17) -----

  function _openTownPanel(focus) {
    _closeTowerPanel();
    _closeBarricadePanel();
    _buildTownPanel(focus);
  }

  function _closeTownPanel() {
    if (townPanelEl) { townPanelEl.remove(); townPanelEl = null; }
  }

  function _buildTownPanel(focus) {
    _closeTownPanel();
    townPanelEl = document.createElement('div');
    townPanelEl.id = 'overlay-town-panel';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'overlay-close';
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', _closeTownPanel);
    townPanelEl.appendChild(closeBtn);

    const title = document.createElement('div');
    title.className = 'overlay-title';
    title.textContent = 'Town Hall';
    townPanelEl.appendChild(title);

    // Current HP
    const hpEl = document.createElement('div');
    hpEl.className = 'town-panel-hp';
    hpEl.textContent = `HP: ${Town.getHealth()} / ${Town.getMaxHealth()}`;
    townPanelEl.appendChild(hpEl);

    const era = state.currentEra;

    // Upgrade section
    const upgSection = document.createElement('div');
    upgSection.className = 'town-panel-section';
    const upgHead = document.createElement('div');
    upgHead.className = 'town-panel-section-head';
    const upCfg     = Town.getUpgradeConfig(era);
    const upgCount   = Town.getUpgradeCount();
    const upgMaxed   = upgCount >= (upCfg?.maxUpgrades ?? 3);
    upgHead.textContent = `Upgrade (+${upCfg?.hp ?? 0} HP)  ${upgCount}/${upCfg?.maxUpgrades ?? 3}`;
    const upgCost = document.createElement('div');
    upgCost.className = 'town-panel-cost';
    upgCost.textContent = upCfg ? _formatCost(upCfg.cost) : '';
    const upgBtn = document.createElement('button');
    upgBtn.className = 'overlay-buy-btn';
    upgBtn.textContent = upgMaxed ? 'Maxed' : 'Upgrade';
    upgBtn.disabled = upgMaxed;
    upgBtn.addEventListener('click', () => {
      const res = Town.upgrade(era);
      if (res === 'insufficient') _flashResourceError();
      else _buildTownPanel(focus);
    });
    upgSection.append(upgHead, upgCost, upgBtn);
    townPanelEl.appendChild(upgSection);

    // Repair section
    const repSection = document.createElement('div');
    repSection.className = 'town-panel-section';
    const repHead = document.createElement('div');
    repHead.className = 'town-panel-section-head';
    const repCfg = Town.getRepairConfig(era);
    repHead.textContent = `Repair (+${repCfg?.hp ?? 0} HP)`;
    const repCost = document.createElement('div');
    repCost.className = 'town-panel-cost';
    repCost.textContent = repCfg ? _formatCost(repCfg.cost) : '';
    const repBtn = document.createElement('button');
    repBtn.className = 'overlay-buy-btn';
    repBtn.textContent = 'Repair';
    repBtn.addEventListener('click', () => {
      const res = Town.repair(era);
      if (res === 'insufficient') _flashResourceError();
      else _buildTownPanel(focus);
    });
    repSection.append(repHead, repCost, repBtn);
    townPanelEl.appendChild(repSection);

    document.getElementById('hud').appendChild(townPanelEl);
  }

  function _formatCost(cost) {
    return Object.entries(cost).map(([k, v]) => `${v} ${k}`).join(', ');
  }

  function _flashResourceError() {
    if (!resourcesEl) return;
    resourcesEl.classList.remove('flash');
    void resourcesEl.offsetWidth;
    resourcesEl.classList.add('flash');
    resourcesEl.addEventListener('animationend', () => resourcesEl.classList.remove('flash'), { once: true });
  }

  return { init, renderHUD, renderStartWaveButton, update, enableStartButton, getBuildState };
})();
