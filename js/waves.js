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
      /* W1 */ [{ type:'boar',       count: 90 }],
      /* W2 */ [{ type:'sabreTooth', count: 90 }],
      /* W3 */ [{ type:'mastodon',   count: 42 }],
      /* W4 */ [{ type:'boar',       count:128 }, { type:'sabreTooth', count:85 }],
      /* W5 */ [{ type:'boar',       count: 90 }, { type:'sabreTooth', count:79 }, { type:'mastodon', count:56 }],
    ],

    // ── Era 2 — Medieval ─────────────────────────────────────────────────
    2: [
      /* W1 */ [{ type:'witch',   count: 66 }],
      /* W2 */ [{ type:'vampire', count:102 }],
      /* W3 */ [{ type:'ghost',   count:162 }],
      /* W4 */ [{ type:'witch',   count: 94 }, { type:'vampire', count:94 }],
      /* W5 */ [{ type:'witch',   count: 96 }, { type:'vampire', count:96 }, { type:'ghost', count:83 }],
    ],

    // ── Era 3 — Pirate ───────────────────────────────────────────────────
    3: [
      /* W1 */ [{ type:'pirateSword', count: 71 }],
      /* W2 */ [{ type:'pirateRifle', count:109 }],
      /* W3 */ [{ type:'pirateSword', count: 51 }, { type:'pirateRifle', count:51 }, { type:'pirateBomb', count:50 }],
      /* W4 */ [{ type:'pirateSword', count: 81 }, { type:'pirateRifle', count:71 }, { type:'pirateBomb', count:50 }],
      /* W5 */ [{ type:'pirateSword', count:103 }, { type:'pirateRifle', count:103 }, { type:'pirateBomb', count:88 }],
    ],

    // ── Era 4 — WW2 Zombies ──────────────────────────────────────────────
    4: [
      /* W1 */ [{ type:'gruntZombie', count: 97 }],
      /* W2 */ [{ type:'vombie',      count:150 }],
      /* W3 */ [{ type:'gruntZombie', count:104 }, { type:'vombie',     count:104 }],
      /* W4 */ [{ type:'gruntZombie', count:125 }, { type:'vombie',     count: 97 }, { type:'necroZombie', count:55 }],
      /* W5 */ [{ type:'gruntZombie', count:182 }, { type:'vombie',     count:121 }, { type:'necroZombie', count:101 }],
    ],

    // ── Era 5 — Sci-Fi ───────────────────────────────────────────────────
    5: [
      /* W1 */ [{ type:'laserAlien',   count:101 }],
      /* W2 */ [{ type:'flyingSaucer', count:155 }],
      /* W3 */ [{ type:'laserAlien',   count:108 }, { type:'fortniteBart', count:108 }],
      /* W4 */ [{ type:'laserAlien',   count:115 }, { type:'fortniteBart', count:101 }, { type:'flyingSaucer', count:72 }],
      /* W5 */ [{ type:'laserAlien',   count:189 }, { type:'fortniteBart', count:142 }, { type:'flyingSaucer', count:142 }],
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
