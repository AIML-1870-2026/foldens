/* ============================================================
   town.js — Town health, damage, upgrades, repair, era advancement
   ============================================================ */

const Town = (() => {

  const BASE_HEALTH = { 1: 500, 2: 750, 3: 1000, 4: 1400, 5: 2000 };

  const UPGRADE_CONFIG = {
    1: { hp: 100, cost: { bone: 10, wood:  8 },        maxUpgrades: 3 },
    2: { hp: 150, cost: { stone:12, iron:  10 },        maxUpgrades: 3 },
    3: { hp: 200, cost: { timber:14, gunpowder:10 },    maxUpgrades: 3 },
    4: { hp: 250, cost: { steel:18, oil:  12 },         maxUpgrades: 3 },
    5: { hp: 400, cost: { alloy:22, plasma:16 },        maxUpgrades: 3 },
  };

  const REPAIR_CONFIG = {
    1: { hp:  80, cost: { bone:  6, wood:   4 } },
    2: { hp: 120, cost: { stone: 8, iron:   6 } },
    3: { hp: 160, cost: { timber:10, gunpowder:8 } },
    4: { hp: 200, cost: { steel:12, oil:   10 } },
    5: { hp: 300, cost: { alloy:16, plasma:12 } },
  };

  let maxHealth    = BASE_HEALTH[1];
  let health       = BASE_HEALTH[1];
  let upgradeCount = 0;

  function init(era) { reset(era); }

  function takeDamage(n) {
    if (health <= 0) return;
    health = Math.max(0, health - n);
    if (health === 0) Events.emit('game:over', {});
  }

  function isDestroyed() { return health <= 0; }

  function reset(era) {
    maxHealth    = BASE_HEALTH[era] ?? BASE_HEALTH[1];
    health       = maxHealth;
    upgradeCount = 0;
  }

  // upgrade(era) — raises maxHealth and heals by upgrade HP amount.
  // Returns: 'ok' | 'maxed' | 'insufficient'
  function upgrade(era) {
    const cfg = UPGRADE_CONFIG[era];
    if (!cfg) return 'insufficient';
    if (upgradeCount >= cfg.maxUpgrades) return 'maxed';
    if (!Resources.spendResources(cfg.cost)) return 'insufficient';
    upgradeCount++;
    maxHealth += cfg.hp;
    health    = Math.min(health + cfg.hp, maxHealth);
    return 'ok';
  }

  // repair(era) — restores HP up to maxHealth.
  // Returns: 'ok' | 'full' | 'insufficient'
  function repair(era) {
    if (health >= maxHealth) return 'full';
    const cfg = REPAIR_CONFIG[era];
    if (!cfg) return 'insufficient';
    if (!Resources.spendResources(cfg.cost)) return 'insufficient';
    health = Math.min(health + cfg.hp, maxHealth);
    return 'ok';
  }

  function getHealth()        { return health; }
  function getMaxHealth()     { return maxHealth; }
  function getUpgradeCount()  { return upgradeCount; }
  function getUpgradeConfig(era) { return UPGRADE_CONFIG[era] ?? null; }
  function getRepairConfig(era)  { return REPAIR_CONFIG[era]  ?? null; }

  return { init, takeDamage, isDestroyed, reset, upgrade, repair,
           getHealth, getMaxHealth, getUpgradeCount, getUpgradeConfig, getRepairConfig };
})();
