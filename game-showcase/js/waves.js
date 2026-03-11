/* ============================================================
   waves.js — Wave definitions (all 5 eras) + WaveSpawner
   ============================================================ */

const Waves = (() => {

  // ----- Wave definitions -----
  // WAVE_DEFS[era][waveIndex] = array of { type, count }
  // waveIndex is 0-based internally; callers use 1-based wave numbers.
  // For mixed waves the queue is Fisher-Yates shuffled before spawning.
  const WAVE_DEFS = {

    // ── Era 1 — Prehistoric ───────────────────────────────────────────────
    1: [
      /* W1 */ [{ type:'boar',       count: 10 }],
      /* W2 */ [{ type:'sabreTooth', count: 10 }],
      /* W3 */ [{ type:'mastodon',   count:  6 }],
      /* W4 */ [{ type:'boar',       count: 13 }, { type:'sabreTooth', count: 10 }],
      /* W5 */ [{ type:'boar',       count: 13 }, { type:'sabreTooth', count: 10 }, { type:'mastodon', count: 6 }],
    ],

    // ── Era 2 — Medieval ─────────────────────────────────────────────────
    2: [
      /* W1 */ [{ type:'witch',   count: 10 }],
      /* W2 */ [{ type:'vampire', count: 13 }],
      /* W3 */ [{ type:'ghost',   count: 15 }],
      /* W4 */ [{ type:'witch',   count: 13 }, { type:'vampire', count: 13 }],
      /* W5 */ [{ type:'witch',   count: 13 }, { type:'vampire', count: 13 }, { type:'ghost', count: 10 }],
    ],

    // ── Era 3 — Pirate ───────────────────────────────────────────────────
    3: [
      /* W1 */ [{ type:'pirateSword', count: 10 }],
      /* W2 */ [{ type:'pirateRifle', count: 13 }],
      /* W3 */ [{ type:'pirateSword', count:  8 }, { type:'pirateRifle', count: 8 }, { type:'pirateBomb', count: 6 }],
      /* W4 */ [{ type:'pirateSword', count: 10 }, { type:'pirateRifle', count: 9 }, { type:'pirateBomb', count: 8 }],
      /* W5 */ [{ type:'pirateSword', count: 13 }, { type:'pirateRifle', count:13 }, { type:'pirateBomb', count:10 }],
    ],

    // ── Era 4 — WW2 Zombies ──────────────────────────────────────────────
    4: [
      /* W1 */ [{ type:'gruntZombie', count: 13 }],
      /* W2 */ [{ type:'vombie',      count: 15 }],
      /* W3 */ [{ type:'gruntZombie', count: 13 }, { type:'vombie',     count: 13 }],
      /* W4 */ [{ type:'gruntZombie', count: 15 }, { type:'vombie',     count: 13 }, { type:'necroZombie', count:  6 }],
      /* W5 */ [{ type:'gruntZombie', count: 19 }, { type:'vombie',     count: 15 }, { type:'necroZombie', count: 13 }],
    ],

    // ── Era 5 — Sci-Fi ───────────────────────────────────────────────────
    5: [
      /* W1 */ [{ type:'laserAlien',   count: 13 }],
      /* W2 */ [{ type:'flyingSaucer', count: 15 }],
      /* W3 */ [{ type:'laserAlien',   count: 13 }, { type:'fortniteBart', count: 13 }],
      /* W4 */ [{ type:'laserAlien',   count: 15 }, { type:'fortniteBart', count: 13 }, { type:'flyingSaucer', count:  9 }],
      /* W5 */ [{ type:'laserAlien',   count: 19 }, { type:'fortniteBart', count: 15 }, { type:'flyingSaucer', count: 15 }],
    ],
  };

  // ----- Spawner state -----
  const SPAWN_INTERVAL = 1500;  // ms between spawns

  let spawnQueue   = [];   // flat array of type strings, shuffled
  let spawned      = 0;    // how many have been released so far
  let spawnTimer   = 0;    // ms elapsed since last spawn
  let active       = false;

  // Fisher-Yates shuffle of a flat array of type strings built from wave def.
  function buildQueue(waveDef) {
    const flat = [];
    for (const { type, count } of waveDef) {
      for (let i = 0; i < count; i++) flat.push(type);
    }
    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flat[i], flat[j]] = [flat[j], flat[i]];
    }
    return flat;
  }

  // ----- Public API -----

  // startWave(era, wave) — 1-based era and wave numbers.
  function startWave(era, wave) {
    const def = WAVE_DEFS[era]?.[wave - 1];
    if (!def) {
      console.warn('[Waves] no definition for era', era, 'wave', wave);
      return;
    }
    Enemies.clear();
    spawnQueue = buildQueue(def);
    spawned    = 0;
    spawnTimer = SPAWN_INTERVAL; // trigger first spawn immediately on first update
    active     = true;
    console.log(`[Waves] starting era ${era} wave ${wave} — ${spawnQueue.length} enemies`);
  }

  // update(dt) — call every frame during a wave.
  function update(dt) {
    if (!active) return;

    // Release enemies at 1.5s intervals
    if (spawned < spawnQueue.length) {
      spawnTimer += dt;
      while (spawnTimer >= SPAWN_INTERVAL && spawned < spawnQueue.length) {
        Enemies.spawn(spawnQueue[spawned]);
        spawned++;
        spawnTimer -= SPAWN_INTERVAL;
      }
    }

    // Wave is complete when all are spawned AND none remain on the field
    if (spawned >= spawnQueue.length && Enemies.count() === 0) {
      active = false;
      Events.emit('wave:complete', {});
      console.log('[Waves] wave:complete');
    }
  }

  function isActive() { return active; }

  return { WAVE_DEFS, startWave, update, isActive };
})();
