/* ============================================================
   towers.js — Tower definitions, placement, combat, and management
   ============================================================ */

const Towers = (() => {

  // ----- Tower definitions (all eras) -----
  const DEFS = {
    // Era 1 — Prehistoric
    club:        { era:1, damage:20, attackSpeed:1.0, rangeTiles:2, aoe:false, spriteKey:'clubMan',        label:'Club',         cost:{ bone: 5, wood:  3 }, peopleRequired:1 },
    rockThrower: { era:1, damage:14, attackSpeed:2.2, rangeTiles:4, aoe:false, spriteKey:'stoneMan',       label:'Rock Thrower', cost:{ bone: 8, wood:  5 }, peopleRequired:1 },
    spear:       { era:1, damage:30, attackSpeed:2.8, rangeTiles:6, aoe:false, spriteKey:'spearMan',       label:'Spear',        cost:{ bone:10, wood:  8 }, peopleRequired:1 },

    // Era 2 — Medieval
    sword:       { era:2, damage:35, attackSpeed:0.9, rangeTiles:2, aoe:false, spriteKey:'swordMan',       label:'Sword',        cost:{ stone: 8, iron:  6 }, peopleRequired:1 },
    cavalry:     { era:2, damage:50, attackSpeed:1.5, rangeTiles:3, aoe:false, spriteKey:'horseMan',       label:'Cavalry',      cost:{ stone:12, iron:  8 }, peopleRequired:1 },
    crossbow:    { era:2, damage:22, attackSpeed:1.8, rangeTiles:6, aoe:false, spriteKey:'crossbowMan',    label:'Crossbow',     cost:{ stone:10, iron:  7 }, peopleRequired:1 },

    // Era 3 — Pirate Age
    cutlass:     { era:3, damage:55, attackSpeed:0.8, rangeTiles:2, aoe:false, spriteKey:'cutlassMan',     label:'Cutlass',      cost:{ timber:10, gunpowder: 6 }, peopleRequired:1 },
    blunderbuss: { era:3, damage:45, attackSpeed:2.2, rangeTiles:5, aoe:false, spriteKey:'blunderbussMan', label:'Blunderbuss',  cost:{ timber:12, gunpowder: 8 }, peopleRequired:1 },
    mortar:      { era:3, damage:90, attackSpeed:3.5, rangeTiles:7, aoe:true,  spriteKey:'cutlassMan',     label:'Mortar',       cost:{ timber:18, gunpowder:14 }, peopleRequired:2 },

    // Era 4 — World War II
    rifleman:    { era:4, damage:65, attackSpeed:1.2, rangeTiles:7, aoe:false, spriteKey:'rifleman',       label:'Rifleman',     cost:{ steel:12, oil: 8 }, peopleRequired:1 },
    machineGun:  { era:4, damage:40, attackSpeed:0.4, rangeTiles:5, aoe:false, spriteKey:'machineGun',     label:'Machine Gun',  cost:{ steel:18, oil:12 }, peopleRequired:2 },
    artillery:   { era:4, damage:160,attackSpeed:4.0, rangeTiles:9, aoe:true,  spriteKey:'artillery',      label:'Artillery',    cost:{ steel:25, oil:18 }, peopleRequired:2 },

    // Era 5 — Sci-Fi
    laserTurret: { era:5, damage:120, attackSpeed:0.5, rangeTiles:8,  aoe:false, spriteKey:'laserTurret',  label:'Laser Turret', cost:{ alloy:14, plasma:10 }, peopleRequired:1 },
    railgun:     { era:5, damage:320, attackSpeed:3.0, rangeTiles:12, aoe:false, spriteKey:'railgun',      label:'Railgun',      cost:{ alloy:20, plasma:15 }, peopleRequired:2 },
    nukeStation: { era:5, damage:550, attackSpeed:8.0, rangeTiles:10, aoe:true,  spriteKey:'nukeStation',  label:'Nuke Station', cost:{ alloy:30, plasma:22 }, peopleRequired:3 },
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
      this.rangePx        = def.rangeTiles * Map.CELL;
      this.aoe            = def.aoe;
      this.spriteKey      = def.spriteKey;
      this.label          = def.label;
      this.peopleRequired = def.peopleRequired ?? 1;

      const center = Map.gridToPixel(gx, gy);
      this.cx = center.x;
      this.cy = center.y;

      this.frameIndex   = 0;
      this.frameElapsed = 0;
      this.attacking    = false;
      this.attackTimer  = 0;
      this.attackFlash  = 0;
    }

    get staffingRatio() {
      const assigned = People.getAssigned(this.id);
      return this.peopleRequired > 0 ? Math.min(1, assigned / this.peopleRequired) : 1;
    }

    // Supply multiplier: Era 1-2 = full power, Era 3+ = supply-health based
    _supplyMult() {
      if (DEFS[this.type].era < 3) return { dmgMult: 1.0, speedPenalty: 0, dormant: false };
      const conn = Supply.getConnection(this.id);
      const h    = conn ? conn.supplyHealth : 0;
      return Supply.getSupplyMultiplier(h);
    }

    update(dt, enemies) {
      if (this.staffingRatio === 0) { this.attacking = false; return; }

      // Check supply dormancy (Era 3+ only)
      const sm = this._supplyMult();
      if (sm.dormant) { this.attacking = false; return; }

      if (this.attackFlash > 0) {
        this.attackFlash = Math.max(0, this.attackFlash - dt / 1000);
      }

      if (this.attacking) {
        const animEntry = Assets.getAnim(this.spriteKey, 'attack');
        if (animEntry) {
          const frameDur = 1000 / animEntry.meta.fps;
          this.frameElapsed += dt;
          while (this.frameElapsed >= frameDur) {
            this.frameIndex++;
            this.frameElapsed -= frameDur;
          }
          const frameCount = animEntry.meta.type === 'sheet'
            ? animEntry.meta.frames
            : (animEntry.images?.length ?? 1);
          this.frameIndex %= frameCount;
        }
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
      let nearest     = null;
      let nearestDist = Infinity;
      for (const e of enemies) {
        if (e.dead || e.reached) continue;
        const pos  = e.getPosition();
        const dx   = pos.x - this.cx;
        const dy   = pos.y - this.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= this.rangePx && dist < nearestDist) {
          nearest     = e;
          nearestDist = dist;
        }
      }
      if (!nearest) { this.attacking = false; return; }
      nearest.takeDamage(this.damage * this.staffingRatio * sm.dmgMult);
      this._onFire(sm.speedPenalty);
    }

    _fireAoE(enemies, sm) {
      let hit = false;
      for (const e of enemies) {
        if (e.dead || e.reached) continue;
        const pos = e.getPosition();
        const dx  = pos.x - this.cx;
        const dy  = pos.y - this.cy;
        if (Math.sqrt(dx * dx + dy * dy) <= this.rangePx) {
          e.takeDamage(this.damage * this.staffingRatio * sm.dmgMult);
          hit = true;
        }
      }
      if (hit) { this._onFire(sm.speedPenalty); } else { this.attacking = false; }
    }

    _onFire(speedPenalty = 0) {
      this.attackTimer  = this.attackSpeed + speedPenalty;
      this.attackFlash  = 0.15;
      this.attacking    = true;
      this.frameIndex   = 0;
      this.frameElapsed = 0;
    }
  }

  // ----- Module-level update -----
  function update(dt) {
    const enemies = Enemies.getAll();
    for (const t of towers) t.update(dt, enemies);
  }

  // ----- Placement validation -----
  function isValid(gx, gy) {
    const cell = Map.getCell(gx, gy);
    if (!cell) return false;
    if (!Map.isDefenseZone(gx)) return false;
    if (cell.state !== 'open') return false;
    return Map.isAdjacentToPath(gx, gy);
  }

  function place(type, gx, gy) {
    if (!isValid(gx, gy)) return 'invalid';
    const cost = DEFS[type]?.cost ?? {};
    if (!Resources.canAfford(cost)) return 'insufficient';
    Resources.spendResources(cost);
    towers.push(new Tower(type, gx, gy));
    Map.setCell(gx, gy, 'tower');
    return 'ok';
  }

  function getAll()  { return towers; }
  function getAt(gx, gy) { return towers.find(t => t.gx === gx && t.gy === gy) ?? null; }

  function demolish(tower) {
    const count = People.getAssigned(tower.id);
    for (let i = 0; i < count; i++) People.removeFromTower(tower.id);
    towers = towers.filter(t => t !== tower);
    Map.setCell(tower.gx, tower.gy, 'open');
  }

  function clear() { towers = []; }

  return { DEFS, isValid, place, update, getAll, getAt, demolish, clear };
})();
