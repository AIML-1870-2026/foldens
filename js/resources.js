/* ============================================================
   resources.js — Gold balance, material stockpiles, affordability
   ============================================================ */

const Resources = (() => {

  let gold = 120;

  // All stockpile resource types across all eras.
  // Starting values: bone=15, wood=20 (Era 1 production materials).
  const stockpiles = {
    bone:      15,
    wood:      20,
    stone:      0,
    iron:       0,
    timber:     0,
    gunpowder:  0,
    steel:      0,
    oil:        0,
    alloy:      0,
    plasma:     0,
  };

  // ----- Gold -----

  function addGold(n) {
    gold += n;
  }

  // spendGold(n) — deducts n gold. Returns false if insufficient.
  function spendGold(n) {
    if (gold < n) return false;
    gold -= n;
    return true;
  }

  function getGold() { return gold; }

  // ----- Stockpiles -----

  function addResource(type, n) {
    if (type in stockpiles) stockpiles[type] += n;
  }

  // canAfford(costs) — returns true if gold and all stockpile costs can be met.
  // costs: { gold?: n, bone?: n, wood?: n, ... }
  function canAfford(costs) {
    for (const [res, amt] of Object.entries(costs)) {
      if (res === 'gold') {
        if (gold < amt) return false;
      } else {
        if ((stockpiles[res] ?? 0) < amt) return false;
      }
    }
    return true;
  }

  // spendResources(costs) — deducts costs if affordable. Returns bool.
  function spendResources(costs) {
    if (!canAfford(costs)) return false;
    for (const [res, amt] of Object.entries(costs)) {
      if (res === 'gold') gold -= amt;
      else stockpiles[res] -= amt;
    }
    return true;
  }

  // getStockpile() — snapshot copy of the current stockpile object.
  function getStockpile() { return { ...stockpiles }; }

  // ----- Production -----

  // Total rate per resource type (ratePerSec) — stacks additively across buildings.
  const productionRates = {};
  // Sub-unit accumulator — avoids fractional stockpile values.
  const productionAccum = {};

  // addProduction(type, ratePerSec) — called once per building purchase.
  function addProduction(type, ratePerSec) {
    productionRates[type] = (productionRates[type] ?? 0) + ratePerSec;
  }

  // update(dt) — called each game frame; credits whole units to stockpiles.
  function update(dt) {
    for (const [type, rate] of Object.entries(productionRates)) {
      productionAccum[type] = (productionAccum[type] ?? 0) + rate * (dt / 1000);
      const whole = Math.floor(productionAccum[type]);
      if (whole > 0) {
        if (type in stockpiles) stockpiles[type] += whole;
        productionAccum[type] -= whole;
      }
    }
  }

  return { addGold, spendGold, getGold, addResource, canAfford, spendResources, getStockpile, addProduction, update };
})();
