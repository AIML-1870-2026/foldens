/**
 * Snake: Dungeon Edition
 * A dungeon-crawling snake game with roguelike elements
 */

// ============================================
// SECTION 1: GAME IDENTITY - CONSTANTS & CONFIGURATION
// ============================================

const CONFIG = {
    // Canvas settings
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    GRID_COLS: 40,
    GRID_ROWS: 30,
    CELL_SIZE: 20,

    // Game timing
    BASE_TICK_RATE: 150,
    MIN_TICK_RATE: 90,

    // Snake settings
    INITIAL_SNAKE_LENGTH: 3,
    MIN_SNAKE_LENGTH: 3,

    // Visibility
    FLASHLIGHT_RADIUS: 6,

    // Power-up settings
    POWERUP_SPAWN_INTERVAL: 15000,
    MAX_POWERUPS_ON_FIELD: 2,

    // Scoring
    COMBO_TIMEOUT: 3000,
    MAX_COMBO: 5,

    // Food spawn
    FOOD_SPAWN_INTERVAL: 2000,
    MAX_FOOD_ON_FIELD: 5,

    // Difficulty progression intervals (ms)
    DIFFICULTY_INTERVALS: [0, 30000, 60000, 90000, 120000, 180000, 240000],
    TICK_RATES: [150, 140, 130, 120, 110, 100, 90],
    HAZARD_INTERVALS: [10000, 8000, 6000, 5000, 4000, 3000, 2500],
    WALL_SPAWN_CHANCES: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]
};

// Color palette from spec
const COLORS = {
    // Primary Dungeon Colors
    stoneDark: '#1a1a2e',
    stoneMid: '#2d2d44',
    stoneLight: '#4a4a6a',

    // Organic Accent Colors
    mossGreen: '#3d5c3d',
    vineGreen: '#5a8a5a',
    mossDark: '#2a3d2a',

    // Light and Fire
    torchOrange: '#d4943a',
    torchYellow: '#f4d03f',
    torchGlow: 'rgba(212, 148, 58, 0.3)',

    // Snake Energy Colors
    snakePrimary: '#5dade2',
    snakeGlow: '#85c1e9',
    snakeEnergy: '#d6eaf8',

    // Treasure and Pickups
    gold: '#f4d03f',
    gemRed: '#e74c3c',
    gemBlue: '#3498db',
    gemGreen: '#2ecc71',
    gemPurple: '#9b59b6',

    // Hazard Colors
    poisonPurple: '#6c3483',
    bombRed: '#922b21',
    dangerOrange: '#e67e22',

    // UI Colors
    uiBackground: 'rgba(10, 10, 20, 0.9)',
    uiBorder: '#4a4a6a',
    uiText: '#f5f5dc',
    uiAccent: '#5dade2',

    // Background
    voidBlack: '#000000',
    floorDark: '#16213e',
    floorPattern: '#1f2f50'
};

// Food types with their properties
const FOOD_TYPES = {
    FRUIT: { name: 'Fruit', points: 10, growth: 1, color: COLORS.gemRed, rarity: 0.6 },
    GEM: { name: 'Gem', points: 50, growth: 1, color: COLORS.gemPurple, rarity: 0.2 },
    ENERGY_ORB: { name: 'Energy Orb', points: 25, growth: 2, color: COLORS.snakePrimary, rarity: 0.15 },
    GOLDEN_SKULL: { name: 'Golden Skull', points: 100, growth: 3, color: COLORS.gold, rarity: 0.05 }
};

// Power-up types
const POWERUP_TYPES = {
    SLOW_MOTION: { name: 'Slow Motion', duration: 5000, icon: '🐢', color: COLORS.gemBlue },
    GHOST: { name: 'Ghost', duration: 4000, icon: '👻', color: COLORS.stoneLight },
    SHIELD: { name: 'Shield', duration: Infinity, icon: '🛡️', color: COLORS.gold },
    TIME_FREEZE: { name: 'Time Freeze', duration: 3000, icon: '⏱️', color: COLORS.gemBlue },
    TRIM: { name: 'Trim', duration: 0, icon: '✂️', color: COLORS.gemGreen }
};

// Hazard types
const HAZARD_TYPES = {
    POISON: { name: 'Poison Food', lethal: false, duration: 3000, icon: '💀', color: COLORS.poisonPurple },
    BOMB: { name: 'Bomb', lethal: true, countdown: 5000, radius: 2, icon: '💣', color: COLORS.bombRed },
    STATIC_OBSTACLE: { name: 'Pillar', lethal: true, icon: '🧱', color: COLORS.stoneMid },
    MOVING_OBSTACLE: { name: 'Boulder', lethal: true, speed: 500, icon: '🚧', color: COLORS.stoneLight }
};

// Terrain types
const TERRAIN_TYPES = {
    NORMAL: { speedMod: 1.0, color: COLORS.floorDark },
    MUD: { speedMod: 0.5, color: '#5d4e37' },
    ICE: { speedMod: 1.5, color: '#a8d8ea' },
    LAVA: { speedMod: 1.0, lethal: true, color: COLORS.dangerOrange }
};

// Directions
const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// Game states
const GAME_STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    PUZZLE_SELECT: 'puzzleSelect',
    SETTINGS: 'settings',
    STATS: 'stats',
    ACHIEVEMENTS: 'achievements',
    CREDITS: 'credits'
};

// Game modes
const GAME_MODES = {
    SURVIVAL: 'survival',
    PUZZLE: 'puzzle'
};

// Achievement definitions
const ACHIEVEMENTS = {
    // Survival achievements
    FIRST_BLOOD: { name: 'First Blood', desc: 'Die for the first time', icon: '💀' },
    SURVIVOR: { name: 'Survivor', desc: 'Survive 60 seconds', icon: '⏰', reward: 'badge' },
    VETERAN: { name: 'Veteran', desc: 'Survive 120 seconds', icon: '🎖️', reward: 'skin' },
    LEGEND: { name: 'Legend', desc: 'Survive 180 seconds', icon: '👑', reward: 'theme' },
    UNTOUCHABLE: { name: 'Untouchable', desc: 'Survive 60s without shield', icon: '🌟' },
    COMBO_MASTER: { name: 'Combo Master', desc: 'Reach 5x combo', icon: '🔥' },
    COMBO_STREAK: { name: 'Combo Streak', desc: 'Maintain 5x for 10 seconds', icon: '💫' },
    GHOST_WALKER: { name: 'Ghost Walker', desc: 'Pass through 5 walls with Ghost', icon: '👻' },
    TREASURE_HUNTER: { name: 'Treasure Hunter', desc: 'Collect 50 items in one run', icon: '💎' },
    GOLDEN_HOARD: { name: 'Golden Hoard', desc: 'Collect 5 Golden Skulls in one run', icon: '💀' },
    // General achievements
    DEDICATED: { name: 'Dedicated', desc: 'Play 50 total games', icon: '🎮' },
    LONG_SNAKE: { name: 'Long Snake', desc: 'Reach length 30', icon: '🐍' },
    LONGER_SNAKE: { name: 'Longer Snake', desc: 'Reach length 50', icon: '🐉', reward: 'skin' },
    SCORE_SEEKER: { name: 'Score Seeker', desc: 'Reach 1000 points', icon: '📊' },
    HIGH_ROLLER: { name: 'High Roller', desc: 'Reach 5000 points', icon: '🎰' },
    SCORE_MASTER: { name: 'Score Master', desc: 'Reach 10000 points', icon: '🏆', reward: 'theme' }
};

// Puzzle level definitions
const PUZZLE_LEVELS = [
    {
        name: 'First Steps',
        gridWidth: 20,
        gridHeight: 15,
        snakeStart: { x: 10, y: 7, dir: 'RIGHT' },
        walls: [],
        food: [
            { x: 5, y: 7, type: 'FRUIT' },
            { x: 8, y: 5, type: 'FRUIT' },
            { x: 12, y: 9, type: 'FRUIT' },
            { x: 15, y: 7, type: 'FRUIT' },
            { x: 10, y: 12, type: 'FRUIT' }
        ],
        hazards: [],
        goal: { collect: 5 },
        parTime: 30,
        parMoves: 50
    },
    {
        name: 'The Corridor',
        gridWidth: 25,
        gridHeight: 10,
        snakeStart: { x: 2, y: 5, dir: 'RIGHT' },
        walls: [
            { x: 0, y: 3, w: 25, h: 1 },
            { x: 0, y: 7, w: 25, h: 1 }
        ],
        food: [
            { x: 5, y: 5, type: 'FRUIT' },
            { x: 10, y: 5, type: 'FRUIT' },
            { x: 15, y: 5, type: 'FRUIT' },
            { x: 20, y: 5, type: 'GEM' }
        ],
        hazards: [],
        goal: { collect: 4 },
        parTime: 20,
        parMoves: 30
    },
    {
        name: 'Crossroads',
        gridWidth: 20,
        gridHeight: 20,
        snakeStart: { x: 10, y: 2, dir: 'DOWN' },
        walls: [
            { x: 8, y: 8, w: 1, h: 4 },
            { x: 12, y: 8, w: 1, h: 4 }
        ],
        food: [
            { x: 2, y: 10, type: 'GEM' },
            { x: 18, y: 10, type: 'GEM' },
            { x: 10, y: 2, type: 'GEM' },
            { x: 10, y: 18, type: 'GEM' }
        ],
        hazards: [
            { x: 10, y: 10, type: 'STATIC_OBSTACLE' }
        ],
        goal: { collect: 4 },
        parTime: 40,
        parMoves: 60
    },
    {
        name: 'The Patrol',
        gridWidth: 20,
        gridHeight: 15,
        snakeStart: { x: 2, y: 7, dir: 'RIGHT' },
        walls: [],
        food: [
            { x: 5, y: 3, type: 'FRUIT' },
            { x: 10, y: 7, type: 'FRUIT' },
            { x: 15, y: 11, type: 'FRUIT' },
            { x: 8, y: 12, type: 'GEM' },
            { x: 17, y: 3, type: 'ENERGY_ORB' }
        ],
        hazards: [
            { x: 10, y: 1, type: 'MOVING_OBSTACLE', dir: 'DOWN', range: 13 }
        ],
        goal: { collect: 5 },
        parTime: 35,
        parMoves: 70
    },
    {
        name: 'Dark Passage',
        gridWidth: 25,
        gridHeight: 15,
        snakeStart: { x: 2, y: 7, dir: 'RIGHT' },
        walls: [
            { x: 5, y: 0, w: 1, h: 5 },
            { x: 5, y: 10, w: 1, h: 5 },
            { x: 10, y: 5, w: 1, h: 5 },
            { x: 15, y: 0, w: 1, h: 5 },
            { x: 15, y: 10, w: 1, h: 5 },
            { x: 20, y: 5, w: 1, h: 5 }
        ],
        food: [
            { x: 3, y: 7, type: 'FRUIT' },
            { x: 7, y: 3, type: 'FRUIT' },
            { x: 7, y: 12, type: 'FRUIT' },
            { x: 12, y: 7, type: 'GEM' },
            { x: 17, y: 3, type: 'FRUIT' },
            { x: 17, y: 12, type: 'FRUIT' },
            { x: 22, y: 7, type: 'GOLDEN_SKULL' }
        ],
        hazards: [],
        goal: { collect: 7 },
        parTime: 45,
        parMoves: 80,
        flashlight: true
    }
];

// Tips shown on game over
const GAME_TIPS = [
    'Use Ghost mode to escape tight corners!',
    'Combo multiplier resets after 3 seconds without eating.',
    'Shield protects you from one fatal collision.',
    'Slow Motion helps navigate through hazards.',
    'Watch out for poison food - it reverses your controls!',
    'Bombs explode in a 2-cell radius.',
    'Moving obstacles stop during Time Freeze.',
    'Trim removes 3 tail segments instantly.',
    'Higher combos mean higher scores!',
    'Doors connect opposite sides of the room.'
];

// ============================================
// SECTION 2: UTILITY FUNCTIONS
// ============================================

const Utils = {
    // Random number in range
    random: (min, max) => Math.random() * (max - min) + min,
    randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

    // Random choice from array
    randomChoice: (arr) => arr[Math.floor(Math.random() * arr.length)],

    // Weighted random choice
    weightedChoice: (items) => {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        for (const item of items) {
            random -= item.weight;
            if (random <= 0) return item.value;
        }
        return items[items.length - 1].value;
    },

    // Distance between two points
    distance: (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),

    // Check if point is in bounds
    inBounds: (x, y, width, height) => x >= 0 && x < width && y >= 0 && y < height,

    // Clamp value
    clamp: (val, min, max) => Math.max(min, Math.min(max, val)),

    // Linear interpolation
    lerp: (a, b, t) => a + (b - a) * t,

    // Ease out quad
    easeOutQuad: (t) => t * (2 - t),

    // Format time as MM:SS
    formatTime: (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },

    // Deep clone object
    clone: (obj) => JSON.parse(JSON.stringify(obj))
};

// ============================================
// SECTION 3: AUDIO MANAGER
// ============================================

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.initialized = false;

        // Volume settings (0-1)
        this.masterVolume = 0.7;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;
    }

    init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();

            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);

            this.updateVolumes();
            this.initialized = true;
        } catch (e) {
            console.warn('Audio not supported:', e);
        }
    }

    updateVolumes() {
        if (!this.initialized) return;
        this.masterGain.gain.value = this.masterVolume;
        this.musicGain.gain.value = this.musicVolume;
        this.sfxGain.gain.value = this.sfxVolume;
    }

    setMasterVolume(vol) {
        this.masterVolume = vol / 100;
        this.updateVolumes();
    }

    setMusicVolume(vol) {
        this.musicVolume = vol / 100;
        this.updateVolumes();
    }

    setSfxVolume(vol) {
        this.sfxVolume = vol / 100;
        this.updateVolumes();
    }

    // Generate simple sounds using Web Audio API
    playSound(type, options = {}) {
        if (!this.initialized) return;

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        switch (type) {
            case 'eat':
                this.playEatSound(ctx, now);
                break;
            case 'powerup':
                this.playPowerupSound(ctx, now);
                break;
            case 'death':
                this.playDeathSound(ctx, now);
                break;
            case 'click':
                this.playClickSound(ctx, now);
                break;
            case 'combo':
                this.playComboSound(ctx, now, options.level || 1);
                break;
            case 'shieldBreak':
                this.playShieldBreakSound(ctx, now);
                break;
            case 'achievement':
                this.playAchievementSound(ctx, now);
                break;
        }
    }

    playEatSound(ctx, now) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    playPowerupSound(ctx, now) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.3);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    playDeathSound(ctx, now) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    playClickSound(ctx, now) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    playComboSound(ctx, now, level) {
        const baseFreq = 400 + (level * 100);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    playShieldBreakSound(ctx, now) {
        // Glass shatter effect
        for (let i = 0; i < 5; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1000 + Math.random() * 2000, now + i * 0.02);

            gain.gain.setValueAtTime(0.15, now + i * 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.02 + 0.1);

            osc.start(now + i * 0.02);
            osc.stop(now + i * 0.02 + 0.1);
        }
    }

    playAchievementSound(ctx, now) {
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);

            gain.gain.setValueAtTime(0.2, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);

            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        });
    }

    // ============================================
    // Section 11: Audio Design - Additional sounds
    // ============================================

    // Bomb countdown beep (escalating pitch)
    playBombBeep(ctx, now, urgency) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'square';
        const baseFreq = 400 + urgency * 400; // Higher pitch as bomb nears explosion
        osc.frequency.setValueAtTime(baseFreq, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    // Ghost mode activation (ethereal whoosh)
    playGhostActivate(ctx, now) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.4);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    // Portal enter sound (mystical)
    playPortalEnter(ctx, now) {
        for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(300 + i * 200, now + i * 0.1);
            osc.frequency.exponentialRampToValueAtTime(600 + i * 200, now + i * 0.1 + 0.2);

            gain.gain.setValueAtTime(0.15, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);

            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.3);
        }
    }

    // Slow motion activate (time distortion)
    playSlowMotion(ctx, now) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.4);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    // Time freeze sound (crystalline)
    playTimeFreeze(ctx, now) {
        const notes = [800, 1200, 1600, 2000];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.05);

            gain.gain.setValueAtTime(0.1, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.2);

            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.2);
        });
    }

    // Level complete fanfare
    playLevelComplete(ctx, now) {
        const melody = [523, 659, 784, 1047, 784, 1047]; // C E G C' G C'
        melody.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.12);

            gain.gain.setValueAtTime(0.2, now + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.2);

            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.25);
        });
    }

    // Play ambient drip sound (background atmosphere)
    playAmbientDrip(ctx, now) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.1);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
    }
}

// ============================================
// SECTION 4: PARTICLE SYSTEM
// ============================================

class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 4;
        this.vy = options.vy || (Math.random() - 0.5) * 4;
        this.life = options.life || 1;
        this.maxLife = this.life;
        this.size = options.size || 4;
        this.color = options.color || COLORS.gold;
        this.gravity = options.gravity || 0;
        this.friction = options.friction || 0.98;
        this.shrink = options.shrink !== undefined ? options.shrink : true;
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life -= dt / 1000;
        return this.life > 0;
    }

    render(ctx) {
        const alpha = this.life / this.maxLife;
        const size = this.shrink ? this.size * alpha : this.size;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, options = {}) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, {
                ...options,
                vx: options.vx !== undefined ? options.vx : (Math.random() - 0.5) * (options.speed || 4),
                vy: options.vy !== undefined ? options.vy : (Math.random() - 0.5) * (options.speed || 4)
            }));
        }
    }

    // Burst effect for eating food
    burstAt(x, y, color) {
        this.emit(x, y, 12, {
            color: color,
            speed: 6,
            life: 0.5,
            size: 5,
            gravity: 0.1
        });
    }

    // Trail effect behind snake
    trail(x, y, color) {
        this.emit(x, y, 1, {
            color: color,
            speed: 0.5,
            life: 0.3,
            size: 3
        });
    }

    // Explosion effect for death
    explosion(x, y) {
        this.emit(x, y, 30, {
            color: COLORS.snakePrimary,
            speed: 8,
            life: 1,
            size: 6,
            gravity: 0.2
        });
    }

    // Sparkle effect for gems
    sparkle(x, y, color) {
        if (Math.random() < 0.3) {
            this.emit(x, y, 1, {
                color: color,
                speed: 1,
                life: 0.5,
                size: 2,
                vy: -1
            });
        }
    }

    // Section 3: Animation & Polish - Enhanced effects

    // Ambient dust particles floating in dungeon
    ambientDust(canvasWidth, canvasHeight) {
        if (Math.random() < 0.02) {
            this.emit(
                Math.random() * canvasWidth,
                canvasHeight + 10,
                1,
                {
                    color: 'rgba(255, 255, 255, 0.3)',
                    speed: 0.3,
                    life: 8,
                    size: 1.5,
                    vy: -0.3,
                    vx: (Math.random() - 0.5) * 0.5,
                    shrink: false,
                    gravity: -0.01
                }
            );
        }
    }

    // Torch ember particles
    torchEmber(x, y) {
        if (Math.random() < 0.1) {
            this.emit(x, y, 1, {
                color: COLORS.torchOrange,
                speed: 1,
                life: 1,
                size: 2,
                vy: -2,
                vx: (Math.random() - 0.5) * 2,
                gravity: -0.05
            });
        }
    }

    // Power-up activation burst
    powerupBurst(x, y, color) {
        // Ring of particles
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                color: color,
                life: 0.6,
                size: 4,
                friction: 0.95
            }));
        }
    }

    // Death fragment particles (snake segments breaking apart)
    deathFragments(segments, cellSize) {
        segments.forEach((seg, i) => {
            const x = seg.x * cellSize + cellSize / 2;
            const y = seg.y * cellSize + cellSize / 2;
            const delay = i * 20;

            setTimeout(() => {
                this.emit(x, y, 5, {
                    color: COLORS.snakePrimary,
                    speed: 5 + Math.random() * 3,
                    life: 0.8,
                    size: 4 + Math.random() * 3,
                    gravity: 0.15
                });
            }, delay);
        });
    }

    // Combo fire effect (particles rising at high combos)
    comboFire(x, y, comboLevel) {
        if (comboLevel >= 3) {
            const intensity = comboLevel - 2;
            for (let i = 0; i < intensity * 2; i++) {
                this.emit(x + (Math.random() - 0.5) * 20, y, 1, {
                    color: comboLevel >= 5 ? COLORS.gold : COLORS.torchOrange,
                    speed: 0.5,
                    life: 0.5,
                    size: 3,
                    vy: -3 - Math.random() * 2,
                    gravity: -0.1
                });
            }
        }
    }

    update(dt) {
        this.particles = this.particles.filter(p => p.update(dt));
    }

    render(ctx) {
        this.particles.forEach(p => p.render(ctx));
    }

    clear() {
        this.particles = [];
    }
}

// ============================================
// SECTION 5: INPUT MANAGER
// Section 12: Controls & Input - Enhanced handling
// ============================================

class InputManager {
    constructor() {
        this.inputBuffer = [];
        this.maxBufferSize = 2;
        this.keyMap = {};
        this.enabled = true;

        // Section 12: Enhanced input tracking
        this.keysPressed = new Set(); // Currently held keys
        this.lastDirection = null; // Last successful direction
        this.inputTimestamps = []; // For detecting rapid inputs
        this.controlsReversed = false; // For poison effect

        this.setupKeyBindings();
    }

    setupKeyBindings() {
        // Movement keys
        this.keyMap['ArrowUp'] = 'UP';
        this.keyMap['ArrowDown'] = 'DOWN';
        this.keyMap['ArrowLeft'] = 'LEFT';
        this.keyMap['ArrowRight'] = 'RIGHT';
        this.keyMap['KeyW'] = 'UP';
        this.keyMap['KeyS'] = 'DOWN';
        this.keyMap['KeyA'] = 'LEFT';
        this.keyMap['KeyD'] = 'RIGHT';

        // System keys
        this.keyMap['Escape'] = 'PAUSE';
        this.keyMap['Space'] = 'PAUSE';
        this.keyMap['Enter'] = 'CONFIRM';
    }

    handleKeyDown(event) {
        if (!this.enabled) return null;

        const action = this.keyMap[event.code];
        if (!action) return null;

        // Track pressed keys
        this.keysPressed.add(event.code);

        // Handle movement inputs
        if (['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(action)) {
            // Apply reversed controls if active
            let finalAction = action;
            if (this.controlsReversed) {
                const reverseMap = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
                finalAction = reverseMap[action];
            }

            if (this.inputBuffer.length < this.maxBufferSize) {
                this.inputBuffer.push(finalAction);
                this.inputTimestamps.push(Date.now());
                this.lastDirection = finalAction;
            }
            return finalAction;
        }

        return action;
    }

    handleKeyUp(event) {
        this.keysPressed.delete(event.code);
    }

    getNextDirection() {
        return this.inputBuffer.shift() || null;
    }

    clearBuffer() {
        this.inputBuffer = [];
        this.inputTimestamps = [];
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
        this.keysPressed.clear();
    }

    // Section 12: Check if a specific key is currently held
    isKeyPressed(code) {
        return this.keysPressed.has(code);
    }

    // Check if any movement key is held
    isMovementKeyHeld() {
        const movementKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'];
        return movementKeys.some(key => this.keysPressed.has(key));
    }

    // Get the opposite direction (for 180-degree turn prevention)
    getOppositeDirection(dir) {
        const opposites = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
        return opposites[dir] || null;
    }

    // Check if direction change is valid (not 180-degree turn)
    isValidDirectionChange(newDir, currentDir) {
        if (!currentDir) return true;
        return this.getOppositeDirection(newDir) !== currentDir;
    }

    // Set reversed controls (for poison effect)
    setReversedControls(reversed) {
        this.controlsReversed = reversed;
    }

    // Get input rate (inputs per second) - for detecting rapid input
    getInputRate() {
        const now = Date.now();
        // Only count inputs in last second
        this.inputTimestamps = this.inputTimestamps.filter(t => now - t < 1000);
        return this.inputTimestamps.length;
    }

    // Check if player is inputting rapidly (for combo feedback)
    isRapidInput() {
        return this.getInputRate() > 5;
    }
}

// ============================================
// SECTION 6: DUNGEON/MAP SYSTEM
// ============================================

class DungeonMap {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.walls = [];
        this.doors = [];
        this.terrain = [];

        this.init();
    }

    init() {
        // Initialize tile grid
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            this.terrain[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = 'floor';
                this.terrain[y][x] = 'NORMAL';
            }
        }

        // Create border walls
        this.createBorderWalls();
    }

    createBorderWalls() {
        this.walls = [];

        // Top and bottom walls
        for (let x = 0; x < this.width; x++) {
            if (x !== Math.floor(this.width / 2)) { // Leave door gap
                this.walls.push({ x, y: 0 });
                this.walls.push({ x, y: this.height - 1 });
            }
        }

        // Left and right walls
        for (let y = 0; y < this.height; y++) {
            if (y !== Math.floor(this.height / 2)) { // Leave door gap
                this.walls.push({ x: 0, y });
                this.walls.push({ x: this.width - 1, y });
            }
        }

        // Create doors at gaps
        this.doors = [
            { x: Math.floor(this.width / 2), y: 0, exit: { x: Math.floor(this.width / 2), y: this.height - 2 } },
            { x: Math.floor(this.width / 2), y: this.height - 1, exit: { x: Math.floor(this.width / 2), y: 1 } },
            { x: 0, y: Math.floor(this.height / 2), exit: { x: this.width - 2, y: Math.floor(this.height / 2) } },
            { x: this.width - 1, y: Math.floor(this.height / 2), exit: { x: 1, y: Math.floor(this.height / 2) } }
        ];
    }

    addWall(x, y, width = 1, height = 1) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const wx = x + dx;
                const wy = y + dy;
                if (Utils.inBounds(wx, wy, this.width, this.height)) {
                    // Check if it's not a door
                    if (!this.isDoor(wx, wy)) {
                        this.walls.push({ x: wx, y: wy });
                    }
                }
            }
        }
    }

    addMazeWall(minDistFromSnake, snakeHead) {
        // Wall shapes
        const shapes = [
            [[0,0], [1,0]], // Horizontal 2
            [[0,0], [1,0], [2,0]], // Horizontal 3
            [[0,0], [0,1]], // Vertical 2
            [[0,0], [0,1], [0,2]], // Vertical 3
            [[0,0], [1,0], [0,1]], // L shape
            [[0,0], [1,0], [1,1]], // L shape rotated
            [[0,0], [1,0], [0,1], [1,1]] // Square 2x2
        ];

        const shape = Utils.randomChoice(shapes);
        let attempts = 50;

        while (attempts > 0) {
            const x = Utils.randomInt(2, this.width - 4);
            const y = Utils.randomInt(2, this.height - 4);

            // Check distance from snake
            const dist = Utils.distance(x, y, snakeHead.x, snakeHead.y);
            if (dist < minDistFromSnake) {
                attempts--;
                continue;
            }

            // Check if all positions are valid
            let valid = true;
            for (const [dx, dy] of shape) {
                const wx = x + dx;
                const wy = y + dy;
                if (this.isWall(wx, wy) || this.isDoor(wx, wy)) {
                    valid = false;
                    break;
                }
            }

            if (valid) {
                for (const [dx, dy] of shape) {
                    this.walls.push({ x: x + dx, y: y + dy });
                }
                return true;
            }

            attempts--;
        }

        return false;
    }

    setTerrain(x, y, type, width = 1, height = 1) {
        for (let dy = 0; dy < height; dy++) {
            for (let dx = 0; dx < width; dx++) {
                const tx = x + dx;
                const ty = y + dy;
                if (Utils.inBounds(tx, ty, this.width, this.height)) {
                    this.terrain[ty][tx] = type;
                }
            }
        }
    }

    isWall(x, y) {
        return this.walls.some(w => w.x === x && w.y === y);
    }

    isDoor(x, y) {
        return this.doors.some(d => d.x === x && d.y === y);
    }

    getDoor(x, y) {
        return this.doors.find(d => d.x === x && d.y === y);
    }

    getTerrain(x, y) {
        if (!Utils.inBounds(x, y, this.width, this.height)) return 'NORMAL';
        return this.terrain[y][x];
    }

    getRandomEmptyPosition(minDistFrom = null, minDist = 5) {
        let attempts = 100;
        while (attempts > 0) {
            const x = Utils.randomInt(2, this.width - 3);
            const y = Utils.randomInt(2, this.height - 3);

            if (!this.isWall(x, y) && !this.isDoor(x, y)) {
                if (!minDistFrom || Utils.distance(x, y, minDistFrom.x, minDistFrom.y) >= minDist) {
                    return { x, y };
                }
            }
            attempts--;
        }
        return null;
    }

    loadPuzzleLevel(level) {
        this.width = level.gridWidth;
        this.height = level.gridHeight;
        this.walls = [];
        this.doors = [];
        this.terrain = [];

        // Reinitialize
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            this.terrain[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = 'floor';
                this.terrain[y][x] = 'NORMAL';
            }
        }

        // Create border (no doors in puzzle mode)
        for (let x = 0; x < this.width; x++) {
            this.walls.push({ x, y: 0 });
            this.walls.push({ x, y: this.height - 1 });
        }
        for (let y = 1; y < this.height - 1; y++) {
            this.walls.push({ x: 0, y });
            this.walls.push({ x: this.width - 1, y });
        }

        // Add level walls
        if (level.walls) {
            level.walls.forEach(wall => {
                this.addWall(wall.x, wall.y, wall.w || 1, wall.h || 1);
            });
        }
    }

    reset() {
        this.walls = [];
        this.doors = [];
        this.createBorderWalls();

        // Reset terrain
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.terrain[y][x] = 'NORMAL';
            }
        }
    }

    // ============================================
    // Section 7: Environment Features
    // Terrain zones, bonus rooms, decorative elements
    // ============================================

    // Spawn a random terrain zone
    spawnTerrainZone(snakeHead) {
        const zoneTypes = ['MUD', 'ICE'];
        const type = Utils.randomChoice(zoneTypes);

        // Random zone size (3x3 to 6x6)
        const width = Utils.randomInt(3, 6);
        const height = Utils.randomInt(3, 6);

        // Find valid position
        let attempts = 30;
        while (attempts > 0) {
            const x = Utils.randomInt(3, this.width - width - 3);
            const y = Utils.randomInt(3, this.height - height - 3);

            // Check distance from snake
            const dist = Utils.distance(x + width/2, y + height/2, snakeHead.x, snakeHead.y);
            if (dist < 5) {
                attempts--;
                continue;
            }

            // Check not blocking doors
            let blocksDoor = false;
            for (const door of this.doors) {
                if (door.x >= x && door.x < x + width &&
                    door.y >= y && door.y < y + height) {
                    blocksDoor = true;
                    break;
                }
            }

            if (!blocksDoor) {
                this.setTerrain(x, y, type, width, height);
                return { x, y, width, height, type };
            }

            attempts--;
        }
        return null;
    }

    // Create a lava border zone (danger zone around edges)
    createLavaBorder(thickness = 1) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                // Skip walls
                if (this.isWall(x, y) || this.isDoor(x, y)) continue;

                // Check if near border
                const distFromEdge = Math.min(
                    x, y,
                    this.width - 1 - x,
                    this.height - 1 - y
                );

                if (distFromEdge <= thickness) {
                    this.terrain[y][x] = 'LAVA';
                }
            }
        }
    }

    // Get all terrain zones for rendering
    getTerrainZones() {
        const zones = [];
        const visited = new Set();

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const terrain = this.terrain[y][x];
                if (terrain !== 'NORMAL' && !visited.has(`${x},${y}`)) {
                    // Flood fill to find zone bounds
                    const zone = this.floodFillZone(x, y, terrain, visited);
                    if (zone) zones.push(zone);
                }
            }
        }
        return zones;
    }

    // Helper for finding terrain zone boundaries
    floodFillZone(startX, startY, terrainType, visited) {
        const cells = [];
        const queue = [{ x: startX, y: startY }];

        while (queue.length > 0) {
            const { x, y } = queue.shift();
            const key = `${x},${y}`;

            if (visited.has(key)) continue;
            if (!Utils.inBounds(x, y, this.width, this.height)) continue;
            if (this.terrain[y][x] !== terrainType) continue;

            visited.add(key);
            cells.push({ x, y });

            queue.push({ x: x + 1, y });
            queue.push({ x: x - 1, y });
            queue.push({ x, y: y + 1 });
            queue.push({ x, y: y - 1 });
        }

        if (cells.length === 0) return null;

        // Calculate bounding box
        const minX = Math.min(...cells.map(c => c.x));
        const minY = Math.min(...cells.map(c => c.y));
        const maxX = Math.max(...cells.map(c => c.x));
        const maxY = Math.max(...cells.map(c => c.y));

        return {
            type: terrainType,
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1,
            cells
        };
    }

    // Generate decorative elements (bones, rocks, cobwebs)
    generateDecorations() {
        const decorations = [];
        const decorTypes = ['bone', 'rock', 'cobweb', 'crack'];

        for (let y = 2; y < this.height - 2; y++) {
            for (let x = 2; x < this.width - 2; x++) {
                if (this.isWall(x, y) || this.isDoor(x, y)) continue;

                // 5% chance for decoration
                if (Math.random() < 0.05) {
                    decorations.push({
                        x,
                        y,
                        type: Utils.randomChoice(decorTypes),
                        rotation: Math.random() * Math.PI * 2,
                        scale: 0.5 + Math.random() * 0.5
                    });
                }
            }
        }
        return decorations;
    }
}

// ============================================
// SECTION 7: ENTITY CLASSES
// ============================================

// Snake Entity
// Section 4: Core Mechanics - Enhanced movement system with smooth interpolation
class Snake {
    constructor(startX, startY, direction = DIRECTIONS.RIGHT) {
        this.segments = [];
        this.direction = { ...direction };
        this.nextDirection = { ...direction };
        this.growing = 0;
        this.ghostMode = false;
        this.hasShield = false;
        this.controlsReversed = false;

        // Visual properties
        this.wobblePhase = 0;
        this.visualPositions = [];

        // Section 4: Enhanced movement tracking
        this.moveHistory = []; // Track recent movements for smooth animation
        this.speedMultiplier = 1.0; // For terrain effects
        this.momentum = { x: 0, y: 0 }; // For ice terrain momentum
        this.turnAngle = 0; // Current visual turn angle
        this.targetTurnAngle = 0; // Target turn angle for smooth turning

        // Initialize segments
        for (let i = 0; i < CONFIG.INITIAL_SNAKE_LENGTH; i++) {
            this.segments.push({
                x: startX - i * direction.x,
                y: startY - i * direction.y
            });
        }

        // Initialize visual positions
        this.visualPositions = this.segments.map(s => ({ x: s.x, y: s.y }));
    }

    get head() {
        return this.segments[0];
    }

    get length() {
        return this.segments.length;
    }

    setDirection(dir) {
        // Prevent 180-degree turns
        if (this.direction.x + dir.x === 0 && this.direction.y + dir.y === 0) {
            return false;
        }

        // Handle reversed controls
        if (this.controlsReversed) {
            this.nextDirection = { x: -dir.x, y: -dir.y };
        } else {
            this.nextDirection = { ...dir };
        }
        return true;
    }

    move() {
        this.direction = { ...this.nextDirection };

        const newHead = {
            x: this.head.x + this.direction.x,
            y: this.head.y + this.direction.y
        };

        this.segments.unshift(newHead);

        if (this.growing > 0) {
            this.growing--;
        } else {
            this.segments.pop();
        }

        return newHead;
    }

    grow(amount = 1) {
        this.growing += amount;
    }

    trim(amount = 3) {
        const minLength = CONFIG.MIN_SNAKE_LENGTH;
        const toRemove = Math.min(amount, this.length - minLength);
        if (toRemove > 0) {
            this.segments.splice(-toRemove, toRemove);
            this.visualPositions.splice(-toRemove, toRemove);
        }
    }

    occupies(x, y, excludeHead = false) {
        const start = excludeHead ? 1 : 0;
        return this.segments.slice(start).some(s => s.x === x && s.y === y);
    }

    collidesWithSelf() {
        if (this.ghostMode) return false;
        return this.segments.slice(1).some(s => s.x === this.head.x && s.y === this.head.y);
    }

    // Section 4: Core Mechanics - Enhanced collision detection
    getCollisionBox() {
        return {
            x: this.head.x,
            y: this.head.y,
            width: 1,
            height: 1
        };
    }

    // Check if a position would cause collision (for AI or prediction)
    wouldCollideAt(x, y, map) {
        // Check wall collision
        if (map.isWall(x, y)) return true;
        // Check self collision
        if (!this.ghostMode && this.occupies(x, y, true)) return true;
        return false;
    }

    // Get the direction angle in radians (for visual rotation)
    getDirectionAngle() {
        if (this.direction.x === 1) return 0;
        if (this.direction.x === -1) return Math.PI;
        if (this.direction.y === 1) return Math.PI / 2;
        if (this.direction.y === -1) return -Math.PI / 2;
        return 0;
    }

    // Apply terrain speed modifier
    applyTerrainEffect(terrain) {
        switch (terrain) {
            case 'MUD':
                this.speedMultiplier = 0.5;
                this.momentum = { x: 0, y: 0 };
                break;
            case 'ICE':
                this.speedMultiplier = 1.5;
                // Build momentum on ice
                this.momentum.x = this.direction.x * 0.3;
                this.momentum.y = this.direction.y * 0.3;
                break;
            default:
                this.speedMultiplier = 1.0;
                // Gradually reduce momentum
                this.momentum.x *= 0.8;
                this.momentum.y *= 0.8;
        }
    }

    updateVisuals(dt) {
        this.wobblePhase += dt * 0.01;

        // Smoothly interpolate visual positions
        for (let i = 0; i < this.segments.length; i++) {
            if (!this.visualPositions[i]) {
                this.visualPositions[i] = { ...this.segments[i] };
            }
            this.visualPositions[i].x = Utils.lerp(
                this.visualPositions[i].x,
                this.segments[i].x,
                0.3
            );
            this.visualPositions[i].y = Utils.lerp(
                this.visualPositions[i].y,
                this.segments[i].y,
                0.3
            );
        }

        // Remove extra visual positions if snake shrunk
        while (this.visualPositions.length > this.segments.length) {
            this.visualPositions.pop();
        }
    }

    reset(startX, startY, direction) {
        this.segments = [];
        this.direction = { ...direction };
        this.nextDirection = { ...direction };
        this.growing = 0;
        this.ghostMode = false;
        this.hasShield = false;
        this.controlsReversed = false;

        for (let i = 0; i < CONFIG.INITIAL_SNAKE_LENGTH; i++) {
            this.segments.push({
                x: startX - i * direction.x,
                y: startY - i * direction.y
            });
        }

        this.visualPositions = this.segments.map(s => ({ x: s.x, y: s.y }));
    }
}

// Food Entity
class Food {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.collected = false;
    }

    update(dt) {
        this.pulsePhase += dt * 0.005;
    }

    getPulseScale() {
        return 1 + Math.sin(this.pulsePhase) * 0.1;
    }
}

// Power-up Entity
// Section 5: Power-up System - Enhanced visual effects and behaviors
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.collected = false;

        // Section 5: Enhanced power-up visuals
        this.rotationAngle = 0; // For spinning effect
        this.floatOffset = 0; // For floating effect
        this.glowIntensity = 0.5; // Dynamic glow
        this.spawnTime = Date.now();
        this.orbitParticles = []; // Orbiting particle positions

        // Initialize orbit particles (3 orbiting dots)
        for (let i = 0; i < 3; i++) {
            this.orbitParticles.push({
                angle: (i / 3) * Math.PI * 2,
                distance: 15,
                speed: 0.003
            });
        }
    }

    update(dt) {
        this.pulsePhase += dt * 0.004;

        // Section 5: Enhanced animations
        this.rotationAngle += dt * 0.002;
        this.floatOffset = Math.sin(this.pulsePhase * 2) * 3;
        this.glowIntensity = 0.5 + Math.sin(this.pulsePhase) * 0.3;

        // Update orbiting particles
        this.orbitParticles.forEach(particle => {
            particle.angle += particle.speed * dt;
        });
    }

    getPulseScale() {
        return 1 + Math.sin(this.pulsePhase) * 0.15;
    }

    // Get orbiting particle positions for rendering
    getOrbitPositions(centerX, centerY) {
        return this.orbitParticles.map(p => ({
            x: centerX + Math.cos(p.angle) * p.distance,
            y: centerY + Math.sin(p.angle) * p.distance + this.floatOffset
        }));
    }

    // Get appropriate warning message for each power-up type
    getWarningText() {
        switch (this.type) {
            case 'GHOST':
                return 'Exit walls before time runs out!';
            case 'SLOW_MOTION':
                return 'Time flows slowly...';
            case 'TIME_FREEZE':
                return 'Hazards frozen!';
            case 'SHIELD':
                return 'Protected!';
            case 'TRIM':
                return 'Trimmed!';
            default:
                return '';
        }
    }
}

// Hazard Entity
// Section 6: Hazard System - Enhanced behaviors and visual effects
class Hazard {
    constructor(x, y, type, options = {}) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;

        // Section 6: Enhanced visual properties
        this.visualX = x;
        this.visualY = y;
        this.shakeOffset = { x: 0, y: 0 };
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.dangerLevel = 0; // 0-1 based on proximity to snake

        // For bombs
        if (type === 'BOMB') {
            this.countdown = HAZARD_TYPES.BOMB.countdown;
            this.exploded = false;
            this.beepTimer = 1000;
            this.flashState = false;
        }

        // For moving obstacles
        if (type === 'MOVING_OBSTACLE') {
            this.direction = options.dir === 'DOWN' ? 1 : (options.dir === 'UP' ? -1 : (options.dir === 'RIGHT' ? 1 : -1));
            this.axis = (options.dir === 'DOWN' || options.dir === 'UP') ? 'y' : 'x';
            this.startPos = this[this.axis];
            this.range = options.range || 5;
            this.moveTimer = 0;
            this.frozen = false;
            this.rollAngle = 0; // Rolling animation
        }

        // For poison
        if (type === 'POISON') {
            this.bubblePhase = Math.random() * Math.PI * 2;
        }
    }

    update(dt, frozen = false) {
        this.pulsePhase += dt * 0.005;

        if (this.type === 'BOMB' && !this.exploded) {
            this.countdown -= dt;

            // Intensifying shake as bomb nears explosion
            const urgency = 1 - (this.countdown / HAZARD_TYPES.BOMB.countdown);
            this.shakeOffset.x = (Math.random() - 0.5) * urgency * 4;
            this.shakeOffset.y = (Math.random() - 0.5) * urgency * 4;

            // Beep timing (faster near end)
            this.beepTimer -= dt;
            if (this.beepTimer <= 0) {
                this.flashState = !this.flashState;
                this.beepTimer = Math.max(100, this.countdown / 5);
            }

            if (this.countdown <= 0) {
                this.exploded = true;
            }
        }

        if (this.type === 'MOVING_OBSTACLE') {
            // Smooth visual interpolation
            this.visualX = Utils.lerp(this.visualX, this.x, 0.2);
            this.visualY = Utils.lerp(this.visualY, this.y, 0.2);

            if (!frozen) {
                this.moveTimer += dt;
                if (this.moveTimer >= HAZARD_TYPES.MOVING_OBSTACLE.speed) {
                    this.moveTimer = 0;
                    this[this.axis] += this.direction;

                    // Rolling animation
                    this.rollAngle += Math.PI / 4 * this.direction;

                    // Reverse at boundaries
                    if (Math.abs(this[this.axis] - this.startPos) >= this.range) {
                        this.direction *= -1;
                    }
                }
            }
        }

        if (this.type === 'POISON') {
            this.bubblePhase += dt * 0.003;
        }
    }

    // Section 6: Calculate danger based on distance to player
    updateDangerLevel(snakeHead) {
        const dist = Utils.distance(this.x, this.y, snakeHead.x, snakeHead.y);
        this.dangerLevel = Math.max(0, 1 - dist / 8);
    }

    // Get visual shake for rendering
    getVisualPosition() {
        return {
            x: this.x + this.shakeOffset.x,
            y: this.y + this.shakeOffset.y
        };
    }

    isInExplosionRadius(x, y) {
        if (this.type !== 'BOMB' || !this.exploded) return false;
        const radius = HAZARD_TYPES.BOMB.radius;
        return Utils.distance(x, y, this.x, this.y) <= radius;
    }

    // Get warning color based on danger level
    getWarningColor() {
        if (this.dangerLevel > 0.7) return COLORS.dangerOrange;
        if (this.dangerLevel > 0.4) return COLORS.torchYellow;
        return null;
    }
}

// ============================================
// SECTION 8: SCORE POPUP CLASS
// Enhanced scoring feedback with visual effects
// ============================================

class ScorePopup {
    constructor(x, y, text, isCombo = false, options = {}) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.isCombo = isCombo;
        this.life = 1;
        this.maxLife = 1;
        this.vy = -2;

        // Section 8: Enhanced feedback options
        this.color = options.color || (isCombo ? COLORS.snakeGlow : COLORS.gold);
        this.scale = options.scale || (isCombo ? 1.3 : 1);
        this.baseSize = options.size || 14;
        this.bouncePhase = 0;
        this.type = options.type || 'score'; // 'score', 'combo', 'bonus', 'achievement'

        // Special effects based on type
        if (this.type === 'achievement') {
            this.scale = 1.5;
            this.color = COLORS.gold;
            this.vy = -1;
            this.life = 2;
            this.maxLife = 2;
        } else if (this.type === 'bonus') {
            this.color = COLORS.gemPurple;
            this.scale = 1.2;
        }
    }

    update(dt) {
        this.y += this.vy;
        this.life -= dt / 1000;
        this.bouncePhase += dt * 0.02;

        // Slow down as it fades
        this.vy *= 0.98;

        return this.life > 0;
    }

    // Get current opacity based on remaining life
    getAlpha() {
        return Utils.easeOutQuad(this.life / this.maxLife);
    }

    // Get current scale with bounce effect
    getCurrentScale() {
        const lifeRatio = this.life / this.maxLife;
        const bounce = lifeRatio > 0.7 ? Math.sin(this.bouncePhase) * 0.1 : 0;
        return this.scale * (0.8 + lifeRatio * 0.2) + bounce;
    }

    // Get font size
    getFontSize() {
        return Math.floor(this.baseSize * this.getCurrentScale());
    }
}

// Section 8: Combo Feedback Manager
class ComboManager {
    constructor() {
        this.combo = 1;
        this.maxCombo = 1;
        this.timer = 0;
        this.timeout = CONFIG.COMBO_TIMEOUT;
        this.streakStart = 0; // Time when streak started
        this.highComboTime = 0; // Time spent at max combo
    }

    // Add to combo and return new multiplier
    increment() {
        this.combo = Math.min(this.combo + 1, CONFIG.MAX_COMBO);
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.timer = this.timeout;

        if (this.combo === CONFIG.MAX_COMBO && this.streakStart === 0) {
            this.streakStart = Date.now();
        }

        return this.combo;
    }

    // Update combo timer
    update(dt) {
        if (this.combo > 1) {
            this.timer -= dt;

            // Track time at max combo
            if (this.combo === CONFIG.MAX_COMBO) {
                this.highComboTime += dt;
            }

            if (this.timer <= 0) {
                this.reset();
            }
        }
    }

    // Reset combo
    reset() {
        this.combo = 1;
        this.timer = 0;
        this.streakStart = 0;
    }

    // Get combo multiplier
    getMultiplier() {
        return this.combo;
    }

    // Get combo progress (0-1 for meter display)
    getProgress() {
        return this.timer / this.timeout;
    }

    // Check if combo is about to expire
    isExpiring() {
        return this.combo > 1 && this.timer < 1000;
    }

    // Get time spent at max combo
    getMaxComboTime() {
        return this.highComboTime;
    }
}

// ============================================
// SECTION 9: GAME STATE MANAGER
// Enhanced with game mode specific features
// ============================================

class GameStateManager {
    constructor() {
        this.currentState = GAME_STATES.MENU;
        this.previousState = null;
        this.gameMode = null;
        this.currentLevel = 0;

        // Section 9: Mode-specific state tracking
        this.survivalState = {
            difficultyLevel: 0,
            hazardsSpawned: 0,
            wallsSpawned: 0,
            bonusRoomsEntered: 0,
            inBonusRoom: false,
            bonusRoomTimer: 0
        };

        this.puzzleState = {
            collected: 0,
            goal: 0,
            moves: 0,
            parTime: 0,
            parMoves: 0,
            timeLimit: null,
            moveLimit: null,
            flashlightEnabled: false
        };

        // Transition effects
        this.transitionAlpha = 0;
        this.transitionTarget = null;
        this.transitionCallback = null;
    }

    setState(newState) {
        this.previousState = this.currentState;
        this.currentState = newState;
    }

    setMode(mode) {
        this.gameMode = mode;

        // Reset mode-specific state
        if (mode === GAME_MODES.SURVIVAL) {
            this.survivalState = {
                difficultyLevel: 0,
                hazardsSpawned: 0,
                wallsSpawned: 0,
                bonusRoomsEntered: 0,
                inBonusRoom: false,
                bonusRoomTimer: 0
            };
        } else if (mode === GAME_MODES.PUZZLE) {
            this.puzzleState = {
                collected: 0,
                goal: 0,
                moves: 0,
                parTime: 0,
                parMoves: 0,
                timeLimit: null,
                moveLimit: null,
                flashlightEnabled: false
            };
        }
    }

    // Section 9: Load puzzle level configuration
    loadPuzzleConfig(level) {
        this.puzzleState.goal = level.goal.collect;
        this.puzzleState.parTime = level.parTime * 1000;
        this.puzzleState.parMoves = level.parMoves;
        this.puzzleState.timeLimit = level.timeLimit ? level.timeLimit * 1000 : null;
        this.puzzleState.moveLimit = level.moveLimit || null;
        this.puzzleState.flashlightEnabled = level.flashlight || false;
        this.puzzleState.collected = 0;
        this.puzzleState.moves = 0;
    }

    // Check if puzzle is complete
    isPuzzleComplete() {
        return this.gameMode === GAME_MODES.PUZZLE &&
               this.puzzleState.collected >= this.puzzleState.goal;
    }

    // Check if puzzle failed (time/move limits)
    isPuzzleFailed() {
        if (this.gameMode !== GAME_MODES.PUZZLE) return false;

        if (this.puzzleState.timeLimit !== null &&
            this.puzzleState.timeLimit <= 0) {
            return true;
        }

        if (this.puzzleState.moveLimit !== null &&
            this.puzzleState.moves > this.puzzleState.moveLimit) {
            return true;
        }

        return false;
    }

    // Calculate puzzle stars (1-3)
    calculatePuzzleStars(time, moves) {
        let stars = 1; // Base star for completion

        if (time <= this.puzzleState.parTime) {
            stars++;
        }

        if (moves <= this.puzzleState.parMoves) {
            stars++;
        }

        return stars;
    }

    // Section 9: Bonus room management (Survival mode)
    enterBonusRoom() {
        this.survivalState.inBonusRoom = true;
        this.survivalState.bonusRoomTimer = 10000; // 10 seconds
        this.survivalState.bonusRoomsEntered++;
    }

    exitBonusRoom() {
        this.survivalState.inBonusRoom = false;
        this.survivalState.bonusRoomTimer = 0;
    }

    updateBonusRoom(dt) {
        if (this.survivalState.inBonusRoom) {
            this.survivalState.bonusRoomTimer -= dt;
            if (this.survivalState.bonusRoomTimer <= 0) {
                return true; // Signal to exit bonus room
            }
        }
        return false;
    }

    // State checks
    isPlaying() {
        return this.currentState === GAME_STATES.PLAYING;
    }

    isPaused() {
        return this.currentState === GAME_STATES.PAUSED;
    }

    isGameOver() {
        return this.currentState === GAME_STATES.GAME_OVER;
    }

    isMenu() {
        return this.currentState === GAME_STATES.MENU;
    }

    isSurvivalMode() {
        return this.gameMode === GAME_MODES.SURVIVAL;
    }

    isPuzzleMode() {
        return this.gameMode === GAME_MODES.PUZZLE;
    }

    // Screen transition helper
    startTransition(targetState, callback) {
        this.transitionTarget = targetState;
        this.transitionCallback = callback;
        this.transitionAlpha = 0;
    }

    updateTransition(dt) {
        if (this.transitionTarget !== null) {
            this.transitionAlpha += dt / 500; // 500ms transition

            if (this.transitionAlpha >= 1) {
                this.setState(this.transitionTarget);
                if (this.transitionCallback) {
                    this.transitionCallback();
                }
                this.transitionTarget = null;
                this.transitionCallback = null;
                this.transitionAlpha = 0;
                return true;
            }
        }
        return false;
    }
}

// ============================================
// SECTION 10: DATA PERSISTENCE
// ============================================

class DataManager {
    constructor() {
        this.storageKey = 'snakeDungeonEdition';
        this.data = this.load();
    }

    getDefaultData() {
        return {
            version: 1,
            highScores: [],
            achievements: {},
            stats: {
                totalGames: 0,
                totalTime: 0,
                totalScore: 0,
                highestScore: 0,
                longestSnake: 0,
                longestSurvival: 0,
                bestCombo: 1,
                fruitsEaten: 0,
                gemsEaten: 0,
                orbsEaten: 0,
                skullsEaten: 0,
                slowmoUsed: 0,
                ghostUsed: 0,
                shieldUsed: 0,
                freezeUsed: 0,
                trimUsed: 0,
                ghostWallPasses: 0
            },
            settings: {
                masterVolume: 70,
                musicVolume: 50,
                sfxVolume: 70,
                reducedMotion: false
            },
            puzzleProgress: {},
            unlockedSkins: ['default'],
            unlockedThemes: ['classic'],
            currentSkin: 'default',
            currentTheme: 'classic'
        };
    }

    load() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                // Merge with defaults to handle new properties
                return { ...this.getDefaultData(), ...data };
            }
        } catch (e) {
            console.warn('Failed to load save data:', e);
        }
        return this.getDefaultData();
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Failed to save data:', e);
        }
    }

    addHighScore(score, length, time) {
        this.data.highScores.push({
            score,
            length,
            time,
            date: new Date().toISOString()
        });
        this.data.highScores.sort((a, b) => b.score - a.score);
        this.data.highScores = this.data.highScores.slice(0, 10);
        this.save();
    }

    getHighScore() {
        return this.data.highScores.length > 0 ? this.data.highScores[0].score : 0;
    }

    updateStats(runStats) {
        const s = this.data.stats;
        s.totalGames++;
        s.totalTime += runStats.time;
        s.totalScore += runStats.score;
        s.highestScore = Math.max(s.highestScore, runStats.score);
        s.longestSnake = Math.max(s.longestSnake, runStats.maxLength);
        s.longestSurvival = Math.max(s.longestSurvival, runStats.time);
        s.bestCombo = Math.max(s.bestCombo, runStats.maxCombo);
        s.fruitsEaten += runStats.fruitsEaten || 0;
        s.gemsEaten += runStats.gemsEaten || 0;
        s.orbsEaten += runStats.orbsEaten || 0;
        s.skullsEaten += runStats.skullsEaten || 0;
        s.slowmoUsed += runStats.slowmoUsed || 0;
        s.ghostUsed += runStats.ghostUsed || 0;
        s.shieldUsed += runStats.shieldUsed || 0;
        s.freezeUsed += runStats.freezeUsed || 0;
        s.trimUsed += runStats.trimUsed || 0;
        s.ghostWallPasses += runStats.ghostWallPasses || 0;
        this.save();
    }

    unlockAchievement(id) {
        if (!this.data.achievements[id]) {
            this.data.achievements[id] = {
                unlocked: true,
                date: new Date().toISOString()
            };
            this.save();
            return true;
        }
        return false;
    }

    hasAchievement(id) {
        return this.data.achievements[id]?.unlocked || false;
    }

    saveSettings(settings) {
        this.data.settings = { ...this.data.settings, ...settings };
        this.save();
    }

    getSettings() {
        return this.data.settings;
    }

    savePuzzleProgress(levelIndex, stars, time, moves) {
        const current = this.data.puzzleProgress[levelIndex] || {};
        this.data.puzzleProgress[levelIndex] = {
            completed: true,
            stars: Math.max(current.stars || 0, stars),
            bestTime: current.bestTime ? Math.min(current.bestTime, time) : time,
            bestMoves: current.bestMoves ? Math.min(current.bestMoves, moves) : moves
        };
        this.save();
    }

    // ============================================
    // Section 10: Progression & Replayability
    // Unlockable content, skins, themes, replay system
    // ============================================

    // Skin definitions
    static SKINS = {
        default: { name: 'Default', color: COLORS.snakePrimary, glow: COLORS.snakeGlow },
        emerald: { name: 'Emerald', color: COLORS.gemGreen, glow: '#58d68d', unlock: 'Survive 120 seconds' },
        golden: { name: 'Golden', color: COLORS.gold, glow: '#f9e79f', unlock: 'Reach length 50' },
        phantom: { name: 'Phantom', color: '#a6acaf', glow: '#d5d8dc', unlock: 'Use Ghost 20 times' },
        inferno: { name: 'Inferno', color: COLORS.dangerOrange, glow: COLORS.torchYellow, unlock: 'Complete all Puzzles' }
    };

    // Theme definitions
    static THEMES = {
        classic: { name: 'Classic Dungeon', floor: COLORS.floorDark, wall: COLORS.stoneMid },
        overgrown: { name: 'Overgrown Ruins', floor: '#1a2f1a', wall: '#2d4a2d', unlock: 'Survive 180 seconds' },
        ice: { name: 'Ice Cavern', floor: '#1a2a3a', wall: '#3a5a7a', unlock: 'Complete 10 puzzles' },
        volcanic: { name: 'Volcanic Depths', floor: '#2a1a1a', wall: '#4a2a2a', unlock: 'Reach 10000 points' }
    };

    // Unlock a skin
    unlockSkin(skinId) {
        if (!this.data.unlockedSkins.includes(skinId)) {
            this.data.unlockedSkins.push(skinId);
            this.save();
            return true;
        }
        return false;
    }

    // Unlock a theme
    unlockTheme(themeId) {
        if (!this.data.unlockedThemes.includes(themeId)) {
            this.data.unlockedThemes.push(themeId);
            this.save();
            return true;
        }
        return false;
    }

    // Set current skin
    setSkin(skinId) {
        if (this.data.unlockedSkins.includes(skinId)) {
            this.data.currentSkin = skinId;
            this.save();
            return true;
        }
        return false;
    }

    // Set current theme
    setTheme(themeId) {
        if (this.data.unlockedThemes.includes(themeId)) {
            this.data.currentTheme = themeId;
            this.save();
            return true;
        }
        return false;
    }

    // Get current skin data
    getCurrentSkin() {
        return DataManager.SKINS[this.data.currentSkin] || DataManager.SKINS.default;
    }

    // Get current theme data
    getCurrentTheme() {
        return DataManager.THEMES[this.data.currentTheme] || DataManager.THEMES.classic;
    }

    // Check and unlock content based on achievements/stats
    checkUnlocks() {
        const unlocked = [];
        const stats = this.data.stats;

        // Emerald skin - Survive 120 seconds
        if (stats.longestSurvival >= 120000 && this.unlockSkin('emerald')) {
            unlocked.push({ type: 'skin', id: 'emerald', name: 'Emerald Snake' });
        }

        // Golden skin - Reach length 50
        if (stats.longestSnake >= 50 && this.unlockSkin('golden')) {
            unlocked.push({ type: 'skin', id: 'golden', name: 'Golden Snake' });
        }

        // Phantom skin - Use Ghost 20 times
        if (stats.ghostUsed >= 20 && this.unlockSkin('phantom')) {
            unlocked.push({ type: 'skin', id: 'phantom', name: 'Phantom Snake' });
        }

        // Overgrown theme - Survive 180 seconds
        if (stats.longestSurvival >= 180000 && this.unlockTheme('overgrown')) {
            unlocked.push({ type: 'theme', id: 'overgrown', name: 'Overgrown Ruins' });
        }

        // Ice theme - Complete 10 puzzles
        const completedPuzzles = Object.values(this.data.puzzleProgress).filter(p => p.completed).length;
        if (completedPuzzles >= 10 && this.unlockTheme('ice')) {
            unlocked.push({ type: 'theme', id: 'ice', name: 'Ice Cavern' });
        }

        // Volcanic theme - Reach 10000 points
        if (stats.highestScore >= 10000 && this.unlockTheme('volcanic')) {
            unlocked.push({ type: 'theme', id: 'volcanic', name: 'Volcanic Depths' });
        }

        // Inferno skin - Complete all puzzles
        if (completedPuzzles >= PUZZLE_LEVELS.length && this.unlockSkin('inferno')) {
            unlocked.push({ type: 'skin', id: 'inferno', name: 'Inferno Snake' });
        }

        return unlocked;
    }

    // Get achievement progress for display
    getAchievementProgress() {
        const total = Object.keys(ACHIEVEMENTS).length;
        const unlocked = Object.keys(this.data.achievements).length;
        return { unlocked, total, percentage: Math.floor((unlocked / total) * 100) };
    }

    // Get puzzle progress summary
    getPuzzleProgress() {
        const total = PUZZLE_LEVELS.length;
        const completed = Object.values(this.data.puzzleProgress).filter(p => p.completed).length;
        const totalStars = Object.values(this.data.puzzleProgress).reduce((sum, p) => sum + (p.stars || 0), 0);
        const maxStars = total * 3;
        return { completed, total, totalStars, maxStars };
    }

    // Export save data (for backup)
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    // Import save data (for restore)
    importData(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.data = { ...this.getDefaultData(), ...imported };
            this.save();
            return true;
        } catch (e) {
            console.error('Failed to import data:', e);
            return false;
        }
    }

    // Reset all data
    resetAllData() {
        this.data = this.getDefaultData();
        this.save();
    }
}

// ============================================
// SECTION 11: RENDERER
// ============================================

class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.screenShake = { x: 0, y: 0, intensity: 0 };
        this.flashAlpha = 0;
        this.reducedMotion = false;
    }

    clear() {
        this.ctx.fillStyle = COLORS.voidBlack;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    applyScreenShake(dt) {
        if (this.reducedMotion) {
            this.screenShake.intensity = 0;
            return;
        }

        if (this.screenShake.intensity > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity * 10;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity * 10;
            this.screenShake.intensity -= dt / 200;
            if (this.screenShake.intensity < 0) this.screenShake.intensity = 0;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
        }
    }

    shake(intensity = 1) {
        this.screenShake.intensity = intensity;
    }

    flash() {
        this.flashAlpha = 0.5;
    }

    updateFlash(dt) {
        if (this.flashAlpha > 0) {
            this.flashAlpha -= dt / 100;
            if (this.flashAlpha < 0) this.flashAlpha = 0;
        }
    }

    renderFlash() {
        if (this.flashAlpha > 0) {
            this.ctx.save();
            this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
    }

    toScreen(gridX, gridY) {
        return {
            x: gridX * CONFIG.CELL_SIZE + this.screenShake.x,
            y: gridY * CONFIG.CELL_SIZE + this.screenShake.y
        };
    }

    renderDungeon(map, flashlightEnabled = false, lightCenter = null) {
        const ctx = this.ctx;

        // Draw floor
        for (let y = 0; y < map.height; y++) {
            for (let x = 0; x < map.width; x++) {
                const pos = this.toScreen(x, y);
                const terrain = map.getTerrain(x, y);
                const terrainData = TERRAIN_TYPES[terrain];

                // Base floor color
                ctx.fillStyle = terrainData.color;
                ctx.fillRect(pos.x, pos.y, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);

                // Add subtle grid pattern
                ctx.strokeStyle = COLORS.floorPattern;
                ctx.lineWidth = 0.5;
                ctx.strokeRect(pos.x, pos.y, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);
            }
        }

        // Draw walls
        map.walls.forEach(wall => {
            const pos = this.toScreen(wall.x, wall.y);

            // Wall base
            ctx.fillStyle = COLORS.stoneMid;
            ctx.fillRect(pos.x, pos.y, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);

            // Wall highlight (top)
            ctx.fillStyle = COLORS.stoneLight;
            ctx.fillRect(pos.x, pos.y, CONFIG.CELL_SIZE, 3);

            // Wall shadow (bottom)
            ctx.fillStyle = COLORS.stoneDark;
            ctx.fillRect(pos.x, pos.y + CONFIG.CELL_SIZE - 3, CONFIG.CELL_SIZE, 3);
        });

        // Draw doors
        map.doors.forEach(door => {
            const pos = this.toScreen(door.x, door.y);
            ctx.fillStyle = COLORS.stoneDark;
            ctx.fillRect(pos.x, pos.y, CONFIG.CELL_SIZE, CONFIG.CELL_SIZE);

            // Archway effect
            ctx.fillStyle = COLORS.voidBlack;
            ctx.fillRect(pos.x + 2, pos.y + 2, CONFIG.CELL_SIZE - 4, CONFIG.CELL_SIZE - 4);
        });

        // Apply flashlight effect if enabled
        if (flashlightEnabled && lightCenter) {
            this.renderFlashlight(lightCenter, map);
        }
    }

    renderFlashlight(center, map) {
        const ctx = this.ctx;
        const centerScreen = this.toScreen(center.x + 0.5, center.y + 0.5);
        const radius = CONFIG.FLASHLIGHT_RADIUS * CONFIG.CELL_SIZE;

        // Create gradient for flashlight
        const gradient = ctx.createRadialGradient(
            centerScreen.x, centerScreen.y, radius * 0.3,
            centerScreen.x, centerScreen.y, radius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');

        // Apply darkness overlay
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Add slight torch flicker
        if (!this.reducedMotion) {
            const flicker = Math.sin(Date.now() * 0.01) * 0.02 + 0.02;
            ctx.fillStyle = `rgba(212, 148, 58, ${flicker})`;
            ctx.beginPath();
            ctx.arc(centerScreen.x, centerScreen.y, radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderSnake(snake, particles) {
        const ctx = this.ctx;

        // Render segments from tail to head
        for (let i = snake.visualPositions.length - 1; i >= 0; i--) {
            const segment = snake.visualPositions[i];
            const pos = this.toScreen(segment.x + 0.5, segment.y + 0.5);

            // Calculate wobble
            let wobbleX = 0, wobbleY = 0;
            if (!this.reducedMotion && i > 0) {
                const wobbleAmount = Math.sin(snake.wobblePhase + i * 0.5) * 2;
                // Wobble perpendicular to movement
                wobbleX = snake.direction.y * wobbleAmount;
                wobbleY = -snake.direction.x * wobbleAmount;
            }

            // Color gradient (brighter near head)
            const t = i / snake.visualPositions.length;
            const brightness = 1 - t * 0.4;

            // Size (head slightly larger)
            const size = (i === 0 ? CONFIG.CELL_SIZE * 0.5 : CONFIG.CELL_SIZE * 0.4);

            // Ghost effect
            ctx.save();
            if (snake.ghostMode) {
                ctx.globalAlpha = 0.5;
            }

            // Draw segment
            ctx.fillStyle = i === 0 ? COLORS.snakeGlow : COLORS.snakePrimary;
            ctx.globalAlpha *= brightness;
            ctx.beginPath();
            ctx.arc(pos.x + wobbleX, pos.y + wobbleY, size, 0, Math.PI * 2);
            ctx.fill();

            // Glow effect
            if (!this.reducedMotion) {
                ctx.fillStyle = COLORS.snakeEnergy;
                ctx.globalAlpha = 0.3 * brightness;
                ctx.beginPath();
                ctx.arc(pos.x + wobbleX, pos.y + wobbleY, size * 1.3, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw eyes on head
            if (i === 0) {
                ctx.globalAlpha = 1;
                ctx.fillStyle = COLORS.stoneDark;
                const eyeOffset = 3;
                const eyeSize = 2;

                // Position eyes based on direction
                const eyeX1 = pos.x + snake.direction.y * eyeOffset + snake.direction.x * 3;
                const eyeY1 = pos.y - snake.direction.x * eyeOffset + snake.direction.y * 3;
                const eyeX2 = pos.x - snake.direction.y * eyeOffset + snake.direction.x * 3;
                const eyeY2 = pos.y + snake.direction.x * eyeOffset + snake.direction.y * 3;

                ctx.beginPath();
                ctx.arc(eyeX1, eyeY1, eyeSize, 0, Math.PI * 2);
                ctx.arc(eyeX2, eyeY2, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();

            // Trail particles
            if (!this.reducedMotion && i === snake.visualPositions.length - 1) {
                particles.trail(pos.x, pos.y, COLORS.snakeGlow);
            }
        }

        // Shield effect
        if (snake.hasShield) {
            const headPos = this.toScreen(snake.visualPositions[0].x + 0.5, snake.visualPositions[0].y + 0.5);
            ctx.save();
            ctx.strokeStyle = COLORS.gold;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
            ctx.beginPath();
            ctx.arc(headPos.x, headPos.y, CONFIG.CELL_SIZE * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    renderFood(food, particles) {
        const ctx = this.ctx;
        const foodData = FOOD_TYPES[food.type];
        const pos = this.toScreen(food.x + 0.5, food.y + 0.5);
        const scale = food.getPulseScale();
        const size = CONFIG.CELL_SIZE * 0.35 * scale;

        ctx.save();

        // Glow
        if (!this.reducedMotion) {
            ctx.fillStyle = foodData.color;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Main shape
        ctx.globalAlpha = 1;
        ctx.fillStyle = foodData.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(pos.x - size * 0.3, pos.y - size * 0.3, size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Sparkle for gems
        if (food.type === 'GEM' || food.type === 'GOLDEN_SKULL') {
            particles.sparkle(pos.x, pos.y, foodData.color);
        }
    }

    renderPowerUp(powerup) {
        const ctx = this.ctx;
        const typeData = POWERUP_TYPES[powerup.type];
        const pos = this.toScreen(powerup.x + 0.5, powerup.y + 0.5);
        const scale = powerup.getPulseScale();
        const size = CONFIG.CELL_SIZE * 0.4 * scale;

        ctx.save();

        // Circular background with glow
        if (!this.reducedMotion) {
            ctx.fillStyle = typeData.color;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size * 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.fillStyle = typeData.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.font = `${CONFIG.CELL_SIZE * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typeData.icon, pos.x, pos.y);

        ctx.restore();
    }

    renderHazard(hazard) {
        const ctx = this.ctx;
        const typeData = HAZARD_TYPES[hazard.type];
        const pos = this.toScreen(hazard.x + 0.5, hazard.y + 0.5);
        const size = CONFIG.CELL_SIZE * 0.45;

        ctx.save();

        // Base shape
        ctx.fillStyle = typeData.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.font = `${CONFIG.CELL_SIZE * 0.7}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typeData.icon, pos.x, pos.y);

        // Bomb countdown
        if (hazard.type === 'BOMB' && !hazard.exploded) {
            const seconds = Math.ceil(hazard.countdown / 1000);
            ctx.fillStyle = COLORS.uiText;
            ctx.font = 'bold 14px "Press Start 2P"';
            ctx.fillText(seconds.toString(), pos.x, pos.y - size - 10);
        }

        // Explosion radius indicator for bombs about to explode
        if (hazard.type === 'BOMB' && hazard.countdown < 2000 && !this.reducedMotion) {
            const radius = HAZARD_TYPES.BOMB.radius * CONFIG.CELL_SIZE;
            ctx.strokeStyle = COLORS.dangerOrange;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    renderScorePopups(popups) {
        const ctx = this.ctx;

        popups.forEach(popup => {
            ctx.save();
            ctx.globalAlpha = popup.life;
            ctx.font = popup.isCombo ? '18px "Press Start 2P"' : '14px "Press Start 2P"';
            ctx.fillStyle = popup.isCombo ? COLORS.snakeGlow : COLORS.gold;
            ctx.textAlign = 'center';
            ctx.shadowColor = COLORS.voidBlack;
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillText(popup.text, popup.x, popup.y);
            ctx.restore();
        });
    }

    renderVignette(intensity = 0.5) {
        const ctx = this.ctx;
        const gradient = ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.3,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width * 0.7
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderBloom() {
        // Simplified bloom effect using globalCompositeOperation
        // Full bloom would require WebGL or multiple canvas passes
    }
}

// ============================================
// SECTION 12: MAIN GAME CLASS
// ============================================

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.canvas.width = CONFIG.CANVAS_WIDTH;
        this.canvas.height = CONFIG.CANVAS_HEIGHT;

        // Core systems
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.audio = new AudioManager();
        this.input = new InputManager();
        this.particles = new ParticleSystem();
        this.state = new GameStateManager();
        this.data = new DataManager();

        // Game entities
        this.map = new DungeonMap(CONFIG.GRID_COLS, CONFIG.GRID_ROWS);
        this.snake = null;
        this.foods = [];
        this.powerups = [];
        this.hazards = [];
        this.scorePopups = [];

        // Game state
        this.score = 0;
        this.combo = 1;
        this.maxCombo = 1;
        this.comboTimer = 0;
        this.gameTime = 0;
        this.difficultyLevel = 0;
        this.tickTimer = 0;
        this.currentTickRate = CONFIG.BASE_TICK_RATE;
        this.foodSpawnTimer = 0;
        this.powerupSpawnTimer = 0;
        this.hazardSpawnTimer = 0;
        this.wallSpawnTimer = 0;

        // Power-up states
        this.activePowerups = {};
        this.slowMotionActive = false;
        this.timeFreezeActive = false;

        // Run statistics
        this.runStats = {};

        // Death animation state
        this.deathAnimation = {
            active: false,
            timer: 0,
            slowMoTimer: 0
        };

        // UI Elements
        this.cacheUIElements();

        // Initialize
        this.loadSettings();
        this.setupEventListeners();
        this.updateMenuHighScore();

        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop();
    }

    cacheUIElements() {
        this.ui = {
            // Screens
            startScreen: document.getElementById('start-screen'),
            hud: document.getElementById('hud'),
            pauseMenu: document.getElementById('pause-menu'),
            gameOverScreen: document.getElementById('game-over-screen'),
            settingsScreen: document.getElementById('settings-screen'),
            statsScreen: document.getElementById('stats-screen'),
            achievementsScreen: document.getElementById('achievements-screen'),
            creditsScreen: document.getElementById('credits-screen'),
            puzzleSelectScreen: document.getElementById('puzzle-select-screen'),

            // HUD elements
            currentScore: document.getElementById('current-score'),
            highScore: document.getElementById('high-score'),
            snakeLength: document.getElementById('snake-length'),
            difficultyLevel: document.getElementById('difficulty-level'),
            powerupIndicators: document.getElementById('power-up-indicators'),
            comboMeter: document.getElementById('combo-meter'),

            // Game over elements
            finalScore: document.getElementById('final-score'),
            newHighScoreBanner: document.getElementById('new-high-score-banner'),
            statTime: document.getElementById('stat-time'),
            statLength: document.getElementById('stat-length'),
            statFood: document.getElementById('stat-food'),
            statCombo: document.getElementById('stat-combo'),
            statPowerups: document.getElementById('stat-powerups'),
            tipText: document.getElementById('tip-text'),
            achievementsUnlocked: document.getElementById('achievements-unlocked'),
            achievementList: document.getElementById('achievement-list'),

            // Menu elements
            menuHighScore: document.getElementById('menu-high-score'),

            // Settings
            masterVolume: document.getElementById('master-volume'),
            musicVolume: document.getElementById('music-volume'),
            sfxVolume: document.getElementById('sfx-volume'),
            reducedMotion: document.getElementById('reduced-motion')
        };
    }

    loadSettings() {
        const settings = this.data.getSettings();
        this.ui.masterVolume.value = settings.masterVolume;
        this.ui.musicVolume.value = settings.musicVolume;
        this.ui.sfxVolume.value = settings.sfxVolume;
        this.ui.reducedMotion.checked = settings.reducedMotion;

        this.audio.setMasterVolume(settings.masterVolume);
        this.audio.setMusicVolume(settings.musicVolume);
        this.audio.setSfxVolume(settings.sfxVolume);
        this.renderer.reducedMotion = settings.reducedMotion;

        if (settings.reducedMotion) {
            document.body.classList.add('reduced-motion');
        }
    }

    saveSettings() {
        const settings = {
            masterVolume: parseInt(this.ui.masterVolume.value),
            musicVolume: parseInt(this.ui.musicVolume.value),
            sfxVolume: parseInt(this.ui.sfxVolume.value),
            reducedMotion: this.ui.reducedMotion.checked
        };
        this.data.saveSettings(settings);

        this.audio.setMasterVolume(settings.masterVolume);
        this.audio.setMusicVolume(settings.musicVolume);
        this.audio.setSfxVolume(settings.sfxVolume);
        this.renderer.reducedMotion = settings.reducedMotion;

        document.body.classList.toggle('reduced-motion', settings.reducedMotion);
    }

    setupEventListeners() {
        // Keyboard input
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.input.handleKeyUp(e)); // Bug fix: Add keyup listener

        // Menu buttons
        document.getElementById('btn-survival').addEventListener('click', () => this.startSurvivalMode());
        document.getElementById('btn-puzzle').addEventListener('click', () => this.showPuzzleSelect());
        document.getElementById('btn-stats').addEventListener('click', () => this.showStats());
        document.getElementById('btn-achievements').addEventListener('click', () => this.showAchievements());
        document.getElementById('btn-settings').addEventListener('click', () => this.showSettings());
        document.getElementById('btn-credits').addEventListener('click', () => this.showCredits());

        // Pause menu buttons
        document.getElementById('btn-resume').addEventListener('click', () => this.resume());
        document.getElementById('btn-restart').addEventListener('click', () => this.restart());
        document.getElementById('btn-pause-settings').addEventListener('click', () => this.showSettings());
        document.getElementById('btn-quit').addEventListener('click', () => this.quitToMenu());

        // Game over buttons
        document.getElementById('btn-quick-restart').addEventListener('click', () => this.restart());
        document.getElementById('btn-return-menu').addEventListener('click', () => this.quitToMenu());

        // Back buttons
        document.getElementById('btn-settings-back').addEventListener('click', () => this.hideSettings());
        document.getElementById('btn-stats-back').addEventListener('click', () => this.returnToMenu());
        document.getElementById('btn-achievements-back').addEventListener('click', () => this.returnToMenu());
        document.getElementById('btn-credits-back').addEventListener('click', () => this.returnToMenu());
        document.getElementById('btn-puzzle-back').addEventListener('click', () => this.returnToMenu());

        // Settings changes
        this.ui.masterVolume.addEventListener('input', () => this.saveSettings());
        this.ui.musicVolume.addEventListener('input', () => this.saveSettings());
        this.ui.sfxVolume.addEventListener('input', () => this.saveSettings());
        this.ui.reducedMotion.addEventListener('change', () => this.saveSettings());

        // Button click sounds
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.audio.init();
                this.audio.playSound('click');
            });
        });
    }

    handleKeyDown(e) {
        // Prevent default for game keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Escape'].includes(e.code)) {
            e.preventDefault();
        }

        const action = this.input.handleKeyDown(e);

        if (this.state.isPlaying()) {
            if (action === 'PAUSE') {
                this.pause();
            } else if (['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(action)) {
                const dir = DIRECTIONS[action];
                if (dir) this.snake.setDirection(dir);
            }
        } else if (this.state.isPaused()) {
            if (action === 'PAUSE') {
                this.resume();
            }
        }
    }

    // ============================================
    // GAME STATE METHODS
    // ============================================

    startSurvivalMode() {
        this.audio.init();
        this.state.setMode(GAME_MODES.SURVIVAL);
        this.initGame();
        this.hideAllScreens(); // Bug fix: Hide all screens first
        this.showScreen('hud');
        this.state.setState(GAME_STATES.PLAYING);
    }

    startPuzzleLevel(levelIndex) {
        this.audio.init();
        this.state.setMode(GAME_MODES.PUZZLE);
        this.state.currentLevel = levelIndex;
        this.initPuzzleGame(levelIndex);
        this.hideAllScreens(); // Bug fix: Hide all screens first
        this.showScreen('hud');
        this.state.setState(GAME_STATES.PLAYING);
    }

    initGame() {
        // Reset map
        this.map = new DungeonMap(CONFIG.GRID_COLS, CONFIG.GRID_ROWS);

        // Reset snake
        const startX = Math.floor(CONFIG.GRID_COLS / 2);
        const startY = Math.floor(CONFIG.GRID_ROWS / 2);
        this.snake = new Snake(startX, startY, DIRECTIONS.RIGHT);

        // Reset entities
        this.foods = [];
        this.powerups = [];
        this.hazards = [];
        this.scorePopups = [];
        this.particles.clear();

        // Reset game state
        this.score = 0;
        this.combo = 1;
        this.maxCombo = 1;
        this.comboTimer = 0;
        this.gameTime = 0;
        this.difficultyLevel = 0;
        this.tickTimer = 0;
        this.currentTickRate = CONFIG.BASE_TICK_RATE;
        this.foodSpawnTimer = 0;
        this.powerupSpawnTimer = CONFIG.POWERUP_SPAWN_INTERVAL;
        this.hazardSpawnTimer = CONFIG.HAZARD_INTERVALS[0];
        this.wallSpawnTimer = 5000;

        // Reset power-up states
        this.activePowerups = {};
        this.slowMotionActive = false;
        this.timeFreezeActive = false;

        // Reset death animation
        this.deathAnimation = { active: false, timer: 0, slowMoTimer: 0 };

        // Reset run stats
        this.runStats = {
            score: 0,
            time: 0,
            maxLength: CONFIG.INITIAL_SNAKE_LENGTH,
            maxCombo: 1,
            foodEaten: 0,
            fruitsEaten: 0,
            gemsEaten: 0,
            orbsEaten: 0,
            skullsEaten: 0,
            powerupsUsed: 0,
            slowmoUsed: 0,
            ghostUsed: 0,
            shieldUsed: 0,
            freezeUsed: 0,
            trimUsed: 0,
            ghostWallPasses: 0,
            shieldUsedInRun: false
        };

        // Spawn initial food
        this.spawnFood();
        this.spawnFood();
        this.spawnFood();

        // Update HUD
        this.updateHUD();

        // Enable input
        this.input.enable();
        this.input.clearBuffer();
    }

    initPuzzleGame(levelIndex) {
        const level = PUZZLE_LEVELS[levelIndex];
        if (!level) return;

        // Load level map
        this.map.loadPuzzleLevel(level);

        // Reset snake at level start position
        const dir = DIRECTIONS[level.snakeStart.dir];
        this.snake = new Snake(level.snakeStart.x, level.snakeStart.y, dir);

        // Reset entities
        this.foods = [];
        this.powerups = [];
        this.hazards = [];
        this.scorePopups = [];
        this.particles.clear();

        // Spawn level food
        level.food.forEach(f => {
            this.foods.push(new Food(f.x, f.y, f.type));
        });

        // Spawn level hazards
        if (level.hazards) {
            level.hazards.forEach(h => {
                this.hazards.push(new Hazard(h.x, h.y, h.type, h));
            });
        }

        // Reset game state
        this.score = 0;
        this.combo = 1;
        this.maxCombo = 1;
        this.comboTimer = 0;
        this.gameTime = 0;
        this.difficultyLevel = 0;
        this.tickTimer = 0;
        this.currentTickRate = CONFIG.BASE_TICK_RATE;

        // Puzzle mode specific
        this.puzzleCollected = 0;
        this.puzzleGoal = level.goal.collect;
        this.puzzleMoves = 0;
        this.flashlightEnabled = level.flashlight || false;

        // Reset power-up states
        this.activePowerups = {};
        this.slowMotionActive = false;
        this.timeFreezeActive = false;

        // Reset run stats
        this.runStats = {
            score: 0,
            time: 0,
            maxLength: CONFIG.INITIAL_SNAKE_LENGTH,
            maxCombo: 1,
            foodEaten: 0,
            powerupsUsed: 0
        };

        // Update HUD
        this.updateHUD();

        // Enable input
        this.input.enable();
        this.input.clearBuffer();
    }

    pause() {
        if (!this.state.isPlaying()) return;
        this.state.setState(GAME_STATES.PAUSED);
        this.showScreen('pauseMenu');
        this.input.clearBuffer();
    }

    resume() {
        if (!this.state.isPaused()) return;
        this.state.setState(GAME_STATES.PLAYING);
        this.hideScreen('pauseMenu');
        this.showScreen('hud');
    }

    restart() {
        this.hideAllScreens();
        if (this.state.gameMode === GAME_MODES.SURVIVAL) {
            this.startSurvivalMode();
        } else {
            this.startPuzzleLevel(this.state.currentLevel);
        }
    }

    quitToMenu() {
        this.hideAllScreens();
        this.state.setState(GAME_STATES.MENU);
        this.showScreen('startScreen');
        this.updateMenuHighScore();
    }

    gameOver() {
        this.state.setState(GAME_STATES.GAME_OVER);
        this.input.disable();

        // Update run stats
        this.runStats.score = this.score;
        this.runStats.time = this.gameTime;

        // Check for new high score
        const isNewHighScore = this.score > this.data.getHighScore();

        // Save data
        this.data.updateStats(this.runStats);
        if (isNewHighScore) {
            this.data.addHighScore(this.score, this.snake.length, this.gameTime);
        }

        // Check achievements
        const newAchievements = this.checkAchievements();

        // Show game over screen after death animation
        setTimeout(() => {
            this.showGameOver(isNewHighScore, newAchievements);
        }, 1500);
    }

    showGameOver(isNewHighScore, newAchievements) {
        this.hideScreen('hud');

        // Update game over UI
        this.ui.finalScore.textContent = this.score;
        this.ui.statTime.textContent = Utils.formatTime(this.gameTime);
        this.ui.statLength.textContent = this.runStats.maxLength;
        this.ui.statFood.textContent = this.runStats.foodEaten;
        this.ui.statCombo.textContent = `x${this.runStats.maxCombo}`;
        this.ui.statPowerups.textContent = this.runStats.powerupsUsed;

        // High score banner
        if (isNewHighScore) {
            this.ui.newHighScoreBanner.classList.remove('hidden');
            this.audio.playSound('achievement');
        } else {
            this.ui.newHighScoreBanner.classList.add('hidden');
        }

        // Achievements
        if (newAchievements.length > 0) {
            this.ui.achievementsUnlocked.classList.remove('hidden');
            this.ui.achievementList.innerHTML = newAchievements.map(a =>
                `<div class="achievement-card unlocked">
                    <div class="achievement-icon">${ACHIEVEMENTS[a].icon}</div>
                    <div class="achievement-name">${ACHIEVEMENTS[a].name}</div>
                </div>`
            ).join('');
        } else {
            this.ui.achievementsUnlocked.classList.add('hidden');
        }

        // Random tip
        this.ui.tipText.textContent = Utils.randomChoice(GAME_TIPS);

        this.showScreen('gameOverScreen');
    }

    // ============================================
    // SCREEN MANAGEMENT
    // ============================================

    showScreen(screenName) {
        const screen = this.ui[screenName];
        if (screen) {
            screen.classList.remove('hidden');
        }
    }

    hideScreen(screenName) {
        const screen = this.ui[screenName];
        if (screen) {
            screen.classList.add('hidden');
        }
    }

    hideAllScreens() {
        Object.values(this.ui).forEach(el => {
            if (el && el.classList && el.classList.contains('screen')) {
                el.classList.add('hidden');
            }
        });
        this.ui.hud.classList.add('hidden');
    }

    showSettings() {
        this.showScreen('settingsScreen');
    }

    hideSettings() {
        this.hideScreen('settingsScreen');
        if (this.state.isPaused()) {
            this.showScreen('pauseMenu');
        } else if (this.state.isMenu()) {
            this.showScreen('startScreen');
        }
    }

    showStats() {
        this.state.setState(GAME_STATES.STATS);
        this.hideScreen('startScreen');

        // Update stats display
        const stats = this.data.data.stats;
        document.getElementById('total-games').textContent = stats.totalGames;
        document.getElementById('total-time').textContent = Utils.formatTime(stats.totalTime);
        document.getElementById('total-score').textContent = stats.totalScore;
        document.getElementById('highest-score').textContent = stats.highestScore;
        document.getElementById('longest-snake').textContent = stats.longestSnake;
        document.getElementById('longest-survival').textContent = Utils.formatTime(stats.longestSurvival);
        document.getElementById('best-combo').textContent = `x${stats.bestCombo}`;
        document.getElementById('fruits-eaten').textContent = stats.fruitsEaten;
        document.getElementById('gems-eaten').textContent = stats.gemsEaten;
        document.getElementById('orbs-eaten').textContent = stats.orbsEaten;
        document.getElementById('skulls-eaten').textContent = stats.skullsEaten;
        document.getElementById('slowmo-used').textContent = stats.slowmoUsed;
        document.getElementById('ghost-used').textContent = stats.ghostUsed;
        document.getElementById('shield-used').textContent = stats.shieldUsed;
        document.getElementById('freeze-used').textContent = stats.freezeUsed;
        document.getElementById('trim-used').textContent = stats.trimUsed;

        this.showScreen('statsScreen');
    }

    showAchievements() {
        this.state.setState(GAME_STATES.ACHIEVEMENTS);
        this.hideScreen('startScreen');

        const grid = document.getElementById('achievements-grid');
        grid.innerHTML = '';

        Object.entries(ACHIEVEMENTS).forEach(([id, achievement]) => {
            const unlocked = this.data.hasAchievement(id);
            const card = document.createElement('div');
            card.className = `achievement-card ${unlocked ? 'unlocked' : 'locked'}`;
            card.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.desc}</div>
            `;
            grid.appendChild(card);
        });

        this.showScreen('achievementsScreen');
    }

    showCredits() {
        this.state.setState(GAME_STATES.CREDITS);
        this.hideScreen('startScreen');
        this.showScreen('creditsScreen');
    }

    showPuzzleSelect() {
        this.state.setState(GAME_STATES.PUZZLE_SELECT);
        this.hideScreen('startScreen');

        const grid = document.getElementById('level-grid');
        grid.innerHTML = '';

        PUZZLE_LEVELS.forEach((level, index) => {
            const progress = this.data.data.puzzleProgress[index];
            const isLocked = index > 0 && !this.data.data.puzzleProgress[index - 1]?.completed;

            const card = document.createElement('div');
            card.className = `level-card ${isLocked ? 'locked' : ''} ${progress?.completed ? 'completed' : ''}`;

            let stars = '';
            if (progress) {
                const starCount = progress.stars || 0;
                stars = '★'.repeat(starCount) + '☆'.repeat(3 - starCount);
            }

            card.innerHTML = `
                <div class="level-number">${index + 1}</div>
                <div class="level-stars">${stars}</div>
            `;

            if (!isLocked) {
                card.addEventListener('click', () => {
                    this.audio.playSound('click');
                    this.hideScreen('puzzleSelectScreen');
                    this.startPuzzleLevel(index);
                });
            }

            grid.appendChild(card);
        });

        this.showScreen('puzzleSelectScreen');
    }

    returnToMenu() {
        this.hideAllScreens();
        this.state.setState(GAME_STATES.MENU);
        this.showScreen('startScreen');
    }

    updateMenuHighScore() {
        this.ui.menuHighScore.textContent = this.data.getHighScore();
    }

    // ============================================
    // GAME UPDATE METHODS
    // ============================================

    update(dt) {
        if (!this.state.isPlaying()) return;

        // Handle death animation
        if (this.deathAnimation.active) {
            this.updateDeathAnimation(dt);
            return;
        }

        // Update game time
        this.gameTime += dt;

        // Update difficulty (Survival mode only)
        if (this.state.gameMode === GAME_MODES.SURVIVAL) {
            this.updateDifficulty();
        }

        // Update power-up timers
        this.updatePowerups(dt);

        // Apply slow motion modifier
        let effectiveDt = dt;
        if (this.slowMotionActive) {
            effectiveDt = dt * 0.5;
        }

        // Update tick timer
        this.tickTimer += effectiveDt;

        // Process game tick
        if (this.tickTimer >= this.currentTickRate) {
            this.tickTimer = 0;
            this.gameTick();
        }

        // Update entities
        this.foods.forEach(f => f.update(dt));
        this.powerups.forEach(p => p.update(dt));
        this.hazards.forEach(h => h.update(dt, this.timeFreezeActive));

        // Check bomb explosions
        this.hazards.forEach(h => {
            if (h.type === 'BOMB' && h.exploded && h.active) {
                h.active = false;
                this.particles.explosion(
                    h.x * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2,
                    h.y * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2
                );
                this.renderer.shake(0.8);
                this.audio.playSound('death');

                // Check if snake is in blast radius
                if (h.isInExplosionRadius(this.snake.head.x, this.snake.head.y)) {
                    if (this.snake.hasShield) {
                        this.breakShield();
                    } else {
                        this.triggerDeath();
                    }
                }
            }
        });

        // Remove exploded bombs
        this.hazards = this.hazards.filter(h => h.active);

        // Spawn logic (Survival mode)
        if (this.state.gameMode === GAME_MODES.SURVIVAL) {
            this.updateSpawning(dt);
        }

        // Update combo timer
        if (this.combo > 1) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 1;
                this.comboTimer = 0;
                this.ui.comboMeter.classList.add('hidden');
            }
        }

        // Update snake visuals
        this.snake.updateVisuals(dt);

        // Update particles
        this.particles.update(dt);

        // Update score popups
        this.scorePopups = this.scorePopups.filter(p => p.update(dt));

        // Update renderer effects
        this.renderer.applyScreenShake(dt);
        this.renderer.updateFlash(dt);

        // Update HUD
        this.updateHUD();
    }

    gameTick() {
        // Process buffered input
        const nextDir = this.input.getNextDirection();
        if (nextDir) {
            this.snake.setDirection(DIRECTIONS[nextDir]);
        }

        // Move snake
        const newHead = this.snake.move();

        // Track moves for puzzle mode
        if (this.state.gameMode === GAME_MODES.PUZZLE) {
            this.puzzleMoves++;
        }

        // Bug fix: Check boundary collision (out of bounds)
        if (newHead.x < 0 || newHead.x >= this.map.width ||
            newHead.y < 0 || newHead.y >= this.map.height) {
            if (this.snake.hasShield) {
                this.breakShield();
                // Push snake back in bounds
                this.snake.segments[0] = {
                    x: Utils.clamp(newHead.x, 0, this.map.width - 1),
                    y: Utils.clamp(newHead.y, 0, this.map.height - 1)
                };
            } else {
                this.triggerDeath();
                return;
            }
        }

        // Check door collision (room transition)
        const door = this.map.getDoor(newHead.x, newHead.y);
        if (door) {
            this.snake.segments[0] = { ...door.exit };
        }

        // Check wall collision
        if (!this.snake.ghostMode && this.map.isWall(newHead.x, newHead.y)) {
            if (this.snake.hasShield) {
                this.breakShield();
            } else {
                this.triggerDeath();
                return;
            }
        }

        // Track ghost wall passes
        if (this.snake.ghostMode && this.map.isWall(newHead.x, newHead.y)) {
            this.runStats.ghostWallPasses++;
        }

        // Check self collision
        if (this.snake.collidesWithSelf()) {
            if (this.snake.hasShield) {
                this.breakShield();
            } else {
                this.triggerDeath();
                return;
            }
        }

        // Check hazard collision
        for (const hazard of this.hazards) {
            if (hazard.x === newHead.x && hazard.y === newHead.y) {
                if (hazard.type === 'POISON') {
                    this.applyPoison();
                } else if (HAZARD_TYPES[hazard.type].lethal) {
                    if (this.snake.hasShield) {
                        this.breakShield();
                    } else {
                        this.triggerDeath();
                        return;
                    }
                }
            }
        }

        // Check terrain effects
        const terrain = this.map.getTerrain(newHead.x, newHead.y);
        if (terrain === 'LAVA') {
            if (this.snake.hasShield) {
                this.breakShield();
            } else {
                this.triggerDeath();
                return;
            }
        }

        // Apply terrain speed modifier
        const terrainData = TERRAIN_TYPES[terrain];
        this.currentTickRate = CONFIG.TICK_RATES[this.difficultyLevel] / terrainData.speedMod;

        // Check food collision
        for (let i = this.foods.length - 1; i >= 0; i--) {
            const food = this.foods[i];
            if (food.x === newHead.x && food.y === newHead.y && !food.collected) {
                this.collectFood(food, i);
            }
        }

        // Check power-up collision
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            if (powerup.x === newHead.x && powerup.y === newHead.y && !powerup.collected) {
                this.collectPowerup(powerup, i);
            }
        }

        // Update max length stat
        this.runStats.maxLength = Math.max(this.runStats.maxLength, this.snake.length);
    }

    updateDifficulty() {
        let newLevel = 0;
        for (let i = CONFIG.DIFFICULTY_INTERVALS.length - 1; i >= 0; i--) {
            if (this.gameTime >= CONFIG.DIFFICULTY_INTERVALS[i]) {
                newLevel = i;
                break;
            }
        }

        if (newLevel !== this.difficultyLevel) {
            this.difficultyLevel = newLevel;
            this.currentTickRate = CONFIG.TICK_RATES[this.difficultyLevel];
        }
    }

    updateSpawning(dt) {
        // Food spawning
        this.foodSpawnTimer -= dt;
        if (this.foodSpawnTimer <= 0 && this.foods.length < CONFIG.MAX_FOOD_ON_FIELD) {
            this.spawnFood();
            this.foodSpawnTimer = CONFIG.FOOD_SPAWN_INTERVAL;
        }

        // Power-up spawning
        this.powerupSpawnTimer -= dt;
        if (this.powerupSpawnTimer <= 0 && this.powerups.length < CONFIG.MAX_POWERUPS_ON_FIELD) {
            this.spawnPowerup();
            this.powerupSpawnTimer = CONFIG.POWERUP_SPAWN_INTERVAL;
        }

        // Hazard spawning
        const hazardInterval = CONFIG.HAZARD_INTERVALS[Math.min(this.difficultyLevel, CONFIG.HAZARD_INTERVALS.length - 1)];
        this.hazardSpawnTimer -= dt;
        if (this.hazardSpawnTimer <= 0) {
            this.spawnHazard();
            this.hazardSpawnTimer = hazardInterval;
        }

        // Wall spawning
        const wallChance = CONFIG.WALL_SPAWN_CHANCES[Math.min(this.difficultyLevel, CONFIG.WALL_SPAWN_CHANCES.length - 1)];
        this.wallSpawnTimer -= dt;
        if (this.wallSpawnTimer <= 0) {
            if (Math.random() < wallChance) {
                this.map.addMazeWall(5, this.snake.head);
            }
            this.wallSpawnTimer = 5000;
        }
    }

    updatePowerups(dt) {
        Object.keys(this.activePowerups).forEach(type => {
            const powerup = this.activePowerups[type];
            powerup.remaining -= dt;

            if (powerup.remaining <= 0) {
                this.deactivatePowerup(type);
            }
        });
    }

    updateDeathAnimation(dt) {
        this.deathAnimation.timer += dt;

        // Slow motion phase
        if (this.deathAnimation.slowMoTimer < 500) {
            this.deathAnimation.slowMoTimer += dt;
        }

        // Explosion and particle phase
        if (this.deathAnimation.timer >= 500 && !this.deathAnimation.exploded) {
            this.deathAnimation.exploded = true;
            const headPos = this.snake.head;
            this.particles.explosion(
                headPos.x * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2,
                headPos.y * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2
            );
            this.renderer.shake(1);
            this.renderer.flash();
        }

        // Update particles during death
        this.particles.update(dt);
        this.renderer.applyScreenShake(dt);
        this.renderer.updateFlash(dt);

        // End death animation
        if (this.deathAnimation.timer >= 1500) {
            this.gameOver();
        }
    }

    // ============================================
    // SPAWN METHODS
    // ============================================

    spawnFood() {
        const pos = this.map.getRandomEmptyPosition(this.snake.head, 3);
        if (!pos) return;

        // Check position isn't occupied
        if (this.foods.some(f => f.x === pos.x && f.y === pos.y)) return;
        if (this.powerups.some(p => p.x === pos.x && p.y === pos.y)) return;
        if (this.snake.occupies(pos.x, pos.y)) return;

        // Weighted random food type
        const types = Object.entries(FOOD_TYPES).map(([key, value]) => ({
            value: key,
            weight: value.rarity
        }));
        const type = Utils.weightedChoice(types);

        this.foods.push(new Food(pos.x, pos.y, type));
    }

    spawnPowerup() {
        const pos = this.map.getRandomEmptyPosition(this.snake.head, 5);
        if (!pos) return;

        // Check position isn't occupied
        if (this.foods.some(f => f.x === pos.x && f.y === pos.y)) return;
        if (this.powerups.some(p => p.x === pos.x && p.y === pos.y)) return;
        if (this.snake.occupies(pos.x, pos.y)) return;

        const type = Utils.randomChoice(Object.keys(POWERUP_TYPES));
        this.powerups.push(new PowerUp(pos.x, pos.y, type));
    }

    spawnHazard() {
        const pos = this.map.getRandomEmptyPosition(this.snake.head, 6);
        if (!pos) return;

        // Check position isn't occupied
        if (this.hazards.some(h => h.x === pos.x && h.y === pos.y)) return;
        if (this.snake.occupies(pos.x, pos.y)) return;

        // Weighted random hazard type
        const weights = [
            { value: 'POISON', weight: 30 },
            { value: 'BOMB', weight: 25 },
            { value: 'STATIC_OBSTACLE', weight: 25 },
            { value: 'MOVING_OBSTACLE', weight: 20 }
        ];
        const type = Utils.weightedChoice(weights);

        const options = {};
        if (type === 'MOVING_OBSTACLE') {
            options.dir = Math.random() < 0.5 ? 'DOWN' : 'RIGHT';
            options.range = Utils.randomInt(3, 6);
        }

        this.hazards.push(new Hazard(pos.x, pos.y, type, options));
    }

    // ============================================
    // COLLECTION METHODS
    // ============================================

    collectFood(food, index) {
        food.collected = true;
        this.foods.splice(index, 1);

        const foodData = FOOD_TYPES[food.type];

        // Grow snake
        this.snake.grow(foodData.growth);

        // Update combo
        this.combo = Math.min(this.combo + 1, CONFIG.MAX_COMBO);
        this.comboTimer = CONFIG.COMBO_TIMEOUT;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        this.runStats.maxCombo = this.maxCombo;

        // Calculate score
        const points = Math.floor(foodData.points * this.combo);
        this.score += points;

        // Update stats
        this.runStats.foodEaten++;
        if (food.type === 'FRUIT') this.runStats.fruitsEaten++;
        if (food.type === 'GEM') this.runStats.gemsEaten++;
        if (food.type === 'ENERGY_ORB') this.runStats.orbsEaten++;
        if (food.type === 'GOLDEN_SKULL') this.runStats.skullsEaten++;

        // Puzzle mode tracking
        if (this.state.gameMode === GAME_MODES.PUZZLE) {
            this.puzzleCollected++;
            if (this.puzzleCollected >= this.puzzleGoal) {
                this.completePuzzle();
                return;
            }
        }

        // Visual feedback
        const screenPos = {
            x: food.x * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2,
            y: food.y * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2
        };

        this.particles.burstAt(screenPos.x, screenPos.y, foodData.color);
        this.renderer.flash();

        // Score popup
        const popupText = this.combo > 1 ? `+${points} x${this.combo}!` : `+${points}`;
        this.scorePopups.push(new ScorePopup(screenPos.x, screenPos.y, popupText, this.combo > 1));

        // Update combo meter
        if (this.combo > 1) {
            this.ui.comboMeter.classList.remove('hidden');
            const comboText = this.ui.comboMeter.querySelector('.combo-text');
            comboText.textContent = `x${this.combo}`;
        }

        // Audio
        this.audio.playSound('eat');
        if (this.combo > 1) {
            this.audio.playSound('combo', { level: this.combo });
        }
    }

    collectPowerup(powerup, index) {
        powerup.collected = true;
        this.powerups.splice(index, 1);

        this.activatePowerup(powerup.type);

        // Visual feedback
        const screenPos = {
            x: powerup.x * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2,
            y: powerup.y * CONFIG.CELL_SIZE + CONFIG.CELL_SIZE / 2
        };

        this.particles.burstAt(screenPos.x, screenPos.y, POWERUP_TYPES[powerup.type].color);
        this.renderer.flash();

        // Audio
        this.audio.playSound('powerup');

        // Stats
        this.runStats.powerupsUsed++;
    }

    // ============================================
    // POWER-UP METHODS
    // ============================================

    activatePowerup(type) {
        const typeData = POWERUP_TYPES[type];

        switch (type) {
            case 'SLOW_MOTION':
                this.slowMotionActive = true;
                this.activePowerups[type] = { remaining: typeData.duration };
                this.runStats.slowmoUsed++;
                break;

            case 'GHOST':
                this.snake.ghostMode = true;
                this.activePowerups[type] = { remaining: typeData.duration };
                this.runStats.ghostUsed++;
                break;

            case 'SHIELD':
                this.snake.hasShield = true;
                this.activePowerups[type] = { remaining: Infinity };
                this.runStats.shieldUsed++;
                this.runStats.shieldUsedInRun = true;
                break;

            case 'TIME_FREEZE':
                this.timeFreezeActive = true;
                this.activePowerups[type] = { remaining: typeData.duration };
                this.runStats.freezeUsed++;
                break;

            case 'TRIM':
                this.snake.trim(3);
                this.runStats.trimUsed++;
                // Instant effect, no duration
                break;
        }

        this.updatePowerupIndicators();
    }

    deactivatePowerup(type) {
        delete this.activePowerups[type];

        switch (type) {
            case 'SLOW_MOTION':
                this.slowMotionActive = false;
                break;

            case 'GHOST':
                this.snake.ghostMode = false;
                // Check if inside wall
                if (this.map.isWall(this.snake.head.x, this.snake.head.y)) {
                    this.triggerDeath();
                }
                break;

            case 'SHIELD':
                this.snake.hasShield = false;
                break;

            case 'TIME_FREEZE':
                this.timeFreezeActive = false;
                break;
        }

        this.updatePowerupIndicators();
    }

    breakShield() {
        this.snake.hasShield = false;
        delete this.activePowerups['SHIELD'];
        this.updatePowerupIndicators();
        this.audio.playSound('shieldBreak');
        this.renderer.shake(0.5);
    }

    applyPoison() {
        this.snake.controlsReversed = true;
        setTimeout(() => {
            this.snake.controlsReversed = false;
        }, HAZARD_TYPES.POISON.duration);
    }

    updatePowerupIndicators() {
        const container = this.ui.powerupIndicators;
        container.innerHTML = '';

        Object.entries(this.activePowerups).forEach(([type, data]) => {
            const typeData = POWERUP_TYPES[type];
            const indicator = document.createElement('div');
            indicator.className = 'power-up-indicator';

            if (data.remaining < 2000 && data.remaining !== Infinity) {
                indicator.classList.add('expiring');
            }

            const timeText = data.remaining === Infinity ? '' : ` ${Math.ceil(data.remaining / 1000)}s`;
            indicator.innerHTML = `${typeData.icon}${timeText}`;
            container.appendChild(indicator);
        });
    }

    // ============================================
    // DEATH & GAME OVER
    // ============================================

    triggerDeath() {
        this.audio.playSound('death');
        this.deathAnimation.active = true;
        this.deathAnimation.timer = 0;
        this.deathAnimation.slowMoTimer = 0;
        this.deathAnimation.exploded = false;
        this.input.disable();
    }

    completePuzzle() {
        // Calculate stars
        const level = PUZZLE_LEVELS[this.state.currentLevel];
        let stars = 1;
        if (this.gameTime <= level.parTime * 1000) stars++;
        if (this.puzzleMoves <= level.parMoves) stars++;

        // Save progress
        this.data.savePuzzleProgress(
            this.state.currentLevel,
            stars,
            this.gameTime,
            this.puzzleMoves
        );

        // Show completion
        this.state.setState(GAME_STATES.GAME_OVER);
        this.input.disable();

        // Update game over UI for puzzle completion
        document.getElementById('game-over-title').textContent = 'LEVEL COMPLETE!';
        this.ui.finalScore.textContent = this.score;
        this.ui.statTime.textContent = Utils.formatTime(this.gameTime);
        this.ui.statLength.textContent = this.snake.length;
        this.ui.statFood.textContent = this.puzzleCollected;
        this.ui.statCombo.textContent = `x${this.maxCombo}`;
        this.ui.statPowerups.textContent = this.runStats.powerupsUsed;
        this.ui.tipText.textContent = `Stars earned: ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`;

        this.ui.newHighScoreBanner.classList.add('hidden');
        this.ui.achievementsUnlocked.classList.add('hidden');

        this.hideScreen('hud');
        this.showScreen('gameOverScreen');

        this.audio.playSound('achievement');
    }

    // ============================================
    // ACHIEVEMENT CHECKING
    // ============================================

    checkAchievements() {
        const newAchievements = [];
        const stats = this.data.data.stats;

        // First Blood
        if (this.data.unlockAchievement('FIRST_BLOOD')) {
            newAchievements.push('FIRST_BLOOD');
        }

        // Survival time achievements
        if (this.runStats.time >= 60000 && this.data.unlockAchievement('SURVIVOR')) {
            newAchievements.push('SURVIVOR');
        }
        if (this.runStats.time >= 120000 && this.data.unlockAchievement('VETERAN')) {
            newAchievements.push('VETERAN');
        }
        if (this.runStats.time >= 180000 && this.data.unlockAchievement('LEGEND')) {
            newAchievements.push('LEGEND');
        }

        // Untouchable
        if (this.runStats.time >= 60000 && !this.runStats.shieldUsedInRun) {
            if (this.data.unlockAchievement('UNTOUCHABLE')) {
                newAchievements.push('UNTOUCHABLE');
            }
        }

        // Combo achievements
        if (this.runStats.maxCombo >= 5 && this.data.unlockAchievement('COMBO_MASTER')) {
            newAchievements.push('COMBO_MASTER');
        }

        // Ghost Walker
        if (this.runStats.ghostWallPasses >= 5 && this.data.unlockAchievement('GHOST_WALKER')) {
            newAchievements.push('GHOST_WALKER');
        }

        // Treasure Hunter
        if (this.runStats.foodEaten >= 50 && this.data.unlockAchievement('TREASURE_HUNTER')) {
            newAchievements.push('TREASURE_HUNTER');
        }

        // Golden Hoard
        if (this.runStats.skullsEaten >= 5 && this.data.unlockAchievement('GOLDEN_HOARD')) {
            newAchievements.push('GOLDEN_HOARD');
        }

        // Length achievements
        if (this.runStats.maxLength >= 30 && this.data.unlockAchievement('LONG_SNAKE')) {
            newAchievements.push('LONG_SNAKE');
        }
        if (this.runStats.maxLength >= 50 && this.data.unlockAchievement('LONGER_SNAKE')) {
            newAchievements.push('LONGER_SNAKE');
        }

        // Score achievements
        if (this.score >= 1000 && this.data.unlockAchievement('SCORE_SEEKER')) {
            newAchievements.push('SCORE_SEEKER');
        }
        if (this.score >= 5000 && this.data.unlockAchievement('HIGH_ROLLER')) {
            newAchievements.push('HIGH_ROLLER');
        }
        if (this.score >= 10000 && this.data.unlockAchievement('SCORE_MASTER')) {
            newAchievements.push('SCORE_MASTER');
        }

        // Dedicated (based on total stats)
        if (stats.totalGames >= 50 && this.data.unlockAchievement('DEDICATED')) {
            newAchievements.push('DEDICATED');
        }

        return newAchievements;
    }

    // ============================================
    // HUD UPDATE
    // ============================================

    updateHUD() {
        this.ui.currentScore.textContent = this.score;
        this.ui.highScore.textContent = this.data.getHighScore();
        this.ui.snakeLength.textContent = this.snake ? this.snake.length : 0;
        this.ui.difficultyLevel.textContent = this.difficultyLevel + 1;
    }

    // ============================================
    // RENDER
    // ============================================

    render() {
        this.renderer.clear();

        // Only render game elements if playing or in death animation
        if (this.state.isPlaying() || this.deathAnimation.active) {
            // Render dungeon
            const flashlightEnabled = this.state.gameMode === GAME_MODES.PUZZLE &&
                                      PUZZLE_LEVELS[this.state.currentLevel]?.flashlight;
            this.renderer.renderDungeon(this.map, flashlightEnabled, this.snake?.head);

            // Render hazards
            this.hazards.forEach(h => this.renderer.renderHazard(h));

            // Render food
            this.foods.forEach(f => this.renderer.renderFood(f, this.particles));

            // Render power-ups
            this.powerups.forEach(p => this.renderer.renderPowerUp(p));

            // Render snake (if not fully dead)
            if (!this.deathAnimation.exploded && this.snake) {
                this.renderer.renderSnake(this.snake, this.particles);
            }

            // Render particles
            this.particles.render(this.ctx);

            // Render score popups
            this.renderer.renderScorePopups(this.scorePopups);

            // Render vignette
            const vignetteIntensity = this.deathAnimation.active ? 0.7 : 0.4;
            this.renderer.renderVignette(vignetteIntensity);

            // Render flash effect
            this.renderer.renderFlash();

            // Slow motion visual effect
            if (this.slowMotionActive) {
                this.ctx.fillStyle = 'rgba(93, 173, 226, 0.1)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }

            // Time freeze visual effect
            if (this.timeFreezeActive) {
                this.ctx.fillStyle = 'rgba(52, 152, 219, 0.15)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }

    // ============================================
    // GAME LOOP
    // ============================================

    gameLoop() {
        const currentTime = performance.now();
        const dt = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(dt);
        this.render();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
