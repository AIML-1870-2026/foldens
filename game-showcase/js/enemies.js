/* ============================================================
   enemies.js — Enemy classes, movement, animation
   ============================================================ */

const Enemies = (() => {

  // ----- Enemy definitions -----
  // speedTiles: tiles per second (1 tile = GameMap.CELL px)
  // goldRange: [min, max] reward on kill (used in Step 9)
  const DEFS = {
    // Era 1 — Prehistoric
    boar:         { era:1, health: 100, speedTiles:2.8, townDamage: 15, spriteKey:'boar',           drawW: 124, drawH: 70,  goldRange:[8,12]  },
    sabreTooth:   { era:1, health: 160, speedTiles:4.0, townDamage: 25, spriteKey:'saberToothTiger', drawW: 124, drawH: 70,  goldRange:[8,12]  },
    mastodon:     { era:1, health: 560, speedTiles:1.0, townDamage: 80, spriteKey:'mammoth',          drawW: 124, drawH: 70,  goldRange:[18,22] },

    // Era 2 — Medieval
    witch:        { era:2, health: 360, speedTiles:1.8, townDamage: 20, spriteKey:'witch',            drawW: 124, drawH: 70,  goldRange:[8,12]  },
    vampire:      { era:2, health: 520, speedTiles:2.8, townDamage: 35, spriteKey:'vampire',          drawW: 124, drawH: 70,  goldRange:[8,12]  },
    ghost:        { era:2, health: 640, speedTiles:1.0, townDamage: 50, spriteKey:'ghost',            drawW: 124, drawH: 70,  goldRange:[18,22] },

    // Era 3 — Pirate
    pirateSword:  { era:3, health:1050, speedTiles:1.8, townDamage: 40, spriteKey:'pirateSword',      drawW: 124, drawH: 70,  goldRange:[8,12]  },
    pirateRifle:  { era:3, health: 750, speedTiles:1.0, townDamage: 30, spriteKey:'pirateRifle',      drawW: 124, drawH: 70,  goldRange:[8,12]  },
    pirateBomb:   { era:3, health:1350, speedTiles:1.8, townDamage: 70, spriteKey:'pirateBomb',       drawW: 124, drawH: 70,  goldRange:[18,22] },

    // Era 4 — WW2 Zombies
    gruntZombie:  { era:4, health: 720, speedTiles:1.8, townDamage: 45, spriteKey:'gruntZombie',      drawW: 124, drawH: 70,  goldRange:[8,12]  },
    vombie:       { era:4, health: 880, speedTiles:1.0, townDamage: 65, spriteKey:'vombie',           drawW: 124, drawH: 70,  goldRange:[18,22] },
    necroZombie:  { era:4, health:1200, speedTiles:1.0, townDamage: 90, spriteKey:'necroZombie',      drawW: 124, drawH: 70,  goldRange:[18,22] },

    // Era 5 — Sci-Fi
    laserAlien:   { era:5, health:1120, speedTiles:2.8, townDamage: 70, spriteKey:'laserAlien',       drawW: 124, drawH: 70,  goldRange:[8,12]  },
    fortniteBart: { era:5, health:1400, speedTiles:1.8, townDamage:100, spriteKey:'mechAlien',        drawW: 124, drawH: 70,  goldRange:[18,22] },
    flyingSaucer: { era:5, health: 880, speedTiles:4.0, townDamage: 55, spriteKey:'saucerAlien',      drawW: 124, drawH: 70,  goldRange:[8,12]  },
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
      this.speed      = def.speedTiles * GameMap.CELL;  // px/s
      this.townDamage = def.townDamage;
      this.spriteKey  = def.spriteKey;
      this.drawW      = def.drawW;
      this.drawH      = def.drawH;

      // Roll gold reward once on spawn (used in Step 9)
      const [lo, hi] = def.goldRange;
      this.goldReward = lo + Math.floor(Math.random() * (hi - lo + 1));

      // Path progress
      this.distance = 0;           // arc-length along spline (px)

      // Fixed random y offset — staggered position along the path (±10px)
      this.yOffset = (Math.random() * 2 - 1) * 10;

      // Animation
      this.frameIndex   = Math.floor(Math.random() * 20); // stagger frames
      this.frameElapsed = 0;

      // State flags
      this.dead      = false;
      this.reached   = false;  // reached town end
      this.attacking = false;  // reached gate, playing attack animation
      this.attackTimer    = 0;   // countdown to next attack (seconds)
      this.attackInterval = 1.5; // seconds between gate attacks

      // Health bar visibility timer (seconds remaining)
      this.damageTimer = 0;
    }

    // Tick the health bar visibility timer.
    updateDamageTimer(dt) {
      if (this.damageTimer > 0) this.damageTimer -= dt / 1000;
    }

    // Advance position along the spline and update wobble.
    // Speed is scaled by any nearby barricade's slowFactor.
    updatePosition(dt) {
      const pos  = this.getPosition();
      const mult = Barricades.getSpeedMultiplier(pos.x, pos.y);
      this.distance += this.speed * mult * (dt / 1000);

      if (this.distance >= Path.calculateTotalLength()) {
        this.reached = true;
      }
    }

    // Returns canvas pixel position {x, y} including fixed y offset.
    getPosition() {
      const pathPt = Path.getPositionAtDistance(this.distance);
      return {
        x: pathPt.x,
        y: pathPt.y + this.yOffset,
      };
    }

    // Returns unit direction vector {x, y} at current position.
    getFacing() {
      return Path.getTangentAtDistance(this.distance);
    }

    // Step animation frame forward (walk or attack based on state).
    updateAnimation(dt) {
      const animKey  = this.attacking ? 'attack' : 'walk';
      const animEntry = Assets.getAnim(this.spriteKey, animKey)
                     ?? Assets.getAnim(this.spriteKey, 'walk');
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
      this.damageTimer = 4;  // show health bar for 4 seconds after last hit
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
    const def = DEFS[type];
    if (def) Assets.load(def.spriteKey);
    enemies.push(new Enemy(type));
    playSound(ENEMY_SFX[type]);
  }

  function update(dt) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];

      if (!e.attacking) {
        e.updatePosition(dt);
      }
      e.updateAnimation(dt);
      e.updateDamageTimer(dt);

      // Transition: reached gate → start attacking
      if (!e.attacking && e.reached) {
        e.attacking   = true;
        e.frameIndex  = 0;
        e.frameElapsed = 0;
        e.attackTimer = 0; // fire first hit immediately
      }

      // Gate attack: deal periodic damage until killed
      if (e.attacking) {
        e.attackTimer -= dt / 1000;
        if (e.attackTimer <= 0) {
          e.attackTimer = e.attackInterval;
          Town.takeDamage(Math.ceil(e.townDamage / 3));
        }
      }

      if (e.dead) {
        enemies.splice(i, 1);
      }
    }
  }

  function getAll()  { return enemies; }
  function count()   { return enemies.length; }
  function clear()   { enemies = []; }

  return { spawn, update, getAll, count, clear, DEFS };
})();
