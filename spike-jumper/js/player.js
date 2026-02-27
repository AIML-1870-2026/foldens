class Player {
    constructor(x, y, width = 40, height = 60) {
        this.x       = x;
        this.y       = y;
        this.width   = width;
        this.height  = height;
        this.groundY = y;        // y when grounded (top of player)

        this.velocityY      = 0;
        this.jumpForce      = 15;
        this.gravity        = 0.6;
        this.terminalVel    = 12;
        this.isGrounded     = true;
        this.justLanded     = false;

        // Squash & stretch
        this.squashScaleY = 1;
        this.squashTarget = 1;
        this.squashTimer  = 0;
        this.squashDur    = 10;

        // Running legs
        this.legAngle = 0;

        // Motion trail
        this.trail = [];
    }

    jump() {
        if (!this.isGrounded) return false;
        this.velocityY  = -this.jumpForce;
        this.isGrounded = false;
        this.squashTarget = 0.72;
        this.squashTimer  = 0;
        return true;
    }

    update() {
        this.justLanded = false;

        this.velocityY = Math.min(this.velocityY + this.gravity, this.terminalVel);
        this.y += this.velocityY;

        // Trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 7) this.trail.shift();

        if (this.y >= this.groundY) {
            if (!this.isGrounded) {
                this.justLanded   = true;
                this.squashTarget = 0.82;
                this.squashTimer  = 0;
            }
            this.y          = this.groundY;
            this.velocityY  = 0;
            this.isGrounded = true;
        }

        // Squash ease
        if (this.squashTimer < this.squashDur) {
            this.squashTimer++;
            const t = this.squashTimer / this.squashDur;
            this.squashScaleY = lerp(this.squashTarget, 1, easeInOutCubic(t));
        } else {
            this.squashScaleY = 1;
        }

        // Leg animation (only when grounded)
        if (this.isGrounded) this.legAngle += 0.22;
    }

    draw(ctx) {
        // Motion trail
        for (let i = 0; i < this.trail.length - 1; i++) {
            const alpha = (i / this.trail.length) * 0.12;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#8bc34a';
            ctx.fillRect(this.trail[i].x, this.trail[i].y, this.width, this.height);
        }
        ctx.globalAlpha = 1;

        ctx.save();

        // Squash pivot at bottom centre
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height;          // bottom
        ctx.translate(cx, cy);
        ctx.scale(1 / Math.max(0.6, this.squashScaleY), this.squashScaleY);
        ctx.translate(-cx, -cy);

        // Shadow under player
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(cx, this.groundY + this.height + 4, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // ── Body ──
        const bodyGrad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
        bodyGrad.addColorStop(0, '#8bc34a');
        bodyGrad.addColorStop(1, '#6ba86b');
        ctx.fillStyle = bodyGrad;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Highlight stripe
        ctx.fillStyle = 'rgba(144,238,144,0.35)';
        ctx.fillRect(this.x + 5, this.y + 5, 10, this.height * 0.45);

        // Dark shading on right
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(this.x + this.width - 8, this.y, 8, this.height);

        // Outline
        ctx.strokeStyle = '#4a7a4a';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // ── Eye ──
        const eyeX = this.x + this.width - 10;
        const eyeY = this.y + 14;
        // White
        ctx.fillStyle = '#c8f0a0';
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, 5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Pupil — looks forward
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(eyeX + 2, eyeY + 1, 3, 0, Math.PI * 2);
        ctx.fill();

        // ── Running legs (only when on ground) ──
        if (this.isGrounded) {
            this._drawLegs(ctx);
        }

        ctx.restore();
    }

    _drawLegs(ctx) {
        const legLen  = 12;
        const footY   = this.y + this.height + 2;
        const hipX    = this.x + this.width / 2;
        const hipY    = this.y + this.height;

        ctx.strokeStyle = '#4a7a4a';
        ctx.lineWidth   = 4;
        ctx.lineCap     = 'round';

        // Left leg
        const la = this.legAngle;
        ctx.beginPath();
        ctx.moveTo(hipX - 6, hipY);
        ctx.lineTo(hipX - 6 + Math.sin(la) * legLen, footY);
        ctx.stroke();

        // Right leg (offset by half cycle)
        ctx.beginPath();
        ctx.moveTo(hipX + 6, hipY);
        ctx.lineTo(hipX + 6 + Math.sin(la + Math.PI) * legLen, footY);
        ctx.stroke();
    }

    getBounds() {
        return {
            x:      this.x + 5,
            y:      this.y + 4,
            width:  this.width - 10,
            height: this.height - 4
        };
    }
}
