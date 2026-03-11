/* ============================================================
   ui.js — HUD rendering, phase controls, build mode (reworked)
   ============================================================ */

const UI = (() => {
  let eraWaveEl    = null;
  let startWaveBtn = null;

  let townHealthFill = null;
  let townHealthText = null;

  let townButtons = null;

  let buildModeBtn  = null;
  let towerSelector = null;

  // Resources panel element
  let resourcesPanelEl = null;
  let populationEl = null;

  let selectedTower    = null;
  let towerPanelEl     = null;
  let selectedBarricade = null;
  let barricadePanelEl  = null;

  let townPanelEl = null;
  let lowSupplyWarnEl = null;

  let abilityBtnEl  = null;
  let abilityFillEl = null;
  let abilityTargeting = false;

  let sidebarOpen      = true;
  let buildingPopupEl  = null;
  let buildingPopupId  = null;

  let buildMode    = true;  // always on (build mode button silenced)
  let selectedType = 'club';
  let hoverCell    = null;
  let canvasEl     = null;

  let activeTab = 'build';

  // Era-relevant resource rows: [key, label, emoji]
  const ERA_RESOURCES = {
    1: [['bone','Bone','🦴'], ['wood','Wood','🪵']],
    2: [['stone','Stone','🪨'], ['iron','Iron','⚙️']],
    3: [['timber','Timber','🌲'], ['gunpowder','Powder','💣']],
    4: [['steel','Steel','🔩'], ['oil','Oil','🛢️']],
    5: [['alloy','Alloy','🔧'], ['plasma','Plasma','⚡']],
  };

  const ERA_NAMES = {
    1:'Prehistoric', 2:'Medieval', 3:'Pirate Age', 4:'Modern', 5:'Future Wars'
  };

  // ----- Init -----
  function init() {
    const hud = document.getElementById('hud');
    canvasEl  = document.getElementById('game-canvas');

    // ── Town health bar (top center) ──
    const healthWidget = document.createElement('div');
    healthWidget.id = 'hud-town-health';
    const healthLabel = document.createElement('div');
    healthLabel.id = 'hud-town-health-label';
    healthLabel.textContent = 'Town Fortress';
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

    // ── Era/wave label (top left) ──
    eraWaveEl = document.createElement('div');
    eraWaveEl.id = 'hud-era-wave';
    hud.appendChild(eraWaveEl);

    // ── Population (top left, below era) ──
    populationEl = document.createElement('div');
    populationEl.id = 'hud-population';
    hud.appendChild(populationEl);

    // ── Low-supply warning ──
    lowSupplyWarnEl = document.createElement('div');
    lowSupplyWarnEl.id = 'hud-low-supply-warn';
    lowSupplyWarnEl.style.display = 'none';
    hud.appendChild(lowSupplyWarnEl);

    // ── Town buttons (hidden — kept for overlay.js compatibility) ──
    townButtons = document.createElement('div');
    townButtons.id = 'hud-town-buttons';
    townButtons.style.display = 'none';
    hud.appendChild(townButtons);

    // ── RIGHT SIDEBAR (4-tab navigation) ──
    const sidebar = document.createElement('div');
    sidebar.id = 'hud-build-sidebar';

    // Tab bar
    const tabBar = document.createElement('div');
    tabBar.id = 'sidebar-tabs';

    const TABS = [
      { key: 'build',     icon: '🗼', label: 'Towers' },
      { key: 'town',      icon: '🏰', label: 'Town' },
      { key: 'buildings', icon: '🏗', label: 'Buildings' },
      { key: 'housing',   icon: '🏠', label: 'Housing' },
    ];
    for (const { key, icon, label } of TABS) {
      const tab = document.createElement('button');
      tab.className = 'sidebar-tab' + (key === 'build' ? ' active' : '');
      tab.dataset.tabKey = key;
      tab.innerHTML = `<span class="tab-icon">${icon}</span>${label}`;
      tab.addEventListener('click', () => _switchTab(key));
      tabBar.appendChild(tab);
    }
    sidebar.appendChild(tabBar);

    // Content area
    const contentArea = document.createElement('div');
    contentArea.id = 'sidebar-content';

    // ── Build tab ──
    const buildContent = document.createElement('div');
    buildContent.id = 'sidebar-build-content';

    // Build mode button silenced — always active
    buildModeBtn = document.createElement('button');
    buildModeBtn.id = 'hud-build-mode-btn';
    buildModeBtn.style.display = 'none';

    towerSelector = document.createElement('div');
    towerSelector.id = 'hud-tower-selector';
    _rebuildTowerSelector();
    buildContent.appendChild(towerSelector);

    contentArea.appendChild(buildContent);

    // ── Town tab ──
    const townContent = document.createElement('div');
    townContent.id = 'sidebar-town-content';
    townContent.style.display = 'none';
    contentArea.appendChild(townContent);

    // ── Buildings tab ──
    const buildingsContent = document.createElement('div');
    buildingsContent.id = 'sidebar-buildings-content';
    buildingsContent.style.display = 'none';
    contentArea.appendChild(buildingsContent);

    // ── Housing tab ──
    const housingContent = document.createElement('div');
    housingContent.id = 'sidebar-housing-content';
    housingContent.style.display = 'none';
    contentArea.appendChild(housingContent);

    sidebar.appendChild(contentArea);
    hud.appendChild(sidebar);

    // ── RESOURCES PANEL (left of sidebar) ──
    resourcesPanelEl = document.createElement('div');
    resourcesPanelEl.id = 'hud-resources-panel';
    hud.appendChild(resourcesPanelEl);

    // ── TOWER HOVER TOOLTIP ──
    const tooltip = document.createElement('div');
    tooltip.id = 'tower-tooltip';
    hud.appendChild(tooltip);

    // ── WAVE BANNER ──
    const waveBanner = document.createElement('div');
    waveBanner.id = 'wave-banner';
    hud.appendChild(waveBanner);

    // ── ABILITY BUTTON ──
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

    // ── START WAVE BUTTON ──
    startWaveBtn = document.createElement('button');
    startWaveBtn.id = 'hud-start-wave';
    startWaveBtn.textContent = '⚔  Start Wave';
    startWaveBtn.disabled = true;
    startWaveBtn.addEventListener('click', onStartWave);
    hud.appendChild(startWaveBtn);

    // ── Canvas listeners ──
    canvasEl.addEventListener('mousemove', onCanvasMouseMove);
    canvasEl.addEventListener('mouseleave', () => { hoverCell = null; });
    canvasEl.addEventListener('click', onCanvasClick);

    // ── Wave events for banner ──
    Events.on('wave:complete', () => {
      _showWaveBanner('WAVE CLEAR', 'Prepare for the next assault', 2200);
    });

    update(state);
  }

  // ----- Tab switching -----
  function _switchTab(tabName) {
    activeTab = tabName;

    // Update tab button active states
    const tabBar = document.getElementById('sidebar-tabs');
    if (tabBar) {
      for (const btn of tabBar.querySelectorAll('.sidebar-tab')) {
        btn.classList.toggle('active', btn.dataset.tabKey === tabName);
      }
    }

    // Show/hide content divs
    const tabContentIds = {
      build:     'sidebar-build-content',
      town:      'sidebar-town-content',
      buildings: 'sidebar-buildings-content',
      housing:   'sidebar-housing-content',
    };
    for (const [key, id] of Object.entries(tabContentIds)) {
      const el = document.getElementById(id);
      if (el) el.style.display = (key === tabName) ? '' : 'none';
    }

    // Refresh town content when switching to that tab
    if (tabName === 'town') {
      _renderTownContent(document.getElementById('sidebar-town-content'));
    }

    // Build mode always stays on
    _hideTowerTooltip();

    // Close left-side panels when switching tabs
    _closeTowerPanel();
    _closeBarricadePanel();
  }

  // ----- Town tab content -----
  function _renderTownContent(el) {
    if (!el) return;
    el.innerHTML = '';

    const era   = state.currentEra;
    const hp    = Town.getHealth();
    const maxHp = Town.getMaxHealth();
    const pct   = maxHp > 0 ? hp / maxHp : 0;
    const fillColor = pct > 0.6 ? '#3fa025' : pct > 0.3 ? '#c0900a' : '#c02020';

    // HP bar
    const hpLabel = document.createElement('div');
    hpLabel.className = 'town-tab-hp-label';
    hpLabel.textContent = 'Town Fortress';
    el.appendChild(hpLabel);

    const hpTrack = document.createElement('div');
    hpTrack.className = 'town-tab-hp-track';
    const hpFill = document.createElement('div');
    hpFill.className = 'town-tab-hp-fill';
    hpFill.style.width = `${(pct * 100).toFixed(1)}%`;
    hpFill.style.background = fillColor;
    hpTrack.appendChild(hpFill);
    el.appendChild(hpTrack);

    const hpText = document.createElement('div');
    hpText.className = 'town-tab-hp-text';
    hpText.textContent = `${hp} / ${maxHp}`;
    el.appendChild(hpText);

    // Upgrade section
    const upCfg    = Town.getUpgradeConfig(era);
    const upgCount = Town.getUpgradeCount();
    const upgMaxed = upgCount >= (upCfg?.maxUpgrades ?? 3);

    const upgSection = document.createElement('div');
    upgSection.className = 'town-tab-section';

    const upgHead = document.createElement('div');
    upgHead.className = 'town-tab-section-head';
    upgHead.textContent = 'Upgrade Fortress';
    upgSection.appendChild(upgHead);

    const upgSub = document.createElement('div');
    upgSub.className = 'town-tab-section-sub';
    upgSub.textContent = `+${upCfg?.hp ?? 0} Max HP  ·  ${upgCount} / ${upCfg?.maxUpgrades ?? 3} done`;
    upgSection.appendChild(upgSub);

    const upgCost = document.createElement('div');
    upgCost.className = 'town-tab-cost';
    upgCost.textContent = upCfg ? _formatCost(upCfg.cost) : '';
    upgSection.appendChild(upgCost);

    const upgBtn = document.createElement('button');
    upgBtn.className = 'town-tab-buy-btn';
    upgBtn.textContent = upgMaxed ? 'Maxed' : 'Upgrade';
    upgBtn.disabled = upgMaxed;
    upgBtn.addEventListener('click', () => {
      const res = Town.upgrade(era);
      if (res === 'insufficient') _flashResourceError();
      else _renderTownContent(el);
    });
    upgSection.appendChild(upgBtn);
    el.appendChild(upgSection);

    // Repair section
    const repCfg  = Town.getRepairConfig(era);
    const atFullHp = hp >= maxHp;

    const repSection = document.createElement('div');
    repSection.className = 'town-tab-section';

    const repHead = document.createElement('div');
    repHead.className = 'town-tab-section-head';
    repHead.textContent = 'Repair';
    repSection.appendChild(repHead);

    const repSub = document.createElement('div');
    repSub.className = 'town-tab-section-sub';
    repSub.textContent = `+${repCfg?.hp ?? 0} HP restored`;
    repSection.appendChild(repSub);

    const repCost = document.createElement('div');
    repCost.className = 'town-tab-cost';
    repCost.textContent = repCfg ? _formatCost(repCfg.cost) : '';
    repSection.appendChild(repCost);

    const repBtn = document.createElement('button');
    repBtn.className = 'town-tab-buy-btn';
    repBtn.textContent = atFullHp ? 'Full HP' : 'Repair';
    repBtn.disabled = atFullHp;
    repBtn.addEventListener('click', () => {
      const res = Town.repair(era);
      if (res === 'insufficient') _flashResourceError();
      else _renderTownContent(el);
    });
    repSection.appendChild(repBtn);
    el.appendChild(repSection);
  }

  // ----- Adopt overlay panels into sidebar slots -----
  function adoptPanels() {
    const bldSlot  = document.getElementById('sidebar-buildings-content');
    const houSlot  = document.getElementById('sidebar-housing-content');
    const bldPanel = document.getElementById('overlay-buildings');
    const houPanel = document.getElementById('overlay-housing');
    if (bldSlot && bldPanel) bldSlot.appendChild(bldPanel);
    if (houSlot && houPanel) houSlot.appendChild(houPanel);
  }

  // ----- Tower selector (era-aware, sidebar buttons) -----
  function _rebuildTowerSelector() {
    towerSelector.innerHTML = '';
    const era = state.currentEra;

    // Group towers by era
    const grouped = {};
    for (const [type, def] of Object.entries(Towers.DEFS)) {
      if (def.era <= era) {
        if (!grouped[def.era]) grouped[def.era] = [];
        grouped[def.era].push({ type, def });
      }
    }

    for (const eraNum of Object.keys(grouped).sort((a, b) => a - b)) {
      const header = document.createElement('div');
      header.className = 'tower-selector-era-header';
      header.textContent = `Era ${eraNum} · ${ERA_NAMES[eraNum] ?? ''}`;
      towerSelector.appendChild(header);

      for (const { type, def } of grouped[eraNum]) {
        const btn = _makeTowerBtn(type, def);
        towerSelector.appendChild(btn);
      }
    }

    // Barricade section
    const barDef = Barricades.DEFS[era] ?? Barricades.DEFS[1];
    const barHeader = document.createElement('div');
    barHeader.className = 'tower-selector-era-header';
    barHeader.textContent = 'Obstacles';
    towerSelector.appendChild(barHeader);
    towerSelector.appendChild(_makeBarricadeBtn(barDef));

    // Keep selectedType valid
    const available = Object.entries(Towers.DEFS)
      .filter(([, d]) => d.era <= era)
      .map(([t]) => t);
    available.push('barricade');
    if (!available.includes(selectedType)) {
      selectedType = available[0] ?? 'club';
    }
    _refreshTowerSelector();
  }

  function _makeTowerBtn(type, def) {
    const costStr = Object.entries(def.cost)
      .map(([k, v]) => `${v} ${k[0].toUpperCase()}${k.slice(1)}`)
      .join(' · ');
    const dps = (def.damage / def.attackSpeed).toFixed(1);
    const btn = document.createElement('button');
    btn.className = 'hud-tower-type-btn';
    btn.dataset.towerType = type;
    btn.innerHTML = `
      <div class="tower-btn-row1">
        <span class="tower-btn-name">${def.label}</span>
        ${def.aoe ? '<span class="tower-btn-aoe">AoE</span>' : ''}
      </div>
      <div class="tower-btn-stats">
        <span>⚔ ${def.damage}</span>
        <span>📡 ${def.rangeTiles}t</span>
        <span>${dps} dps</span>
        ${def.peopleRequired > 1 ? `<span>👥 ${def.peopleRequired}</span>` : ''}
      </div>
      <div class="tower-btn-cost">${costStr}</div>
    `;
    btn.addEventListener('click', () => { selectedType = type; _refreshTowerSelector(); });
    btn.addEventListener('mouseenter', () => _showTowerTooltip(type, def, btn));
    btn.addEventListener('mouseleave', _hideTowerTooltip);
    return btn;
  }

  function _makeBarricadeBtn(barDef) {
    const barCostStr = Object.entries(barDef.cost)
      .map(([k, v]) => `${v} ${k[0].toUpperCase()}${k.slice(1)}`)
      .join(' · ');
    const btn = document.createElement('button');
    btn.className = 'hud-tower-type-btn';
    btn.dataset.towerType = 'barricade';
    btn.innerHTML = `
      <div class="tower-btn-row1">
        <span class="tower-btn-name">${barDef.label ?? 'Barricade'}</span>
      </div>
      <div class="tower-btn-stats">
        <span>HP ${barDef.maxHp ?? '—'}</span>
        <span>Slows ${Math.round((barDef.slowFactor ?? 0.35) * 100)}%</span>
      </div>
      <div class="tower-btn-cost">${barCostStr}</div>
    `;
    btn.addEventListener('click', () => { selectedType = 'barricade'; _refreshTowerSelector(); });
    return btn;
  }

  // ----- Tooltip (hover on sidebar button) -----
  function _showTowerTooltip(type, def, btn) {
    const tooltip = document.getElementById('tower-tooltip');
    if (!tooltip) return;

    const canAfford = Resources.canAfford(def.cost);
    const costLines = Object.entries(def.cost)
      .map(([k, v]) => `${v} ${k[0].toUpperCase()}${k.slice(1)}`)
      .join('\n');
    const dps = (def.damage / def.attackSpeed).toFixed(1);

    tooltip.innerHTML = `
      <div class="tooltip-name">${def.label}</div>
      <div class="tooltip-stat-grid">
        <div class="tooltip-stat-item">
          <span class="tooltip-stat-label">Damage</span>
          <span class="tooltip-stat-value">${def.damage}</span>
        </div>
        <div class="tooltip-stat-item">
          <span class="tooltip-stat-label">DPS</span>
          <span class="tooltip-stat-value">${dps}</span>
        </div>
        <div class="tooltip-stat-item">
          <span class="tooltip-stat-label">Range</span>
          <span class="tooltip-stat-value">${def.rangeTiles} tiles</span>
        </div>
        <div class="tooltip-stat-item">
          <span class="tooltip-stat-label">${def.aoe ? 'Type' : 'Fire Rate'}</span>
          <span class="tooltip-stat-value">${def.aoe ? 'AoE' : `${def.attackSpeed}s`}</span>
        </div>
        <div class="tooltip-stat-item">
          <span class="tooltip-stat-label">People</span>
          <span class="tooltip-stat-value">${def.peopleRequired ?? 1}</span>
        </div>
        <div class="tooltip-stat-item">
          <span class="tooltip-stat-label">Era</span>
          <span class="tooltip-stat-value">${def.era}</span>
        </div>
      </div>
      <div class="tooltip-cost ${canAfford ? '' : 'cant-afford'}">
        ${canAfford ? '✓ Can afford' : '✗ Insufficient resources'}<br>${costLines}
      </div>
    `;

    // Position tooltip vertically near the hovered button
    const wrapper = document.getElementById('game-wrapper');
    const wRect   = wrapper.getBoundingClientRect();
    const scale   = wRect.width / 1920;
    const btnY    = btn.getBoundingClientRect().top;
    const topHud  = (btnY - wRect.top) / scale;
    const clampedTop = Math.max(10, Math.min(topHud, 1080 - 300));

    tooltip.style.top    = `${clampedTop}px`;
    tooltip.style.display = 'block';
  }

  function _hideTowerTooltip() {
    const tooltip = document.getElementById('tower-tooltip');
    if (tooltip) tooltip.style.display = 'none';
  }

  // ----- Wave banner -----
  function _showWaveBanner(main, sub, duration) {
    const banner = document.getElementById('wave-banner');
    if (!banner) return;
    banner.innerHTML = main + (sub ? `<div class="banner-sub">${sub}</div>` : '');
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), duration ?? 2000);
  }

  // ----- Button handlers -----

  function onStartWave() {
    if (state.phase !== 'prep') return;
    state.phase = 'wave';
    Waves.startWave(state.currentEra, state.currentWave);
    _showWaveBanner(`Wave ${state.currentWave}`, 'Incoming — defend your fortress!', 2400);
    update(state);
  }

  function onToggleBuildMode() {
    buildMode = !buildMode;
    if (!buildMode) { hoverCell = null; _hideTowerTooltip(); }
    if (buildMode) { _closeTowerPanel(); _closeBarricadePanel(); }
    _refreshBuildModeBtn();
    _refreshTowerSelector();
  }

  // ----- Ability click -----
  function _onAbilityClick() {
    if (!Abilities.isReady() || state.phase !== 'wave') return;
    if (Abilities.isTargeted()) {
      abilityTargeting = true;
      canvasEl.style.cursor = 'crosshair';
    } else {
      Abilities.activate();
      AbilityEffects.spawn(state.currentEra);
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
    if (!buildMode || state.phase === 'gameover') { hoverCell = null; return; }
    const { cx, cy } = _canvasCoords(e);
    const gx = Math.floor(cx / GameMap.CELL);
    const gy = Math.floor((cy + 5) / GameMap.CELL);
    if (gx < 0 || gx >= GameMap.COLS || gy < 0 || gy >= GameMap.ROWS) {
      hoverCell = null;
    } else {
      hoverCell = { gx, gy };
    }
  }

  function onCanvasClick(e) {
    const { cx, cy } = _canvasCoords(e);

    // Ability targeting
    if (abilityTargeting) {
      abilityTargeting = false;
      canvasEl.style.cursor = '';
      Abilities.activate(cx, cy);
      AbilityEffects.spawn(state.currentEra, cx, cy);
      return;
    }

    // Check if clicking on a settlement building (right of wall)
    if (cx >= GameMap.WALL_COL * GameMap.CELL) {
      const bSize = Renderer.BUILDING_SIZE;
      for (const def of Renderer.BUILDING_DEFS) {
        if (TownBuildingsPanel.getLevel(def.id) === 0) continue; // only rendered buildings
        if (cx >= def.x && cx <= def.x + bSize && cy >= def.y && cy <= def.y + bSize) {
          if (buildingPopupId === def.id) {
            _closeBuildingPopup();
          } else {
            _openBuildingPopup(def);
          }
          return;
        }
      }
      // Clicked blank settlement area — close building popup
      _closeBuildingPopup();
      return;
    }

    // Defense zone clicks — close building popup
    _closeBuildingPopup();

    const gx = Math.floor(cx / GameMap.CELL);
    const gy = Math.floor((cy + 5) / GameMap.CELL);

    // Always check existing structures first — lets player open tower/barricade
    // panels even while build mode is active
    const tower = Towers.getAt(gx, gy);
    if (tower) {
      _closeBarricadePanel();
      _openTowerPanel(tower);
      return;
    }

    const barricade = Barricades.getAt(gx, gy);
    if (barricade) {
      _closeTowerPanel();
      _openBarricadePanel(barricade);
      return;
    }

    // Build mode placement (only on empty cells, only if something is selected)
    if (buildMode && selectedType !== null && state.phase !== 'gameover') {
      let result;
      if (selectedType === 'barricade') {
        result = Barricades.place(gx, gy);
      } else {
        result = Towers.place(selectedType, gx, gy);
      }
      if (result === 'insufficient') _flashResourceError();
      return;
    }

    _closeTowerPanel();
    _closeBarricadePanel();
  }

  // ----- renderHUD — every frame -----
  function renderHUD() {
    _updateHealthBar();
    _updateResourceDisplay();
    _updatePopulationDisplay();
    _updateLowSupplyWarning();
    _updateAbilityButton();
    _updateTowerAffordability();
    TownBuildingsPanel.refresh();
    HousingPanel.refresh();
  }

  function renderStartWaveButton() {
    if (!startWaveBtn) return;
    startWaveBtn.style.display = (state.phase === 'prep') ? '' : 'none';
  }

  // ----- update — sync HUD to state -----
  function update(s) {
    if (eraWaveEl) eraWaveEl.textContent = `Era ${s.currentEra}  ·  Wave ${s.currentWave}`;
    const isGameOver = s.phase === 'gameover';
    // Always hide old town buttons (replaced by sidebar tabs)
    if (townButtons) townButtons.style.display = 'none';
    const sidebar = document.getElementById('hud-build-sidebar');
    if (sidebar) sidebar.style.display = isGameOver ? 'none' : '';
    if (isGameOver) { buildMode = false; hoverCell = null; }
    _refreshBuildModeBtn();
    _rebuildTowerSelector();
    _refreshTowerSelector();
    renderStartWaveButton();
    _updateHealthBar();
    _updateResourceDisplay();
    // Refresh town tab if it's currently active
    if (activeTab === 'town') {
      _renderTownContent(document.getElementById('sidebar-town-content'));
    }
    const supplyBtn = document.getElementById('hud-supply-btn');
    if (supplyBtn) supplyBtn.disabled = (s.currentEra < 3);
  }

  function enableStartButton() {
    if (startWaveBtn) startWaveBtn.disabled = false;
  }

  function getBuildState() { return { buildMode, hoverCell, selectedType }; }

  // ----- Internal helpers -----

  // ----- Sidebar collapse -----
  function _toggleSidebar() { sidebarOpen ? _closeSidebar() : _openSidebar(); }

  function _openSidebar() {
    sidebarOpen = true;
    document.getElementById('hud-build-sidebar')?.classList.remove('collapsed');
    document.getElementById('hud-resources-panel')?.classList.remove('sidebar-collapsed');
    if (startWaveBtn) startWaveBtn.classList.remove('sidebar-collapsed');
    const tb = document.getElementById('sidebar-toggle-btn');
    if (tb) { tb.classList.remove('collapsed'); tb.textContent = '❯'; }
  }

  function _closeSidebar() {
    sidebarOpen = false;
    document.getElementById('hud-build-sidebar')?.classList.add('collapsed');
    document.getElementById('hud-resources-panel')?.classList.add('sidebar-collapsed');
    if (startWaveBtn) startWaveBtn.classList.add('sidebar-collapsed');
    const tb = document.getElementById('sidebar-toggle-btn');
    if (tb) { tb.classList.add('collapsed'); tb.textContent = '❮'; }
  }

  // ----- Building popup -----
  function _closeBuildingPopup() {
    if (buildingPopupEl) { buildingPopupEl.remove(); buildingPopupEl = null; }
    buildingPopupId = null;
  }

  function _openBuildingPopup(def) {
    _closeBuildingPopup();
    buildingPopupId = def.id;
    const info = TownBuildingsPanel.getBuildingInfo(def.id);
    if (!info) return;

    const MAX    = 3;
    const lv     = TownBuildingsPanel.getLevel(def.id);
    const bSize  = Renderer.BUILDING_SIZE;

    // Position: centered below building, flip above if near bottom
    let popX = def.x + bSize / 2 - 140;
    let popY = def.y + bSize + 10;
    if (popY + 230 > 1060) popY = def.y - 230 - 10;
    // Keep within horizontal bounds (don't overlap sidebar or go off left)
    popX = Math.max(10, Math.min(1920 - 420 - 290, popX));

    buildingPopupEl = document.createElement('div');
    buildingPopupEl.id = 'building-popup';
    buildingPopupEl.style.left = `${popX}px`;
    buildingPopupEl.style.top  = `${popY}px`;
    buildingPopupEl.addEventListener('click', (e) => e.stopPropagation());

    // Header
    const header = document.createElement('div');
    header.className = 'bpop-header';
    const nameBlock = document.createElement('div');
    const nameEl = document.createElement('div');
    nameEl.className = 'bpop-name';
    nameEl.textContent = info.name;
    const eraEl = document.createElement('div');
    eraEl.className = 'bpop-era';
    eraEl.textContent = `Era ${info.era}  ·  ${ERA_NAMES[info.era] ?? ''}`;
    nameBlock.appendChild(nameEl);
    nameBlock.appendChild(eraEl);
    const closeBtn = document.createElement('button');
    closeBtn.className = 'bpop-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); _closeBuildingPopup(); });
    header.appendChild(nameBlock);
    header.appendChild(closeBtn);
    buildingPopupEl.appendChild(header);

    // Level pips
    const levelRow = document.createElement('div');
    levelRow.className = 'bpop-level';
    const pipsEl = document.createElement('span');
    pipsEl.className = 'bpop-pips';
    pipsEl.textContent = Array.from({ length: MAX }, (_, i) => i < lv ? '●' : '○').join('');
    const lvText = document.createElement('span');
    lvText.className = 'bpop-level-text';
    lvText.textContent = lv === 0 ? 'Unbuilt' : lv >= MAX ? 'MAX' : `Level ${lv}`;
    levelRow.appendChild(pipsEl);
    levelRow.appendChild(lvText);
    buildingPopupEl.appendChild(levelRow);

    // Production
    const prodEl = document.createElement('div');
    prodEl.className = 'bpop-prod';
    if (lv > 0) {
      prodEl.innerHTML = `Producing <span>+${(info.rate * lv).toFixed(1)} ${info.produces}/s</span>`;
    } else {
      prodEl.textContent = `Produces ${info.produces}`;
    }
    buildingPopupEl.appendChild(prodEl);

    // Cost + action button
    if (lv < MAX) {
      const nextCost  = info.goldCost * (lv + 1);
      const canAfford = Resources.canAfford({ gold: nextCost });

      const costEl = document.createElement('div');
      costEl.className = 'bpop-cost';
      costEl.textContent = `Cost: ${nextCost}g`;
      buildingPopupEl.appendChild(costEl);

      const actionBtn = document.createElement('button');
      actionBtn.className = 'bpop-action-btn';
      actionBtn.textContent = lv === 0 ? 'Build' : 'Upgrade';
      actionBtn.disabled = !canAfford;
      actionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        TownBuildingsPanel.upgrade(info.id);
        _openBuildingPopup(def); // Rebuild popup with new state
      });
      buildingPopupEl.appendChild(actionBtn);
    } else {
      const actionBtn = document.createElement('button');
      actionBtn.className = 'bpop-action-btn';
      actionBtn.textContent = 'Maxed';
      actionBtn.disabled = true;
      buildingPopupEl.appendChild(actionBtn);
    }

    document.getElementById('hud').appendChild(buildingPopupEl);
  }

  function _refreshBuildModeBtn() {
    if (!buildModeBtn) return;
    buildModeBtn.classList.toggle('active', buildMode);
    buildModeBtn.textContent = buildMode ? '⚒  Build Mode  ON' : '⚒  Build Mode';
  }

  function _refreshTowerSelector() {
    if (!towerSelector) return;
    towerSelector.style.opacity      = '1';
    towerSelector.style.pointerEvents = 'auto';
    for (const btn of towerSelector.querySelectorAll('.hud-tower-type-btn')) {
      btn.classList.toggle('active', btn.dataset.towerType === selectedType);
    }
  }

  // Update affordability highlight on every frame
  function _updateTowerAffordability() {
    if (!towerSelector) return;
    const era = state.currentEra;
    for (const btn of towerSelector.querySelectorAll('.hud-tower-type-btn')) {
      const type = btn.dataset.towerType;
      let cost;
      if (type === 'barricade') {
        cost = (Barricades.DEFS[era] ?? Barricades.DEFS[1]).cost;
      } else {
        const def = Towers.DEFS[type];
        if (!def) continue;
        cost = def.cost;
      }
      const affordable = Resources.canAfford(cost);
      const costEl = btn.querySelector('.tower-btn-cost');
      if (costEl) costEl.classList.toggle('cant-afford', !affordable);
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
    if (!resourcesPanelEl) return;
    const g   = Resources.getGold();
    const s   = Resources.getStockpile();
    const era = state.currentEra;
    const rows = ERA_RESOURCES[era] ?? ERA_RESOURCES[1];

    resourcesPanelEl.innerHTML = '';

    // Gold (always shown)
    const goldRow = document.createElement('div');
    goldRow.className = 'res-gold-display';
    goldRow.innerHTML = `
      <span class="res-gold-icon">🪙</span>
      <span class="res-gold-label">Gold</span>
      <span class="res-gold-value">${g}</span>
    `;
    resourcesPanelEl.appendChild(goldRow);

    // Era-relevant stockpile resources
    for (const [key, label, icon] of rows) {
      const row = document.createElement('div');
      row.className = 'res-item';
      row.innerHTML = `
        <span class="res-item-icon">${icon}</span>
        <span class="res-item-label">${label}</span>
        <span class="res-item-value">${s[key] ?? 0}</span>
      `;
      resourcesPanelEl.appendChild(row);
    }
  }

  function _updatePopulationDisplay() {
    if (!populationEl) return;
    const unassigned = People.getUnassigned();
    const total      = People.getTotalPeople();
    populationEl.textContent = `👤 ${unassigned} / ${total} people`;
  }

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
    if (warn) lowSupplyWarnEl.textContent = '⚠  Low Supply — some towers are weakened';
  }

  function _updateAbilityButton() {
    if (!abilityBtnEl) return;
    const pct = Abilities.getProgress();
    abilityFillEl.style.width = `${(pct * 100).toFixed(1)}%`;
    abilityBtnEl.querySelector('.ability-btn-label').textContent = Abilities.getName();
    abilityBtnEl.classList.toggle('ready', Abilities.isReady());
    abilityBtnEl.classList.toggle('targeting', abilityTargeting);
  }

  function _flashResourceError() {
    if (!resourcesPanelEl) return;
    resourcesPanelEl.classList.remove('flash');
    void resourcesPanelEl.offsetWidth;
    resourcesPanelEl.classList.add('flash');
    resourcesPanelEl.addEventListener('animationend',
      () => resourcesPanelEl.classList.remove('flash'), { once: true });
  }

  function _eraName(n) { return ERA_NAMES[n] ?? `Era ${n}`; }

  // ----- Tower selection panel (left sidebar) -----

  function _openTowerPanel(tower) { selectedTower = tower; _buildTowerPanel(tower); }

  function _closeTowerPanel() {
    if (towerPanelEl) { towerPanelEl.remove(); towerPanelEl = null; }
    selectedTower = null;
  }

  function _buildTowerPanel(tower) {
    _closeTowerPanel();
    towerPanelEl = document.createElement('div');
    towerPanelEl.id = 'overlay-tower-panel';

    const def = Towers.DEFS[tower.type];

    // ── Header ──
    const header = document.createElement('div');
    header.className = 'tp-header';

    const titleEl = document.createElement('div');
    titleEl.className = 'tp-title';
    titleEl.textContent = tower.label;

    const eraEl = document.createElement('div');
    eraEl.className = 'tp-era';
    eraEl.textContent = `Era ${def.era}  ·  ${_eraName(def.era)}`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'overlay-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', _closeTowerPanel);

    header.appendChild(titleEl);
    header.appendChild(eraEl);
    header.appendChild(closeBtn);
    towerPanelEl.appendChild(header);

    // ── Content ──
    const content = document.createElement('div');
    content.className = 'tp-content';

    // Stat block
    const dps = (tower.damage / def.attackSpeed).toFixed(1);
    const statsGrid = document.createElement('div');
    statsGrid.className = 'tp-stats-grid';
    statsGrid.innerHTML = `
      <div class="tp-stat">
        <span class="tp-stat-label">Damage</span>
        <span class="tp-stat-value">${tower.damage}</span>
      </div>
      <div class="tp-stat">
        <span class="tp-stat-label">DPS</span>
        <span class="tp-stat-value">${dps}</span>
      </div>
      <div class="tp-stat">
        <span class="tp-stat-label">Range</span>
        <span class="tp-stat-value">${def.rangeTiles}t</span>
      </div>
      <div class="tp-stat">
        <span class="tp-stat-label">${def.aoe ? 'Type' : 'Rate'}</span>
        <span class="tp-stat-value">${def.aoe ? 'AoE' : def.attackSpeed + 's'}</span>
      </div>
    `;
    content.appendChild(statsGrid);

    // Supply bar (Era 3+)
    if (def.era >= 3) {
      const conn = Supply.getConnection(tower.id);
      const h    = conn ? conn.supplyHealth : 0;
      const pct  = Math.round(h * 100);
      const col  = h >= 0.75 ? '#44cc66' : h >= 0.30 ? '#ccaa33' : h > 0 ? '#cc4444' : '#555';
      const supplyEl = document.createElement('div');
      supplyEl.className = 'tp-supply';
      supplyEl.innerHTML = `
        <div class="tp-supply-label">Supply Line</div>
        <div class="tp-supply-bar-track">
          <div class="tp-supply-bar-fill" style="width:${pct}%;background:${col}"></div>
        </div>
        <div class="tp-supply-pct" style="color:${col}">${conn ? pct + '%' : 'No connection'}</div>
      `;
      content.appendChild(supplyEl);
    }

    // Staffing
    const staffSection = document.createElement('div');
    staffSection.className = 'tp-staffing';

    const staffTitle = document.createElement('div');
    staffTitle.className = 'tp-section-title';
    staffTitle.textContent = 'Staffing';
    staffSection.appendChild(staffTitle);

    const staffControls = document.createElement('div');
    staffControls.className = 'tp-staff-controls';

    const minusBtn = document.createElement('button');
    minusBtn.className = 'tp-staff-btn';
    minusBtn.textContent = '−';

    const staffDisplay = document.createElement('div');
    staffDisplay.className = 'tp-staff-display';

    const plusBtn = document.createElement('button');
    plusBtn.className = 'tp-staff-btn';
    plusBtn.textContent = '+';

    function refreshStaff() {
      const assigned = People.getAssigned(tower.id);
      const req      = tower.peopleRequired;
      const ratio    = req > 0 ? Math.min(1, assigned / req) : 1;
      const effDmg   = (tower.damage * ratio).toFixed(0);
      staffDisplay.innerHTML = `
        <div class="tp-staff-count">${assigned} / ${req}</div>
        <div class="tp-staff-sub">${Math.round(ratio * 100)}% · ${effDmg} dmg</div>
      `;
      staffDisplay.style.color = ratio >= 1 ? '#7ec860' : ratio > 0 ? '#f0c040' : '#e06060';
      minusBtn.disabled = assigned <= 0;
      plusBtn.disabled  = People.getUnassigned() <= 0;
    }
    refreshStaff();

    minusBtn.addEventListener('click', () => { People.removeFromTower(tower.id); refreshStaff(); });
    plusBtn.addEventListener('click',  () => { People.assignToTower(tower.id);  refreshStaff(); });

    staffControls.append(minusBtn, staffDisplay, plusBtn);
    staffSection.appendChild(staffControls);
    content.appendChild(staffSection);

    // Demolish
    const demolishBtn = document.createElement('button');
    demolishBtn.className = 'tp-demolish-btn';
    demolishBtn.textContent = '⚠  Demolish Tower';
    demolishBtn.addEventListener('click', () => { Towers.demolish(tower); _closeTowerPanel(); });
    content.appendChild(demolishBtn);

    towerPanelEl.appendChild(content);
    document.getElementById('hud').appendChild(towerPanelEl);
  }

  // ----- Barricade selection panel (left sidebar) -----

  function _openBarricadePanel(barricade) { selectedBarricade = barricade; _buildBarricadePanel(barricade); }

  function _closeBarricadePanel() {
    if (barricadePanelEl) { barricadePanelEl.remove(); barricadePanelEl = null; }
    selectedBarricade = null;
  }

  function _buildBarricadePanel(barricade) {
    _closeBarricadePanel();
    barricadePanelEl = document.createElement('div');
    barricadePanelEl.id = 'overlay-barricade-panel';

    // Header
    const closeBtn = document.createElement('button');
    closeBtn.className = 'overlay-close';
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'position:absolute;top:14px;right:16px;background:none;border:none;color:var(--era-text,#D2B48C);font-size:26px;line-height:1;cursor:pointer;opacity:0.5;transition:opacity 0.1s;';
    closeBtn.addEventListener('click', _closeBarricadePanel);
    barricadePanelEl.appendChild(closeBtn);

    const title = document.createElement('div');
    title.className = 'tp-title';
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
    slowEl.textContent = `Slows enemies to ${Math.round((Barricades.DEFS[state.currentEra]?.slowFactor ?? 0.35) * 100)}% speed\nBlocks enemy movement`;
    barricadePanelEl.appendChild(slowEl);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'tp-demolish-btn';
    removeBtn.textContent = '⚠  Remove Barricade';
    removeBtn.style.marginTop = 'auto';
    removeBtn.addEventListener('click', () => { Barricades.remove(barricade); _closeBarricadePanel(); });
    barricadePanelEl.appendChild(removeBtn);

    document.getElementById('hud').appendChild(barricadePanelEl);
  }

  // ----- Town panel (now opens sidebar town tab) -----

  function _openTownPanel() {
    _closeTowerPanel();
    _closeBarricadePanel();
    _switchTab('town');
  }

  function _closeTownPanel() {
    // Town is in the sidebar — switch back to build tab if currently on town
    if (activeTab === 'town') _switchTab('build');
  }

  function _formatCost(cost) {
    return Object.entries(cost).map(([k, v]) => `${v} ${k}`).join('  ·  ');
  }

  function closeAll() {
    _closeTowerPanel();
    _closeBarricadePanel();
    _closeBuildingPopup();
    _closeSidebar();
  }

  function clearSelection() {
    selectedType = null;
    hoverCell    = null;
  }

  return { init, renderHUD, renderStartWaveButton, update, enableStartButton, getBuildState, closeAll, clearSelection, adoptPanels };
})();
