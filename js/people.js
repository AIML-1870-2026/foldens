/* ============================================================
   people.js — Population pool, housing capacity, tower assignment
   ============================================================ */

const People = (() => {

  // Starting conditions (design doc):
  // 3 people pre-seeded into unassigned pool, 1 Hut already built (capacity 2).
  // 3 > capacity is intentional — player must build housing before accepting arrivals.
  let totalCapacity  = 2;
  let unassignedPool = 3;

  // towerId (string) → count of assigned people
  const assignedMap = {};

  // Housing type definitions — all earlier eras remain available throughout the game.
  const ERA_HOUSING = {
    1: { name: 'Hut',            capacity: 2,  goldCost: 20,  costs: { bone:  6, wood:   4 } },
    2: { name: 'Cottage',        capacity: 4,  goldCost: 35,  costs: { stone: 8, iron:   6 } },
    3: { name: 'Lodging House',  capacity: 6,  goldCost: 55,  costs: { timber:10, gunpowder:6 } },
    4: { name: 'Barracks Block', capacity: 8,  goldCost: 80,  costs: { steel: 14, oil:   8 } },
    5: { name: 'Habitat Module', capacity: 12, goldCost: 110, costs: { alloy: 18, plasma:12 } },
  };

  // ----- Capacity -----

  function addHousing(slots) { totalCapacity += slots; }

  function getTotalCapacity() { return totalCapacity; }

  // ----- Population counts -----

  function getTotalPeople() {
    const assigned = Object.values(assignedMap).reduce((s, v) => s + v, 0);
    return unassignedPool + assigned;
  }

  function getUnassigned() { return unassignedPool; }

  // ----- Accept / Turn Away -----

  // canAccept() — true if there is room for at least one more person.
  function canAccept() { return getTotalPeople() < totalCapacity; }

  // acceptPerson() — adds 1 to the unassigned pool. Returns false if housing full.
  function acceptPerson() {
    if (!canAccept()) return false;
    unassignedPool++;
    return true;
  }

  // ----- Tower assignment -----

  // assignToTower(towerId) — moves 1 person from unassigned pool to tower.
  function assignToTower(towerId) {
    if (unassignedPool <= 0) return false;
    unassignedPool--;
    assignedMap[towerId] = (assignedMap[towerId] ?? 0) + 1;
    return true;
  }

  // removeFromTower(towerId) — moves 1 person from tower back to unassigned pool.
  function removeFromTower(towerId) {
    if ((assignedMap[towerId] ?? 0) <= 0) return false;
    assignedMap[towerId]--;
    unassignedPool++;
    return true;
  }

  function getAssigned(towerId) { return assignedMap[towerId] ?? 0; }

  // ----- Housing purchase -----

  // buyHousing(era) — deducts gold + construction resources, adds capacity.
  // Uses Resources.canAfford / spendResources which both handle gold and stockpiles.
  function buyHousing(era) {
    const h = ERA_HOUSING[era];
    if (!h) return false;
    const fullCost = { gold: h.goldCost, ...h.costs };
    if (!Resources.canAfford(fullCost)) return false;
    Resources.spendResources(fullCost);
    addHousing(h.capacity);
    return true;
  }

  return {
    addHousing, getTotalCapacity, getTotalPeople, getUnassigned,
    canAccept, acceptPerson, assignToTower, removeFromTower, getAssigned,
    buyHousing, ERA_HOUSING,
  };
})();
