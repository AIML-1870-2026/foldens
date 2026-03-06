/* ============================================================
   map.js — Grid data model, zone constants, coordinate helpers
   ============================================================ */

const Map = (() => {
  // ----- Constants -----
  const COLS = 48;
  const ROWS = 27;
  const CELL = 40; // px per cell

  // Defense zone: cols 0-23  (pixels 0–959)
  // Settlement zone: cols 24-47 (pixels 960–1919)
  const WALL_COL = 24;

  const DEFENSE_ZONE    = { minCol: 0,        maxCol: WALL_COL - 1 };
  const SETTLEMENT_ZONE = { minCol: WALL_COL,  maxCol: COLS - 1 };

  // ----- Coordinate helpers -----
  // gridToPixel returns the CENTER of the cell in canvas pixels.
  //   gridToPixel(0,0)   → {x:20,  y:20}
  //   gridToPixel(47,26) → {x:1900, y:1060}
  function gridToPixel(gx, gy) {
    return { x: 20 + gx * CELL, y: 20 + gy * CELL };
  }

  function pixelToGrid(px, py) {
    return {
      x: Math.floor((px - 20) / CELL),
      y: Math.floor((py - 20) / CELL),
    };
  }

  // ----- Grid build -----
  // Each cell: { state: 'open' | 'path' | 'wall' | 'blocked' }
  const grid = [];
  for (let gy = 0; gy < ROWS; gy++) {
    grid[gy] = [];
    for (let gx = 0; gx < COLS; gx++) {
      // Defense zone defaults to 'open'; settlement zone to 'blocked'
      grid[gy][gx] = { state: gx < WALL_COL ? 'open' : 'blocked' };
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

  return {
    COLS, ROWS, CELL, WALL_COL,
    DEFENSE_ZONE, SETTLEMENT_ZONE,
    grid,
    gridToPixel, pixelToGrid,
    getCell, setCell,
    isDefenseZone, isSettlementZone, isAdjacentToPath,
  };
})();
