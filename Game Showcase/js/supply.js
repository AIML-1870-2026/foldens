/* ============================================================
   supply.js — Supply network: connections, priority distribution
   ============================================================ */

// Supply is only active from Era 3. In Eras 1–2, no production is registered
// so getTotalProduction() returns 0 and all supplyHealth stays at 0.

var Supply = (() => {

  const PRIORITIES = ['low', 'medium', 'high'];

  // Map(towerId → { priority: 'low'|'medium'|'high', supplyHealth: 0–1 })
  const connections = new Map();

  let totalProductionRate = 0;

  // ----- Connection management -----

  function connect(towerId, priority = 'medium') {
    if (!connections.has(towerId)) {
      connections.set(towerId, { priority, supplyHealth: 0 });
    }
  }

  function disconnect(towerId) {
    connections.delete(towerId);
  }

  function cyclePriority(towerId) {
    const c = connections.get(towerId);
    if (!c) return;
    const i = PRIORITIES.indexOf(c.priority);
    c.priority = PRIORITIES[(i + 1) % PRIORITIES.length];
  }

  function getConnection(towerId) { return connections.get(towerId) ?? null; }
  function getAllConnections()     { return connections; }

  // ----- Production -----

  function addProduction(unitsPerSec) { totalProductionRate += unitsPerSec; }
  function getTotalProduction()        { return totalProductionRate; }
  function getTotalDraw()              { return connections.size; }

  // ----- Supply multiplier (Step 15) -----
  // Returns dmgMult and speedPenalty based on supply health level.
  function getSupplyMultiplier(h) {
    if (h >= 0.75) return { dmgMult: 1.0,  speedPenalty: 0,   dormant: false };
    if (h >= 0.30) return { dmgMult: 0.6,  speedPenalty: 0.5, dormant: false };
    if (h  >  0)   return { dmgMult: 0.25, speedPenalty: 1.5, dormant: false };
    return                 { dmgMult: 0,   speedPenalty: 0,   dormant: true  };
  }

  // ----- Per-tick distribution -----
  // Gradually moves each tower's supplyHealth toward its target (0–1)
  // at a rate of 2 units/sec so changes feel smooth rather than instant.
  function update(dt) {
    if (connections.size === 0) return;

    const dtSec = (dt ?? 16) / 1000;
    const RATE  = 2; // health units per second of adjustment

    const byPriority = { high: [], medium: [], low: [] };
    for (const [id, c] of connections) byPriority[c.priority].push([id, c]);

    let remaining = totalProductionRate;

    for (const tier of ['high', 'medium', 'low']) {
      const group = byPriority[tier];
      if (group.length === 0) continue;
      const target = remaining >= group.length ? 1 : (group.length > 0 ? remaining / group.length : 0);
      for (const [, c] of group) {
        const delta = target - c.supplyHealth;
        c.supplyHealth += Math.sign(delta) * Math.min(Math.abs(delta), RATE * dtSec);
        c.supplyHealth = Math.max(0, Math.min(1, c.supplyHealth));
      }
      remaining = Math.max(0, remaining - group.length);
    }
  }

  return {
    PRIORITIES,
    connect, disconnect, cyclePriority,
    getConnection, getAllConnections,
    addProduction, getTotalProduction, getTotalDraw,
    getSupplyMultiplier,
    update,
  };
})();
