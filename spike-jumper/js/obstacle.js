class Obstacle {
    constructor(x, groundY, width, height, speed, forceType = null) {
        this.x      = x;
        this.y      = groundY - height;   // top of obstacle sits at groundY - height
        this.width  = width;
        this.height = height;
        this.speed  = speed;
        this.type   = forceType || (Math.random() < 0.55 ? 'concrete' : 'vine');
        this.groundY = groundY;

        if (this.type === 'concrete') {
            // Irregular corner offsets (baked once)
            this.corners = [
                { dx: randomInt(-3, 2),  dy: randomInt(-4, 1) },
                { dx: randomInt(-1, 4),  dy: randomInt(-4, 1) },
                { dx: randomInt(-1, 3),  dy: randomInt(-1, 3) },
                { dx: randomInt(-3, 1),  dy: randomInt(-1, 3) }
            ];
            // Cracks
            this.cracks = Array.from({ length: randomInt(2, 5) }, () => ({
                x1: randomInt(3, width - 10),
                y1: randomInt(5, height - 10),
                dx: randomInt(-20, 20),
                dy: randomInt(-15, 15)
            }));
            // Moss patches
            this.moss = Array.from({ length: randomInt(2, 5) }, () => ({
                x: randomInt(0, width - 12),
                y: randomInt(0, height - 8),
                w: randomInt(8, 20),
                h: randomInt(4, 10)
            }));
        }

        if (this.type === 'vine') {
            const vineCount = randomInt(4, 7);
            this.vines = Array.from({ length: vineCount }, () => {
                const sx = randomInt(0, width);
                return {
                    sx,
                    c1x: sx + randomInt(-35, 35),
                    c1y: height * randomInt(25, 40) * 0.01,
                    c2x: sx + randomInt(-55, 55),
                    c2y: height * randomInt(55, 75) * 0.01,
                    ex:  sx + randomInt(-25, 25),
                    thick: randomInt(5, 11)
                };
            });
        }
    }

    update() { this.x -= this.speed; }

    draw(ctx) {
        if (!this._cache) this._buildCache();
        // Draw the pre-rendered offscreen canvas at current position
        ctx.drawImage(this._cache, this.x - this._pad, this.y - this._pad);
    }

    _buildCache() {
        // Render once into an offscreen canvas; glow/shadow is baked into pixels.
        // pad = extra space so shadow blur (max 8px) isn't clipped.
        const pad = 10;
        const oc  = document.createElement('canvas');
        oc.width  = this.width  + pad * 2;
        oc.height = this.height + pad * 2;
        const offCtx = oc.getContext('2d');
        // Translate so that drawing at (this.x, this.y) lands at (pad, pad) in the cache
        offCtx.translate(pad - this.x, pad - this.y);
        if (this.type === 'concrete') this._drawConcrete(offCtx);
        else                          this._drawVine(offCtx);
        this._cache = oc;
        this._pad   = pad;
    }

    _drawConcrete(ctx) {
        const { x, y, width: w, height: h, corners: c } = this;

        // Body with gradient
        const grad = ctx.createLinearGradient(x, y, x + w, y + h);
        grad.addColorStop(0, '#525252');
        grad.addColorStop(1, '#3a3a3a');
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.moveTo(x + c[0].dx,       y + c[0].dy);
        ctx.lineTo(x + w + c[1].dx,   y + c[1].dy);
        ctx.lineTo(x + w + c[2].dx,   y + h + c[2].dy);
        ctx.lineTo(x + c[3].dx,       y + h + c[3].dy);
        ctx.closePath();
        ctx.fill();

        // Moss
        ctx.fillStyle = '#3d5a3d';
        ctx.globalAlpha = 0.55;
        for (const m of this.moss) {
            ctx.fillRect(x + m.x, y + m.y, m.w, m.h);
        }
        ctx.globalAlpha = 1;

        // Cracks
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth   = 1.2;
        ctx.lineCap     = 'round';
        for (const cr of this.cracks) {
            ctx.beginPath();
            ctx.moveTo(x + cr.x1, y + cr.y1);
            ctx.lineTo(x + cr.x1 + cr.dx, y + cr.y1 + cr.dy);
            ctx.stroke();
        }

        // Outline glow
        ctx.shadowColor = '#6ba86b';
        ctx.shadowBlur  = 4;
        ctx.strokeStyle = '#6ba86b';
        ctx.lineWidth   = 1.5;
        ctx.strokeRect(x, y, w, h);
        ctx.shadowBlur  = 0;
    }

    _drawVine(ctx) {
        const { x, y, height: h } = this;

        // Dark fill behind vines
        ctx.fillStyle   = 'rgba(20,30,20,0.45)';
        ctx.fillRect(x + 4, y, this.width - 8, h);

        ctx.lineCap = 'round';
        for (const v of this.vines) {
            // Thick dark base vine
            ctx.strokeStyle = '#2a3d2a';
            ctx.lineWidth   = v.thick + 3;
            ctx.beginPath();
            ctx.moveTo(x + v.sx,  y);
            ctx.bezierCurveTo(x + v.c1x, y + v.c1y, x + v.c2x, y + v.c2y, x + v.ex, y + h);
            ctx.stroke();

            // Bright overlay vine
            ctx.strokeStyle = '#4a7a4a';
            ctx.lineWidth   = v.thick;
            ctx.beginPath();
            ctx.moveTo(x + v.sx,  y);
            ctx.bezierCurveTo(x + v.c1x, y + v.c1y, x + v.c2x, y + v.c2y, x + v.ex, y + h);
            ctx.stroke();
        }

        // Accent highlight on 2 vines
        ctx.strokeStyle = '#8bc34a';
        ctx.lineWidth   = 2;
        ctx.globalAlpha = 0.7;
        for (let i = 0; i < Math.min(2, this.vines.length); i++) {
            const v = this.vines[i];
            ctx.beginPath();
            ctx.moveTo(x + v.sx,  y);
            ctx.bezierCurveTo(x + v.c1x, y + v.c1y, x + v.c2x, y + v.c2y, x + v.ex, y + h);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Glow outline
        ctx.shadowColor = '#6ba86b';
        ctx.shadowBlur  = 6;
        ctx.strokeStyle = '#3d5a3d';
        ctx.lineWidth   = 1;
        ctx.strokeRect(x + 4, y, this.width - 8, h);
        ctx.shadowBlur  = 0;
    }

    getBounds() {
        const inset = this.type === 'vine' ? 10 : 3;
        return {
            x:      this.x + inset,
            y:      this.y,
            width:  this.width - inset * 2,
            height: this.height
        };
    }

    isOffScreen() { return this.x + this.width < 0; }
}

class ObstacleSpawner {
    constructor(canvasWidth, groundY, speed) {
        this.canvasWidth      = canvasWidth;
        this.groundY          = groundY;
        this.baseSpeed        = speed;
        this.obstacles        = [];
        this.spawnTimer       = 0;
        this.spawnInterval    = 120;
        this.obstaclesCleared = 0;
    }

    // Spawn an obstacle with explicit dimensions and type (from pattern scheduler)
    spawnWithSpec({ width, height, type }) {
        const resolvedType = (type === 'random' || !type) ? null : type;
        this.obstacles.push(
            new Obstacle(this.canvasWidth + 10, this.groundY, width, height, this.baseSpeed, resolvedType)
        );
    }

    // Fallback: spawn one random obstacle immediately
    spawnNow(speed) {
        this.baseSpeed = speed;
        this.obstacles.push(
            new Obstacle(this.canvasWidth + 10, this.groundY, randomInt(40, 80), randomInt(55, 120), this.baseSpeed)
        );
    }

    // Move all existing obstacles and cull off-screen ones
    moveAll(gameSpeed) {
        this.baseSpeed = gameSpeed;
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].speed = this.baseSpeed;
            this.obstacles[i].update();
            if (this.obstacles[i].isOffScreen()) {
                this.obstacles.splice(i, 1);
                this.obstaclesCleared++;
            }
        }
    }

    drawAll(ctx) {
        for (const obs of this.obstacles) obs.draw(ctx);
    }
}
