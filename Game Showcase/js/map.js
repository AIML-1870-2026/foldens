/* ============================================================
   map.js — Grid data model, zone constants, coordinate helpers
   ============================================================ */

const GameMap = (() => {
  // ----- Constants -----
  const COLS = 41;
  const ROWS = 23;
  const CELL = 47; // px per cell  (47×23=1081 ≈1080; 41×47=1927 ≈1920)

  // Defense zone: cols 0-20  (pixels 0–986)
  // Settlement zone: cols 21-40 (pixels 987–1926)
  const WALL_COL = 21;

  const DEFENSE_ZONE    = { minCol: 0,        maxCol: WALL_COL - 1 };
  const SETTLEMENT_ZONE = { minCol: WALL_COL,  maxCol: COLS - 1 };

  // ----- Coordinate helpers -----
  // gridToPixel returns the CENTER of the cell in canvas pixels.
  //   gridToPixel(0,0)   → {x:15,  y:15}
  //   gridToPixel(63,35) → {x:1905, y:1065}
  function gridToPixel(gx, gy) {
    return { x: CELL / 2 + gx * CELL, y: CELL / 2 + gy * CELL };
  }

  function pixelToGrid(px, py) {
    return {
      x: Math.floor((px - CELL / 2) / CELL),
      y: Math.floor((py - CELL / 2) / CELL),
    };
  }

  // ----- Grid build -----
  // Each cell: { state: 'open' | 'path' | 'wall' | 'blocked' }
  const grid = [];
  for (let gy = 0; gy < ROWS; gy++) {
    grid[gy] = [];
    for (let gx = 0; gx < COLS; gx++) {
      // Defense zone: 'open'; wall column: 'wall'; settlement zone: 'blocked'
      let state;
      if      (gx < WALL_COL) state = 'open';
      else if (gx === WALL_COL) state = 'wall';
      else                    state = 'blocked';
      grid[gy][gx] = { state };
    }
  }

  // ----- Accessors -----
  function getCell(gx, gy) {
    if (gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS) return null;
    return grid[gy][gx];
  }

  function setCell(gx, gy, state) {
    if (gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS) return;
    grid[gy][gx].state = state;
  }

  function isDefenseZone(gx) { return gx >= DEFENSE_ZONE.minCol && gx <= DEFENSE_ZONE.maxCol; }
  function isSettlementZone(gx) { return gx >= SETTLEMENT_ZONE.minCol && gx <= SETTLEMENT_ZONE.maxCol; }

  // isAdjacentToPath(gx, gy) — true if any of the 4 cardinal neighbors is a path cell.
  function isAdjacentToPath(gx, gy) {
    const neighbors = [[gx - 1, gy], [gx + 1, gy], [gx, gy - 1], [gx, gy + 1]];
    return neighbors.some(([nx, ny]) => {
      const c = getCell(nx, ny);
      return c && c.state === 'path';
    });
  }

  // resetPathCells — clears all 'path' cells back to 'open' in the defense zone.
  function resetPathCells() {
    for (let gy = 0; gy < ROWS; gy++) {
      for (let gx = 0; gx < WALL_COL; gx++) {
        if (grid[gy][gx].state === 'path') grid[gy][gx].state = 'open';
      }
    }
  }

  return {
    COLS, ROWS, CELL, WALL_COL,
    DEFENSE_ZONE, SETTLEMENT_ZONE,
    grid,
    gridToPixel, pixelToGrid,
    getCell, setCell,
    isDefenseZone, isSettlementZone, isAdjacentToPath, resetPathCells,
  };
})();
