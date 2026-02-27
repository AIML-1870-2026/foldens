# OVERGROWN RUINS RUNNER - Complete Master Specification

## PROJECT OVERVIEW

**Game:** Overgrown Ruins Runner | **Type:** Rhythm-Synchronized Endless Runner | **Platform:** Web (Canvas + Web Audio API)  
**Vision:** Post-apocalyptic nature reclaiming a city. Jump obstacles synced to organic music.  
**Timeline:** ~16-21 hours (5 phases) | **Status:** Ready to implement

---

## CORE DESIGN (LOCKED IN)

| Aspect | Specification |
|--------|---------------|
| **Theme** | Nature overtaking ruined city |
| **Mechanic** | Jump over obstacles (spacebar) |
| **Music** | Organic strings & woodwinds (100 BPM, 4/4) |
| **Style** | Hand-drawn/organic, desaturated gray + green |
| **Difficulty** | Progressive (obstacles get complex over time) |
| **Sync** | Beat-synced obstacle spawning |
| **Player Movement** | Horizontal left-to-right runner |
| **Collision** | Game ends on impact |
| **Score** | Distance traveled, bonus for rhythm hits |

---

## COLOR PALETTE

```
Primary BG:    #2a2a2a  (dark gray)
Secondary BG:  #1a1a1a  (darker)
Concrete:      #4a4a4a  (medium gray)
Nature:        #3d5a3d  (muted green)
Player:        #8bc34a  (vibrant green)
Highlight:     #6ba86b  (bright green)
Glow:          #90ee90  (light green)
Error:         #ff6b6b  (red for collision)
```

---

## PHYSICS CONSTANTS (Phase 1)

```javascript
// Canvas & Scene
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;
const GROUND_Y = 450;

// Player
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 60;
const PLAYER_START_X = 150;
const JUMP_FORCE = 15;           // Initial upward velocity
const GRAVITY = 0.6;             // Downward acceleration
const TERMINAL_VELOCITY = 12;    // Max fall speed

// Game Speed
const INITIAL_GAME_SPEED = 6;    // pixels/frame
const MAX_GAME_SPEED = 12;
const SPEED_INCREMENT = 0.0002;  // per frame

// Obstacle Spawning
const SPAWN_INTERVAL = 120;      // frames between spawns
const OBSTACLE_WIDTH_RANGE = [40, 80];
const OBSTACLE_HEIGHT_RANGE = [60, 120];

// Difficulty Scaling
const SPEED_INCREASE_INTERVAL = 500;  // points
const PATTERN_CHANGE_INTERVAL = 500;  // points
```

---

## PHASE 1: CORE GAME ENGINE (3-4 hours)

### Files to Create
```
overgrown-ruins-runner/
├── index.html
├── css/style.css
└── js/
    ├── main.js
    ├── player.js
    ├── obstacle.js
    └── utils.js
```

### HTML Boilerplate
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Overgrown Ruins Runner</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="gameContainer">
        <canvas id="gameCanvas" width="1024" height="576"></canvas>
        <div id="hud"><div id="score">Score: 0</div></div>
        <div id="gameOverScreen" class="hidden">
            <h1>GAME OVER</h1>
            <p id="finalScore">Score: 0</p>
            <button onclick="location.reload()">Restart</button>
        </div>
    </div>
    <script src="js/utils.js"></script>
    <script src="js/player.js"></script>
    <script src="js/obstacle.js"></script>
    <script src="js/main.js"></script>
</body>
</html>
```

### CSS
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #1a1a1a; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial, sans-serif; }
#gameContainer { position: relative; width: 1024px; height: 576px; background: #2a2a2a; border: 2px solid #6ba86b; }
canvas { display: block; background: linear-gradient(to bottom, #1a1a1a, #2a2a2a); }
#hud { position: absolute; top: 20px; left: 20px; color: #6ba86b; font-size: 24px; z-index: 100; }
#gameOverScreen { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); padding: 40px; border-radius: 10px; text-align: center; z-index: 200; color: white; }
#gameOverScreen h1 { font-size: 48px; color: #ff6b6b; margin-bottom: 20px; }
#gameOverScreen button { margin-top: 20px; padding: 10px 30px; font-size: 18px; background: #6ba86b; color: white; border: none; border-radius: 5px; cursor: pointer; }
.hidden { display: none !important; }
```

### Utilities (js/utils.js)
```javascript
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function lerp(a, b, t) { return a + (b - a) * t; }
```

### Player Class (js/player.js)
```javascript
class Player {
    constructor(x, y, width = 40, height = 60) {
        this.x = x; this.y = y; this.width = width; this.height = height;
        this.velocityY = 0; this.jumpForce = 15; this.gravity = 0.6;
        this.terminalVelocity = 12; this.groundY = y; this.isGrounded = true;
        this.squashScale = 1; this.squashTarget = 1; this.squashTimer = 0; this.squashDuration = 8;
    }
    
    jump() {
        if (this.isGrounded) {
            this.velocityY = -this.jumpForce;
            this.isGrounded = false;
            this.squashTarget = 0.8;
            this.squashTimer = 0;
        }
    }
    
    update() {
        this.velocityY = Math.min(this.velocityY + this.gravity, this.terminalVelocity);
        this.y += this.velocityY;
        
        if (this.y >= this.groundY) {
            this.y = this.groundY; this.velocityY = 0; this.isGrounded = true;
            this.squashTarget = 0.95; this.squashTimer = 0;
        }
        
        if (this.squashTimer < this.squashDuration) {
            this.squashTimer++;
            const t = this.squashTimer / this.squashDuration;
            this.squashScale = lerp(this.squashTarget, 1, easeInOutCubic(t));
        } else {
            this.squashScale = 1;
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(1, this.squashScale);
        ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
        
        ctx.fillStyle = '#8bc34a';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#6ba86b';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        ctx.restore();
    }
    
    getBounds() {
        return { x: this.x, y: this.y + 5, width: this.width, height: this.height - 5 };
    }
}
```

### Obstacle Classes (js/obstacle.js)
```javascript
class Obstacle {
    constructor(x, y, width, height, speed) {
        this.x = x; this.y = y; this.width = width; this.height = height;
        this.speed = speed; this.type = Math.random() < 0.6 ? 'concrete' : 'vine';
    }
    
    update() { this.x -= this.speed; }
    
    draw(ctx) {
        ctx.fillStyle = this.type === 'concrete' ? '#4a4a4a' : '#3d5a3d';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#6ba86b';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    
    getBounds() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }
    
    isOffScreen() { return this.x + this.width < 0; }
}

class ObstacleSpawner {
    constructor(canvasWidth, groundY, speed) {
        this.canvasWidth = canvasWidth; this.groundY = groundY;
        this.baseSpeed = speed; this.obstacles = []; this.spawnTimer = 0;
        this.spawnInterval = 120;
    }
    
    update(gameSpeed) {
        this.baseSpeed = gameSpeed;
        this.spawnTimer++;
        if (this.spawnTimer >= this.spawnInterval) {
            const height = randomInt(60, 120);
            const y = this.groundY - height;
            const width = randomInt(40, 80);
            const obs = new Obstacle(this.canvasWidth, y, width, height, this.baseSpeed);
            this.obstacles.push(obs);
            this.spawnTimer = 0;
        }
        
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].update();
            if (this.obstacles[i].isOffScreen()) this.obstacles.splice(i, 1);
        }
    }
    
    drawAll(ctx) {
        for (let obs of this.obstacles) obs.draw(ctx);
    }
}
```

### Main Game Loop (js/main.js)
```javascript
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GROUND_Y = 450;
const INITIAL_SPEED = 6;
const SPEED_INCREMENT = 0.0002;

let gameRunning = true;
let score = 0;
let gameSpeed = INITIAL_SPEED;
let frameCount = 0;

let player = new Player(150, GROUND_Y);
let spawner = new ObstacleSpawner(canvas.width, GROUND_Y, INITIAL_SPEED);

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a1a');
    gradient.addColorStop(1, '#2a2a2a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    
    ctx.strokeStyle = '#6ba86b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(canvas.width, GROUND_Y);
    ctx.stroke();
}

function update() {
    if (!gameRunning) return;
    
    frameCount++;
    player.update();
    spawner.update(gameSpeed);
    gameSpeed = Math.min(gameSpeed + SPEED_INCREMENT, 12);
    score = Math.floor(frameCount / 10);
    document.getElementById('score').innerText = `Score: ${score}`;
    
    const playerBounds = player.getBounds();
    for (let obs of spawner.obstacles) {
        if (checkCollision(playerBounds, obs.getBounds())) {
            gameRunning = false;
            document.getElementById('finalScore').innerText = `Score: ${score}`;
            document.getElementById('gameOverScreen').classList.remove('hidden');
        }
    }
}

function draw() {
    drawBackground();
    player.draw(ctx);
    spawner.drawAll(ctx);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        player.jump();
    }
});

gameLoop();
```

### Phase 1 Checklist
- ✅ Game runs at 60 FPS
- ✅ Spacebar jump works
- ✅ Obstacles spawn and move
- ✅ Collision detection works
- ✅ Score increments
- ✅ Game over screen appears

---

## PHASE 2: VISUAL POLISH & JUICE (4-5 hours)

### Key Implementations

**Irregular Shapes (Organic Feel):**
```javascript
function drawConcreteBlock(ctx, x, y, width, height) {
    const corners = [
        { x: x + randomInt(-3, 2), y: y + randomInt(-3, 2) },
        { x: x + width + randomInt(-2, 3), y: y + randomInt(-3, 2) },
        { x: x + width + randomInt(-2, 3), y: y + height + randomInt(-2, 3) },
        { x: x + randomInt(-3, 2), y: y + height + randomInt(-2, 3) }
    ];
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 4; i++) ctx.lineTo(corners[i].x, corners[i].y);
    ctx.closePath();
    ctx.fill();
    
    // Cracks
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        const startY = y + randomInt(0, height);
        ctx.beginPath();
        ctx.moveTo(x + randomInt(0, width / 3), startY);
        ctx.lineTo(x + randomInt(20, 40), startY + randomInt(-10, 10));
        ctx.stroke();
    }
}
```

**Vine Obstacles (Bezier Curves):**
```javascript
function drawVineTangle(ctx, x, y, width, height) {
    ctx.fillStyle = '#3d5a3d';
    for (let i = 0; i < 5; i++) {
        const startX = x + randomInt(0, width);
        const startY = y;
        const c1x = startX + randomInt(-30, 30), c1y = startY + height / 3;
        const c2x = startX + randomInt(-50, 50), c2y = startY + (2 * height) / 3;
        const endX = startX + randomInt(-20, 20), endY = startY + height;
        
        ctx.strokeStyle = '#3d5a3d';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, endX, endY);
        ctx.stroke();
    }
}
```

**Advanced Particle System:**
```javascript
class Particle {
    constructor(x, y, vx, vy, type = 'dust') {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.type = type;
        this.lifetime = 60; this.age = 0;
        this.size = type === 'dust' ? randomInt(3, 8) : randomInt(8, 15);
        this.color = type === 'dust' ? '#7a7a7a' : type === 'leaf' ? '#6ba86b' : '#4a4a4a';
    }
    
    update() {
        this.x += this.vx; this.y += this.vy;
        this.vy += 0.2; this.vx *= 0.98; this.age++;
    }
    
    draw(ctx) {
        const progress = this.age / this.lifetime;
        ctx.globalAlpha = 1 - Math.pow(progress, 2);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
    
    isDead() { return this.age >= this.lifetime; }
}

function emitLandingParticles(particles, x, y) {
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const speed = randomInt(1, 4);
        particles.push(new Particle(x, y, Math.cos(angle) * speed + randomInt(-2, 2),
                                   Math.sin(angle) * speed - randomInt(1, 3), 'dust'));
    }
}
```

**Screen Shake:**
```javascript
function applyScreenShake(ctx, shakeIntensity, shakeTimer, shakeDuration) {
    if (shakeTimer <= 0) return;
    const progress = shakeTimer / shakeDuration;
    const easeOut = 1 - Math.pow(progress, 2);
    const shakeX = (Math.sin(shakeTimer * 0.1) * 3 + Math.cos(shakeTimer * 0.07) * 2) * easeOut * shakeIntensity;
    const shakeY = (Math.sin(shakeTimer * 0.15) * 3 + Math.cos(shakeTimer * 0.11) * 2) * easeOut * shakeIntensity;
    ctx.translate(shakeX, shakeY);
}
```

**Parallax Background (3 Layers):**
```javascript
function drawBackgroundLayers(ctx, cameraX, width, height) {
    drawDistantRuins(ctx, cameraX * 0.2, width, height);
    drawOvergrownStructures(ctx, cameraX * 0.4, width, height);
    drawNearRubble(ctx, cameraX * 0.7, width, height);
}

function drawDistantRuins(ctx, offset, width, height) {
    ctx.fillStyle = '#1a1a1a';
    const buildingWidth = 150;
    const buildingHeights = [200, 300, 250, 280, 220];
    
    for (let i = -1; i < Math.ceil(width / buildingWidth) + 1; i++) {
        const bx = (i * buildingWidth - offset) % (buildingWidth * buildingHeights.length);
        const bh = buildingHeights[i % buildingHeights.length];
        ctx.fillRect(bx, height - bh, buildingWidth, bh);
    }
}
```

### Phase 2 Checklist
- ✅ Irregular concrete blocks with cracks
- ✅ Organic vine obstacles with curves
- ✅ Particle system (dust, leaves, debris)
- ✅ Screen shake with easing
- ✅ Squash & stretch visible
- ✅ 3-layer parallax background

---

## PHASE 3: AUDIO & RHYTHM SYNC (3-4 hours)

### Web Audio Setup
```javascript
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let musicBuffer = null;

async function loadMusic(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    musicBuffer = await audioContext.decodeAudioData(arrayBuffer);
}

function playMusic() {
    const source = audioContext.createBufferSource();
    source.buffer = musicBuffer;
    source.connect(audioContext.destination);
    source.start(0);
    return source;
}
```

### Beat Detection (BPM-based)
```javascript
const BPM = 100;
const BEAT_DURATION = (60 / BPM) * 1000;  // milliseconds

function getCurrentBeat(currentTime) {
    return (currentTime / BEAT_DURATION) % 4;  // 4 beats per measure
}

function isOnBeat(currentTime, tolerance = 100) {
    const beat = (currentTime / BEAT_DURATION) % 1;
    return beat < tolerance / BEAT_DURATION || beat > 1 - tolerance / BEAT_DURATION;
}
```

### Rhythm Multiplier System
```javascript
let rhythmMultiplier = 1.0;
const PERFECT_HIT_WINDOW = 100;  // milliseconds
const GOOD_HIT_WINDOW = 250;

function onPlayerJump(currentTime) {
    const beat = (currentTime / BEAT_DURATION) % 1;
    const distToBeat = Math.min(beat, 1 - beat) * BEAT_DURATION;
    
    if (distToBeat < PERFECT_HIT_WINDOW) {
        rhythmMultiplier += 0.1;
        playSound('chime');  // Satisfying sound
        createRhythmGlow(player.x, player.y);
    } else if (distToBeat < GOOD_HIT_WINDOW) {
        // Base score only
    } else {
        rhythmMultiplier = 1.0;
        playSound('buzz');  // Error sound
    }
}
```

### Phase 3 Checklist
- ✅ Music plays seamlessly
- ✅ Beat detection working
- ✅ Obstacles spawn on beat
- ✅ Multiplier increases on perfect rhythm
- ✅ Multiplier resets on miss
- ✅ Audio/SFX balanced (60% music, 40% SFX)

---

## PHASE 4: PATTERNS & DIFFICULTY (4-5 hours)

### 18 Obstacle Patterns

**Tier 1 (Easy, 0-500 pts):**
1. Single Low Block — 1 obstacle, standard height, 4 beats
2. Single Vine Tangle — 1 vine, taller, 3 beats
3. Two-Block Sequence — 2 blocks staggered, 8 beats total
4. Rising Rubble — 2 blocks, second 50% taller, 8 beats
5. Vine Wall — Full-height vine, 2 beats (tight timing)
6. Double Block Horizontal — 2 blocks side-by-side, 4 beats

**Tier 2 (Medium, 500-1500 pts):**
7. Staggered Vine & Block — Mixed types offset, 8 beats
8. Low-High Combo — 3 obstacles increasing height, 8 beats
9. Triple Block Rhythm — 3 blocks with syncopation, 6 beats
10. Vine Weave — 6 vines every 1.5 beats, 6 beats
11. Rubble Cluster — 8 obstacles rapid-fire (0.5 beat spacing), 4 beats
12. Mixed Nature & Concrete — Alternating vine/block, 8 beats

**Tier 3 (Hard, 1500+ pts):**
13. Polyrhythmic Vine Dance — Vines on overlapping 3-beat/4-beat divisions, 12 beats
14. The Gauntlet — 5-6 obstacles in 8 beats, extreme challenge
15. Beat & Off-Beat Alternation — Obstacles on beat AND off-beat, 16 beats
16. The Crescendo — Progressive density (4 beats → 2 beats → 1 beat), 12 beats
17. Triplet Rhythm Sequence — Obstacles on triplet divisions, 8 beats
18. Chaotic Nature Symphony — All vines, organic but metrically valid, 12 beats

### Pattern Implementation
```javascript
const patterns = {
    tier1: [
        { name: 'Single Low Block', obstacles: [{ beat: 1, height: 60, width: 50, type: 'concrete' }], duration: 4 },
        { name: 'Single Vine Tangle', obstacles: [{ beat: 1, height: 80, width: 55, type: 'vine' }], duration: 3 },
        // ... rest of patterns
    ],
    tier2: [ /* ... */ ],
    tier3: [ /* ... */ ]
};

function selectPatternTier(score) {
    if (score < 500) return patterns.tier1;
    if (score < 1500) return patterns.tier2;
    return patterns.tier3;
}

function spawnPattern(pattern) {
    for (let obs of pattern.obstacles) {
        const spawnTime = obs.beat * BEAT_DURATION;
        scheduleObstacleSpawn(obs, spawnTime);
    }
}
```

### Difficulty Scaling
```javascript
function updateDifficulty(score) {
    // Speed increase
    if (score % 500 === 0 && score > 0) {
        gameSpeed += 0.5;
        gameSpeed = Math.min(gameSpeed, MAX_GAME_SPEED);
    }
    
    // Pattern tier upgrade
    const tier = score < 500 ? 1 : score < 1500 ? 2 : 3;
    currentPatternTier = tier;
}
```

### Phase 4 Checklist
- ✅ All 18 patterns coded and working
- ✅ Patterns feel fair (no impossible jumps)
- ✅ Pattern randomization prevents predictability
- ✅ Difficulty progression smooth
- ✅ Game interesting for 10+ minutes

---

## PHASE 5: POLISH & DEPLOY (2-3 hours)

### Visual Refinement Checklist
- ✅ Consistency: All colors match palette
- ✅ Lighting: Proper shadows/depth
- ✅ Animations: Smooth easing throughout
- ✅ Particles: Proper fade and physics
- ✅ UI: Clear, readable HUD
- ✅ Performance: Stable 60 FPS

### Performance Optimization
```javascript
// Particle limit
const MAX_PARTICLES = 200;
function updateParticles() {
    particles = particles.filter(p => !p.isDead());
    if (particles.length > MAX_PARTICLES) {
        particles = particles.slice(-MAX_PARTICLES);
    }
}

// Obstacle caching
const cachedObstacles = {};
function getCachedObstacle(type, width, height) {
    const key = `${type}-${width}-${height}`;
    if (!cachedObstacles[key]) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (type === 'concrete') drawConcreteBlock(ctx, 0, 0, width, height);
        else drawVineTangle(ctx, 0, 0, width, height);
        cachedObstacles[key] = canvas;
    }
    return cachedObstacles[key];
}
```

### GitHub Pages Deployment
```bash
# Initialize git repo
git init
git add .
git commit -m "Initial commit: Overgrown Ruins Runner"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/overgrown-ruins-runner.git
git branch -M main
git push -u origin main

# Enable Pages: Settings → Pages → Deploy from main branch
# Live at: https://YOUR_USERNAME.github.io/overgrown-ruins-runner
```

### Game Over Screen
```html
<div id="gameOverScreen" class="hidden">
    <h1>GAME OVER</h1>
    <div class="stats">
        <p>Final Score: <span id="finalScore">0</span></p>
        <p>Distance: <span id="finalDistance">0</span> px</p>
        <p>Peak Multiplier: <span id="peakMultiplier">1.0</span>x</p>
        <p>Obstacles Cleared: <span id="obstaclesCleared">0</span></p>
    </div>
    <div class="buttons">
        <button onclick="location.reload()">Try Again</button>
        <button onclick="shareScore()">Share Score</button>
    </div>
</div>
```

### Phase 5 Checklist
- ✅ No visual glitches
- ✅ Consistent 60 FPS
- ✅ Cross-browser compatible
- ✅ Mobile responsive (optional)
- ✅ Deployed to GitHub Pages
- ✅ Ready to share

---

## IMPLEMENTATION SUMMARY TABLE

| Phase | Duration | Goal | Key Tech |
|-------|----------|------|----------|
| 1 | 3-4h | Playable loop | Canvas, physics |
| 2 | 4-5h | Visual polish | Particles, parallax, animation |
| 3 | 3-4h | Audio/rhythm | Web Audio API, beat sync |
| 4 | 4-5h | Content | 18 patterns, difficulty |
| 5 | 2-3h | Deploy | Optimization, GitHub Pages |
| **Total** | **16-21h** | **Complete game** | **Vanilla JS stack** |

---

## QUICK REFERENCE: COMMON TASKS

**Add particles on landing:**
```javascript
emitLandingParticles(particles, player.x + player.width/2, player.y + player.height);
```

**Check collision:**
```javascript
if (checkCollision(player.getBounds(), obstacle.getBounds())) gameOver();
```

**Increase difficulty:**
```javascript
gameSpeed += 0.1;
pattern = selectPatternTier(score);
```

**Apply screen shake:**
```javascript
applyScreenShake(ctx, shakeIntensity, shakeTimer, shakeDuration);
```

**Draw hand-drawn shape:**
```javascript
drawConcreteBlock(ctx, x, y, width, height);  // Cracks + irregular edges
drawVineTangle(ctx, x, y, width, height);     // Bezier curves
```

**Sync obstacle to beat:**
```javascript
if (isOnBeat(currentTime)) spawnObstacle();
```

---

## SUCCESS CRITERIA (Full Project)

- ✅ Playable for 10+ minutes without repetition
- ✅ 60 FPS consistent performance
- ✅ Perfect music synchronization
- ✅ Hand-drawn, organic visual aesthetic
- ✅ Fair difficulty progression
- ✅ Rewarding rhythm system
- ✅ Shareable via GitHub Pages
- ✅ Responsive controls (0ms jump latency)
- ✅ All 18 patterns distinct and working
- ✅ Professional polish throughout

---

## FILES NEEDED

```
overgrown-ruins-runner/
├── index.html
├── README.md
├── .gitignore
├── css/style.css
└── js/
    ├── main.js (game loop, state)
    ├── player.js (player physics + rendering)
    ├── obstacle.js (obstacles + spawner)
    ├── particle.js (particle system)
    ├── audio.js (Web Audio API wrapper)
    ├── rhythm.js (multiplier + hit detection)
    ├── patterns.js (18 pattern definitions)
    ├── effects.js (screen shake, glows)
    └── utils.js (collision, easing, helpers)
```

---

## NOTES FOR IMPLEMENTATION

- **Start with Phase 1** following code snippets exactly
- **Reference physics constants** from section above
- **Use color palette** consistently throughout
- **Test after each phase** before moving to next
- **Optimize particles** to avoid slowdown (cap at 200)
- **Cache complex shapes** (concrete blocks, vine tangles)
- **Easing is key** — all animations use cubic easing
- **Audio sync** — may need periodic resync in Phase 3
- **Mobile support** — optional but adds value

---

**Created:** February 26, 2026 | **Status:** Ready for Phase 1 Implementation | **Total Lines:** ~2,000 (optimized from 5,000+)
