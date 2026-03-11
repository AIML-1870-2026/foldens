/* ============================================================
   popups.js — People arrival popup, era advancement overlay
   ============================================================ */

// ----- People Arrival Popup -----
const PeopleArrivalPopup = (() => {

  const ERA_ARRIVAL_RANGE = {
    1: [2, 4],
    2: [3, 6],
    3: [4, 7],
    4: [5, 9],
    5: [7, 12],
  };

  let popupEl        = null;
  let onDoneCallback = null;

  function show(era, onDone) {
    onDoneCallback = onDone;
    const [lo, hi] = ERA_ARRIVAL_RANGE[era] ?? [2, 4];
    const arrivalCount = lo + Math.floor(Math.random() * (hi - lo + 1));
    _buildPopup(arrivalCount);
  }

  function _buildPopup(arrivalCount) {
    if (popupEl) popupEl.remove();

    popupEl = document.createElement('div');
    popupEl.id = 'popup-arrival';

    const header = document.createElement('div');
    header.className = 'popup-title';
    const noun = arrivalCount === 1 ? 'person wants' : 'people want';
    header.textContent = `New Arrivals \u2014 ${arrivalCount} ${noun} to join your Town`;
    popupEl.appendChild(header);

    const housingInfo = document.createElement('div');
    housingInfo.className = 'popup-housing-info';
    _refreshHousingInfo(housingInfo);
    popupEl.appendChild(housingInfo);

    const listEl = document.createElement('div');
    listEl.className = 'popup-person-list';

    const doneBtn = document.createElement('button');
    doneBtn.className = 'popup-btn popup-btn-done';
    doneBtn.textContent = 'Done';
    doneBtn.disabled = true;
    doneBtn.addEventListener('click', _onDone);

    const acceptAllBtn = document.createElement('button');
    acceptAllBtn.className = 'popup-btn popup-btn-accept';
    acceptAllBtn.textContent = 'Accept All';
    acceptAllBtn.addEventListener('click', () => {
      for (const row of listEl.querySelectorAll('.popup-person-row')) {
        const btn = row.querySelector('.popup-btn-accept');
        if (btn && !btn.disabled) btn.click();
      }
      _onDone();
    });

    let pendingCount = arrivalCount;

    function onRowResolved() {
      pendingCount--;
      _refreshHousingInfo(housingInfo);
      _refreshAcceptButtons(listEl, acceptAllBtn);
      if (pendingCount === 0 || !People.canAccept()) doneBtn.disabled = false;
    }

    for (let i = 0; i < arrivalCount; i++) {
      const row = document.createElement('div');
      row.className = 'popup-person-row';

      const icon = document.createElement('span');
      icon.className = 'popup-person-icon';
      icon.textContent = '\u{1F464}';

      const acceptBtn = document.createElement('button');
      acceptBtn.className = 'popup-btn popup-btn-accept';
      acceptBtn.textContent = 'Accept';

      const rejectBtn = document.createElement('button');
      rejectBtn.className = 'popup-btn popup-btn-reject';
      rejectBtn.textContent = 'Turn Away';

      const statusEl = document.createElement('span');
      statusEl.className = 'popup-person-status';

      acceptBtn.addEventListener('click', () => {
        if (!People.canAccept()) return;
        People.acceptPerson();
        statusEl.textContent = 'Accepted';
        statusEl.className = 'popup-person-status status-accepted';
        acceptBtn.disabled = true;
        rejectBtn.disabled = true;
        onRowResolved();
      });

      rejectBtn.addEventListener('click', () => {
        statusEl.textContent = 'Turned Away';
        statusEl.className = 'popup-person-status status-rejected';
        acceptBtn.disabled = true;
        rejectBtn.disabled = true;
        onRowResolved();
      });

      row.append(icon, acceptBtn, rejectBtn, statusEl);
      listEl.appendChild(row);
    }

    popupEl.appendChild(listEl);

    const btnRow = document.createElement('div');
    btnRow.className = 'popup-btn-row';
    btnRow.append(acceptAllBtn, doneBtn);
    popupEl.appendChild(btnRow);

    document.getElementById('hud').appendChild(popupEl);

    _refreshAcceptButtons(listEl, acceptAllBtn);
    if (!People.canAccept()) doneBtn.disabled = false;
  }

  function _refreshHousingInfo(el) {
    const used  = People.getTotalPeople();
    const cap   = People.getTotalCapacity();
    const avail = Math.max(0, cap - used);
    el.textContent =
      `Housing: ${used} / ${cap}  \u00b7  ${avail} slot${avail === 1 ? '' : 's'} available`;
  }

  function _refreshAcceptButtons(listEl, acceptAllBtn) {
    const canStill = People.canAccept();
    for (const row of listEl.querySelectorAll('.popup-person-row')) {
      const btn = row.querySelector('.popup-btn-accept');
      if (btn && !btn.disabled) {
        btn.disabled = !canStill;
        btn.title    = canStill ? '' : 'Build more housing';
      }
    }
    if (acceptAllBtn) {
      acceptAllBtn.disabled = !canStill;
      acceptAllBtn.title    = canStill ? '' : 'Build more housing';
    }
  }

  function _onDone() {
    if (popupEl) { popupEl.remove(); popupEl = null; }
    if (onDoneCallback) { onDoneCallback(); onDoneCallback = null; }
  }

  return { show };
})();

// ----- Era Advancement Overlay -----
const EraAdvancementOverlay = (() => {

  const ERA_NAMES = {
    2: 'Medieval Age',
    3: 'Pirate Age',
    4: 'World War II',
    5: 'Sci-Fi Era',
  };

  const ERA_UNLOCKS = {
    2: [
      'Towers: Sword, Cavalry, Crossbow',
      'Enemies: Witch, Vampire, Ghost',
      'Barricade: Stone Wall',
      'Buildings: Stone Quarry, Iron Mine',
      'Housing: Cottage (+4 cap)',
      'Ability: Trebuchet (AoE click)',
    ],
    3: [
      'Towers: Cutlass, Blunderbuss, Mortar (AoE)',
      'Enemies: Sword Pirate, Flintlock Pirate, Bomb Pirate',
      'Barricade: Barrel Trap',
      'Buildings: Timber Mill, Powder Mill',
      'Housing: Lodging House (+6 cap)',
      'Supply Network activated',
      'Ability: Cannon (click target + splash)',
    ],
    4: [
      'Towers: Rifleman, Machine Gun, Artillery (AoE)',
      'Enemies: Grunt Zombie, Vombie, Necro Zombie',
      'Barricade: Sandbag',
      'Buildings: Steel Foundry, Oil Refinery',
      'Housing: Barracks Block (+8 cap)',
      'Ability: Fighter Jets (horizontal strike)',
    ],
    5: [
      'Towers: Laser Turret, Railgun, Nuke Station (AoE)',
      'Enemies: Laser Alien, Fortnite Bart, Flying Saucer',
      'Barricade: Force Field',
      'Buildings: Alloy Forge, Plasma Generator',
      'Housing: Habitat Module (+12 cap)',
      'Ability: Nuclear Bomb (all screen)',
    ],
  };

  let overlayEl = null;

  function show(newEra, onContinue) {
    if (overlayEl) overlayEl.remove();

    overlayEl = document.createElement('div');
    overlayEl.id = 'popup-era-advance';

    const title = document.createElement('div');
    title.className = 'popup-title';
    title.textContent = `Era Complete!`;
    overlayEl.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.className = 'popup-era-subtitle';
    subtitle.textContent = `Entering ${ERA_NAMES[newEra] ?? `Era ${newEra}`}`;
    overlayEl.appendChild(subtitle);

    const unlockTitle = document.createElement('div');
    unlockTitle.className = 'popup-housing-info';
    unlockTitle.textContent = 'Unlocked:';
    overlayEl.appendChild(unlockTitle);

    const list = document.createElement('ul');
    list.className = 'popup-era-unlocks';
    for (const item of ERA_UNLOCKS[newEra] ?? []) {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    }
    overlayEl.appendChild(list);

    const continueBtn = document.createElement('button');
    continueBtn.className = 'popup-btn popup-btn-done';
    continueBtn.textContent = 'Continue';
    continueBtn.addEventListener('click', () => {
      overlayEl.remove();
      overlayEl = null;
      if (onContinue) onContinue();
    });
    overlayEl.appendChild(continueBtn);

    document.getElementById('hud').appendChild(overlayEl);
  }

  return { show };
})();
