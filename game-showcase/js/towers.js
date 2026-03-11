/* ============================================================
   towers.js — Tower definitions, placement, combat, and management
   ============================================================ */

const Towers = (() => {

  // ----- Tower definitions (all eras) -----
  // rangeTiles: tower attack range in grid cells (pixels = rangeTiles * GameMap.CELL).
  const DEFS = {
    // Era 1 — Prehistoric
    club:        { era:1, damage:20, attackSpeed:1.0, rangeTiles: 4, aoe:false, spriteKey:'clubMan',        label:'Club',         cost:{ bone:10, wood:  6 }, peopleRequired:1 },
    rockThrower: { era:1, damage:14, attackSpeed:2.2, rangeTiles: 8, aoe:false, spriteKey:'stoneMan',       label:'Rock Thrower', cost:{ bone:16, wood: 10 }, peopleRequired:1 },
    spear:       { era:1, damage:30, attackSpeed:2.8, rangeTiles:12, aoe:false, spriteKey:'spearMan',       label:'Spear',        cost:{ bone:20, wood: 16 }, peopleRequired:1 },

    // Era 2 — Medieval
    sword:       { era:2, damage:35, attackSpeed:0.9, rangeTiles: 4, aoe:false, spriteKey:'swordMan',       label:'Sword',        cost:{ stone:24, iron: 18 }, peopleRequired:1 },
    cavalry:     { era:2, damage:50, attackSpeed:1.5, rangeTiles: 6, aoe:false, spriteKey:'horseMan',       label:'Cavalry',      cost:{ stone:36, iron: 24 }, peopleRequired:1 },
    crossbow:    { era:2, damage:22, attackSpeed:1.8, rangeTiles:12, aoe:false, spriteKey:'crossbowMan',    label:'Crossbow',     cost:{ stone:30, iron: 21 }, peopleRequired:1 },

    // Era 3 — Pirate Age
    cutlass:     { era:3, damage:55, attackSpeed:0.8, rangeTiles: 4, aoe:false, spriteKey:'cutlassMan',     label:'Cutlass',      cost:{ timber:20, gunpowder:12 }, peopleRequired:1 },
    blunderbuss: { era:3, damage:45, attackSpeed:2.2, rangeTiles:10, aoe:false, spriteKey:'blunderbussMan', label:'Blunderbuss',  cost:{ timber:24, gunpowder:16 }, peopleRequired:1 },
    mortar:      { era:3, damage:90, attackSpeed:3.5, rangeTiles:14, aoe:true,  spriteKey:'cutlassMan',     label:'Mortar',       cost:{ timber:36, gunpowder:28 }, peopleRequired:2 },

    // Era 4 — World War II
    rifleman:    { era:4, damage:65, attackSpeed:1.2, rangeTiles:14, aoe:false, spriteKey:'rifleman',       label:'Rifleman',     cost:{ steel:24, oil:16 }, peopleRequired:1 },
    machineGun:  { era:4, damage:40, attackSpeed:0.4, rangeTiles:10, aoe:false, spriteKey:'machineGun',     label:'Machine Gun',  cost:{ steel:36, oil:24 }, peopleRequired:2 },
    artillery:   { era:4, damage:160,attackSpeed:4.0, rangeTiles:18, aoe:true,  spriteKey:'artillery',      label:'Artillery',    cost:{ steel:50, oil:36 }, peopleRequired:2 },

    // Era 5 — Sci-Fi
    laserTurret: { era:5, damage:120, attackSpeed:0.5, rangeTiles:16, aoe:false, spriteKey:'laserTurret',  label:'Laser Turret', cost:{ alloy:28, plasma:20 }, peopleRequired:1 },
    railgun:     { era:5, damage:320, attackSpeed:3.0, rangeTiles:24, aoe:false, spriteKey:'railgun',      label:'Railgun',      cost:{ alloy:40, plasma:30 }, peopleRequired:2 },
    nukeStation: { era:5, damage:550, attackSpeed:8.0, rangeTiles:20, aoe:true,  spriteKey:'nukeStation',  label:'Nuke Station', cost:{ alloy:60, plasma:44 }, peopleRequired:3 },
  };

  let nextTowerId = 0;
  let towers = [];

  // ----- Tower class -----
  class Tower {
    constructor(type, gx, gy) {
      const def = DEFS[type];
      if (!def) throw new Error(`[Towers] unknown type: ${type}`);

      this.id             = `tower_${nextTowerId++}`;
      this.type           = type;
      this.gx             = gx;
      this.gy             = gy;
      this.damage         = def.damage;
      this.attackSpeed    = def.attackSpeed;
      this.rangePx        = def.rangeTiles * GameMap.CELL;
      this.aoe            = def.aoe;
      this.label          = def.label;
      this.peopleRequired = def.peopleRequired ?? 1;

      const center = GameMap.gridToPixel(gx, gy);
      this.cx = center.x;
      this.cy = center.y;

      this.attacking    = false;
      this.attackTimer  = 0;
      this.attackFlash  = 0;
      this.faceAngle    = 0; // radians, 0 = right
    }

    get staffingRatio() {
      const assigned = People.getAssigned(this.id);
      return this.peopleRequired > 0 ? Math.min(1, assigned / this.peopleRequired) : 1;
    }

    // Supply multiplier: Era 1-2 = full power, Era 3+ = supply-health based
    _supplyMult() {
      if (DEFS[this.type].era < 3) return { dmgMult: 1.0, speedPenalty: 0, dormant: false };
      try {
        const conn = Supply.getConnection(this.id);
        const h    = conn ? conn.supplyHealth : 0;
        return Supply.getSupplyMultiplier(h);
      } catch (_e) {
        return { dmgMult: 1.0, speedPenalty: 0, dormant: false };
      }
    }

    update(dt, enemies) {
      if (this.staffingRatio === 0) { this.attacking = false; return; }

      // Check supply dormancy (Era 3+ only)
      const sm = this._supplyMult();
      if (sm.dormant) { this.attacking = false; return; }

      if (this.attackFlash > 0) {
        this.attackFlash = Math.max(0, this.attackFlash - dt / 1000);
      }

      this.attackTimer -= dt / 1000;
      if (this.attackTimer > 0) return;

      if (this.aoe) {
        this._fireAoE(enemies, sm);
      } else {
        this._fireSingleTarget(enemies, sm);
      }
    }

    _fireSingleTarget(enemies, sm) {
      let target       = null;
      let furthestDist = -1;
      for (const e of enemies) {
        if (e.dead) continue;
        const pos = e.getPosition();
        const dx  = pos.x - this.cx;
        const dy  = pos.y - this.cy;
        if (Math.sqrt(dx * dx + dy * dy) <= this.rangePx && e.distance > furthestDist) {
          target       = e;
          furthestDist = e.distance;
        }
      }
      if (!target) { this.attacking = false; return; }
      target.takeDamage(this.damage * this.staffingRatio * sm.dmgMult);
      const tpos = target.getPosition();
      this.faceAngle = Math.atan2(tpos.y - this.cy, tpos.x - this.cx);
      Projectiles.fire(this.type, this.cx, this.cy - 5, tpos.x, tpos.y);
      this._onFire(sm.speedPenalty);
    }

    _fireAoE(enemies, sm) {
      let hit      = false;
      let firstPos = null;
      for (const e of enemies) {
        if (e.dead) continue;
        const pos = e.getPosition();
        const dx  = pos.x - this.cx;
        const dy  = pos.y - this.cy;
        if (Math.sqrt(dx * dx + dy * dy) <= this.rangePx) {
          e.takeDamage(this.damage * this.staffingRatio * sm.dmgMult);
          if (!firstPos) firstPos = pos;
          hit = true;
        }
      }
      if (hit) {
        if (firstPos) {
          this.faceAngle = Math.atan2(firstPos.y - this.cy, firstPos.x - this.cx);
          Projectiles.fire(this.type, this.cx, this.cy - 5, firstPos.x, firstPos.y);
        }
        this._onFire(sm.speedPenalty);
      } else {
        this.attacking = false;
      }
    }

    _onFire(speedPenalty = 0) {
      this.attackTimer  = this.attackSpeed + speedPenalty;
      this.attackFlash  = this.type === 'club' ? 0.45 : 0.15;
      this.attacking    = true;
      playSound(TOWER_SFX[this.type]);
    }
  }

  // ----- Module-level update -----
  function update(dt) {
    const enemies = Enemies.getAll();
    for (const t of towers) t.update(dt, enemies);
  }

  // ----- Placement validation -----
  function isValid(gx, gy) {
    const cell = GameMap.getCell(gx, gy);
    if (!cell) return false;
    if (!GameMap.isDefenseZone(gx)) return false;
    return cell.state === 'open';
  }

  function place(type, gx, gy) {
    if (!isValid(gx, gy)) return 'invalid';
    const cost = DEFS[type]?.cost ?? {};
    if (!Resources.canAfford(cost)) return 'insufficient';
    Resources.spendResources(cost);
    towers.push(new Tower(type, gx, gy));
    GameMap.setCell(gx, gy, 'tower');
    return 'ok';
  }

  function getAll()  { return towers; }
  function getAt(gx, gy) { return towers.find(t => t.gx === gx && t.gy === gy) ?? null; }

  function demolish(tower) {
    const count = People.getAssigned(tower.id);
    for (let i = 0; i < count; i++) People.removeFromTower(tower.id);
    if (typeof Supply !== 'undefined') Supply.disconnect(tower.id);
    towers = towers.filter(t => t !== tower);
    GameMap.setCell(tower.gx, tower.gy, 'open');
  }

  function clear() { towers = []; }

  return { DEFS, isValid, place, update, getAll, getAt, demolish, clear };
})();
