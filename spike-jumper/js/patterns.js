// ─── Obstacle Size Presets ────────────────────────────────────────────────────
const SZ = {
    low:  { hMin: 55,  hMax: 70,  wMin: 42, wMax: 56 },
    mid:  { hMin: 72,  hMax: 92,  wMin: 48, wMax: 65 },
    tall: { hMin: 96,  hMax: 118, wMin: 46, wMax: 68 },
    vine: { hMin: 78,  hMax: 112, wMin: 46, wMax: 65 },
    wall: { hMin: 112, hMax: 120, wMin: 56, wMax: 72 },
};

// Shorthand: obs(beatOffset, sizeKey, type)
function obs(b, size, type) {
    return { beatOffset: b, ...SZ[size], type };
}

// ─── 18 Patterns ──────────────────────────────────────────────────────────────
// cool: beats to wait (from pattern start) before selecting next pattern
// This guarantees no overlap and controls density

const PATTERNS = {

    // ── TIER 1: Easy (0–500 pts) ──────────────────────────────────────────────
    tier1: [
        {
            name: 'Single Block',
            tier: 1, cool: 4,
            obs: [ obs(0, 'low', 'concrete') ]
        },
        {
            name: 'Vine Tangle',
            tier: 1, cool: 3,
            obs: [ obs(0, 'vine', 'vine') ]
        },
        {
            name: 'Two-Block Sequence',
            tier: 1, cool: 7,
            obs: [ obs(0, 'low', 'concrete'), obs(3, 'low', 'concrete') ]
        },
        {
            name: 'Rising Rubble',
            tier: 1, cool: 6,
            obs: [ obs(0, 'low', 'concrete'), obs(2.5, 'tall', 'concrete') ]
        },
        {
            name: 'Vine Wall',
            tier: 1, cool: 3,
            obs: [ obs(0, 'wall', 'vine') ]
        },
        {
            // 1.5 beats = 324px gap at speed 6: player can land and re-jump
            name: 'Double Block',
            tier: 1, cool: 7,
            obs: [ obs(0, 'low', 'concrete'), obs(1.5, 'low', 'concrete') ]
        },
    ],

    // ── TIER 2: Medium (500–1500 pts) ─────────────────────────────────────────
    tier2: [
        {
            name: 'Vine & Block',
            tier: 2, cool: 6,
            obs: [ obs(0, 'vine', 'vine'), obs(2, 'mid', 'concrete') ]
        },
        {
            name: 'Low-High Combo',
            tier: 2, cool: 9,
            obs: [ obs(0, 'low', 'concrete'), obs(2, 'mid', 'concrete'), obs(5, 'tall', 'vine') ]
        },
        {
            name: 'Triple Rhythm',
            tier: 2, cool: 7,
            obs: [ obs(0, 'mid', 'concrete'), obs(1.5, 'low', 'concrete'), obs(3.5, 'mid', 'vine') ]
        },
        {
            name: 'Vine Weave',
            tier: 2, cool: 9,
            obs: [
                obs(0,   'vine', 'vine'), obs(1.5, 'vine', 'vine'), obs(3, 'vine', 'vine'),
                obs(4.5, 'vine', 'vine'), obs(6,   'vine', 'vine'),
            ]
        },
        {
            // Pair 1 (0 + 0.75 beats): single jump clears both
            // Gap before pair 2 (2.0 beats): player lands, reacts, jumps
            // Pair 2 (3.5 + 4.25 beats): single jump clears both
            name: 'Rubble Cluster',
            tier: 2, cool: 9,
            obs: [
                obs(0,    'low', 'concrete'), obs(0.75, 'low', 'concrete'),
                obs(2.0,  'mid', 'concrete'),
                obs(3.5,  'low', 'concrete'), obs(4.25, 'low', 'concrete'),
            ]
        },
        {
            name: 'Mixed Alternating',
            tier: 2, cool: 10,
            obs: [
                obs(0, 'vine', 'vine'),     obs(2, 'low', 'concrete'),
                obs(4, 'vine', 'vine'),     obs(6, 'mid', 'concrete'),
            ]
        },
    ],

    // ── TIER 3: Hard (1500+ pts) ──────────────────────────────────────────────
    tier3: [
        {
            name: 'Polyrhythmic',
            tier: 3, cool: 12,
            obs: [
                obs(0,    'vine', 'vine'), obs(1.33, 'vine', 'vine'),
                obs(2.67, 'vine', 'vine'), obs(4,    'mid',  'concrete'),
                obs(5.33, 'vine', 'vine'), obs(6.67, 'vine', 'vine'),
            ]
        },
        {
            name: 'The Gauntlet',
            tier: 3, cool: 12,
            obs: [
                obs(0, 'low', 'concrete'),  obs(1,   'mid',  'vine'),
                obs(2, 'tall','concrete'),  obs(3.5, 'mid',  'vine'),
                obs(5, 'low', 'concrete'),  obs(6,   'tall', 'vine'),
            ]
        },
        {
            name: 'Beat & Off-Beat',
            tier: 3, cool: 10,
            obs: [
                obs(0,   'mid',  'concrete'), obs(0.5, 'low',  'vine'),
                obs(2,   'mid',  'vine'),     obs(2.5, 'low',  'concrete'),
                obs(4,   'tall', 'concrete'), obs(4.5, 'vine', 'vine'),
            ]
        },
        {
            name: 'Crescendo',
            tier: 3, cool: 14,
            obs: [
                obs(0,  'low',  'concrete'), obs(4,  'mid',  'concrete'),
                obs(6,  'mid',  'vine'),     obs(8,  'tall', 'concrete'),
                obs(9,  'tall', 'vine'),     obs(10, 'wall', 'vine'),
            ]
        },
        {
            name: 'Triplet Rush',
            tier: 3, cool: 10,
            obs: [
                obs(0,    'mid', 'concrete'), obs(0.67, 'vine', 'vine'),
                obs(1.33, 'mid', 'concrete'), obs(2,    'vine', 'vine'),
                obs(2.67, 'mid', 'concrete'), obs(3.33, 'vine', 'vine'),
            ]
        },
        {
            name: 'Nature Symphony',
            tier: 3, cool: 14,
            obs: [
                obs(0,   'vine', 'vine'), obs(1.1, 'tall', 'vine'),
                obs(2.3, 'wall', 'vine'), obs(3.5, 'vine', 'vine'),
                obs(4.2, 'tall', 'vine'), obs(5.8, 'vine', 'vine'),
                obs(7,   'wall', 'vine'), obs(8.5, 'vine', 'vine'),
            ]
        },
    ],
};

// ─── Pattern Selection ────────────────────────────────────────────────────────

function selectPattern(score) {
    let pool;
    const r = Math.random();

    if (score < 500) {
        pool = PATTERNS.tier1;
    } else if (score < 800) {
        pool = r < 0.70 ? PATTERNS.tier1 : PATTERNS.tier2;
    } else if (score < 1200) {
        pool = r < 0.40 ? PATTERNS.tier1 : PATTERNS.tier2;
    } else if (score < 1500) {
        pool = r < 0.15 ? PATTERNS.tier1 : PATTERNS.tier2;
    } else if (score < 2200) {
        pool = r < 0.20 ? PATTERNS.tier2 : r < 0.65 ? PATTERNS.tier2 : PATTERNS.tier3;
    } else {
        pool = r < 0.35 ? PATTERNS.tier2 : PATTERNS.tier3;
    }

    return pool[Math.floor(Math.random() * pool.length)];
}

// Tier label for HUD
function getTierLabel(score) {
    if (score < 500)  return { label: 'TIER I',   color: '#6ba86b' };
    if (score < 1500) return { label: 'TIER II',  color: '#8bc34a' };
    return                   { label: 'TIER III', color: '#90ee90' };
}
