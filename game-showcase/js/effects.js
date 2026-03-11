/* ============================================================
   effects.js — Visual particle effects for ability activations
   ============================================================ */

const AbilityEffects = (() => {

  // Images per era (preloaded on init)
  const IMAGE_PATHS = {
    1: ['assets/Fire Rain/fire-rain.png'],
    2: ['assets/trebuchet/trebuchet.png'],
    3: ['assets/cannonball/cannonball.png'],
    4: ['assets/Fighter Jets/fighter-jet.png', 'assets/Fighter Jets/missle.png'],
    5: ['assets/Nuclear Bomb/nuclear-bomb.png'],
  };

  // Particle behaviour per era
  const CONFIGS = {
    1: { count: 18, startSize: 90,  duration: 1400, spread: 'allScreen' },
    2: { count:  6, startSize: 80,  duration: 1300, spread: 'local',     radius: 220 },
    3: { count:  8, startSize: 65,  duration: 1200, spread: 'local',     radius: 180 },
    4: { count:  6, startSize: 110, duration: 1500, spread: 'line' },
    5: { count:  7, startSize: 130, duration: 2000, spread: 'allScreen' },
  };

  const _imgs = {};   // era (string) -> [HTMLImageElement, ...]
  let _particles = [];

  function init() {
    for (const [era, paths] of Object.entries(IMAGE_PATHS)) {
      _imgs[era] = paths.map(src => {
        const img = new Image();
        img.src = src;
        return img;
      });
    }
  }

  // Spawn particles when an ability fires.
  // era: current era (1-5), px/py: canvas coords of click (undefined for allScreen)
  function spawn(era, px, py) {
    const cfg  = CONFIGS[era];
    const imgs = _imgs[String(era)];
    if (!cfg || !imgs) return;

    const wallX = GameMap.WALL_COL * GameMap.CELL;

    for (let i = 0; i < cfg.count; i++) {
      let x, y;

      if (cfg.spread === 'allScreen') {
        x = Math.random() * wallX;
        y = Math.random() * 1080;
      } else if (cfg.spread === 'local') {
        const angle  = Math.random() * Math.PI * 2;
        const dist   = Math.random() * (cfg.radius ?? 200);
        x = Math.max(0, Math.min(wallX, (px ?? wallX / 2) + Math.cos(angle) * dist));
        y = Math.max(10, Math.min(1070,  (py ?? 540)      + Math.sin(angle) * dist));
      } else if (cfg.spread === 'line') {
        // Horizontal band across the defence zone at the clicked y
        x = Math.random() * wallX;
        y = (py ?? 540) + (Math.random() - 0.5) * 120;
      }

      const img      = imgs[Math.floor(Math.random() * imgs.length)];
      const sizeMult = 0.7 + Math.random() * 0.6;
      const durMult  = 0.8 + Math.random() * 0.4;

      _particles.push({
        img,
        x, y,
        startSize: cfg.startSize * sizeMult,
        duration:  cfg.duration  * durMult,
        elapsed:   0,
        rotation:  (Math.random() - 0.5) * Math.PI * 0.5,
      });
    }
  }

  function update(dt) {
    for (const p of _particles) p.elapsed += dt;
    _particles = _particles.filter(p => p.elapsed < p.duration);
  }

  function draw(ctx) {
    for (const p of _particles) {
      if (!p.img.complete || p.img.naturalWidth === 0) continue;
      const t     = p.elapsed / p.duration;
      const h     = p.startSize * (1 - t);
      const w     = h * (p.img.naturalWidth / p.img.naturalHeight);
      const alpha = Math.pow(1 - t, 0.4);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.drawImage(p.img, -w / 2, -h / 2, w, h);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  return { init, spawn, update, draw };
})();
