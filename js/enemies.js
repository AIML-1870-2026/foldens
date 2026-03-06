/* ============================================================
   enemies.js — Enemy classes, movement, animation
   ============================================================ */

const Enemies = (() => {

  // ----- Enemy definitions -----
  // speedTiles: tiles per second (1 tile = 40px)
  // goldRange: [min, max] reward on kill (used in Step 9)
  const DEFS = {
    // Era 1 — Prehistoric
    boar:         { era:1, health:  50, speedTiles:2.8, townDamage: 15, spriteKey:'boar',           drawW: 80,  drawH: 80,  goldRange:[8,12]  },
    sabreTooth:   { era:1, health:  80, speedTiles:4.0, townDamage: 25, spriteKey:'saberToothTiger', drawW:110,  drawH: 62,  goldRange:[8,12]  },
    mastodon:     { era:1, health: 280, speedTiles:1.0, townDamage: 80, spriteKey:'mammoth',          drawW:180,  drawH:105,  goldRange:[18,22] },

    // Era 2 — Medieval
    witch:        { era:2, health:  90, speedTiles:1.8, townDamage: 20, spriteKey:'witch',            drawW: 80,  drawH: 80,  goldRange:[8,12]  },
    vampire:      { era:2, health: 130, speedTiles:2.8, townDamage: 35, spriteKey:'vampire',          drawW: 80,  drawH: 80,  goldRange:[8,12]  },
    ghost:        { era:2, health: 160, speedTiles:1.0, townDamage: 50, spriteKey:'ghost',            drawW: 80,  drawH: 80,  goldRange:[18,22] },

    // Era 3 — Pirate
    pirateSword:  { era:3, health: 140, speedTiles:1.8, townDamage: 40, spriteKey:'pirateSword',      drawW: 80,  drawH: 80,  goldRange:[8,12]  },
    pirateRifle:  { era:3, health: 100, speedTiles:1.0, townDamage: 30, spriteKey:'pirateRifle',      drawW: 80,  drawH: 80,  goldRange:[8,12]  },
    pirateBomb:   { era:3, health: 180, speedTiles:1.8, townDamage: 70, spriteKey:'pirateBomb',       drawW: 80,  drawH: 80,  goldRange:[18,22] },

    // Era 4 — WW2 Zombies
    gruntZombie:  { era:4, health: 180, speedTiles:1.8, townDamage: 45, spriteKey:'gruntZombie',      drawW: 80,  drawH: 80,  goldRange:[8,12]  },
    vombie:       { era:4, health: 220, speedTiles:1.0, townDamage: 65, spriteKey:'vombie',           drawW: 80,  drawH: 80,  goldRange:[18,22] },
    necroZombie:  { era:4, health: 300, speedTiles:1.0, townDamage: 90, spriteKey:'necroZombie',      drawW: 80,  drawH: 80,  goldRange:[18,22] },

    // Era 5 — Sci-Fi
    laserAlien:   { era:5, health: 280, speedTiles:2.8, townDamage: 70, spriteKey:'laserAlien',       drawW: 80,  drawH: 80,  goldRange:[8,12]  },
    fortniteBart: { era:5, health: 350, speedTiles:1.8, townDamage:100, spriteKey:'fortniteBart',     drawW: 80,  drawH: 80,  goldRange:[18,22] },
    flyingSaucer: { era:5, health: 220, speedTiles:4.0, townDamage: 55, spriteKey:'flyingSaucer',     drawW: 80,  drawH: 80,  goldRange:[8,12]  },
  };

  // Active enemy list
  let enemies = [];

  // ----- Enemy class -----
  class Enemy {
    constructor(type) {
      const def = DEFS[type];
      if (!def) throw new Error(`[Enemies] unknown type: ${type}`);

      this.type       = type;
      this.health     = def.health;
      this.maxHealth  = def.health;
      this.speed      = def.speedTiles * Map.CELL;  // px/s
      this.townDamage = def.townDamage;
      this.spriteKey  = def.spriteKey;
      this.drawW      = def.drawW;
      this.drawH      = def.drawH;

      // Roll gold reward once on spawn (used in Step 9)
      const [lo, hi] = def.goldRange;
      this.goldReward = lo + Math.floor(Math.random() * (hi - lo + 1));

      // Path progress
      this.distance = 0;           // arc-length along spline (px)

      // Lateral wobble — sinusoidal with per-enemy randomised phase and freq
      this.wobblePhase = Math.random() * Math.PI * 2;
      this.wobbleFreq  = 0.35 + Math.random() * 0.25;  // Hz
      this.wobble      = 0;

      // Animation
      this.frameIndex   = Math.floor(Math.random() * 20); // stagger frames
      this.frameElapsed = 0;

      // State flags
      this.dead    = false;
      this.reached = false;  // reached town end (despawn silently)
    }

    // Advance position along the spline and update wobble.
    // Speed is scaled by any nearby barricade's slowFactor.
    updatePosition(dt) {
      const pos  = this.getPosition();
      const mult = Barricades.getSpeedMultiplier(pos.x, pos.y);
      this.distance += this.speed * mult * (dt / 1000);

      // Sinusoidal lateral wobble, clamped to ±60px
      this.wobblePhase += this.wobbleFreq * 2 * Math.PI * (dt / 1000);
      this.wobble = Math.sin(this.wobblePhase) * 60;

      if (this.distance >= Path.calculateTotalLength()) {
        this.reached = true;
      }
    }

    // Returns canvas pixel position {x, y} including wobble.
    getPosition() {
      const pathPt  = Path.getPositionAtDistance(this.distance);
      const tangent = Path.getTangentAtDistance(this.distance);
      // Perpendicular to direction of travel (rotated 90° CCW)
      const perpX = -tangent.y;
      const perpY =  tangent.x;
      return {
        x: pathPt.x + perpX * this.wobble,
        y: pathPt.y + perpY * this.wobble,
      };
    }

    // Returns unit direction vector {x, y} at current position.
    getFacing() {
      return Path.getTangentAtDistance(this.distance);
    }

    // Step animation frame forward.
    updateAnimation(dt) {
      const animEntry = Assets.getAnim(this.spriteKey, 'walk');
      if (!animEntry) return;
      const frameDur = 1000 / animEntry.meta.fps;
      this.frameElapsed += dt;
      while (this.frameElapsed >= frameDur) {
        this.frameIndex++;
        this.frameElapsed -= frameDur;
      }
    }

    // Called by tower combat (Step 8).
    takeDamage(n) {
      this.health -= n;
      if (this.health <= 0 && !this.dead) this.die();
    }

    // Mark dead and emit event (Step 8/9).
    die() {
      this.dead = true;
      Events.emit('enemy:killed', { goldReward: this.goldReward, type: this.type });
    }
  }

  // ----- Public API -----

  function spawn(type) {
    enemies.push(new Enemy(type));
  }

  function update(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.updatePosition(dt);
      e.updateAnimation(dt);
      if (e.reached) {
        Town.takeDamage(e.townDamage);
        enemies.splice(i, 1);
      } else if (e.dead) {
        enemies.splice(i, 1);
      }
    }
  }

  function getAll()  { return enemies; }
  function count()   { return enemies.length; }
  function clear()   { enemies = []; }

  return { spawn, update, getAll, count, clear, DEFS };
})();
