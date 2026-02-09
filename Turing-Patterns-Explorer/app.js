// ============================================================
// Turing Patterns Explorer — Main Application
// ============================================================

// ===== MODEL CONFIGURATIONS =====
const MODELS = {
    'gray-scott': {
        shader: 'grayScott',
        dt: 1.0,
        stepsMultiplier: 1,
        dispMin: 0.0,
        dispMax: 0.4,
        params: [
            { key: 'feed', uniform: 'u_feed', label: 'Feed (F)', min: 0.01, max: 0.08, step: 0.002, default: 0.034, tip: 'How fast chemical A is replenished. Higher = more activity.' },
            { key: 'kill', uniform: 'u_kill', label: 'Kill (K)', min: 0.03, max: 0.07, step: 0.002, default: 0.062, tip: 'How fast chemical B decays. Higher = sparser patterns.' },
            { key: 'dA', uniform: 'u_dA', label: 'Diff A', min: 0.5, max: 1.2, step: 0.01, default: 1.0, tip: 'Diffusion rate of chemical A.' },
            { key: 'dB', uniform: 'u_dB', label: 'Diff B', min: 0.1, max: 0.6, step: 0.01, default: 0.5, tip: 'Diffusion rate of chemical B.' }
        ],
        presets: [
            { name: 'Spots',   vals: { feed: 0.034, kill: 0.063 }, tip: 'Self-replicating round dots' },
            { name: 'Stripes', vals: { feed: 0.042, kill: 0.063 }, tip: 'Parallel lines and filaments' },
            { name: 'Maze',    vals: { feed: 0.029, kill: 0.057 }, tip: 'Winding labyrinthine corridors' },
            { name: 'Coral',   vals: { feed: 0.055, kill: 0.062 }, tip: 'Branching coral-like growth' },
            { name: 'Mitosis', vals: { feed: 0.037, kill: 0.065 }, tip: 'Blobs splitting like dividing cells' },
            { name: 'Chaos',   vals: { feed: 0.026, kill: 0.051 }, tip: 'Turbulent shifting regions' },
            { name: 'Worms',   vals: { feed: 0.058, kill: 0.065 }, tip: 'Elongated wriggling shapes' },
            { name: 'Holes',   vals: { feed: 0.039, kill: 0.058 }, tip: 'Negative-space dots in a field' }
        ],
        seed(data, w, h) {
            for (let i = 0; i < w * h; i++) { data[i * 4] = 1; data[i * 4 + 1] = 0; }
            seedCenter(data, w, h, 0.5, 0.25);
        }
    },
    'brusselator': {
        shader: 'brusselator',
        dt: 0.008,
        stepsMultiplier: 10,
        dispMin: 0.0,
        dispMax: 2.0,
        params: [
            { key: 'a', uniform: 'u_a', label: 'A', min: 0.5, max: 5.0, step: 0.1, default: 4.5, tip: 'Production rate of activator.' },
            { key: 'b', uniform: 'u_b', label: 'B', min: 1.0, max: 12.0, step: 0.1, default: 7.5, tip: 'Conversion rate.' },
            { key: 'du', uniform: 'u_du', label: 'Du', min: 0.5, max: 4.0, step: 0.1, default: 2.0, tip: 'Diffusion of chemical U.' },
            { key: 'dv', uniform: 'u_dv', label: 'Dv', min: 4.0, max: 22.0, step: 0.5, default: 16.0, tip: 'Diffusion of chemical V.' }
        ],
        presets: [
            { name: 'Spots',   vals: { a: 4.5, b: 7.5, du: 2.0, dv: 16.0 }, tip: 'Turing spots' },
            { name: 'Stripes', vals: { a: 4.5, b: 9.5, du: 2.0, dv: 16.0 }, tip: 'Turing stripes' },
            { name: 'Maze',    vals: { a: 4.5, b: 11.0, du: 2.0, dv: 16.0 }, tip: 'Labyrinthine corridors' },
            { name: 'Fine',    vals: { a: 4.5, b: 7.5, du: 1.5, dv: 20.0 }, tip: 'Fine-grained patterns' }
        ],
        seed(data, w, h, params) {
            const a = params.a, b = params.b;
            const u0 = a, v0 = b / a;
            for (let i = 0; i < w * h; i++) { data[i * 4] = u0; data[i * 4 + 1] = v0; }
            seedPerturb(data, w, h, u0, v0, 0.15);
        }
    },
    'schnakenberg': {
        shader: 'schnakenberg',
        dt: 0.02,
        stepsMultiplier: 4,
        dispMin: 0.0,
        dispMax: 1.5,
        params: [
            { key: 'a', uniform: 'u_a', label: 'a', min: 0.01, max: 0.3, step: 0.01, default: 0.1, tip: 'Base production of activator.' },
            { key: 'b', uniform: 'u_b', label: 'b', min: 0.3, max: 2.0, step: 0.05, default: 0.9, tip: 'Base production of inhibitor.' },
            { key: 'du', uniform: 'u_du', label: 'Du', min: 0.5, max: 4.0, step: 0.1, default: 1.0, tip: 'Diffusion of activator.' },
            { key: 'dv', uniform: 'u_dv', label: 'Dv', min: 5.0, max: 40.0, step: 1.0, default: 10.0, tip: 'Diffusion of inhibitor.' }
        ],
        presets: [
            { name: 'Spots',   vals: { a: 0.1, b: 0.9, du: 1.0, dv: 10.0 }, tip: 'Classic Turing spots' },
            { name: 'Stripes', vals: { a: 0.05, b: 1.0, du: 1.0, dv: 20.0 }, tip: 'Stripe patterns' },
            { name: 'Mixed',   vals: { a: 0.1, b: 0.9, du: 1.0, dv: 30.0 }, tip: 'Spots and stripes mixed' },
            { name: 'Dense',   vals: { a: 0.2, b: 1.5, du: 0.5, dv: 20.0 }, tip: 'Dense small patterns' }
        ],
        seed(data, w, h, params) {
            const a = params.a, b = params.b;
            const ss = a + b;
            const u0 = ss, v0 = b / (ss * ss);
            for (let i = 0; i < w * h; i++) { data[i * 4] = u0; data[i * 4 + 1] = v0; }
            seedPerturb(data, w, h, u0, v0, 0.3);
        }
    }
};

// ===== COLOR SCHEMES =====
const COLOR_SCHEMES = {
    grayscale: { name: 'Grayscale', stops: [[0,240,240,240],[1,10,10,10]] },
    ocean:     { name: 'Ocean',     stops: [[0,0,8,30],[0.25,0,50,130],[0.5,0,140,200],[0.75,40,210,250],[1,200,245,255]] },
    plasma:    { name: 'Plasma',    stops: [[0,10,5,120],[0.2,100,0,170],[0.4,210,30,110],[0.6,255,110,40],[0.8,255,200,30],[1,250,255,100]] },
    inferno:   { name: 'Inferno',   stops: [[0,0,0,3],[0.2,60,10,90],[0.4,170,40,80],[0.6,240,80,30],[0.8,255,180,10],[1,255,255,150]] },
    neon:      { name: 'Neon',      stops: [[0,2,0,15],[0.25,0,40,220],[0.5,100,0,255],[0.75,255,0,180],[1,255,100,220]] },
    earth:     { name: 'Earth',     stops: [[0,15,8,3],[0.2,70,40,15],[0.45,170,140,40],[0.7,50,150,35],[1,20,75,12]] },
    ice:       { name: 'Ice',       stops: [[0,3,5,40],[0.25,15,50,140],[0.5,60,140,230],[0.75,160,215,255],[1,235,248,255]] },
    matrix:    { name: 'Matrix',    stops: [[0,0,0,0],[0.25,0,30,3],[0.5,0,120,20],[0.75,0,220,50],[1,50,255,80]] }
};

// ===== APPLICATION STATE =====
let gl, canvas, container;
const S = {
    model: 'gray-scott',
    params: {},
    programs: {},
    textures: [null, null],
    framebuffers: [null, null],
    currentTex: 0,
    quadVAO: null,
    colorLUTTex: null,
    colorScheme: 'grayscale',
    width: 0,
    height: 0,
    playing: true,
    speed: 8,
    brush: { active: false, x: -1, y: -1, radius: 15, chemical: 1 },
    iterations: 0,
    fps: { frames: 0, last: 0, value: 0 },
    animId: null,
    journey: { active: false, time: 0, startTime: 0 },
    resizeTimer: null
};

// ===== SEEDING HELPERS =====
function seedCenter(data, w, h, aVal, bVal) {
    const cx = w >> 1, cy = h >> 1;
    const count = 15 + Math.floor(Math.random() * 10);
    for (let s = 0; s < count; s++) {
        const sx = cx + Math.floor((Math.random() - 0.5) * w * 0.35);
        const sy = cy + Math.floor((Math.random() - 0.5) * h * 0.35);
        const sz = 2 + Math.floor(Math.random() * 5);
        for (let dy = -sz; dy <= sz; dy++) {
            for (let dx = -sz; dx <= sz; dx++) {
                const px = ((sx + dx) % w + w) % w;
                const py = ((sy + dy) % h + h) % h;
                const i = (py * w + px) * 4;
                data[i] = aVal;
                data[i + 1] = bVal;
            }
        }
    }
}

function seedPerturb(data, w, h, u0, v0, strength) {
    const cx = w >> 1, cy = h >> 1;
    const count = 15 + Math.floor(Math.random() * 10);
    for (let s = 0; s < count; s++) {
        const sx = cx + Math.floor((Math.random() - 0.5) * w * 0.35);
        const sy = cy + Math.floor((Math.random() - 0.5) * h * 0.35);
        const sz = 2 + Math.floor(Math.random() * 5);
        for (let dy = -sz; dy <= sz; dy++) {
            for (let dx = -sz; dx <= sz; dx++) {
                const px = ((sx + dx) % w + w) % w;
                const py = ((sy + dy) % h + h) % h;
                const i = (py * w + px) * 4;
                data[i] = u0 + (Math.random() - 0.5) * strength * u0;
                data[i + 1] = v0 + (Math.random() - 0.5) * strength * v0;
            }
        }
    }
}

// ===== WEBGL HELPERS =====
function compileShader(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
    }
    return s;
}

function createProgram(vsSrc, fsSrc) {
    const vs = compileShader(vsSrc, gl.VERTEX_SHADER);
    const fs = compileShader(fsSrc, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return null;
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(p));
        return null;
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    return p;
}

function getUniforms(program, names) {
    const u = {};
    for (const n of names) u[n] = gl.getUniformLocation(program, n);
    return u;
}

function createFloatTexture(w, h, data) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    return tex;
}

function createFB(tex) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return fb;
}

function lerpColor(stops, t) {
    if (t <= stops[0][0]) return [stops[0][1], stops[0][2], stops[0][3]];
    if (t >= stops[stops.length - 1][0]) { const s = stops[stops.length - 1]; return [s[1], s[2], s[3]]; }
    for (let i = 0; i < stops.length - 1; i++) {
        if (t >= stops[i][0] && t <= stops[i + 1][0]) {
            const f = (t - stops[i][0]) / (stops[i + 1][0] - stops[i][0]);
            return [
                Math.round(stops[i][1] + (stops[i + 1][1] - stops[i][1]) * f),
                Math.round(stops[i][2] + (stops[i + 1][2] - stops[i][2]) * f),
                Math.round(stops[i][3] + (stops[i + 1][3] - stops[i][3]) * f)
            ];
        }
    }
    return [0, 0, 0];
}

function createLUTTexture(schemeName) {
    const stops = COLOR_SCHEMES[schemeName].stops;
    const data = new Uint8Array(256 * 4);
    for (let i = 0; i < 256; i++) {
        const c = lerpColor(stops, i / 255);
        data[i * 4] = c[0]; data[i * 4 + 1] = c[1]; data[i * 4 + 2] = c[2]; data[i * 4 + 3] = 255;
    }
    if (S.colorLUTTex) {
        gl.bindTexture(gl.TEXTURE_2D, S.colorLUTTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
        return S.colorLUTTex;
    }
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
}

// ===== INIT WEBGL =====
function initGL() {
    canvas = document.getElementById('sim-canvas');
    container = document.getElementById('canvas-container');

    gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, alpha: false });
    if (!gl) {
        document.getElementById('webgl-error').style.display = 'flex';
        document.getElementById('sidebar').style.display = 'none';
        return false;
    }

    const ext = gl.getExtension('EXT_color_buffer_float');
    if (!ext) {
        document.getElementById('webgl-error').style.display = 'flex';
        document.getElementById('webgl-error').children[0].textContent = 'EXT_color_buffer_float not supported.';
        document.getElementById('sidebar').style.display = 'none';
        return false;
    }

    // Fullscreen quad VAO
    S.quadVAO = gl.createVertexArray();
    gl.bindVertexArray(S.quadVAO);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    // Compile programs
    const vs = SHADERS.vertex;
    S.programs['gray-scott'] = createProgram(vs, SHADERS.grayScott);
    S.programs['brusselator'] = createProgram(vs, SHADERS.brusselator);
    S.programs['schnakenberg'] = createProgram(vs, SHADERS.schnakenberg);
    S.programs.display = createProgram(vs, SHADERS.display);

    // Cache uniform locations
    const commonU = ['u_state', 'u_texel', 'u_dt', 'u_brush', 'u_brushR', 'u_brushChem'];
    for (const key of ['gray-scott', 'brusselator', 'schnakenberg']) {
        const model = MODELS[key];
        const paramUniforms = model.params.map(p => p.uniform);
        S.programs[key].u = getUniforms(S.programs[key], [...commonU, ...paramUniforms]);
    }
    S.programs.display.u = getUniforms(S.programs.display, ['u_state', 'u_lut', 'u_min', 'u_max', 'u_steady']);

    // Color LUT
    S.colorLUTTex = createLUTTexture(S.colorScheme);

    return true;
}

// ===== SIMULATION TEXTURES =====
function initTextures() {
    const rect = container.getBoundingClientRect();
    S.width = Math.max(256, Math.floor(rect.width));
    S.height = Math.max(256, Math.floor(rect.height));
    canvas.width = S.width;
    canvas.height = S.height;

    // Cleanup old
    for (let i = 0; i < 2; i++) {
        if (S.textures[i]) gl.deleteTexture(S.textures[i]);
        if (S.framebuffers[i]) gl.deleteFramebuffer(S.framebuffers[i]);
    }

    // Seed data
    const model = MODELS[S.model];
    const data = new Float32Array(S.width * S.height * 4);
    model.seed(data, S.width, S.height, S.params);

    S.textures[0] = createFloatTexture(S.width, S.height, data);
    S.textures[1] = createFloatTexture(S.width, S.height, null);
    S.framebuffers[0] = createFB(S.textures[0]);
    S.framebuffers[1] = createFB(S.textures[1]);
    S.currentTex = 0;
    S.iterations = 0;

    document.getElementById('resolution').textContent = `${S.width} \u00d7 ${S.height}`;
}

// ===== SIMULATION STEP =====
function simStep() {
    const model = MODELS[S.model];
    const prog = S.programs[S.model];
    gl.useProgram(prog);

    // Set model-specific parameter uniforms
    for (const p of model.params) {
        gl.uniform1f(prog.u[p.uniform], S.params[p.key]);
    }
    gl.uniform2f(prog.u.u_texel, 1 / S.width, 1 / S.height);
    gl.uniform1f(prog.u.u_dt, model.dt);

    // Brush
    if (S.brush.active) {
        gl.uniform2f(prog.u.u_brush, S.brush.x, S.brush.y);
        gl.uniform1f(prog.u.u_brushR, S.brush.radius);
        gl.uniform1f(prog.u.u_brushChem, S.brush.chemical);
    } else {
        gl.uniform2f(prog.u.u_brush, -1, -1);
        gl.uniform1f(prog.u.u_brushR, 0);
        gl.uniform1f(prog.u.u_brushChem, 0);
    }

    gl.bindVertexArray(S.quadVAO);

    const steps = S.speed * (model.stepsMultiplier || 1);
    for (let i = 0; i < steps; i++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, S.framebuffers[1 - S.currentTex]);
        gl.viewport(0, 0, S.width, S.height);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, S.textures[S.currentTex]);
        gl.uniform1i(prog.u.u_state, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        S.currentTex = 1 - S.currentTex;
        S.iterations++;
    }
}

// ===== DISPLAY =====
function display() {
    const model = MODELS[S.model];
    const prog = S.programs.display;
    gl.useProgram(prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, S.textures[S.currentTex]);
    gl.uniform1i(prog.u.u_state, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, S.colorLUTTex);
    gl.uniform1i(prog.u.u_lut, 1);

    gl.uniform1f(prog.u.u_min, model.dispMin);
    gl.uniform1f(prog.u.u_max, model.dispMax);

    // Compute steady-state for deviation display (Brusselator/Schnakenberg)
    let steady = 0;
    if (S.model === 'brusselator') {
        steady = S.params.b / Math.max(S.params.a, 0.01);
    } else if (S.model === 'schnakenberg') {
        const ss = S.params.a + S.params.b;
        steady = S.params.b / Math.max(ss * ss, 0.01);
    }
    gl.uniform1f(prog.u.u_steady, steady);

    gl.bindVertexArray(S.quadVAO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// ===== ANIMATION LOOP =====
function animate(t) {
    S.animId = requestAnimationFrame(animate);

    if (S.journey.active) updateJourney(t);

    if (S.playing) {
        simStep();
    }
    display();

    // FPS
    S.fps.frames++;
    if (t - S.fps.last >= 500) {
        S.fps.value = Math.round(S.fps.frames / ((t - S.fps.last) / 1000));
        S.fps.frames = 0;
        S.fps.last = t;
        document.getElementById('fps').textContent = S.fps.value + ' FPS';
    }
    document.getElementById('iterations').textContent = S.iterations.toLocaleString() + ' iterations';
}

// ===== UI BUILDING =====
function decimalsForStep(step) {
    return Math.max(0, Math.round(-Math.log10(step)));
}

function buildParamSliders() {
    const div = document.getElementById('param-sliders');
    div.innerHTML = '';
    const model = MODELS[S.model];
    for (const p of model.params) {
        const dec = decimalsForStep(p.step);
        const row = document.createElement('div');
        row.className = 'slider-row';
        row.innerHTML = `
            <label data-tip="${p.tip}">${p.label}</label>
            <input type="range" min="${p.min}" max="${p.max}" step="${p.step}" value="${S.params[p.key]}" data-key="${p.key}">
            <span class="val" id="val-${p.key}">${Number(S.params[p.key]).toFixed(dec)}</span>
        `;
        const input = row.querySelector('input');
        input.addEventListener('input', () => {
            S.params[p.key] = parseFloat(input.value);
            document.getElementById('val-' + p.key).textContent = Number(input.value).toFixed(dec);
            if (S.model === 'gray-scott') updateParamSpaceCrosshair();
        });
        div.appendChild(row);
    }
}

function buildPresets() {
    const div = document.getElementById('presets');
    div.innerHTML = '';
    const model = MODELS[S.model];
    model.presets.forEach((preset, idx) => {
        const btn = document.createElement('button');
        btn.textContent = preset.name;
        btn.setAttribute('data-tip', preset.tip);
        btn.addEventListener('click', () => applyPreset(preset));
        div.appendChild(btn);
    });
}

function buildColorSwatches() {
    const div = document.getElementById('color-swatches');
    div.innerHTML = '';
    for (const [key, scheme] of Object.entries(COLOR_SCHEMES)) {
        const el = document.createElement('div');
        el.className = 'swatch' + (key === S.colorScheme ? ' active' : '');
        // Create gradient background from stops
        const stops = scheme.stops;
        const gradStops = stops.map(s => `rgb(${s[1]},${s[2]},${s[3]}) ${s[0] * 100}%`).join(',');
        el.style.background = `linear-gradient(135deg, ${gradStops})`;
        el.setAttribute('data-tip', scheme.name);
        el.addEventListener('click', () => {
            S.colorScheme = key;
            createLUTTexture(key);
            div.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
            el.classList.add('active');
        });
        div.appendChild(el);
    }
}

function applyPreset(preset) {
    const model = MODELS[S.model];
    for (const p of model.params) {
        if (preset.vals[p.key] !== undefined) {
            S.params[p.key] = preset.vals[p.key];
        }
    }
    // Update sliders
    for (const p of model.params) {
        const input = document.querySelector(`#param-sliders input[data-key="${p.key}"]`);
        if (input) {
            input.value = S.params[p.key];
            const dec = decimalsForStep(p.step);
            document.getElementById('val-' + p.key).textContent = Number(S.params[p.key]).toFixed(dec);
        }
    }
    // Reset simulation
    resetSimulation();
    // Update preset highlights
    document.querySelectorAll('#presets button').forEach(b => b.classList.remove('active'));
    // Highlight matching
    const buttons = document.querySelectorAll('#presets button');
    const idx = MODELS[S.model].presets.indexOf(preset);
    if (idx >= 0 && buttons[idx]) buttons[idx].classList.add('active');
    if (S.model === 'gray-scott') updateParamSpaceCrosshair();
}

function switchModel(name) {
    S.model = name;
    // Set default params
    const model = MODELS[name];
    S.params = {};
    for (const p of model.params) S.params[p.key] = p.default;
    // Update UI
    document.querySelectorAll('#model-selector button').forEach(b => {
        b.classList.toggle('active', b.dataset.model === name);
    });
    document.getElementById('param-space-group').style.display = name === 'gray-scott' ? '' : 'none';
    buildParamSliders();
    buildPresets();
    resetSimulation();
    if (name === 'gray-scott') updateParamSpaceCrosshair();
}

function resetSimulation() {
    initTextures();
}

// ===== BRUSH INTERACTION =====
function getTexCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = S.width / rect.width;
    const scaleY = S.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: S.height - (e.clientY - rect.top) * scaleY
    };
}

function onPointerDown(e) {
    if (e.target !== canvas) return;
    e.preventDefault();
    S.brush.active = true;
    const c = getTexCoords(e);
    S.brush.x = c.x;
    S.brush.y = c.y;
    canvas.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
    // Update brush cursor position
    const rect = canvas.getBoundingClientRect();
    const bx = e.clientX - rect.left;
    const by = e.clientY - rect.top;
    if (bx >= 0 && by >= 0 && bx <= rect.width && by <= rect.height) {
        const cursor = document.getElementById('brush-cursor');
        const screenR = S.brush.radius * (rect.width / S.width);
        cursor.style.display = 'block';
        cursor.style.width = screenR * 2 + 'px';
        cursor.style.height = screenR * 2 + 'px';
        cursor.style.left = bx + 'px';
        cursor.style.top = by + 'px';
    }

    if (S.brush.active) {
        const c = getTexCoords(e);
        S.brush.x = c.x;
        S.brush.y = c.y;
    }
}

function onPointerUp(e) {
    S.brush.active = false;
}

function onPointerLeave() {
    document.getElementById('brush-cursor').style.display = 'none';
}

// ===== PARAMETER SPACE DIAGRAM =====
function drawParamSpace() {
    const cvs = document.getElementById('param-space');
    const ctx = cvs.getContext('2d');
    const w = cvs.width, h = cvs.height;
    const img = ctx.createImageData(w, h);

    const fMin = 0.01, fMax = 0.08;
    const kMin = 0.03, kMax = 0.07;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const f = fMin + (x / (w - 1)) * (fMax - fMin);
            const k = kMax - (y / (h - 1)) * (kMax - kMin); // Y inverted: top = high K

            // Approximate classification of Gray-Scott parameter space
            const threshold = Math.sqrt(f) * 0.21;
            const lower = 0.02 + f * 0.55;
            let r = 10, g = 12, b = 20; // dead/uniform background

            if (k <= threshold && k >= lower) {
                // Pattern region
                const relF = (f - fMin) / (fMax - fMin);
                const relK = (k - lower) / (threshold - lower);

                if (relF < 0.15) {
                    // Chaos region
                    r = 140; g = 40; b = 80;
                } else if (relF < 0.35) {
                    if (relK > 0.5) { r = 50; g = 130; b = 220; } // Spots
                    else { r = 60; g = 180; b = 80; } // Maze
                } else if (relF < 0.55) {
                    if (relK > 0.6) { r = 50; g = 130; b = 220; } // Spots
                    else { r = 200; g = 160; b = 40; } // Stripes
                } else if (relF < 0.75) {
                    r = 230; g = 120; b = 50; // Coral
                } else {
                    r = 50; g = 100; b = 180; // Spots (edge)
                }

                // Smooth edges
                const edgeDist = Math.min(
                    (k - lower) / (threshold - lower),
                    1 - (k - lower) / (threshold - lower)
                );
                const fade = Math.min(1, edgeDist * 5);
                r = Math.round(r * fade + 10 * (1 - fade));
                g = Math.round(g * fade + 12 * (1 - fade));
                b = Math.round(b * fade + 20 * (1 - fade));
            }

            const i = (y * w + x) * 4;
            img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);
}

function updateParamSpaceCrosshair() {
    if (S.model !== 'gray-scott') return;
    const cvs = document.getElementById('param-space');
    const ch = document.getElementById('param-crosshair');
    const f = S.params.feed || 0.03;
    const k = S.params.kill || 0.06;
    const fMin = 0.01, fMax = 0.08, kMin = 0.03, kMax = 0.07;

    const xPct = (f - fMin) / (fMax - fMin) * 100;
    const yPct = (1 - (k - kMin) / (kMax - kMin)) * 100;
    ch.style.left = xPct + '%';
    ch.style.top = yPct + '%';
}

function onParamSpaceClick(e) {
    const cvs = document.getElementById('param-space');
    const rect = cvs.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;

    const fMin = 0.01, fMax = 0.08, kMin = 0.03, kMax = 0.07;
    const f = fMin + xPct * (fMax - fMin);
    const k = kMax - yPct * (kMax - kMin);

    S.params.feed = Math.round(f * 1000) / 1000;
    S.params.kill = Math.round(k * 1000) / 1000;

    // Update sliders
    const feedInput = document.querySelector('#param-sliders input[data-key="feed"]');
    const killInput = document.querySelector('#param-sliders input[data-key="kill"]');
    if (feedInput) { feedInput.value = S.params.feed; document.getElementById('val-feed').textContent = S.params.feed.toFixed(decimalsForStep(0.001)); }
    if (killInput) { killInput.value = S.params.kill; document.getElementById('val-kill').textContent = S.params.kill.toFixed(decimalsForStep(0.001)); }

    updateParamSpaceCrosshair();
    resetSimulation();
}

// ===== JOURNEY MODE =====
const JOURNEY_PATH = [
    { feed: 0.034, kill: 0.063 }, // Spots
    { feed: 0.042, kill: 0.063 }, // Stripes
    { feed: 0.029, kill: 0.057 }, // Maze
    { feed: 0.055, kill: 0.062 }, // Coral
    { feed: 0.026, kill: 0.051 }, // Chaos
    { feed: 0.034, kill: 0.063 }  // Back to spots
];
const JOURNEY_DURATION = 15000; // 15 seconds

function toggleJourney() {
    if (S.journey.active) {
        S.journey.active = false;
        document.getElementById('btn-journey').classList.remove('active-action');
    } else {
        if (S.model !== 'gray-scott') switchModel('gray-scott');
        S.journey.active = true;
        S.journey.startTime = performance.now();
        S.playing = true;
        document.getElementById('btn-play').textContent = 'Pause';
        document.getElementById('btn-journey').classList.add('active-action');
    }
}

function updateJourney(t) {
    const elapsed = t - S.journey.startTime;
    const progress = Math.min(elapsed / JOURNEY_DURATION, 1);

    if (progress >= 1) {
        S.journey.active = false;
        document.getElementById('btn-journey').classList.remove('active-action');
        return;
    }

    // Find which segment we're in
    const segments = JOURNEY_PATH.length - 1;
    const segProgress = progress * segments;
    const segIdx = Math.min(Math.floor(segProgress), segments - 1);
    const segT = segProgress - segIdx;

    // Smooth easing
    const eased = segT * segT * (3 - 2 * segT); // smoothstep

    const from = JOURNEY_PATH[segIdx];
    const to = JOURNEY_PATH[segIdx + 1];
    S.params.feed = from.feed + (to.feed - from.feed) * eased;
    S.params.kill = from.kill + (to.kill - from.kill) * eased;

    // Update slider UI
    const feedInput = document.querySelector('#param-sliders input[data-key="feed"]');
    const killInput = document.querySelector('#param-sliders input[data-key="kill"]');
    if (feedInput) { feedInput.value = S.params.feed; document.getElementById('val-feed').textContent = S.params.feed.toFixed(decimalsForStep(0.001)); }
    if (killInput) { killInput.value = S.params.kill; document.getElementById('val-kill').textContent = S.params.kill.toFixed(decimalsForStep(0.001)); }
    updateParamSpaceCrosshair();
}

// ===== ACTIONS =====
function togglePlay() {
    S.playing = !S.playing;
    document.getElementById('btn-play').textContent = S.playing ? 'Pause' : 'Play';
}

function saveImage() {
    const link = document.createElement('a');
    link.download = `turing-${S.model}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// ===== KEYBOARD =====
function onKeyDown(e) {
    if (e.target.tagName === 'INPUT') return;
    switch (e.key.toLowerCase()) {
        case ' ': e.preventDefault(); togglePlay(); break;
        case 'r': resetSimulation(); break;
        case 's': e.preventDefault(); saveImage(); break;
        case 'j': toggleJourney(); break;
        default:
            const num = parseInt(e.key);
            if (num >= 1 && num <= MODELS[S.model].presets.length) {
                applyPreset(MODELS[S.model].presets[num - 1]);
            }
    }
}

// ===== RESIZE =====
function handleResize() {
    clearTimeout(S.resizeTimer);
    S.resizeTimer = setTimeout(() => {
        initTextures();
    }, 200);
}

// ===== INIT =====
function init() {
    if (!initGL()) return;

    // Default params
    const model = MODELS[S.model];
    for (const p of model.params) S.params[p.key] = p.default;

    // Init textures
    initTextures();

    // Build UI
    buildParamSliders();
    buildPresets();
    buildColorSwatches();
    drawParamSpace();
    updateParamSpaceCrosshair();

    // Speed slider
    const speedSlider = document.getElementById('speed-slider');
    speedSlider.addEventListener('input', () => {
        S.speed = parseInt(speedSlider.value);
        document.getElementById('speed-val').textContent = S.speed;
    });

    // Brush size
    const brushSize = document.getElementById('brush-size');
    brushSize.addEventListener('input', () => {
        S.brush.radius = parseInt(brushSize.value);
        document.getElementById('brush-size-val').textContent = S.brush.radius;
    });

    // Brush chemical toggle
    document.getElementById('brush-a').addEventListener('click', () => {
        S.brush.chemical = 0;
        document.getElementById('brush-a').classList.add('active');
        document.getElementById('brush-b').classList.remove('active');
    });
    document.getElementById('brush-b').addEventListener('click', () => {
        S.brush.chemical = 1;
        document.getElementById('brush-b').classList.add('active');
        document.getElementById('brush-a').classList.remove('active');
    });

    // Model selector
    document.querySelectorAll('#model-selector button').forEach(btn => {
        btn.addEventListener('click', () => switchModel(btn.dataset.model));
    });

    // Action buttons
    document.getElementById('btn-play').addEventListener('click', togglePlay);
    document.getElementById('btn-reset').addEventListener('click', resetSimulation);
    document.getElementById('btn-save').addEventListener('click', saveImage);
    document.getElementById('btn-journey').addEventListener('click', toggleJourney);

    // Canvas interaction
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);

    // Parameter space click
    document.getElementById('param-space').addEventListener('click', onParamSpaceClick);

    // Keyboard
    window.addEventListener('keydown', onKeyDown);

    // Resize
    window.addEventListener('resize', handleResize);

    // Start
    S.fps.last = performance.now();
    requestAnimationFrame(animate);
}

window.addEventListener('DOMContentLoaded', init);
