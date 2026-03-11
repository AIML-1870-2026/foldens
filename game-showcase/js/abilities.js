/* ============================================================
   abilities.js — Era cooldown abilities (charge + activate)
   ============================================================ */

const Abilities = (() => {

  // One ability per era
  const DEFS = {
    1: { name: 'Fire Rain',    chargeTime: 75, effect: 'allScreen',   damage:  60 },
    2: { name: 'Trebuchet',    chargeTime: 70, effect: 'aoeClick',    damage: 120, radius: 6 },
    3: { name: 'Cannon',       chargeTime: 65, effect: 'cannonClick', damage: 200, splash: 80, splashRadius: 4 },
    4: { name: 'Fighter Jets', chargeTime: 60, effect: 'lineClick',   damage: 350 },
    5: { name: 'Nuclear Bomb', chargeTime: 55, effect: 'allScreen',   damage: 800 },
  };

  let chargeTimer = 0;  // seconds charged

  function _def() { return DEFS[state.currentEra] ?? DEFS[1]; }

  // update(dt) — charges during wave phase only
  function update(dt) {
    if (state.phase !== 'wave') return;
    chargeTimer = Math.min(chargeTimer + dt / 1000, _def().chargeTime);
  }

  function isReady()      { return chargeTimer >= _def().chargeTime; }
  function getProgress()  { return Math.min(chargeTimer / _def().chargeTime, 1); }
  function getName()      { return _def().name; }
  function getChargeTime(){ return _def().chargeTime; }

  // isTargeted() — true if player must click a canvas position first
  function isTargeted() { return _def().effect !== 'allScreen'; }

  // activate(px, py) — fire the ability. px/py = canvas pixel coords (for targeted).
  // Returns false if not ready.
  function activate(px, py) {
    if (!isReady()) return false;
    const def = _def();
    chargeTimer = 0;

    switch (def.effect) {
      case 'allScreen':
        _effectAllScreen(def);
        break;
      case 'aoeClick':
        if (px !== undefined) _effectAoeClick(def, px, py);
        break;
      case 'cannonClick':
        if (px !== undefined) _effectCannonClick(def, px, py);
        break;
      case 'lineClick':
        if (px !== undefined) _effectLineClick(def, px, py);
        break;
    }
    return true;
  }

  // All enemies on screen take damage
  function _effectAllScreen(def) {
    for (const e of Enemies.getAll()) {
      if (!e.dead && !e.reached) e.takeDamage(def.damage);
    }
  }

  // AoE centered on clicked tile
  function _effectAoeClick(def, px, py) {
    const radiusPx = (def.radius ?? 2) * GameMap.CELL;
    for (const e of Enemies.getAll()) {
      if (e.dead || e.reached) continue;
      const pos = e.getPosition();
      const dx  = pos.x - px, dy = pos.y - py;
      if (Math.sqrt(dx * dx + dy * dy) <= radiusPx) e.takeDamage(def.damage);
    }
  }

  // Nearest primary target + splash around it
  function _effectCannonClick(def, px, py) {
    let nearest = null, nearestDist = Infinity;
    for (const e of Enemies.getAll()) {
      if (e.dead || e.reached) continue;
      const pos  = e.getPosition();
      const dx   = pos.x - px, dy = pos.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) { nearest = e; nearestDist = dist; }
    }
    if (!nearest) return;
    nearest.takeDamage(def.damage);
    const splashPx = (def.splashRadius ?? 2) * GameMap.CELL;
    const nPos = nearest.getPosition();
    for (const e of Enemies.getAll()) {
      if (e === nearest || e.dead || e.reached) continue;
      const pos = e.getPosition();
      const dx  = pos.x - nPos.x, dy = pos.y - nPos.y;
      if (Math.sqrt(dx * dx + dy * dy) <= splashPx) e.takeDamage(def.splash ?? 0);
    }
  }

  // Horizontal band (±1 tile) at the clicked y position
  function _effectLineClick(def, px, py) {
    const bandH = GameMap.CELL;
    for (const e of Enemies.getAll()) {
      if (e.dead || e.reached) continue;
      const pos = e.getPosition();
      if (Math.abs(pos.y - py) <= bandH) e.takeDamage(def.damage);
    }
  }

  function reset() { chargeTimer = 0; }

  return { update, isReady, getProgress, getName, getChargeTime, isTargeted, activate, reset };
})();
