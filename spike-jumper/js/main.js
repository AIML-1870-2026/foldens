const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ─── Persistent high score ────────────────────────────────────────────────────
const HS_KEY   = 'overgrown-highscore';
let   highScore = parseInt(localStorage.getItem(HS_KEY) || '0', 10);

// ─── Constants ────────────────────────────────────────────────────────────────
const CANVAS_WIDTH  = 1024;
const CANVAS_HEIGHT = 576;
const GROUND_Y      = 450;
const PLAYER_GROUND = GROUND_Y - 60;

const INITIAL_SPEED   = 6;
const MAX_SPEED       = 12;
const SPEED_INCREMENT = 0.0001;   // very gradual per-frame increase

// Rhythm windows (ms)
const PERFECT_MS = 100;
const GOOD_MS    = 250;

// Score thresholds for speed boosts
const SPEED_MILESTONES = [300, 600, 1000, 1500, 2000, 2500];

// BPM and music intensity at each milestone (100 BPM baseline → up to 124)
const BPM_STEPS       = [104, 108, 112, 116, 120, 124];
const INTENSITY_STEPS = [0,   1,   1,   2,   2,   2  ];

// ─── State ────────────────────────────────────────────────────────────────────
let gameState  = 'start';
let score      = 0;
let frameCount = 0;
let gameSpeed  = INITIAL_SPEED;
let rhythmMult = 1.0;
let peakMult   = 1.0;
let cameraX    = 0;

let nextMilestoneIdx = 0;

// Screen shake
let shakeIntensity = 0;
let shakeDuration  = 0;
let shakeTimer     = 0;

// Rhythm flash
let rhythmFlash      = 0;
let rhythmFlashColor = '#90ee90';

// ─── Collections ─────────────────────────────────────────────────────────────
const particles      = [];
const ambientLeaves  = [];
const floatingTexts  = [];
const scheduledSpawns = [];   // { time (audioCtx), width, height, type }
const MAX_PARTICLES  = 250;

// ─── Pattern state ────────────────────────────────────────────────────────────
let prevBeatPhase    = 0;
let totalBeats       = 0;
let currentCooldown  = 4;    // beats to wait before next pattern (initial warm-up)
let beatsSincePattern = 0;

// ─── Pattern name flash ───────────────────────────────────────────────────────
let patternFlash = null;   // { text, tier, age, life }

// ─── Objects ─────────────────────────────────────────────────────────────────
let player;
let spawner;

// ─── Pre-generated background ─────────────────────────────────────────────────
const FAR_BUILDINGS = genBuildings(18, 60, 180, 80, 240);
const MID_BUILDINGS = genBuildings(12, 100, 220, 100, 310);
const NEAR_RUBBLE   = genRubble(30);

function genBuildings(count, minW, maxW, minH, maxH) {
    const list = [];
    let x = -200;
    for (let i = 0; i < count; i++) {
        const w = randomInt(minW, maxW);
        const h = randomInt(minH, maxH);
        const windows = [];
        const cols = Math.floor(w / 22);
        const rows = Math.floor(h / 28);
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
                if (Math.random() < 0.35) windows.push({ r, c });
        const vines = [];
        if (Math.random() < 0.6)
            for (let v = 0; v < randomInt(2, 5); v++)
                vines.push({ sx: randomInt(0, w), len: randomInt(Math.floor(h * 0.3), h), wobble: randomInt(-15, 15) });
        list.push({ x, w, h, windows, vines });
        x += w + randomInt(8, 50);
    }
    return list;
}

function genRubble(count) {
    return Array.from({ length: count }, () => ({
        x: randomInt(0, CANVAS_WIDTH * 3),
        y: GROUND_Y + randomInt(5, 25),
        w: randomInt(10, 35),
        h: randomInt(5, 18)
    }));
}

// ─── Background ───────────────────────────────────────────────────────────────

function drawBackground() {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    skyGrad.addColorStop(0, '#060c06');
    skyGrad.addColorStop(0.5, '#0d180d');
    skyGrad.addColorStop(1, '#182818');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

    drawBuildingLayer(FAR_BUILDINGS, cameraX * 0.1, '#111711', '#0d170d', 0.65, 0.65);
    drawBuildingLayer(MID_BUILDINGS, cameraX * 0.3, '#192419', '#111a11', 1.0,  0.88);

    const gGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_HEIGHT);
    gGrad.addColorStop(0, '#1c2c1c');
    gGrad.addColorStop(1, '#0d140d');
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    drawNearRubble();

    ctx.shadowColor = '#6ba86b';
    ctx.shadowBlur  = 10;
    ctx.strokeStyle = '#6ba86b';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y); ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#3d5a3d';
    ctx.globalAlpha = 0.4;
    ctx.fillRect(0, GROUND_Y + 2, CANVAS_WIDTH, 4);
    ctx.globalAlpha = 1;
}

function drawBuildingLayer(buildings, offset, wallColor, shadowColor, heightScale, alpha) {
    const totalW = buildings.reduce((s, b) => s + b.w + 50, 0) + 400;
    ctx.globalAlpha = alpha;
    for (const b of buildings) {
        const bh = b.h * heightScale;
        for (let tile = -1; tile <= 2; tile++) {
            const bx = ((b.x - offset + tile * totalW) % totalW + totalW) % totalW - 300;
            if (bx > CANVAS_WIDTH + b.w || bx < -b.w - 10) continue;
            const by = GROUND_Y - bh;
            ctx.fillStyle = wallColor;
            ctx.fillRect(bx, by, b.w, bh);
            ctx.fillStyle = shadowColor;
            ctx.fillRect(bx, by, b.w, 8);
            const colW = Math.max(18, Math.floor(b.w / Math.max(1, Math.floor(b.w / 22))));
            ctx.fillStyle = '#3d5a3d';
            for (const win of b.windows) {
                const wx = bx + win.c * colW + 4;
                const wy = by + win.r * 28 + 10;
                if (wy < GROUND_Y - 5 && wx < bx + b.w - 4) ctx.fillRect(wx, wy, 10, 10);
            }
            ctx.strokeStyle = '#2a3d2a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
            for (const vine of b.vines) {
                ctx.beginPath();
                ctx.moveTo(bx + vine.sx, by);
                ctx.bezierCurveTo(bx + vine.sx + vine.wobble, by + vine.len * 0.4,
                                  bx + vine.sx - vine.wobble, by + vine.len * 0.7,
                                  bx + vine.sx + vine.wobble * 0.5, by + vine.len);
                ctx.stroke();
            }
        }
    }
    ctx.globalAlpha = 1;
}

function drawNearRubble() {
    ctx.fillStyle = '#2a3a2a';
    for (const r of NEAR_RUBBLE) {
        const rx = ((r.x - cameraX * 0.8) % (CANVAS_WIDTH * 3) + CANVAS_WIDTH * 3) % (CANVAS_WIDTH * 3) - 100;
        if (rx > CANVAS_WIDTH + 50 || rx < -50) continue;
        ctx.fillRect(rx, r.y, r.w, r.h);
    }
}

// ─── Ambient leaves ───────────────────────────────────────────────────────────

let leafTimer = 0;

function updateAmbientLeaves() {
    if (++leafTimer > 38) {
        leafTimer = 0;
        ambientLeaves.push({
            x: CANVAS_WIDTH + 20,
            y: randomInt(80, GROUND_Y - 40),
            vx: -(randomInt(1, 3) + gameSpeed * 0.18),
            vy: (Math.random() - 0.5) * 0.3,
            angle: Math.random() * Math.PI * 2,
            spin:  (Math.random() - 0.5) * 0.08,
            size:  randomInt(4, 9),
            alpha: randomInt(4, 9) * 0.1,
            color: Math.random() < 0.6 ? '#3d5a3d' : '#6ba86b'
        });
    }
    for (let i = ambientLeaves.length - 1; i >= 0; i--) {
        const l = ambientLeaves[i];
        l.x += l.vx; l.y += l.vy;
        l.vy += Math.sin(l.angle) * 0.018;
        l.angle += l.spin;
        if (l.x < -20) ambientLeaves.splice(i, 1);
    }
}

function drawAmbientLeaves() {
    for (const l of ambientLeaves) {
        ctx.save();
        ctx.globalAlpha = l.alpha; ctx.fillStyle = l.color;
        ctx.translate(l.x, l.y); ctx.rotate(l.angle);
        ctx.beginPath(); ctx.ellipse(0, 0, l.size, l.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.restore();
    }
    ctx.globalAlpha = 1;
}

// ─── Particles ────────────────────────────────────────────────────────────────

class Particle {
    constructor(x, y, vx, vy, type = 'dust') {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.type = type;
        this.lifetime = type === 'glow' ? 28 : type === 'debris' ? 48 : 42;
        this.age  = 0;
        this.size = type === 'glow' ? randomInt(4, 9) : type === 'debris' ? randomInt(3, 7) : randomInt(2, 5);
        this.color = type === 'glow'   ? '#90ee90' :
                     type === 'debris' ? '#4a4a4a' :
                     type === 'leaf'   ? '#6ba86b' : '#7a7a7a';
    }
    update() { this.x += this.vx; this.y += this.vy; this.vy += 0.2; this.vx *= 0.97; this.age++; }
    draw(ctx) {
        const t = this.age / this.lifetime;
        ctx.globalAlpha = (1 - t * t) * 0.88;
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size * (1 - t * 0.4), 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }
    isDead() { return this.age >= this.lifetime; }
}

function emit(x, y, count, type, vxR, vyR) {
    for (let i = 0; i < count; i++)
        particles.push(new Particle(x, y, (Math.random() - 0.5) * vxR, (Math.random() - 0.5) * vyR - Math.abs(vyR) * 0.3, type));
}
function emitLanding(x, y)    { emit(x, y, 10, 'dust', 7, 4); emit(x, y, 3, 'leaf', 5, 3); }
function emitRhythmGlow(x, y) {
    for (let i = 0; i < 14; i++) {
        const a = (Math.PI * 2 * i) / 14, s = randomInt(2, 5);
        particles.push(new Particle(x + 20, y, Math.cos(a) * s, Math.sin(a) * s - 3, 'glow'));
    }
}
function emitCollision(x, y)  { emit(x + 20, y + 20, 22, 'debris', 12, 10); emit(x + 20, y + 20, 12, 'leaf', 10, 8); }

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].isDead()) particles.splice(i, 1);
    }
    if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
}

// ─── Floating feedback text ───────────────────────────────────────────────────

function addFloatingText(text, color, cx, cy, size = 18) {
    floatingTexts.push({ text, color, x: cx, y: cy, vy: -1.8, age: 0, life: 44, size });
}

function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        floatingTexts[i].y  += floatingTexts[i].vy;
        floatingTexts[i].vy *= 0.94;
        floatingTexts[i].age++;
        if (floatingTexts[i].age >= floatingTexts[i].life) floatingTexts.splice(i, 1);
    }
}

function drawFloatingTexts() {
    ctx.textAlign = 'center';
    for (const ft of floatingTexts) {
        const alpha = 1 - ft.age / ft.life;
        ctx.globalAlpha = alpha;
        ctx.font        = `bold ${ft.size}px "Courier New", monospace`;
        ctx.shadowColor = ft.color; ctx.shadowBlur = 10;
        ctx.fillStyle   = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.textAlign = 'left';
}

// ─── Pattern name flash ───────────────────────────────────────────────────────

function showPatternFlash(pattern) {
    patternFlash = { text: pattern.name.toUpperCase(), tier: pattern.tier, age: 0, life: 80 };
}

function drawPatternFlash() {
    if (!patternFlash || gameState !== 'playing') return;
    const t     = patternFlash.age / patternFlash.life;
    const alpha = t < 0.15 ? t / 0.15 : t > 0.65 ? (1 - t) / 0.35 : 1;
    const tier  = patternFlash.tier;
    const color = tier === 3 ? '#90ee90' : tier === 2 ? '#8bc34a' : '#6ba86b';
    ctx.globalAlpha = alpha * 0.75;
    ctx.font        = 'bold 13px "Courier New", monospace';
    ctx.textAlign   = 'center';
    ctx.shadowColor = color; ctx.shadowBlur = 8;
    ctx.fillStyle   = color;
    ctx.fillText(patternFlash.text, CANVAS_WIDTH / 2, 42);
    ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.textAlign = 'left';
    patternFlash.age++;
    if (patternFlash.age >= patternFlash.life) patternFlash = null;
}

// ─── Screen Shake ─────────────────────────────────────────────────────────────

function triggerShake(intensity, duration) {
    shakeIntensity = intensity; shakeDuration = duration; shakeTimer = duration;
}

function applyShake() {
    if (shakeTimer <= 0) return;
    const ease = 1 - Math.pow(1 - shakeTimer / shakeDuration, 2);
    ctx.translate(Math.sin(shakeTimer * 1.1) * 5 * ease * shakeIntensity,
                  Math.cos(shakeTimer * 0.9) * 4 * ease * shakeIntensity);
    shakeTimer--;
}

// ─── Rhythm / Beat ────────────────────────────────────────────────────────────

function onPlayerJump() {
    const dist = audio.getDistToNearestBeat();
    const cx   = player.x + player.width / 2;
    const cy   = player.y - 10;

    if (dist < PERFECT_MS) {
        rhythmMult       = Math.min(rhythmMult + 0.1, 5.0);
        rhythmFlash      = 10;
        rhythmFlashColor = '#90ee90';
        emitRhythmGlow(player.x, player.y);
        addFloatingText('PERFECT!', '#90ee90', cx, cy);
        audio.playPerfect();
    } else if (dist < GOOD_MS) {
        addFloatingText('GOOD', '#6ba86b', cx, cy);
    } else {
        rhythmMult       = Math.max(rhythmMult - 0.2, 1.0);
        rhythmFlash      = 6;
        rhythmFlashColor = '#3a1a1a';
        addFloatingText('MISS', '#ff6b6b', cx, cy);
        audio.playMiss();
    }

    peakMult = Math.max(peakMult, rhythmMult);
    document.getElementById('multiplier').textContent = `x${rhythmMult.toFixed(1)}`;
}

// ─── HUD ──────────────────────────────────────────────────────────────────────

function drawHUD() {
    // Rhythm flash overlay
    if (rhythmFlash > 0) {
        ctx.globalAlpha = rhythmFlash / 30 * 0.22;
        ctx.fillStyle   = rhythmFlashColor;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.globalAlpha = 1;
        rhythmFlash--;
    }

    // Tier label (top right)
    if (gameState === 'playing') {
        const { label, color } = getTierLabel(score);
        ctx.font        = 'bold 13px "Courier New", monospace';
        ctx.textAlign   = 'right';
        ctx.fillStyle   = color;
        ctx.globalAlpha = 0.65;
        ctx.shadowColor = color; ctx.shadowBlur = 6;
        ctx.fillText(label, CANVAS_WIDTH - 16, 36);
        ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.textAlign = 'left';
    }

    // Beat bar at bottom
    const bp  = audio.getBeatPhase();
    const barH = 5;
    ctx.fillStyle = '#0a140a';
    ctx.fillRect(0, CANVAS_HEIGHT - barH, CANVAS_WIDTH, barH);
    const g = Math.floor(80 + (1 - bp) * 110);
    ctx.fillStyle = `rgb(30,${g},30)`;
    ctx.fillRect(0, CANVAS_HEIGHT - barH, CANVAS_WIDTH * bp, barH);

    if (bp < 0.10 && gameState === 'playing') {
        ctx.shadowColor = '#90ee90'; ctx.shadowBlur = 16;
        ctx.fillStyle   = '#90ee90';
        ctx.globalAlpha = (1 - bp / 0.10) * 0.85;
        ctx.fillRect(0, CANVAS_HEIGHT - barH, CANVAS_WIDTH, barH);
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    }

    drawPatternFlash();
}

function drawBeatRing() {
    if (gameState !== 'playing') return;
    const bp = audio.getBeatPhase();
    if (bp > 0.13) return;
    const a = (1 - bp / 0.13) * 0.38;
    ctx.globalAlpha = a;
    ctx.strokeStyle = '#90ee90'; ctx.lineWidth = 2;
    ctx.shadowColor = '#90ee90'; ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 28 + bp * 70, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
}

// ─── Pattern Scheduler ────────────────────────────────────────────────────────

function schedulePattern(pattern) {
    // Arrival-sync: calculate a small delay so obstacles reach the player
    // exactly on a beat boundary, regardless of current game speed.
    //
    // Travel distance from spawn (x=CANVAS_WIDTH) to player reaction zone (x=220):
    //   travelSec  = 814px / (gameSpeed px/frame * 60 fps)
    // Round to nearest whole-beat travel so arrival is on-beat.
    const bs         = audio.beatSec;
    const travelSec  = 814 / (gameSpeed * 60);
    const travelBeat = travelSec / bs;
    // ceil: always round UP so syncDelay is never negative.
    // Guarantees obstacle arrives exactly leadBeats * beatSec after pattern trigger.
    const leadBeats  = Math.ceil(travelBeat);
    const syncDelay  = Math.max(0.01, leadBeats * bs - travelSec);

    const baseTime = audio.ctx.currentTime + syncDelay;
    for (const ob of pattern.obs) {
        scheduledSpawns.push({
            time:   baseTime + ob.beatOffset * bs,
            width:  randomInt(ob.wMin, ob.wMax),
            height: randomInt(ob.hMin, ob.hMax),
            type:   ob.type
        });
    }
    currentCooldown   = pattern.cool;
    beatsSincePattern = 0;
    showPatternFlash(pattern);
}

function updateBeatSpawn() {
    if (!audio.ready || !audio.running) return;

    const bp = audio.getBeatPhase();

    // Detect beat wrap-around (1 → 0)
    if (bp < prevBeatPhase - 0.5) {
        totalBeats++;
        beatsSincePattern++;

        if (beatsSincePattern >= currentCooldown) {
            schedulePattern(selectPattern(score));
        }
    }
    prevBeatPhase = bp;

    // Fire any queued spawns whose time has come
    const now = audio.ctx.currentTime;
    for (let i = scheduledSpawns.length - 1; i >= 0; i--) {
        if (now >= scheduledSpawns[i].time) {
            spawner.spawnWithSpec(scheduledSpawns[i]);
            scheduledSpawns.splice(i, 1);
        }
    }
}

// ─── Speed milestones ─────────────────────────────────────────────────────────

function checkSpeedMilestones() {
    if (nextMilestoneIdx >= SPEED_MILESTONES.length) return;
    if (score >= SPEED_MILESTONES[nextMilestoneIdx]) {
        gameSpeed = Math.min(gameSpeed + 0.55, MAX_SPEED);
        audio.setBPM(BPM_STEPS[nextMilestoneIdx]);
        audio.setIntensity(INTENSITY_STEPS[nextMilestoneIdx]);
        const cx = player.x + player.width / 2;
        addFloatingText('FASTER!', '#ffaa44', cx, player.y - 30, 22);
        triggerShake(0.8, 12);
        nextMilestoneIdx++;
    }
}

// ─── Game Flow ────────────────────────────────────────────────────────────────

function startGame() {
    gameState  = 'playing';
    frameCount = 0;
    score      = 0;
    gameSpeed  = INITIAL_SPEED;
    rhythmMult = 1.0;
    peakMult   = 1.0;
    cameraX    = 0;
    leafTimer  = 0;
    nextMilestoneIdx  = 0;
    totalBeats        = 0;
    beatsSincePattern = 0;
    currentCooldown   = 4;   // 4-beat warm-up before first pattern
    prevBeatPhase     = 0;
    patternFlash      = null;

    particles.length       = 0;
    ambientLeaves.length   = 0;
    floatingTexts.length   = 0;
    scheduledSpawns.length = 0;

    player  = new Player(150, PLAYER_GROUND);
    spawner = new ObstacleSpawner(CANVAS_WIDTH, GROUND_Y, INITIAL_SPEED);

    audio.restart();

    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('multiplier').textContent = 'x1.0';
}

function triggerGameOver() {
    gameState = 'dead';
    triggerShake(3, 35);
    emitCollision(player.x, player.y);
    scheduledSpawns.length = 0;
    audio.stop();
    audio.playGameOver();

    const isNewBest = score > highScore;
    if (isNewBest) {
        highScore = score;
        localStorage.setItem(HS_KEY, highScore);
    }

    document.getElementById('finalScore').textContent       = score;
    document.getElementById('highScoreDisplay').textContent = highScore;
    document.getElementById('finalDistance').textContent    = Math.floor(frameCount / 10);
    document.getElementById('peakMultiplier').textContent   = peakMult.toFixed(1);
    document.getElementById('obstaclesCleared').textContent = spawner.obstaclesCleared;

    const newBestEl = document.getElementById('newBestMsg');
    newBestEl.classList.toggle('hidden', !isNewBest);

    setTimeout(() => document.getElementById('gameOverScreen').classList.remove('hidden'), 600);
}

// ─── Update ───────────────────────────────────────────────────────────────────

function update() {
    if (gameState !== 'playing') return;

    frameCount++;
    cameraX   += gameSpeed;
    gameSpeed  = Math.min(gameSpeed + SPEED_INCREMENT, MAX_SPEED);

    player.update();
    if (player.justLanded) {
        emitLanding(player.x + player.width / 2, player.y + player.height);
        triggerShake(0.5, 8);
        audio.playLand();
    }

    updateBeatSpawn();
    spawner.moveAll(gameSpeed);
    checkSpeedMilestones();

    score = Math.floor((frameCount / 10) * rhythmMult);
    document.getElementById('score').textContent = `Score: ${score}`;

    // Collision
    const pb = player.getBounds();
    for (const obs of spawner.obstacles) {
        if (checkCollision(pb, obs.getBounds())) {
            triggerGameOver();
            return;
        }
    }

    updateParticles();
    updateAmbientLeaves();
    updateFloatingTexts();
}

// ─── Draw ─────────────────────────────────────────────────────────────────────

function draw() {
    ctx.save();
    applyShake();

    drawBackground();
    drawAmbientLeaves();

    if (gameState !== 'start') {
        drawBeatRing();
        spawner.drawAll(ctx);
        player.draw(ctx);
        for (const p of particles) p.draw(ctx);
        drawFloatingTexts();
    }

    drawHUD();
    ctx.restore();
}

// ─── Game Loop ────────────────────────────────────────────────────────────────

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// ─── Input ────────────────────────────────────────────────────────────────────

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'start')   { startGame(); return; }
        if (gameState === 'playing') {
            if (player.jump()) { audio.playJump(); onPlayerJump(); }
        }
    }
});

document.getElementById('startBtn').addEventListener('click', startGame);

// Touch — tap anywhere on the canvas to jump
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'start')   { startGame(); return; }
    if (gameState === 'playing') {
        if (player.jump()) { audio.playJump(); onPlayerJump(); }
    }
}, { passive: false });

// ─── Responsive scaling ───────────────────────────────────────────────────────

function fitCanvas() {
    const container = document.getElementById('gameContainer');
    const scaleX = window.innerWidth  / CANVAS_WIDTH;
    const scaleY = window.innerHeight / CANVAS_HEIGHT;
    const scale  = Math.min(scaleX, scaleY, 1); // never upscale past native
    container.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', fitCanvas);

// ─── Boot ─────────────────────────────────────────────────────────────────────

(function boot() {
    // Show high score on start screen if one exists
    if (highScore > 0) {
        document.getElementById('startBest').classList.remove('hidden');
        document.getElementById('startHighScore').textContent = highScore;
    }

    fitCanvas();

    player  = new Player(150, PLAYER_GROUND);
    spawner = new ObstacleSpawner(CANVAS_WIDTH, GROUND_Y, 0);
    gameLoop();
})();
