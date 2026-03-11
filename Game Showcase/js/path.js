/* ============================================================
   path.js — Enemy path: Catmull-Rom spline, arc-length queries
   Waypoints are mutable objects — the PathEditor manipulates them
   directly and calls Path.refreshLUT() / Path.refresh().
   ============================================================ */

const Path = (() => {
  // Active waypoints — mutated in place by the path editor.
  const _waypoints = [
    { x:   0, y: 596 },
    { x: 136, y: 512 },
    { x: 278, y: 153 },
    { x: 396, y: 276 },
    { x: 254, y: 860 },
    { x: 502, y: 849 },
    { x: 590, y: 288 },
    { x: 771, y: 282 },
    { x: 763, y: 546 },
    { x: 957, y: 568 },
  ];

  // Arc-length lookup table entry: { seg, t, x, y, dist }
  let lut = [];
  let totalLength = 0;

  // ----- Catmull-Rom maths -----

  function catmullRomPos(p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t;
    return {
      x: 0.5 * ((2 * p1.x)
               + (-p0.x + p2.x) * t
               + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2
               + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      y: 0.5 * ((2 * p1.y)
               + (-p0.y + p2.y) * t
               + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2
               + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    };
  }

  function catmullRomDeriv(p0, p1, p2, p3, t) {
    const t2 = t * t;
    return {
      x: 0.5 * ((-p0.x + p2.x)
               + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * 2 * t
               + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * 3 * t2),
      y: 0.5 * ((-p0.y + p2.y)
               + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * 2 * t
               + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * 3 * t2),
    };
  }

  function controlPoints(seg) {
    const n = _waypoints.length;
    return {
      p0: _waypoints[Math.max(0, seg - 1)],
      p1: _waypoints[seg],
      p2: _waypoints[Math.min(n - 1, seg + 1)],
      p3: _waypoints[Math.min(n - 1, seg + 2)],
    };
  }

  // ----- Arc-length LUT -----

  function buildLUT() {
    const SAMPLES_PER_SEG = 400;
    const numSegs = _waypoints.length - 1;
    lut = [];
    let dist = 0;
    let prev = null;
    for (let seg = 0; seg < numSegs; seg++) {
      const { p0, p1, p2, p3 } = controlPoints(seg);
      for (let s = 0; s <= SAMPLES_PER_SEG; s++) {
        const t  = s / SAMPLES_PER_SEG;
        const pt = catmullRomPos(p0, p1, p2, p3, t);
        if (prev) {
          const dx = pt.x - prev.x, dy = pt.y - prev.y;
          dist += Math.sqrt(dx * dx + dy * dy);
        }
        lut.push({ seg, t, x: pt.x, y: pt.y, dist });
        prev = pt;
      }
    }
    totalLength = dist;
  }

  function lutSearch(d) {
    let lo = 0, hi = lut.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (lut[mid].dist < d) lo = mid; else hi = mid;
    }
    return [lo, hi];
  }

  // ----- Public API -----

  function calculateTotalLength() { return totalLength; }

  function getPositionAtDistance(d) {
    if (d <= 0) return { x: lut[0].x, y: lut[0].y };
    if (d >= totalLength) {
      const last = lut[lut.length - 1];
      return { x: last.x, y: last.y };
    }
    const [lo, hi] = lutSearch(d);
    const a = lut[lo], b = lut[hi];
    const span = b.dist - a.dist;
    const frac = span > 0 ? (d - a.dist) / span : 0;
    return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
  }

  function getTangentAtDistance(d) {
    if (d < 0) d = 0;
    if (d > totalLength) d = totalLength;
    const [lo, hi] = lutSearch(Math.min(d, totalLength - 0.01));
    const a = lut[lo], b = lut[hi];
    const span = b.dist - a.dist;
    const frac = span > 0 ? (d - a.dist) / span : 0;
    const t    = a.t + (b.t - a.t) * frac;
    const { p0, p1, p2, p3 } = controlPoints(a.seg);
    const deriv = catmullRomDeriv(p0, p1, p2, p3, t);
    const len   = Math.sqrt(deriv.x * deriv.x + deriv.y * deriv.y);
    if (len === 0) return { x: 1, y: 0 };
    return { x: deriv.x / len, y: deriv.y / len };
  }

  function markPathCells() {
    const HALF_WIDTH = GameMap.CELL * 1.9;
    const pts = [];
    for (let d = 0; d <= totalLength; d += 4) pts.push(getPositionAtDistance(d));
    for (let gy = 0; gy < GameMap.ROWS; gy++) {
      for (let gx = 0; gx < GameMap.WALL_COL; gx++) {
        const cx = GameMap.CELL / 2 + gx * GameMap.CELL;
        const cy = GameMap.CELL / 2 + gy * GameMap.CELL;
        for (const pt of pts) {
          const dx = cx - pt.x, dy = cy - pt.y;
          if (dx * dx + dy * dy <= HALF_WIDTH * HALF_WIDTH) {
            GameMap.setCell(gx, gy, 'path');
            break;
          }
        }
      }
    }
  }

  // refreshLUT — fast rebuild during drag (no cell update).
  function refreshLUT() { buildLUT(); }

  // refresh — full reset + rebuild + remark (call on drag end).
  function refresh() {
    GameMap.resetPathCells();
    buildLUT();
    markPathCells();
  }

  // ----- Init -----
  buildLUT();
  markPathCells();

  return {
    get WAYPOINTS() { return _waypoints; },
    calculateTotalLength,
    getPositionAtDistance,
    getTangentAtDistance,
    markPathCells,
    refreshLUT,
    refresh,
  };
})();
