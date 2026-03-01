'use strict';
/* ====================================================================
   SPIKE RUNNER — game.js
   Jump: Space / Up Arrow / Tap left  |  Shift: D / Shift / Tap right
   ==================================================================== */

// ── CANVAS SETUP ─────────────────────────────────────────────────────
const W = 320, H = 200;          // internal pixel resolution
const gameCanvas  = document.getElementById('game');
const bloomCanvas = document.getElementById('bloom');
const gc  = gameCanvas.getContext('2d');
const bc  = bloomCanvas.getContext('2d');

// Offscreen canvas accumulates glow sources before blur
const offC = document.createElement('canvas');
offC.width = W; offC.height = H;
const oc = offC.getContext('2d');

gameCanvas.width  = bloomCanvas.width  = W;
gameCanvas.height = bloomCanvas.height = H;
[gc, bc, oc].forEach(x => { x.imageSmoothingEnabled = false; });

// HUD overlay DOM elements (crisp HTML text, no canvas scaling blur)
const hudEl     = document.getElementById('hud');
const hudDistEl = document.getElementById('hud-dist');
const hudMultEl = document.getElementById('hud-mult');
const hudEmpEl  = document.getElementById('hud-emp');

function resize() {
  const s  = Math.min(window.innerWidth / W, window.innerHeight / H);
  const cw = Math.floor(W * s), ch = Math.floor(H * s);
  const lx = Math.floor((window.innerWidth  - cw) / 2);
  const ly = Math.floor((window.innerHeight - ch) / 2);
  for (const c of [gameCanvas, bloomCanvas]) {
    c.style.width  = cw + 'px';  c.style.height = ch + 'px';
    c.style.left   = lx + 'px';  c.style.top    = ly + 'px';
  }
  // HUD overlay matches canvas exactly; scale font to match canvas pixels
  hudEl.style.width  = cw + 'px';  hudEl.style.height = ch + 'px';
  hudEl.style.left   = lx + 'px';  hudEl.style.top    = ly + 'px';
  hudEl.style.fontSize = Math.max(8, Math.floor(5 * s)) + 'px';
}
window.addEventListener('resize', resize);
resize();

// ── CONSTANTS ────────────────────────────────────────────────────────
const PLAYER_X    = 72;          // fixed screen x
const PW = 12, PH = 20;          // player pixel size
const STREET_Y    = 162;         // ground surface y (street)
const ROOF_Y      = 82;          // ground surface y (rooftop)
const SPEED_BASE  = 2.5;         // px/frame initial
const SPEED_MAX   = 5.5;         // px/frame cap
const SPEED_GROW  = 0.00015;     // added per frame (log growth approx)

// Physics
const JUMP_VY         = -12;
const GRAV_RISE       = 0.62;
const GRAV_APEX       = 0.18;    // near apex (|vy|<APEX_THR)
const GRAV_FALL       = 1.35;
const APEX_THR        = 2.2;
const COYOTE_F        = 6;       // frames
const JUMP_BUF_F      = 6;
const SHIFT_CD_F      = 24;      // 400ms @ 60fps
const NEAR_MISS_PX    = 5;       // px distance = near miss

// ── ZONES ────────────────────────────────────────────────────────────
const ZONES = [
  { name:'NEON DISTRICT',      dist:0,    bg:'#08091a', skyA:'#08091a', skyB:'#0d1030',
    buildFar:'#111235', buildNear:'#18164a', gnd:'#1b1650', gndD:'#241f72',
    acc:'#ff2d78', acc2:'#00f7ff', pGlow:'#00f7ff', particles:'rain' },
  { name:'INDUSTRIAL SECTOR',  dist:1000, bg:'#180c00', skyA:'#180c00', skyB:'#221200',
    buildFar:'#321600', buildNear:'#3d1c00', gnd:'#452000', gndD:'#6a3200',
    acc:'#ff8c00', acc2:'#ffcc00', pGlow:'#ffcc00', particles:'embers' },
  { name:'CORPORATE SKYLINE',  dist:2000, bg:'#040c18', skyA:'#040c18', skyB:'#071525',
    buildFar:'#0c1e40', buildNear:'#0e2250', gnd:'#0d2060', gndD:'#153898',
    acc:'#4dfff3', acc2:'#b8e0ff', pGlow:'#4dfff3', particles:'data' },
  { name:'UNDERGROUND',        dist:3000, bg:'#060010', skyA:'#060010', skyB:'#0b0020',
    buildFar:'#0f0030', buildNear:'#130036', gnd:'#140040', gndD:'#200060',
    acc:'#39ff14', acc2:'#cc00ff', pGlow:'#39ff14', particles:'spores' },
  { name:'SKYLINE ROOFTOPS',   dist:4000, bg:'#100020', skyA:'#100020', skyB:'#20001a',
    buildFar:'#1e0038', buildNear:'#280050', gnd:'#3a0058', gndD:'#560080',
    acc:'#ff9900', acc2:'#cc44ff', pGlow:'#ff9900', particles:'wind' },
  { name:'GLITCH ZONE',        dist:5000, bg:'#040404', skyA:'#040404', skyB:'#080010',
    buildFar:'#0a0020', buildNear:'#180010', gnd:'#180018', gndD:'#ff00ff',
    acc:'#ff0000', acc2:'#00ff88', pGlow:'#ffffff', particles:'glitch' },
];

function hexToRgb(h) {
  const v = parseInt(h.replace('#',''), 16);
  return [(v>>16)&255, (v>>8)&255, v&255];
}
function rgbToHex(r,g,b) {
  return '#'+[r,g,b].map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
}
function lerpColor(a, b, t) {
  const [ar,ag,ab2] = hexToRgb(a), [br,bg,bb] = hexToRgb(b);
  return rgbToHex(ar+(br-ar)*t, ag+(bg-ag)*t, ab2+(bb-ab2)*t);
}

let zonePal = { ...ZONES[0] }; // current interpolated palette

function updatePalette(dist) {
  const FADE = 200;
  let zi = 0;
  for (let i = ZONES.length-1; i >= 0; i--) {
    if (dist >= ZONES[i].dist) { zi = i; break; }
  }
  const z = ZONES[zi];
  if (zi < ZONES.length-1) {
    const nxt = ZONES[zi+1];
    const fadeStart = nxt.dist - FADE;
    if (dist > fadeStart) {
      const t = Math.min(1, (dist - fadeStart) / FADE);
      const lerp = k => lerpColor(z[k], nxt[k], t);
      zonePal = {
        name: z.name, particles: z.particles,
        bg:lerp('bg'), skyA:lerp('skyA'), skyB:lerp('skyB'),
        buildFar:lerp('buildFar'), buildNear:lerp('buildNear'),
        gnd:lerp('gnd'), gndD:lerp('gndD'),
        acc:lerp('acc'), acc2:lerp('acc2'), pGlow:lerp('pGlow'),
      };
      return;
    }
  }
  zonePal = { ...z };
}

function getZoneIndex(dist) {
  let zi = 0;
  for (let i = ZONES.length-1; i >= 0; i--) {
    if (dist >= ZONES[i].dist) { zi = i; break; }
  }
  return zi;
}

// ── AUDIO ────────────────────────────────────────────────────────────
let audioCtx = null;
let musicNodes = null;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  startMusic();
}

function playTone(freq, type, dur, vol=0.3, detune=0) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  o.type = type; o.frequency.value = freq; o.detune.value = detune;
  g.gain.setValueAtTime(vol, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.start(); o.stop(audioCtx.currentTime + dur);
}

function playNoise(dur, vol=0.15, hipass=200) {
  if (!audioCtx) return;
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i=0; i<data.length; i++) data[i] = Math.random()*2-1;
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const flt = audioCtx.createBiquadFilter();
  flt.type = 'highpass'; flt.frequency.value = hipass;
  const g = audioCtx.createGain();
  src.connect(flt); flt.connect(g); g.connect(audioCtx.destination);
  g.gain.setValueAtTime(vol, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  src.start(); src.stop(audioCtx.currentTime + dur);
}

const SFX = {
  jump()    { playTone(320, 'square', 0.12, 0.25); playTone(480, 'sine', 0.08, 0.15); },
  land()    { playNoise(0.08, 0.2, 80); playTone(80, 'sine', 0.1, 0.3); },
  shift()   { playNoise(0.15, 0.25, 1000); playTone(600, 'sawtooth', 0.1, 0.2, 100); },
  shiftReady() { playTone(880, 'sine', 0.06, 0.15); },
  nearMiss(){ playTone(1200, 'sine', 0.05, 0.1); },
  collect() { [523,659,784].forEach((f,i)=> setTimeout(()=>playTone(f,'sine',0.1,0.2), i*60)); },
  die()     { playNoise(0.4, 0.4, 40); playTone(100,'sawtooth',0.3,0.3); },
  milestone(){ [392,523,659,784].forEach((f,i)=> setTimeout(()=>playTone(f,'square',0.15,0.25), i*80)); },
  empOn()   { playNoise(0.3, 0.3, 20); },
  empOff()  { playTone(440,'sine',0.2,0.25); playTone(550,'sine',0.2,0.2); },
};

// ── MUSIC — chord-based per zone ─────────────────────────────────────
// Each zone: [bassRoot, [chord tones for arpeggio], [melody scale], beatMs]
const ZONE_MUSIC = [
  // 0 Neon: D minor 7 — dark, hypnotic
  { bass:[73.4,110,87.3,98],  chord:[146.8,184.9,220,261.6,329.6], scale:[146.8,164.8,184.9,220,246.9,261.6,293.7,329.6], ms:115 },
  // 1 Industrial: A minor — driving, heavy
  { bass:[55,82.4,73.4,55],   chord:[220,261.6,329.6,392,440],     scale:[220,246.9,261.6,293.7,329.6,349.2,392,440],     ms:105 },
  // 2 Corporate: C minor — cold, precise
  { bass:[65.4,98,87.3,65.4], chord:[130.8,155.6,196,261.6,311.1], scale:[130.8,155.6,174.6,196,220,261.6,311.1,349.2],   ms:118 },
  // 3 Underground: G minor — low, ominous
  { bass:[49,73.4,55,61.7],   chord:[98,116.5,146.8,174.6,196],    scale:[98,110,130.8,146.8,164.8,174.6,196,220],        ms:125 },
  // 4 Rooftops: E minor — open, triumphant
  { bass:[82.4,110,98,82.4],  chord:[164.8,196,246.9,329.6,392],   scale:[164.8,184.9,196,220,246.9,261.6,293.7,329.6],   ms:100 },
  // 5 Glitch: dissonant, unstable tempo
  { bass:[60,80,100,70],      chord:[120,170,213,285,340],          scale:[120,135,160,180,213,240,270,320],               ms:95  },
];

let musicTick = 0, musicInterval = null, lastMusicZone = -1;
let musicChordIdx = 0;
const MELODY_PATTERN = [1,0,1,0,0,1,0,1,  1,0,0,1,0,1,1,0];  // 16-step gate

function startMusic() {
  if (musicInterval) clearInterval(musicInterval);
  musicTick = 0; lastMusicZone = -1; musicChordIdx = 0;
  // Start at zone 0 tempo, re-schedule when zone changes
  scheduleMusic(0);
}

function scheduleMusic(zi) {
  if (musicInterval) clearInterval(musicInterval);
  lastMusicZone = zi;
  const zm = ZONE_MUSIC[zi] || ZONE_MUSIC[0];
  musicInterval = setInterval(() => {
    if (gameState !== 'playing') return;
    const curZi = getZoneIndex(dist);
    if (curZi !== lastMusicZone) { scheduleMusic(curZi); return; }

    const zm2 = ZONE_MUSIC[curZi];
    const beat = musicTick % 16;
    musicTick++;

    // Kick on beats 0 and 8
    if (beat === 0 || beat === 8) {
      playNoise(0.06, 0.18, 60);
    }
    // Bass — follows chord progression (4 chords, 4 beats each)
    if (beat % 4 === 0) {
      musicChordIdx = (beat / 4) | 0;
      playTone(zm2.bass[musicChordIdx % zm2.bass.length], 'square', 0.28, 0.14);
    }
    // Snare on beats 4 and 12
    if (beat === 4 || beat === 12) {
      playNoise(0.08, 0.12, 800);
    }
    // Hi-hat every odd beat
    if (beat % 2 === 1) {
      playNoise(0.03, 0.05, 5000);
    }
    // Arpeggio chord — plays on specific beat gates
    if (MELODY_PATTERN[beat]) {
      const chordNote = zm2.chord[beat % zm2.chord.length];
      playTone(chordNote, 'square', zm2.ms * 0.0009, 0.07);
    }
    // Melody — plays on off-beats, scale tones
    if (beat % 3 === 2 && Math.random() < 0.55) {
      const step = (musicChordIdx * 2 + (beat & 3)) % zm2.scale.length;
      playTone(zm2.scale[step] * 2, 'sine', zm2.ms * 0.0012, 0.05);
    }
  }, zm.ms);
}

// ── INPUT ─────────────────────────────────────────────────────────────
const keys = {};
const input = { jump: false, shift: false };
let prevInput = { jump: false, shift: false };

window.addEventListener('keydown', e => {
  if (keys[e.code]) return;
  keys[e.code] = true;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    e.preventDefault(); input.jump = true;
  }
  if (e.code === 'KeyD' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    e.preventDefault(); input.shift = true;
  }
  // Start game on any key
  if (gameState === 'title' || gameState === 'dead') startGame();
});
window.addEventListener('keyup', e => {
  keys[e.code] = false;
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') input.jump = false;
  if (e.code === 'KeyD' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.shift = false;
});

// Touch: left half = jump, right half = shift
gameCanvas.addEventListener('touchstart', e => {
  e.preventDefault(); initAudio();
  if (gameState === 'title' || gameState === 'dead') { startGame(); return; }
  for (const t of e.changedTouches) {
    const cx = t.clientX / window.innerWidth;
    if (cx < 0.5) input.jump  = true;
    else          input.shift = true;
  }
}, { passive: false });
gameCanvas.addEventListener('touchend', e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    const cx = t.clientX / window.innerWidth;
    if (cx < 0.5) input.jump  = false;
    else          input.shift = false;
  }
}, { passive: false });
gameCanvas.addEventListener('click', () => {
  initAudio();
  if (gameState === 'title' || gameState === 'dead') startGame();
});

// ── PARTICLE SYSTEM ──────────────────────────────────────────────────
const particles = [];

function spawnParticles(x, y, n, options = {}) {
  const { color='#fff', spread=2.5, life=30, gravity=0.1, speed=1.5,
          size=2, sizeVar=1, glowing=false, type='dot' } = options;
  for (let i=0; i<n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd   = (0.4 + Math.random()*0.6) * speed;
    particles.push({
      x, y,
      vx: Math.cos(angle)*spd*spread,
      vy: Math.sin(angle)*spd*spread - Math.random()*speed*0.5,
      life, maxLife: life,
      color, glowing, type,
      size: size + (Math.random()-0.5)*sizeVar*2,
      gravity
    });
  }
}

function spawnJumpDust(x, y) {
  spawnParticles(x+PW/2, y, 7, { color:zonePal.acc2, spread:2.5, speed:1.2, life:20, gravity:0.05 });
}
function spawnLandDust(x, y) {
  spawnParticles(x+PW/2, y, 10, { color:zonePal.acc2, spread:3, speed:1.5, life:22, gravity:0.04, size:1.5 });
}
function spawnShiftParticles(x, y) {
  spawnParticles(x+PW/2, y+PH/2, 14, { color:zonePal.pGlow, spread:3, speed:2, life:18, size:2, glowing:true, gravity:0 });
}
function spawnDeathParticles(x, y) {
  spawnParticles(x+PW/2, y+PH/2, 28, { color:zonePal.pGlow, spread:3.5, speed:3, life:55, size:2.5, glowing:true, gravity:0.25 });
  spawnParticles(x+PW/2, y+PH/2, 10, { color:zonePal.acc, spread:3, speed:2, life:45, size:1.5, glowing:true, gravity:0.2 });
}
function spawnNearMiss(ox, oy) {
  spawnParticles(ox, oy, 4, { color:'#ffff00', spread:2, speed:2, life:14, size:1.5, glowing:true });
}
function spawnCollect(x, y) {
  spawnParticles(x, y, 8, { color:zonePal.acc, spread:2.5, speed:2.2, life:20, size:2, glowing:true });
}

function updateParticles() {
  for (let i = particles.length-1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.96; p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles(ctx) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    const s = Math.max(0.5, p.size * alpha);
    ctx.fillRect(Math.floor(p.x - s/2), Math.floor(p.y - s/2), Math.ceil(s), Math.ceil(s));
  }
  ctx.globalAlpha = 1;
}

// Ambient particles per zone
const ambientParticles = [];
function spawnAmbient() {
  switch (zonePal.particles) {
    case 'rain':
      if (Math.random() < 0.6) ambientParticles.push({
        x: Math.random()*W, y: -4, vx: -0.4, vy: 4+Math.random()*2,
        life: 60, color: zonePal.acc2+'66', type:'line', len:6 });
      break;
    case 'embers':
      if (Math.random() < 0.12) ambientParticles.push({
        x: Math.random()*W, y: H+4, vx:(Math.random()-0.5)*0.8, vy: -1.5-Math.random(),
        life: 80+Math.random()*60, color: zonePal.acc, type:'dot', size:1.5, gravity:-0.005 });
      break;
    case 'data':
      if (Math.random() < 0.08) ambientParticles.push({
        x: Math.random()*W, y: H/2+Math.random()*H/2, vx:0, vy:-0.8-Math.random()*0.5,
        life:90, color:zonePal.acc2+'88', type:'square', size:2 });
      break;
    case 'spores':
      if (Math.random() < 0.05) ambientParticles.push({
        x: Math.random()*W, y: Math.random()*H, vx:(Math.random()-0.5)*0.3, vy:-0.3,
        life:120, color:zonePal.acc+'aa', type:'dot', size:1, gravity:-0.001 });
      break;
    case 'wind':
      if (Math.random() < 0.08) ambientParticles.push({
        x: W+4, y: Math.random()*H*0.6, vx:-4-Math.random()*3, vy:0,
        life:30, color:'#ffffff22', type:'line', len:8 });
      break;
    case 'glitch':
      if (Math.random() < 0.06) ambientParticles.push({
        x: Math.random()*W, y: Math.random()*H, vx:(Math.random()-0.5)*3, vy:(Math.random()-0.5)*2,
        life:8, color:Math.random()<0.5?zonePal.acc:zonePal.acc2, type:'square', size:Math.random()*4+1 });
      break;
  }
}

function updateAmbient() {
  for (let i = ambientParticles.length-1; i >= 0; i--) {
    const p = ambientParticles[i];
    p.x += p.vx; p.y += p.vy;
    if (p.gravity) p.vy += p.gravity;
    p.life--;
    if (p.life <= 0 || p.x < -10 || p.x > W+10 || p.y < -10 || p.y > H+10)
      ambientParticles.splice(i, 1);
  }
}

function drawAmbient(ctx) {
  for (const p of ambientParticles) {
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;
    if (p.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx*p.len/4, p.y + p.vy*p.len/4);
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (p.type === 'square') {
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size||2, p.size||2);
    } else {
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size||1.5, p.size||1.5);
    }
  }
}

// ── BACKGROUND RENDERING ─────────────────────────────────────────────
function drawBackground(camX) {
  // Sky gradient
  const skyGrad = gc.createLinearGradient(0,0,0,H);
  skyGrad.addColorStop(0, zonePal.skyA);
  skyGrad.addColorStop(1, zonePal.skyB);
  gc.fillStyle = skyGrad;
  gc.fillRect(0, 0, W, H);

  // Far buildings (slowest, layer 1)
  drawBuildings(gc, camX * 0.12, zonePal.buildFar, 24, 40, 18, 14, 70, 110);
  // Mid buildings (layer 2)
  drawBuildings(gc, camX * 0.30, zonePal.buildNear, 18, 30, 25, 20, 95, 135);

  // Ambient particles behind gameplay
  drawAmbient(gc);

  // Ground for inactive layer (the one the player is NOT on)
  // Both grounds always drawn; active is bright, inactive is dim
}

function drawBuildings(ctx, scrollX, color, minW, maxW, minH, maxH, baseY, maxBaseY) {
  // Fixed tile stride so buildings have stable identities — no snapping
  const TILE = 72;
  const iStart = Math.floor(scrollX / TILE);
  const ox     = scrollX % TILE;          // fractional offset within tile

  const winBright = lerpColor(color, '#ffffff', 0.4);
  const winDim    = lerpColor(color, '#ffffff', 0.08);

  const count = Math.ceil(W / TILE) + 2;
  for (let i = 0; i < count; i++) {
    const idx = iStart + i;
    // Stable hash for this tile — never changes as camera scrolls
    const s = (Math.imul(idx, 1664525) + 1013904223) >>> 0;
    const bw = minW + (s          % (maxW - minW + 1));
    const bh = minH + ((s >>> 8)  % (maxH - minH + 1));
    const by = baseY + ((s >>> 16) % (maxBaseY - baseY + 1));
    const bx = i * TILE - ox;
    const visW = TILE - 5;               // slight gap between buildings

    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(bx), by - bh, visW, bh + (H - by + 4));

    // Windows: deterministic per tile, stable
    for (let wy = by - bh + 4; wy < by - 3; wy += 7) {
      for (let wx = bx + 3; wx < bx + visW - 5; wx += 6) {
        const winOn = ((idx * 7 + Math.floor(wy / 7) * 13 + Math.floor((wx - bx) / 6) * 5) & 3) !== 0;
        ctx.fillStyle = winOn ? winBright : winDim;
        ctx.fillRect(Math.floor(wx), wy, 3, 4);
      }
    }
  }
}

// ── CHUNK / TERRAIN SYSTEM ───────────────────────────────────────────
/*
  Each chunk: { worldX, width, streetPits[], roofPits[], obstacles[], collectibles[], empZone }
  Pit: { x (relative to chunk start), w }
  Obstacle: { type, layer, x, y, w, h }   (x relative to chunk)
  Collectible: { layer, x, y }             (x relative to chunk, y relative to layer ground)
*/

const chunks = [];
let worldGenX = 0;    // next chunk worldX to generate
let cameraX   = 0;    // px scrolled

const CHUNK_DEFS = [
  // 0 FLAT — breather
  (wx) => ({ worldX:wx, width:280, streetPits:[], roofPits:[], obstacles:[], collectibles:[], empZone:false }),

  // 1 STREET_GAP — easy
  (wx) => {
    const gw = 44 + Math.floor(Math.random()*24);
    return { worldX:wx, width:320, streetPits:[{x:120, w:gw}], roofPits:[], obstacles:[],
      collectibles:[{layer:'street', x:120+gw/2-3, dy:-30}], empZone:false };
  },
  // 2 ROOF_GAP — easy
  (wx) => {
    const gw = 44 + Math.floor(Math.random()*20);
    return { worldX:wx, width:320, streetPits:[], roofPits:[{x:120, w:gw}], obstacles:[],
      collectibles:[{layer:'roof', x:120+gw/2-3, dy:-30}], empZone:false };
  },
  // 3 STREET_BARRIER — easy (MUST shift to roof, unjumpable wall)
  (wx) => ({
    worldX:wx, width:300, streetPits:[], roofPits:[],
    obstacles:[{type:'barrier', layer:'street', x:170, w:14, h:150}],
    collectibles:[{layer:'roof', x:170, dy:-20}], empZone:false }),

  // 4 ROOF_BARRIER — easy (MUST shift to street, unjumpable wall)
  (wx) => ({
    worldX:wx, width:300, streetPits:[], roofPits:[],
    obstacles:[{type:'barrier', layer:'roof', x:170, w:14, h:80}],
    collectibles:[{layer:'street', x:170, dy:-20}], empZone:false }),

  // 5 DOUBLE_BARRIER — medium (shift to roof, then quickly back to street)
  (wx) => ({
    worldX:wx, width:400, streetPits:[], roofPits:[],
    obstacles:[
      {type:'barrier', layer:'street', x:130, w:14, h:150},
      {type:'barrier', layer:'roof',   x:250, w:14, h:80},
    ],
    collectibles:[{layer:'roof', x:185, dy:-20}], empZone:false }),

  // 6 UNIVERSAL BARRIER — both layers, must jump over (can't shift to avoid)
  (wx) => ({
    worldX:wx, width:300, streetPits:[], roofPits:[],
    obstacles:[{type:'barrier', layer:'both', x:160, w:10, h:28}],
    collectibles:[{layer:'street', x:210, dy:-32}], empZone:false }),

  // 7 DUAL_GAP — medium
  (wx) => {
    const gw = 38 + Math.floor(Math.random()*18);
    return { worldX:wx, width:360, streetPits:[{x:100,w:gw}], roofPits:[{x:200,w:gw}],
      obstacles:[], collectibles:[], empZone:false };
  },
  // 8 EMP_ZONE — hard, no shifting
  (wx) => ({
    worldX:wx, width:380, streetPits:[{x:140,w:38},{x:240,w:38}], roofPits:[],
    obstacles:[], collectibles:[], empZone:true }),

  // 9 ALTERNATING — hard (rapid shift left-right)
  (wx) => ({
    worldX:wx, width:420, streetPits:[], roofPits:[],
    obstacles:[
      {type:'barrier', layer:'street', x:130, w:12, h:150},
      {type:'barrier', layer:'roof',   x:190, w:12, h:80},
      {type:'barrier', layer:'street', x:250, w:12, h:150},
      {type:'barrier', layer:'roof',   x:310, w:12, h:80},
    ],
    collectibles:[{layer:'roof', x:155, dy:-28},{layer:'street', x:255, dy:-28}], empZone:false }),
];

// Difficulty-weighted chunk selection by distance
function pickChunk(dist) {
  if (dist < 6)   return 0;         // very short flat intro (~1 sec)
  if (dist < 20)  return 1;         // first gap — teaches jumping
  if (dist < 35)  return 3;         // first wall — teaches shifting (street barrier)

  // After 35m: mix based on tier
  const tier = dist < 200 ? 0 : dist < 600 ? 1 : 2;
  // tier 0: gaps + shift walls; tier 1: adds combos/both; tier 2: all hard
  const easy   = [1,2,3,4,1,3,4];   // bias toward shift barriers
  const medium = [1,2,3,4,5,6,7,3,4];
  const hard   = [1,2,3,4,5,6,7,8,9];
  const pool = tier === 0 ? easy : tier === 1 ? medium : hard;

  // Occasional flat breather (less frequent early on)
  const flatChance = dist < 200 ? 0.1 : 0.18;
  if (Math.random() < flatChance) return 0;
  return pool[Math.floor(Math.random() * pool.length)];
}

let lastHardChunk = -10; // index of last generated chunk (track for no back-to-back hard)
let chunkCount = 0;

function generateChunk(dist) {
  let id = pickChunk(dist);
  // Avoid back-to-back hard (8,9)
  if ((id === 8 || id === 9) && chunkCount - lastHardChunk < 3) id = 1;
  if (id === 8 || id === 9) lastHardChunk = chunkCount;
  chunkCount++;
  const def = CHUNK_DEFS[id](worldGenX);
  chunks.push(def);
  worldGenX += def.width;
  // Always append a small flat bridge
  const bridge = CHUNK_DEFS[0](worldGenX);
  bridge.width = 80;
  chunks.push(bridge);
  worldGenX += 80;
}

function ensureChunks() {
  // Keep 3 screens worth of content ahead
  while (worldGenX - cameraX < W * 3) {
    generateChunk(dist);
  }
  // Remove chunks that are far behind
  while (chunks.length > 2 && chunks[0].worldX + chunks[0].width < cameraX - W) {
    chunks.shift();
  }
}

// ── GROUND / PIT QUERIES ─────────────────────────────────────────────
function isOverPit(layer, worldLeft, worldRight) {
  // Returns true if there is NO ground at this position
  let hasPit = false;
  for (const chunk of chunks) {
    const cx = chunk.worldX;
    const pitArr = layer === 'street' ? chunk.streetPits : chunk.roofPits;
    for (const pit of pitArr) {
      const pw = cx + pit.x;
      const pe = pw + pit.w;
      if (worldRight > pw && worldLeft < pe) { hasPit = true; }
    }
  }
  return hasPit;
}

// ── PLAYER STATE ─────────────────────────────────────────────────────
const player = {
  layer: 'street',
  y: STREET_Y - PH,    // top of player sprite (screen y)
  vy: 0,
  onGround: true,
  coyoteFrames: 0,
  jumpBuffer: 0,
  shiftCooldown: 0,
  empLocked: false,     // in EMP zone
  // Animation
  state: 'run',  // run | jump | land | shift | dead
  frame: 0,
  frameTimer: 0,
  animSpeed: 6,
  squashY: 1.0, squashX: 1.0,
  squashTimer: 0,
  // Ghost trail
  trail: [],
  // Near-miss tracking
  nearMissThisFrame: false,
};

function groundY() {
  return player.layer === 'street' ? STREET_Y : ROOF_Y;
}

// ── OBSTACLES (live instances) ────────────────────────────────────────
// Obstacle instances built from chunks each frame
function getActiveObstacles() {
  const obs = [];
  for (const chunk of chunks) {
    const cx = chunk.worldX - cameraX; // screen x of chunk start
    if (cx > W + 50 || cx + chunk.width < -50) continue;
    for (const o of chunk.obstacles) {
      obs.push({ ...o, sx: cx + o.x, _orig: o });  // _orig ref for persistent flags
    }
    for (const c of chunk.collectibles) {
      if (c.collected) continue;
      const gy = c.layer === 'street' ? STREET_Y : ROOF_Y;
      obs.push({ type:'collectible', layer:c.layer, sx:cx+c.x, sy:gy+(c.dy||0), w:8, h:8, _ref:c });
    }
  }
  return obs;
}

function getEmpActive() {
  for (const chunk of chunks) {
    if (!chunk.empZone) continue;
    const sx = chunk.worldX - cameraX;
    if (sx < PLAYER_X + PW && sx + chunk.width > PLAYER_X) return true;
  }
  return false;
}

// ── COLLISION ─────────────────────────────────────────────────────────
// Player hitbox: slightly smaller than sprite (80% width, 90% height)
function playerHitbox() {
  const margin_x = Math.floor(PW * 0.1);
  const margin_y = Math.floor(PH * 0.05);
  return {
    left:   PLAYER_X + margin_x,
    right:  PLAYER_X + PW - margin_x,
    top:    player.y + margin_y,
    bottom: player.y + PH,
  };
}

function overlaps(hb, sx, sy, sw, sh) {
  return hb.right > sx && hb.left < sx + sw &&
         hb.bottom > sy && hb.top  < sy + sh;
}

// ── SCREEN SHAKE ─────────────────────────────────────────────────────
let shakeFrames = 0, shakeMag = 0;
function screenShake(mag, frames) {
  shakeMag = Math.max(shakeMag, mag);
  shakeFrames = Math.max(shakeFrames, frames);
}

// ── GAME STATE ────────────────────────────────────────────────────────
let gameState = 'title';   // title | playing | dead
let dist      = 0;         // meters traveled
let score     = 0;
let mult      = 1.0;
let speed     = SPEED_BASE;
let hiDist    = parseInt(localStorage.getItem('sr-hi-dist') || '0');
let hiScore   = parseInt(localStorage.getItem('sr-hi-score')|| '0');
let lastZoneIndex = 0;
let deadTimer = 0;
let freezeFrames = 0;      // for impact freezes
let scanlineFlash = 0;     // chromatic aberration intensity
let empVisual = 0;         // EMP zone overlay alpha

function startGame() {
  initAudio();
  // Reset state
  gameState  = 'playing';
  dist       = 0;
  score      = 0;
  mult       = 1.0;
  speed      = SPEED_BASE;
  cameraX    = 0;
  worldGenX  = 0;
  chunks.length = 0;
  chunkCount = 0;
  lastHardChunk = -10;
  particles.length = 0;
  ambientParticles.length = 0;

  player.layer     = 'street';
  player.y         = STREET_Y - PH;
  player.vy        = 0;
  player.onGround  = true;
  player.coyoteFrames = 0;
  player.jumpBuffer   = 0;
  player.shiftCooldown = 0;
  player.empLocked = false;
  player.state     = 'run';
  player.frame     = 0;
  player.frameTimer = 0;
  player.squashY   = 1;
  player.squashX   = 1;
  player.squashTimer = 0;
  player.trail     = [];

  shakeFrames = 0; shakeMag = 0;
  freezeFrames = 0; scanlineFlash = 0; empVisual = 0;
  lastZoneIndex = 0;
  updatePalette(0);

  ensureChunks();

  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('zone-banner').classList.add('hidden');
  hudEl.classList.remove('hidden');
}

function showGameOver() {
  if (dist > hiDist) { hiDist = dist; localStorage.setItem('sr-hi-dist', hiDist); }
  if (score > hiScore){ hiScore = score; localStorage.setItem('sr-hi-score', hiScore); }

  document.getElementById('go-dist').textContent  = dist;
  document.getElementById('go-score').textContent = Math.floor(score);
  document.getElementById('go-zone').textContent  = zonePal.name;
  const best = document.getElementById('go-best');
  best.textContent = dist >= hiDist ? '— NEW BEST! —' : `BEST: ${hiDist}m`;
  document.getElementById('hi-dist').textContent = hiDist;

  document.getElementById('gameover-screen').classList.remove('hidden');
  hudEl.classList.add('hidden');
  gameState = 'dead';
}

// Zone banner
function showZoneBanner(name) {
  const el = document.getElementById('zone-banner');
  el.textContent = name;
  el.classList.remove('hidden');
  el.style.opacity = '1';
  let t = 0;
  const fade = setInterval(() => {
    t++;
    if (t < 30) el.style.opacity = Math.min(1, t/10).toString();
    else if (t > 150) el.style.opacity = Math.max(0, 1-(t-150)/20).toString();
    if (t > 170) { clearInterval(fade); el.classList.add('hidden'); }
  }, 16);
}

// ── PLAYER UPDATE ─────────────────────────────────────────────────────
function updatePlayer() {
  if (player.state === 'dead') return;

  // Squash recovery
  if (player.squashTimer > 0) {
    player.squashTimer--;
    player.squashY = 1 + (player.squashY - 1) * 0.7;
    player.squashX = 1 + (player.squashX - 1) * 0.7;
  }

  // EMP zone check
  player.empLocked = getEmpActive();

  // Trail
  player.trail.unshift({ x: PLAYER_X, y: player.y, layer: player.layer });
  if (player.trail.length > 5) player.trail.pop();

  // World x of player edges
  const plWorldLeft  = cameraX + PLAYER_X;
  const plWorldRight = cameraX + PLAYER_X + PW;

  // Gravity
  const rising = player.vy < 0;
  const apexHang = Math.abs(player.vy) < APEX_THR && !player.onGround;
  const grav = apexHang ? GRAV_APEX : rising ? GRAV_RISE : GRAV_FALL;
  if (!player.onGround) player.vy += grav;

  // Apply velocity
  player.y += player.vy;

  // Hard ceiling — prevents flying off top of screen
  if (player.y < 4) { player.y = 4; if (player.vy < 0) player.vy = 0; }

  // Ground check
  const gY  = groundY();
  const overPit = isOverPit(player.layer, plWorldLeft, plWorldRight);

  if (!overPit && player.y + PH >= gY) {
    // Landing
    if (!player.onGround && player.vy > 1) {
      SFX.land();
      screenShake(2, 4);
      spawnLandDust(PLAYER_X, gY);
      player.squashY = 0.75; player.squashX = 1.2; player.squashTimer = 8;
      if (player.state !== 'shift') player.state = 'land';
    }
    player.y = gY - PH;
    player.vy = 0;
    player.onGround = true;
    player.coyoteFrames = COYOTE_F;
  } else {
    player.onGround = false;
  }

  // Coyote time countdown
  if (player.coyoteFrames > 0) player.coyoteFrames--;

  // Jump buffer countdown
  if (player.jumpBuffer > 0) player.jumpBuffer--;

  // Jump input edge detect
  const jumpPressed  = input.jump  && !prevInput.jump;
  const shiftPressed = input.shift && !prevInput.shift;

  if (jumpPressed) player.jumpBuffer = JUMP_BUF_F;

  // Execute jump
  if (player.jumpBuffer > 0 && (player.onGround || player.coyoteFrames > 0)) {
    player.vy = JUMP_VY;
    player.onGround = false;
    player.coyoteFrames = 0;
    player.jumpBuffer = 0;
    player.state = 'jump';
    player.squashY = 1.25; player.squashX = 0.85; player.squashTimer = 5;
    SFX.jump();
    spawnJumpDust(PLAYER_X, gY);
  }

  // Phase shift
  if (player.shiftCooldown > 0) player.shiftCooldown--;
  if (player.shiftCooldown === 1) SFX.shiftReady();

  if (shiftPressed && player.shiftCooldown === 0 && !player.empLocked) {
    const wasLayer = player.layer;
    player.layer   = player.layer === 'street' ? 'roof' : 'street';
    player.y       = groundY() - PH;     // snap to new layer ground
    player.vy      = 0;
    player.onGround = true;
    player.shiftCooldown = SHIFT_CD_F;
    player.state   = 'shift';
    scanlineFlash  = 8;
    screenShake(1, 3);
    SFX.shift();
    spawnShiftParticles(PLAYER_X, player.y);
  }

  // Pit fall = death
  if (overPit && player.y + PH > gY + 30) {
    killPlayer();
    return;
  }

  // Player fell off bottom
  if (player.y > H + 20) { killPlayer(); return; }

  // Update animation state
  if (player.state !== 'dead' && player.state !== 'shift') {
    if (player.onGround) {
      if (player.state === 'land' && player.squashTimer <= 0) player.state = 'run';
    } else {
      player.state = player.vy < 0 ? 'jump' : 'fall';
    }
  }
  if (player.state === 'shift' && player.shiftCooldown < SHIFT_CD_F - 4) player.state = 'run';

  // Frame animation
  player.frameTimer++;
  if (player.frameTimer >= player.animSpeed) {
    player.frameTimer = 0;
    player.frame = (player.frame + 1) % 8;
  }
}

function killPlayer() {
  if (player.state === 'dead') return;
  player.state = 'dead';
  freezeFrames = 5;
  screenShake(5, 12);
  scanlineFlash = 20;
  SFX.die();
  spawnDeathParticles(PLAYER_X, player.y);
  deadTimer = 90;
}

// ── PLAYER RENDERING ─────────────────────────────────────────────────
function drawPlayer(ctx, toBloom) {
  if (player.state === 'dead') return;

  const cx = PLAYER_X + PW/2;
  const cy = player.y + PH/2;
  const sy = player.squashY;
  const sx = player.squashX;
  const w = PW * sx, h = PH * sy;
  const px = cx - w/2, py = cy - h/2;

  // ── Trail afterimages (offset left by speed so frames don't stack) ─
  for (let i = player.trail.length - 1; i >= 1; i--) {
    const t = player.trail[i];
    if (t.layer !== player.layer) continue;
    const a = 0.12 - i * 0.02;
    if (a <= 0) continue;
    const trailOffX = -i * speed * 1.1;
    ctx.globalAlpha = a;
    ctx.fillStyle = zonePal.pGlow;
    ctx.fillRect(Math.floor(t.x + trailOffX + (PW - PW*sx)/2), Math.floor(t.y + (PH - PH*sy)/2), Math.ceil(PW*sx), Math.ceil(PH*sy));
    ctx.globalAlpha = 1;
  }

  // ── Running cycle values ──────────────────────────────────────────
  const phase   = (player.frame / 8) * Math.PI * 2;
  const running = player.onGround && player.state === 'run';
  const legSwing = running ? Math.sin(phase) : (player.state === 'jump' ? -0.5 : 0.3);
  const armSwing = running ? Math.sin(phase + Math.PI) : -legSwing;
  const lean     = running ? 1 : (player.state === 'jump' ? -1 : 1);  // +1 lean forward, -1 tuck

  const X = Math.floor(px), Y = Math.floor(py);
  const visorAlpha = player.shiftCooldown > 0
    ? 0.3 + 0.7 * (1 - player.shiftCooldown / SHIFT_CD_F) : 1;

  // ── HEAD (8×7 with rounded corners, slight forward lean) ─────────
  const hx = X + 2 + lean;
  ctx.fillStyle = '#2e2e6e';
  ctx.fillRect(hx + 1, Y,     6, 1);   // top row (skip corners)
  ctx.fillRect(hx,     Y + 1, 8, 5);   // middle rows
  ctx.fillRect(hx + 1, Y + 6, 6, 1);   // bottom row
  // Head highlight (top-left)
  ctx.fillStyle = '#5050aa';
  ctx.fillRect(hx + 1, Y + 1, 3, 2);
  // Head shadow (right)
  ctx.fillStyle = '#18183a';
  ctx.fillRect(hx + 5, Y + 1, 3, 5);

  // Visor strip (eyes glow)
  ctx.fillStyle = zonePal.pGlow;
  ctx.globalAlpha = visorAlpha;
  ctx.fillRect(hx + 1, Y + 2, 6, 3);
  ctx.globalAlpha = 1;
  // Visor dark top/bottom border
  ctx.fillStyle = '#000020';
  ctx.fillRect(hx + 1, Y + 2, 6, 1);
  ctx.fillRect(hx + 1, Y + 4, 6, 1);

  // ── TORSO (10×8, leaning slightly) ───────────────────────────────
  const tx = X + 1 + (lean > 0 ? 1 : 0);
  const ty = Y + 7;
  ctx.fillStyle = '#3a3a8e';
  ctx.fillRect(tx, ty, 10, 8);
  ctx.fillStyle = '#5555b8';                    // highlight stripe left
  ctx.fillRect(tx, ty, 2, 8);
  ctx.fillStyle = '#22225a';                    // shadow right
  ctx.fillRect(tx + 8, ty, 2, 8);
  // Logo/detail line on chest
  ctx.fillStyle = zonePal.pGlow;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(tx + 2, ty + 3, 5, 1);
  ctx.globalAlpha = 1;

  // ── CAPE/HOOD TAIL (trailing behind, animated) ────────────────────
  const capeOff = running ? Math.round(Math.sin(phase * 2) * 1.5) : 0;
  ctx.fillStyle = '#28285e';
  ctx.fillRect(X, ty + 1, 3, 5 + capeOff);
  ctx.fillStyle = '#18183a';
  ctx.fillRect(X, ty + 6 + capeOff, 2, 2);

  // ── FRONT ARM ────────────────────────────────────────────────────
  const armF  = Math.round(armSwing * 4);
  ctx.fillStyle = '#2a2a70';
  ctx.fillRect(tx + 8, ty + 1 + armF, 4, 3);    // upper arm
  ctx.fillRect(tx + 10, ty + 4 + armF, 3, 3);   // forearm

  // ── BACK ARM ─────────────────────────────────────────────────────
  const armB  = Math.round(-armSwing * 3);
  ctx.fillStyle = '#222260';
  ctx.fillRect(X - 1, ty + 1 + armB, 3, 3);

  // ── LEGS ─────────────────────────────────────────────────────────
  const ly2 = ty + 8;
  const legF = Math.round(legSwing * 5);         // front leg
  const legB = Math.round(-legSwing * 4);        // back leg

  // Back leg (drawn first, behind)
  ctx.fillStyle = '#1a1a50';
  ctx.fillRect(tx + 2, ly2 + Math.max(0, legB), 4, 4 - Math.min(0, legB));   // thigh
  ctx.fillRect(tx + 3, ly2 + 4 + legB, 3, 2);                                // shin
  // Foot (back)
  ctx.fillStyle = '#333380';
  ctx.fillRect(tx + 1 + (legB < 0 ? -1 : 1), ly2 + 6 + legB, 5, 2);

  // Front leg
  ctx.fillStyle = '#252575';
  ctx.fillRect(tx + 5, ly2 + Math.max(0, legF), 4, 4 - Math.min(0, legF));   // thigh
  ctx.fillRect(tx + 5, ly2 + 4 + legF, 4, 2);                                // shin
  // Foot (front) — brighter
  ctx.fillStyle = '#4040aa';
  ctx.fillRect(tx + 4 + (legF > 0 ? 1 : -1), ly2 + 6 + legF, 6, 2);

  // ── BLOOM ────────────────────────────────────────────────────────
  if (toBloom) {
    oc.fillStyle = zonePal.pGlow;
    oc.globalAlpha = 0.85 * visorAlpha;
    oc.fillRect(hx, Y + 2, 9, 3);      // visor glow
    oc.globalAlpha = 0.3;
    oc.fillRect(tx, ty + 3, 6, 1);     // chest logo glow
    oc.globalAlpha = 1;
  }
}

// ── OBSTACLE & COLLECTIBLE RENDERING ──────────────────────────────────
function drawObstacles(ctx, layer) {
  const obs = getActiveObstacles();
  const hb  = playerHitbox();

  for (const o of obs) {
    const sameLayer = o.layer === layer || o.layer === 'both';

    if (o.type === 'collectible') {
      if (o.layer !== layer) continue;
      if (o._ref.collected) continue;
      const glow = zonePal.acc;
      // Pulse
      const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.005);
      ctx.save();
      ctx.fillStyle = glow;
      ctx.globalAlpha = (ctx.globalAlpha || 1) * pulse;
      ctx.fillRect(Math.floor(o.sx), Math.floor(o.sy), 8, 8);
      ctx.restore();
      // Bloom
      oc.fillStyle = glow;
      oc.globalAlpha = 0.8;
      oc.fillRect(Math.floor(o.sx)-2, Math.floor(o.sy)-2, 12, 12);
      oc.globalAlpha = 1;
      continue;
    }

    if (!sameLayer) continue;

    // 'both' barriers render at whichever layer is currently being drawn
    const gy = o.layer === 'both' ? (layer === 'roof' ? ROOF_Y : STREET_Y)
                                   : (o.layer === 'roof' ? ROOF_Y : STREET_Y);

    if (o.type === 'barrier') {
      const bx = Math.floor(o.sx), bw = o.w, bh = o.h;
      const by = Math.max(0, gy - bh);
      const visH = gy - by; // visible height (clamped to screen)

      // Color: street=cyan (shift UP to roof), roof=magenta (shift DOWN to street), both=red (jump over)
      const gateColor = o.layer === 'both' ? '#ff3300'
                      : o.layer === 'street' ? '#00ccff'
                      : '#ff44cc';
      const gateDark  = o.layer === 'both' ? '#330800'
                      : o.layer === 'street' ? '#003344'
                      : '#330022';

      // Dark frame fill
      ctx.fillStyle = gateDark;
      ctx.fillRect(bx, by, bw, visH);

      // Vertical edge rails
      ctx.fillStyle = gateColor;
      ctx.fillRect(bx,        by, 2,  visH);
      ctx.fillRect(bx+bw-2,  by, 2,  visH);

      // Horizontal bars every 12px
      for (let barY = by + 2; barY < by + visH - 2; barY += 12) {
        ctx.fillStyle = gateColor;
        ctx.fillRect(bx, barY, bw, 2);
      }

      // Top glow cap
      ctx.fillStyle = gateColor;
      ctx.fillRect(bx - 1, by, bw + 2, 3);

      // Bloom: top cap + rails
      oc.fillStyle = gateColor;
      oc.globalAlpha = 0.9;
      oc.fillRect(bx - 2, by - 1, bw + 4, 5);
      oc.globalAlpha = 0.4;
      oc.fillRect(bx, by, 2, visH);
      oc.fillRect(bx + bw - 2, by, 2, visH);
      oc.globalAlpha = 1;
    }

  }
}

// ── COLLISION DETECTION ───────────────────────────────────────────────
function checkCollisions() {
  const obs = getActiveObstacles();
  const hb  = playerHitbox();

  for (const o of obs) {
    if (o.type === 'collectible') {
      if (o.layer !== player.layer || o._ref.collected) continue;
      if (overlaps(hb, o.sx, o.sy, o.w, o.h)) {
        o._ref.collected = true;
        score += 100 * mult;
        SFX.collect();
        spawnCollect(o.sx + 4, o.sy + 4);
      }
      continue;
    }

    // Only check obstacles on player's current layer (or universal)
    if (o.layer !== player.layer && o.layer !== 'both') continue;

    // 'both' barriers use the player's current layer ground so they're always at foot level
    const gY = o.layer === 'both' ? groundY() : (o.layer === 'roof' ? ROOF_Y : STREET_Y);

    if (o.type === 'barrier') {
      const bx = o.sx, by = gY - o.h, bw = o.w, bh = o.h;
      if (overlaps(hb, bx, by, bw, bh)) { killPlayer(); return; }
      // Near miss
      const closeX = hb.right > bx - NEAR_MISS_PX && hb.right < bx;
      if (closeX && hb.bottom > by && hb.top < by+bh) {
        if (!o._orig._nearMissed) {
          o._orig._nearMissed = true;
          mult = Math.min(8, mult + 0.1);
          SFX.nearMiss();
          spawnNearMiss(bx, by + bh/2);
        }
      }
    }

  }
}

// ── GROUND RENDERING ─────────────────────────────────────────────────
function drawGround(ctx, layer) {
  const gY   = layer === 'street' ? STREET_Y : ROOF_Y;
  const gndH = H - gY;

  // Draw ground except over pits
  ctx.fillStyle = zonePal.gnd;
  ctx.fillRect(0, gY, W, gndH);

  // Ground detail line
  ctx.fillStyle = zonePal.gndD;
  ctx.fillRect(0, gY, W, 2);

  // Pit cutouts
  for (const chunk of chunks) {
    const pitArr = layer === 'street' ? chunk.streetPits : chunk.roofPits;
    const cx = chunk.worldX - cameraX;
    for (const pit of pitArr) {
      const px = Math.floor(cx + pit.x), pw2 = pit.w;
      // Cut out pit
      ctx.clearRect(px, gY, pw2, gndH);
      // Pit edge glow
      ctx.fillStyle = zonePal.acc + '44';
      ctx.fillRect(px, gY, 2, gndH);
      ctx.fillRect(px+pw2-2, gY, 2, gndH);
    }
  }
}

// ── HUD ──────────────────────────────────────────────────────────────
function drawHUD() {
  // Update crisp HTML overlay elements
  hudDistEl.textContent = dist + 'm';
  hudMultEl.textContent = '×' + mult.toFixed(1);
  hudMultEl.style.color = zonePal.acc2;
  hudEmpEl.textContent  = player.empLocked ? 'EMP' : '';

  // Phase shift cooldown ring near player (canvas arc, no text)
  const cx = PLAYER_X + PW/2, cy = player.y - 8;
  if (player.shiftCooldown > 0) {
    const pct = 1 - player.shiftCooldown / SHIFT_CD_F;
    gc.strokeStyle = '#ffffff55';
    gc.lineWidth = 1;
    gc.beginPath();
    gc.arc(cx, cy, 5, -Math.PI/2, -Math.PI/2 + pct * Math.PI * 2);
    gc.stroke();
  } else if (player.state !== 'dead') {
    // Ready glow dot
    gc.fillStyle = zonePal.pGlow + 'cc';
    gc.beginPath();
    gc.arc(cx, cy, 2, 0, Math.PI*2);
    gc.fill();
    oc.fillStyle = zonePal.pGlow;
    oc.beginPath();
    oc.arc(cx, cy, 3, 0, Math.PI*2);
    oc.fill();
  }

  // ── Shift-warning arrow ───────────────────────────────────────────
  // Scan ahead for a barrier that's on the player's current layer (must shift to avoid)
  const WARN_DIST = 120;
  let shiftTarget = null;
  for (const o of getActiveObstacles()) {
    if (o.type !== 'barrier' || o.layer === 'both') continue;
    if (o.layer !== player.layer) continue;
    if (o.sx > PLAYER_X + PW && o.sx < PLAYER_X + WARN_DIST) {
      shiftTarget = o; break;
    }
  }
  if (shiftTarget && player.state !== 'dead') {
    const urgency  = 1 - (shiftTarget.sx - PLAYER_X - PW) / (WARN_DIST - PW);
    // Pulse faster as barrier closes in
    const pulse    = 0.55 + 0.45 * Math.abs(Math.sin(Date.now() * (0.005 + urgency * 0.012)));
    // Cyan = barrier is on street → shift UP to roof; Magenta = barrier on roof → shift DOWN to street
    const toRoof   = shiftTarget.layer === 'street';
    const color    = toRoof ? '#00ccff' : '#ff44cc';
    const ax       = Math.floor(PLAYER_X + PW/2) - 3;   // 7px wide arrow, centred on player
    const ay       = Math.floor(player.y) - 16;           // just above head

    gc.fillStyle   = color;
    gc.globalAlpha = pulse;
    if (toRoof) {
      // Up-arrow (7×7 pixels)
      gc.fillRect(ax+3, ay,   1, 1);
      gc.fillRect(ax+2, ay+1, 3, 1);
      gc.fillRect(ax+1, ay+2, 5, 1);
      gc.fillRect(ax+2, ay+3, 3, 2);  // stem
      gc.fillRect(ax+2, ay+5, 3, 2);
    } else {
      // Down-arrow (7×7 pixels)
      gc.fillRect(ax+2, ay,   3, 2);  // stem
      gc.fillRect(ax+2, ay+2, 3, 2);
      gc.fillRect(ax+1, ay+4, 5, 1);
      gc.fillRect(ax+2, ay+5, 3, 1);
      gc.fillRect(ax+3, ay+6, 1, 1);
    }
    // Bloom halo behind arrow
    oc.fillStyle   = color;
    oc.globalAlpha = pulse * 0.7;
    oc.fillRect(ax - 1, ay - 1, 9, 9);
    oc.globalAlpha = 1;
    gc.globalAlpha = 1;
  }
}

// ── POST-PROCESSING ───────────────────────────────────────────────────
function applyPostProcessing() {
  // Flush bloom offscreen to bloom canvas
  bc.clearRect(0,0,W,H);
  bc.filter = 'blur(3px)';
  bc.drawImage(offC, 0, 0);
  bc.filter = 'none';
  oc.clearRect(0,0,W,H);

  // Vignette on game canvas
  const vig = gc.createRadialGradient(W/2,H/2,H*0.25, W/2,H/2,H*0.8);
  const vAlpha = Math.min(0.5, 0.3 + speed/SPEED_MAX * 0.2);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, `rgba(0,0,0,${vAlpha})`);
  gc.fillStyle = vig;
  gc.fillRect(0,0,W,H);

  // Chromatic aberration burst on shift / death
  if (scanlineFlash > 0) {
    const intensity = scanlineFlash / 20;
    gc.globalAlpha = intensity * 0.25;
    gc.fillStyle = '#ff0000';
    gc.fillRect(-2, 0, W, H);
    gc.globalAlpha = intensity * 0.15;
    gc.fillStyle = '#00ffff';
    gc.fillRect(2, 0, W, H);
    gc.globalAlpha = 1;
    scanlineFlash--;
  }

  // EMP zone overlay
  if (player.empLocked) {
    empVisual = Math.min(0.15, empVisual + 0.02);
  } else {
    empVisual = Math.max(0, empVisual - 0.03);
  }
  if (empVisual > 0) {
    gc.fillStyle = `rgba(255,0,0,${empVisual})`;
    gc.fillRect(0,0,W,H);
    // Scanline distortion
    for (let y=0; y<H; y+=4) {
      if (Math.random() < 0.05) {
        gc.globalAlpha = 0.1;
        gc.fillStyle = '#ff0000';
        gc.fillRect(0, y, W, 1);
        gc.globalAlpha = 1;
      }
    }
  }
}

// ── MAIN GAME LOOP ────────────────────────────────────────────────────
let lastTime = 0;
function loop(timestamp) {
  const dt = Math.min(32, timestamp - lastTime);
  lastTime = timestamp;

  // Freeze frames (impact pauses)
  if (freezeFrames > 0) { freezeFrames--; requestAnimationFrame(loop); return; }

  // ── UPDATE ──
  if (gameState === 'playing') {
    // Speed ramp
    speed = Math.min(SPEED_MAX, speed + SPEED_GROW * speed);
    // Scroll camera
    cameraX += speed;
    // Distance in meters (5px per meter)
    dist = Math.floor(cameraX / 5);
    // Score
    score += speed * mult * 0.05;

    // Update palette and check zone change
    updatePalette(dist);
    const zi = getZoneIndex(dist);
    if (zi !== lastZoneIndex) {
      lastZoneIndex = zi;
      SFX.milestone();
      screenShake(2, 6);
      freezeFrames = 2;
      showZoneBanner(ZONES[zi].name);
    }

    ensureChunks();
    updatePlayer();
    prevInput.jump  = input.jump;
    prevInput.shift = input.shift;
    if (player.state !== 'dead') checkCollisions();
    updateParticles();
    updateAmbient();
    spawnAmbient();

    // Multiplier decay
    mult = Math.max(1, mult - 0.0005);

    // Death timer
    if (player.state === 'dead') {
      deadTimer--;
      if (deadTimer <= 0) showGameOver();
    }
  }

  // ── RENDER ──
  gc.clearRect(0,0,W,H);
  oc.clearRect(0,0,W,H);

  // Screen shake offset
  let shX = 0, shY = 0;
  if (shakeFrames > 0) {
    shX = (Math.random()-0.5) * shakeMag * 2;
    shY = (Math.random()-0.5) * shakeMag * 2;
    shakeFrames--;
    shakeMag *= 0.85;
  }
  gc.save(); gc.translate(shX, shY);
  oc.save(); oc.translate(shX, shY);

  if (gameState === 'playing' || gameState === 'dead') {
    // Background
    drawBackground(cameraX);

    // Inactive layer (dimmed at 35% opacity)
    const inactiveLayer = player.layer === 'street' ? 'roof' : 'street';
    gc.save();
    gc.globalAlpha = 0.35;
    drawGround(gc, inactiveLayer);
    drawObstacles(gc, inactiveLayer);
    gc.restore();

    // Active layer ground
    drawGround(gc, player.layer);

    // Active layer obstacles
    drawObstacles(gc, player.layer);

    // Particles (game and ambient)
    drawParticles(gc);

    // Player
    drawPlayer(gc, true);

    // HUD
    if (player.state !== 'dead') drawHUD();

    // Post-processing
    gc.restore();
    oc.restore();
    applyPostProcessing();

  } else {
    // Title screen — draw animated Neon District background
    gc.restore(); oc.restore();
    gc.fillStyle = ZONES[0].bg;
    gc.fillRect(0,0,W,H);
    drawBuildings(gc, (Date.now() * 0.02) % (W*2), ZONES[0].buildFar, 24, 40, 18, 14, 70, 110);
    drawBuildings(gc, (Date.now() * 0.06) % (W*2), ZONES[0].buildNear, 18, 30, 25, 20, 95, 135);
    // Neon ground strip
    gc.fillStyle = ZONES[0].gnd;
    gc.fillRect(0, STREET_Y, W, H-STREET_Y);
    gc.fillStyle = ZONES[0].gndD;
    gc.fillRect(0, STREET_Y, W, 2);
    // Rain
    const t = Date.now() * 0.005;
    gc.strokeStyle = ZONES[0].acc2 + '55';
    gc.lineWidth = 1;
    for (let i=0; i<20; i++) {
      const rx = ((Math.sin(i*37.3)*0.5+0.5)*W*3 + t*40) % W;
      const ry = ((Math.cos(i*19.7)*0.5+0.5)*H*3 + t*80) % H;
      gc.beginPath(); gc.moveTo(rx, ry); gc.lineTo(rx-3, ry+8); gc.stroke();
    }
    // Update hi-score on title
    document.getElementById('hi-dist').textContent = hiDist;
  }

  requestAnimationFrame(loop);
}

// ── START ─────────────────────────────────────────────────────────────
updatePalette(0);
document.getElementById('title-screen').classList.remove('hidden');
requestAnimationFrame(loop);
