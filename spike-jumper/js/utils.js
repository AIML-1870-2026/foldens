function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function lerp(a, b, t) { return a + (b - a) * t; }
