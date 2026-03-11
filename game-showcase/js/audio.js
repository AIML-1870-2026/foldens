/* ══════════════════════════════════════════
   WEB AUDIO — FILE-BASED AUDIO SYSTEM
   Sources: OpenGameArt.org (CC0 / CC-BY)
══════════════════════════════════════════ */
let audioCtx = null;
let _analyser = null;
const audioBuffers = {};

const SFX_FILES = {
  // Tower attack sounds
  club:            'assets/sfx/club.wav',
  rockThrower:     'assets/sfx/stone.wav',
  spear:           'assets/sfx/spear.wav',
  swordsman:       'assets/sfx/sword.wav',
  archer:          'assets/sfx/bow.wav',
  cavalry:         'assets/sfx/horse.wav',
  // Era 1 enemies
  boar:            'assets/sfx/boar.ogg',
  saberToothTiger: 'assets/sfx/tiger.wav',
  mammoth:         'assets/sfx/mammoth.wav',
  // Era 2 enemies
  witch:           'assets/sfx/witch.wav',
  vampire:         'assets/sfx/vampire.wav',
  ghost:           'assets/sfx/ghost.wav',
  // Era 3 enemies
  pirate:          'assets/sfx/gunshot.wav',
  explosion:       'assets/sfx/explosion.wav',
  // Era 4 enemies
  zombie:          'assets/sfx/zombie.wav',
  // Era 5 enemies
  alienGun:        'assets/sfx/alien_gun.wav',
  ufo:             'assets/sfx/ufo.wav',
};

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  _analyser = audioCtx.createAnalyser();
  _analyser.fftSize = 1024;
  _analyser.smoothingTimeConstant = 0.7;
  _analyser.connect(audioCtx.destination);
}

async function loadSound(key) {
  if (audioBuffers[key]) return audioBuffers[key];
  initAudio();
  try {
    const resp = await fetch(SFX_FILES[key]);
    const arrayBuf = await resp.arrayBuffer();
    const decoded = await audioCtx.decodeAudioData(arrayBuf);
    audioBuffers[key] = decoded;
    return decoded;
  } catch (err) {
    console.warn('Could not load sound:', key, err);
    return null;
  }
}

function playBuffer(buffer) {
  const src  = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  gain.gain.value = 0.85;
  src.buffer = buffer;
  src.connect(gain);
  gain.connect(_analyser);
  src.start();
  return buffer.duration;
}

// Tower type → SFX key
const TOWER_SFX = {
  club:        'club',
  rockThrower: 'rockThrower',
  spear:       'spear',
  sword:       'swordsman',
  cavalry:     'cavalry',
  crossbow:    'archer',
};

// Enemy type → SFX key
const ENEMY_SFX = {
  // Era 1
  boar:         'boar',
  sabreTooth:   'saberToothTiger',
  mastodon:     'mammoth',
  // Era 2
  witch:        'witch',
  vampire:      'vampire',
  ghost:        'ghost',
  // Era 3
  pirateSword:  'pirate',
  pirateRifle:  'pirate',
  pirateBomb:   'explosion',
  // Era 4
  gruntZombie:  'zombie',
  vombie:       'zombie',
  necroZombie:  'zombie',
  // Era 5
  laserAlien:   'alienGun',
  fortniteBart: 'alienGun',
  flyingSaucer: 'ufo',
};

// Throttle: minimum ms between plays of the same sound
const _sfxCooldowns = {};
const SFX_THROTTLE_MS = 120;

function playSound(key) {
  if (!key || !SFX_FILES[key]) return;
  const now = performance.now();
  if (_sfxCooldowns[key] && now - _sfxCooldowns[key] < SFX_THROTTLE_MS) return;
  _sfxCooldowns[key] = now;
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  loadSound(key).then(buf => { if (buf) playBuffer(buf); });
}
