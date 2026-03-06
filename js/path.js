/* ============================================================
   path.js — Enemy path: Catmull-Rom spline, arc-length queries
   ============================================================ */

const Path = (() => {
  // 5 base waypoints in canvas pixels.
  // Forms an S-curve through the defense zone (x: 0–960).
  // P0 = left-edge spawn. P4 = wall entry at row 13 (y=540).
  const WAYPOINTS = [
    { x:   0, y: 200 },   // P0 — left edge, upper area (row ~4.5)
    { x: 240, y: 880 },   // P1 — quarter-way, lower  (row ~21.5)
    { x: 480, y: 200 },   // P2 — halfway,    upper   (row ~4.5)
    { x: 720, y: 880 },   // P3 — three-quarter, lower (row ~21.5)
    { x: 940, y: 540 },   // P4 — col 23 center, row 13 (wall)
  ];

  // Arc-length lookup table entry: { seg, t, x, y, dist }
  let lut = [];
  let totalLength = 0;

  // ----- Catmull-Rom maths -----

  // Returns position on segment [p1→p2], with p0 and p3 as tangent guides.
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

  // Returns derivative (tangent) on the segment at t.
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

  // Gets the 4 control points for segment index `seg`.
  // Clamps to endpoints for edge segments.
  function controlPoints(seg) {
    const n = WAYPOINTS.length;
    return {
      p0: WAYPOINTS[Math.max(0, seg - 1)],
      p1: WAYPOINTS[seg],
      p2: WAYPOINTS[Math.min(n - 1, seg + 1)],
      p3: WAYPOINTS[Math.min(n - 1, seg + 2)],
    };
  }

  // ----- Arc-length LUT -----

  function buildLUT() {
    const SAMPLES_PER_SEG = 400;
    const numSegs = WAYPOINTS.length - 1;
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

  // Binary-search LUT for the entry nearest to arc-distance d.
  // Returns [loIdx, hiIdx].
  function lutSearch(d) {
    let lo = 0, hi = lut.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (lut[mid].dist < d) lo = mid; else hi = mid;
    }
    return [lo, hi];
  }

  // ----- Public API -----

  function calculateTotalLength() {
    return totalLength;
  }

  // Returns {x, y} on the spline at arc-distance d from the start.
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
    return {
      x: a.x + (b.x - a.x) * frac,
      y: a.y + (b.y - a.y) * frac,
    };
  }

  // Returns a unit direction vector {x, y} at arc-distance d.
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

  // Marks all defense-zone grid cells whose center is within 2 tiles (80px)
  // of the spline center line as state='path'.  Called once on init.
  function markPathCells() {
    const HALF_WIDTH = Map.CELL * 2; // 80px — 2 tiles each side = 4 tiles total

    // Pre-sample path points densely
    const pts = [];
    for (let d = 0; d <= totalLength; d += 4) {
      pts.push(getPositionAtDistance(d));
    }

    for (let gy = 0; gy < Map.ROWS; gy++) {
      for (let gx = 0; gx < Map.WALL_COL; gx++) {
        const cx = 20 + gx * Map.CELL;  // cell center x
        const cy = 20 + gy * Map.CELL;  // cell center y
        for (const pt of pts) {
          const dx = cx - pt.x, dy = cy - pt.y;
          if (dx * dx + dy * dy <= HALF_WIDTH * HALF_WIDTH) {
            Map.setCell(gx, gy, 'path');
            break;
          }
        }
      }
    }
  }

  // ----- Init -----
  buildLUT();
  markPathCells();

  return {
    WAYPOINTS,
    calculateTotalLength,
    getPositionAtDistance,
    getTangentAtDistance,
    markPathCells,
  };
})();
