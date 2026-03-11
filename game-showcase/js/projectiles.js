/* ============================================================
   projectiles.js — Visual-only projectile system
   Damage is still instant; projectiles are purely cosmetic.
   ============================================================ */

const Projectiles = (() => {

  // Per-tower-type projectile appearance.
  // null = melee tower, no projectile spawned.
  const PROJ_DEFS = {
    // Era 1 — Prehistoric
    club:        null,
    rockThrower: { speed: 420, r: 6,   color: '#aaaaaa', trailColor: '#777777', shape: 'ball'  },
    spear:       { speed: 540, r: 3,   color: '#cd853f', trailColor: '#8B5500', shape: 'arrow' },

    // Era 2 — Medieval
    sword:       null,
    cavalry:     null,
    crossbow:    { speed: 580, r: 2.5, color: '#c8a020', trailColor: '#806010', shape: 'arrow' },

    // Era 3 — Pirate
    cutlass:     null,
    blunderbuss: { speed: 500, r: 5,   color: '#dddddd', trailColor: '#999999', shape: 'ball'  },
    mortar:      { speed: 340, r: 8,   color: '#556655', trailColor: '#334433', shape: 'ball'  },

    // Era 4 — WW2
    rifleman:    { speed: 680, r: 3,   color: '#ffe866', trailColor: '#ff8800', shape: 'ball'  },
    machineGun:  { speed: 740, r: 2.5, color: '#ffe866', trailColor: '#ff8800', shape: 'ball'  },
    artillery:   { speed: 360, r: 9,   color: '#887766', trailColor: '#554433', shape: 'ball'  },

    // Era 5 — Sci-Fi
    laserTurret: { speed: 860, r: 3,   color: '#00ffff', trailColor: '#0088ff', shape: 'beam', glow: true },
    railgun:     { speed: 960, r: 4,   color: '#88ccff', trailColor: '#4466ff', shape: 'beam', glow: true },
    nukeStation: { speed: 290, r: 13,  color: '#00ff66', trailColor: '#00aa33', shape: 'ball', glow: true },
  };

  let list = [];

  // fire — spawn a projectile from (fromX, fromY) aimed at (toX, toY).
  function fire(type, fromX, fromY, toX, toY) {
    const def = PROJ_DEFS[type];
    if (!def) return; // melee — skip

    const dx   = toX - fromX;
    const dy   = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;

    list.push({
      x:        fromX,
      y:        fromY,
      ndx:      dx / dist,
      ndy:      dy / dist,
      dist,
      traveled: 0,
      def,
    });
  }

  function update(dt) {
    const dtS = dt / 1000;
    for (let i = list.length - 1; i >= 0; i--) {
      const p    = list[i];
      const move = p.def.speed * dtS;
      p.traveled += move;
      p.x        += p.ndx * move;
      p.y        += p.ndy * move;
      if (p.traveled >= p.dist) list.splice(i, 1);
    }
  }

  function getAll() { return list; }
  function clear()  { list = []; }

  return { fire, update, getAll, clear };
})();
