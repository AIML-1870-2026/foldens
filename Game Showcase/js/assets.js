/* ============================================================
   assets.js — Asset manifest, on-demand preloader, animation registry
   ============================================================ */

const Assets = (() => {

  const MANIFEST = {

    // ── Era I — Enemies ──────────────────────────────────────────────────
    boar: {
      era: 1, role: 'enemy',
      sfx: 'boar',
      anims: {
        walk:   { type:'frames', dir:'assets/Boar/boar-walking-png',   count:112, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
        attack: { type:'frames', dir:'assets/Boar/boar-attacking-png', count:109, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
      },
    },

    mammoth: {
      era: 1, role: 'enemy',
      sfx: 'mammoth',
      anims: {
        walk:   { type:'frames', dir:'assets/Mammoth/mammoth-walking-png',   count:147, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
        attack: { type:'frames', dir:'assets/Mammoth/mammoth-attacking-png', count:129, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
      },
    },

    saberToothTiger: {
      era: 1, role: 'enemy',
      sfx: 'tiger',
      anims: {
        walk:   { type:'frames', dir:'assets/Saber Tooth Tiger/saber-tooth-tiger-walking-png',   count:143, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
        attack: { type:'frames', dir:'assets/Saber Tooth Tiger/saber-tooth-tiger-attacking-png', count:171, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
      },
    },

    // ── Era I — Towers ───────────────────────────────────────────────────
    clubMan: {
      era: 1, role: 'tower',
      sfx: 'club',
      anims: {
        attack: { type:'frames', dir:'assets/Club Man/club-man-attacking-png', count:145, pad:4, prefix:'', ext:'png', fps:24, fw:1280, fh:720 },
      },
    },

    stoneMan: {
      era: 1, role: 'tower',
      sfx: 'stone',
      anims: {
        attack: { type:'frames', dir:'assets/Stone Man/stone-man-attacking-png', count:124, pad:4, prefix:'', ext:'png', fps:24, fw:1280, fh:720 },
      },
    },

    spearMan: {
      era: 1, role: 'tower',
      sfx: 'spear',
      anims: {
        attack: { type:'frames', dir:'assets/Spear Man/spear-man-attacking-png', count:100, pad:4, prefix:'', ext:'png', fps:24, fw:1280, fh:720 },
      },
    },

    bowMan: {
      era: 1, role: 'tower',
      sfx: 'bow',
      anims: {
        attack: { type:'frames', dir:'assets/Bow Man/bow-man-attacking-png', count:102, pad:4, prefix:'', ext:'png', fps:24, fw:1280, fh:720 },
      },
    },


    // ── Era II — Enemies ─────────────────────────────────────────────────
    witch: {
      era: 2, role: 'enemy',
      anims: {
        walk:   { type:'frames', dir:'assets/Witch/witch-walking-png',   count:90, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
        attack: { type:'frames', dir:'assets/Witch/witch-attacking-png', count:145, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
      },
    },

    vampire: {
      era: 2, role: 'enemy',
      anims: {
        walk:   { type:'frames', dir:'assets/Vampire/vampire-walking-png',   count:32, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
        attack: { type:'frames', dir:'assets/Vampire/vampire-attacking-png', count:109, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
      },
    },

    ghost: {
      era: 2, role: 'enemy',
      anims: {
        walk:   { type:'frames', dir:'assets/Ghost/ghost-walking-png',   count:107, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
        attack: { type:'frames', dir:'assets/Ghost/ghost-attacking-png', count:192, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
      },
    },

    // ── Era II — Towers ──────────────────────────────────────────────────
    swordMan: {
      era: 2, role: 'tower',
      sfx: 'sword',
      anims: {
        attack: { type:'frames', dir:'assets/Sword Man/sword-man-attacking-png', count:123, pad:4, prefix:'', ext:'png', fps:24, fw:1280, fh:720 },
      },
    },

    horseMan: {
      era: 2, role: 'tower',
      sfx: 'horse',
      anims: {
        attack: { type:'frames', dir:'assets/Horse Man/horse-man-attacking-png', count:116, pad:4, prefix:'', ext:'png', fps:24, fw:1280, fh:720 },
      },
    },

    crossbowMan: {
      era: 2, role: 'tower',
      anims: {
        attack: { type:'frames', dir:'assets/Crossbow Man/crossbow-man-attacking-png', count:124, pad:4, prefix:'', ext:'png', fps:24, fw:1280, fh:720 },
      },
    },

    // ── Era III — Enemies ────────────────────────────────────────────────
    pirateSword: {
      era: 3, role: 'enemy',
      anims: {
        walk:   { type:'frames', dir:'assets/Sword Pirate/sword-pirate-walking-png',   count:100, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
        attack: { type:'frames', dir:'assets/Sword Pirate/sword-pirate-attacking-png', count:114, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
      },
    },

    pirateRifle: {
      era: 3, role: 'enemy',
      anims: {
        walk:   { type:'frames', dir:'assets/Flintlock Pirate/flintlock-pirate-walking-png',   count:112, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
        attack: { type:'frames', dir:'assets/Flintlock Pirate/flintlock-pirate-attacking-png', count:146, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
      },
    },

    pirateBomb: {
      era: 3, role: 'enemy',
      anims: {
        walk:   { type:'frames', dir:'assets/Bomb Pirate/bomb-pirate-walking-png',   count:108, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
        attack: { type:'frames', dir:'assets/Bomb Pirate/bomb-pirate-attacking-png', count:164, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
      },
    },

    // ── Era III — Towers ─────────────────────────────────────────────────
    cutlassMan: {
      era: 3, role: 'tower',
      anims: {
        attack: { type:'frames', dir:'assets/Cutlass Man/cutlass-man-attacking-png', count:140, pad:4, prefix:'', ext:'png', fps:24, fw:1280, fh:720 },
      },
    },

    blunderbussMan: {
      era: 3, role: 'tower',
      anims: {
        attack: { type:'frames', dir:'assets/Blunderbuss Man/blunderbuss-man-attacking-png', count:143, pad:4, prefix:'', ext:'png', fps:24, fw:1280, fh:720 },
      },
    },

    // ── Era IV — Zombie Enemies ──────────────────────────────────────────────
    gruntZombie: {
      era: 4, role: 'enemy',
      anims: {
        walk:   { type:'frames', dir:'assets/Grunt Zombie/grunt-zombie-walking-png',   count:140, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
        attack: { type:'frames', dir:'assets/Grunt Zombie/grunt-zombie-attacking-png', count: 66, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
      },
    },

    necroZombie: {
      era: 4, role: 'enemy',
      anims: {
        walk:   { type:'frames', dir:'assets/Necro Zombie/necro-zombie-walking-png',   count:110, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
        attack: { type:'frames', dir:'assets/Necro Zombie/necro-zombie-attacking-png', count:162, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
      },
    },

    vombie: {
      era: 4, role: 'enemy',
      anims: {
        walk:   { type:'frames', dir:'assets/Vombie/vombie-walking-png',   count:105, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
        attack: { type:'frames', dir:'assets/Vombie/vombie-attacking-png', count:161, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
      },
    },

    // ── Era V — Enemies ──────────────────────────────────────────────────
    laserAlien: {
      era: 5, role: 'enemy',
      anims: {
        walk:   { type:'frames', dir:'assets/Laser Alien/laser-alien-walking-png',   count:192, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
        attack: { type:'frames', dir:'assets/Laser Alien/laser-alien-attacking-png', count:124, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
      },
    },

    mechAlien: {
      era: 5, role: 'enemy',
      anims: {
        walk: { type:'frames', dir:'assets/Mech Alien/mech-alien-walking-png', count:125, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
      },
    },

    saucerAlien: {
      era: 5, role: 'enemy',
      anims: {
        walk: { type:'frames', dir:'assets/Saucer Alien/saucer-alien-walking-png', count:120, pad:4, prefix:'', ext:'png', fps:20, fw:1280, fh:720 },
      },
    },

    // Era IV uses placeholder rendering (no sprite assets yet)
  };

  // ── SFX paths ────────────────────────────────────────────────────────────
  const SFX = {
    boar:    'assets/sfx/boar.ogg',
    mammoth: 'assets/sfx/mammoth.ogg',
    tiger:   'assets/sfx/tiger.ogg',
    club:    'assets/sfx/club.wav',
    stone:   'assets/sfx/stone.wav',
    spear:   'assets/sfx/spear.wav',
    bow:     'assets/sfx/bow.wav',
    arrow:   'assets/sfx/arrow.ogg',
    sword:   'assets/sfx/sword.wav',
    horse:   'assets/sfx/horse.wav',
  };

  const registry  = {};
  const loading   = {};

  function loadImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = () => { console.warn('[Assets] missing:', src); resolve(null); };
      img.src = src;
    });
  }

  function frameUrl(animDef, i) {
    const n = String(i).padStart(animDef.pad, '0');
    return `${animDef.dir}/${animDef.prefix}${n}.${animDef.ext}`;
  }

  async function loadAnimEntry(animDef) {
    if (animDef.type === 'sheet') {
      const image = await loadImage(animDef.src);
      return { image, images: null, meta: animDef };
    }
    const promises = [];
    for (let i = 1; i <= animDef.count; i++) {
      promises.push(loadImage(frameUrl(animDef, i)));
    }
    const images = await Promise.all(promises);
    return { image: null, images, meta: animDef };
  }

  function load(key) {
    if (registry[key]) return Promise.resolve();
    if (loading[key])  return loading[key];
    const def = MANIFEST[key];
    if (!def) { console.warn('[Assets] unknown key:', key); return Promise.resolve(); }
    registry[key] = {};
    const tasks = Object.entries(def.anims).map(([animName, animDef]) =>
      loadAnimEntry(animDef).then(entry => { registry[key][animName] = entry; })
    );
    loading[key] = Promise.all(tasks).then(() => {
      Events.emit('assets:ready', { key });
      console.log(`[Assets] loaded: ${key}`);
    });
    return loading[key];
  }

  function loadEra(era) {
    const keys = Object.keys(MANIFEST).filter(k => MANIFEST[k].era === era);
    return Promise.all(keys.map(load));
  }

  function getAnim(key, animName) {
    return registry[key]?.[animName] ?? null;
  }

  function isReady(key) {
    return !!registry[key];
  }

  return { load, loadEra, getAnim, isReady, MANIFEST, SFX };
})();
