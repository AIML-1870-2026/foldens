/* ============================================================
   barricades.js — Placeable path barricades: slow enemies, have HP
   ============================================================ */

const Barricades = (() => {

  // Era-specific barricade definitions
  const DEFS = {
    1: { hp:  80, slowFactor:0.35, slowRadius:52, damagePerSec: 8, cost:{ bone:  3, wood:  4 }, label:'Barricade'    },
    2: { hp: 120, slowFactor:0.30, slowRadius:56, damagePerSec:10, cost:{ stone: 5, iron:  4 }, label:'Stone Wall'   },
    3: { hp: 100, slowFactor:0.40, slowRadius:52, damagePerSec: 8, cost:{ timber:6, gunpowder:4 }, label:'Barrel Trap' },
    4: { hp: 150, slowFactor:0.45, slowRadius:56, damagePerSec:12, cost:{ steel: 6, oil:   4 }, label:'Sandbag'      },
    5: { hp: 200, slowFactor:0.20, slowRadius:60, damagePerSec:15, cost:{ alloy: 8, plasma:6 }, label:'Force Field'  },
  };

  // DEF is always the current era's definition (set by setEra)
  let DEF = DEFS[1];

  function setEra(era) {
    DEF = DEFS[era] ?? DEFS[1];
  }

  let nextId     = 0;
  let barricades = [];

  class Barricade {
    constructor(gx, gy) {
      this.id    = `barricade_${nextId++}`;
      this.gx    = gx;
      this.gy    = gy;
      this.hp    = DEF.hp;
      this.maxHp = DEF.hp;
      this.dead  = false;

      const c  = Map.gridToPixel(gx, gy);
      this.cx  = c.x;
      this.cy  = c.y;
    }

    takeDamage(amount) {
      this.hp -= amount;
      if (this.hp <= 0 && !this.dead) this.dead = true;
    }
  }

  function isValid(gx, gy) {
    const cell = Map.getCell(gx, gy);
    if (!cell) return false;
    if (!Map.isDefenseZone(gx)) return false;
    if (cell.state !== 'path') return false;
    return !barricades.some(b => b.gx === gx && b.gy === gy);
  }

  function place(gx, gy) {
    if (!isValid(gx, gy)) return 'invalid';
    if (!Resources.canAfford(DEF.cost)) return 'insufficient';
    Resources.spendResources(DEF.cost);
    barricades.push(new Barricade(gx, gy));
    return 'ok';
  }

  function getSpeedMultiplier(x, y) {
    for (const b of barricades) {
      if (b.dead) continue;
      const dx = x - b.cx, dy = y - b.cy;
      if (dx * dx + dy * dy <= DEF.slowRadius * DEF.slowRadius) return DEF.slowFactor;
    }
    return 1;
  }

  function update(dt) {
    const enemies = Enemies.getAll();
    for (const b of barricades) {
      if (b.dead) continue;
      for (const e of enemies) {
        if (e.dead || e.reached) continue;
        const pos = e.getPosition();
        const dx  = pos.x - b.cx, dy = pos.y - b.cy;
        if (dx * dx + dy * dy <= DEF.slowRadius * DEF.slowRadius) {
          b.takeDamage(DEF.damagePerSec * (dt / 1000));
        }
      }
    }
    barricades = barricades.filter(b => !b.dead);
  }

  function getAll()       { return barricades; }
  function getAt(gx, gy) { return barricades.find(b => b.gx === gx && b.gy === gy) ?? null; }
  function remove(b)      { barricades = barricades.filter(x => x !== b); }
  function clear()        { barricades = []; }

  return { DEFS, DEF: new Proxy({}, { get(_, k) { return DEF[k]; } }), setEra, isValid, place, getSpeedMultiplier, update, getAll, getAt, remove, clear };
})();
