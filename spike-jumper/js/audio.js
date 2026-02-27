// ─── Audio Engine — Procedural Organic Soundtrack ─────────────────────────────
// A-minor pentatonic. Tempo scales with game speed (100→124 BPM).
// 8-bar chord cycle: Am → G → Am → C with rotating melody phrases.
// Instruments: kick, snare, hi-hat, shaker, tom, bass, cello, pluck, woodwind, bell, pad

const LOOK_AHEAD    = 0.14;   // schedule this many seconds ahead
const SCHEDULE_TICK = 25;     // ms between scheduler calls

const NOTE = {
    A1: 55.00, E2: 82.41, G2: 98.00,
    A2: 110.00, C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00,
    A3: 220.00, C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00,
    A4: 440.00
};

// ─── 8-bar chord cycle: Am(0-1) → G(2-3) → Am var(4-5) → C(6-7) ─────────────

const ARPS = [
    // Am (bar 0) — original ascending pattern
    [NOTE.A3, NOTE.C4, NOTE.E4, NOTE.G4, NOTE.E4, NOTE.D4, NOTE.C4, NOTE.A3],
    // Am upper (bar 1) — reach up to A4
    [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.A4, NOTE.G4, NOTE.E4, NOTE.D4, NOTE.C4],
    // G (bar 2) — G/D riff
    [NOTE.G3, NOTE.D4, NOTE.G4, NOTE.D4, NOTE.G4, NOTE.D4, NOTE.G3, NOTE.D4],
    // G resolving (bar 3) — step down to G3
    [NOTE.D4, NOTE.G3, NOTE.D4, NOTE.G4, NOTE.E4, NOTE.D4, NOTE.C4, NOTE.G3],
    // Am variation (bar 4) — hits A4
    [NOTE.A3, NOTE.E4, NOTE.A4, NOTE.G4, NOTE.E4, NOTE.C4, NOTE.D4, NOTE.A3],
    // Am upper variation (bar 5)
    [NOTE.A3, NOTE.D4, NOTE.E4, NOTE.G4, NOTE.A4, NOTE.G4, NOTE.E4, NOTE.D4],
    // C feel (bar 6)
    [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.E4, NOTE.C4, NOTE.G3, NOTE.E3, NOTE.C3],
    // C → Am resolution (bar 7)
    [NOTE.E3, NOTE.A3, NOTE.C4, NOTE.E4, NOTE.G4, NOTE.E4, NOTE.C4, NOTE.A3],
];

// Bass root and fifth for each bar in the 8-bar cycle
const BASS_R = [NOTE.A2, NOTE.A2, NOTE.G2, NOTE.G2, NOTE.A2, NOTE.A2, NOTE.C3, NOTE.C3];
const BASS_5 = [NOTE.E2, NOTE.E2, NOTE.D3, NOTE.D3, NOTE.E2, NOTE.E2, NOTE.G3, NOTE.G3];

// Counter-melody note played on beat 1 (intensity 2+), one per bar
const COUNTER = [NOTE.E4, NOTE.C4, NOTE.D4, NOTE.G4, NOTE.E4, NOTE.A4, NOTE.G4, NOTE.E4];

class AudioEngine {
    constructor() {
        this.ctx             = null;
        this.masterGain      = null;
        this.musicBus        = null;
        this.sfxBus          = null;
        this.ready           = false;
        this.running         = false;
        this.musicStart      = 0;
        this.nextBeat        = 0;
        this.beatIdx         = 0;
        this._timer          = null;
        this.bpm             = 100;
        this.beatSec         = 60 / 100;
        this.intensity       = 0;          // 0=tier1, 1=tier2, 2=tier3
        this._scheduledBeats = [];         // [{startTime, dur}] for phase lookup
    }

    // ── Init / start / stop ──────────────────────────────────────────────────

    _init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        this.masterGain = this._gain(0.80);
        this.masterGain.connect(this.ctx.destination);

        this.musicBus = this._gain(0.58);
        this.musicBus.connect(this.masterGain);

        this.sfxBus = this._gain(1.0);
        this.sfxBus.connect(this.masterGain);

        this.ready = true;
    }

    start() {
        if (!this.ready) this._init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        if (this.running) return;

        this.running         = true;
        this.musicStart      = this.ctx.currentTime + 0.05;
        this.nextBeat        = this.musicStart;
        this.beatIdx         = 0;
        this._scheduledBeats = [];

        this._pad([NOTE.A2, NOTE.E3, NOTE.A3, NOTE.C4], this.musicStart, this.beatSec * 4 * 120);
        this._timer = setInterval(() => this._scheduler(), SCHEDULE_TICK);
    }

    stop() {
        this.running = false;
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
        if (this.masterGain && this.ctx) {
            const now = this.ctx.currentTime;
            this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
            this.masterGain.gain.linearRampToValueAtTime(0, now + 0.9);
        }
    }

    restart() {
        if (!this.ready) this._init();
        if (this.ctx.state === 'suspended') this.ctx.resume();

        this.running         = true;
        this.bpm             = 100;
        this.beatSec         = 60 / 100;
        this.intensity       = 0;
        this._scheduledBeats = [];

        if (this.masterGain) {
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
            this.masterGain.gain.setValueAtTime(0.80, this.ctx.currentTime);
        }
        this.musicStart = this.ctx.currentTime + 0.05;
        this.nextBeat   = this.musicStart;
        this.beatIdx    = 0;

        this._pad([NOTE.A2, NOTE.E3, NOTE.A3, NOTE.C4], this.musicStart, this.beatSec * 4 * 120);
        if (!this._timer) this._timer = setInterval(() => this._scheduler(), SCHEDULE_TICK);
    }

    setBPM(bpm) {
        this.bpm     = bpm;
        this.beatSec = 60 / bpm;
    }

    setIntensity(level) {
        this.intensity = level;
    }

    // ── Scheduler ─────────────────────────────────────────────────────────────

    _scheduler() {
        if (!this.running) return;
        while (this.nextBeat < this.ctx.currentTime + LOOK_AHEAD) {
            this._beatAt(this.nextBeat, this.beatIdx);
            this.nextBeat += this.beatSec;
            this.beatIdx++;
        }
    }

    _beatAt(t, idx) {
        const bs     = this.beatSec;
        const b      = idx % 4;                  // beat 0-3 within bar
        const barIdx = Math.floor(idx / 4) % 8;  // 8-bar chord cycle

        // Record for phase lookup (keep last 16 beats)
        this._scheduledBeats.push({ startTime: t, dur: bs });
        if (this._scheduledBeats.length > 16) this._scheduledBeats.shift();

        // ── Percussion ──────────────────────────────────────────────────────
        if (b === 0 || b === 2) this._kick(t);
        if (b === 1 || b === 3) this._snare(t);
        this._hihat(t, b % 2 === 0 ? 0.55 : 1.0);
        this._hihat(t + bs * 0.5, 0.35);          // 8th-note off-beat

        // Shaker on "and" of beats 1 and 3 — tambourine feel
        if (b === 0 || b === 2) this._shaker(t + bs * 0.5, 0.8);

        // 16th-note hi-hats at intensity 1+ (denser groove)
        if (this.intensity >= 1) {
            this._hihat(t + bs * 0.25, 0.18);
            this._hihat(t + bs * 0.75, 0.18);
        }

        // Extra kick accent on "and" of beat 3 at intensity 2 (driving push)
        if (this.intensity >= 2 && b === 2) {
            this._kick(t + bs * 0.5);
        }

        // Tom fill at end of G and C sections (barIdx 3 and 7, last 8th note)
        if ((barIdx === 3 || barIdx === 7) && b === 3) {
            this._tom(t + bs * 0.5, 0.48);
        }

        // ── Bass + Cello sustain (chord-aware) ──────────────────────────────
        if (b === 0) {
            this._bass(BASS_R[barIdx], t, bs * 1.85);
            // Cello: one octave above bass root, sustains 2 beats (root chord tone)
            this._cello(BASS_R[barIdx] * 2, t, bs * 2.1, 0.09);
        }
        if (b === 2) {
            this._bass(BASS_5[barIdx], t, bs * 1.85);
            // Cello: one octave above fifth, answers the root
            this._cello(BASS_5[barIdx] * 2, t, bs * 2.1, 0.07);
        }

        // ── Plucked lute — marks bar root, overlaps cello for attack transient
        if (b === 0) this._pluck(BASS_R[barIdx] * 2, t, 0.22);

        // ── Bell — marks 8-bar cycle; more frequent at intensity 2
        if (idx % 8 === 0) this._bell(NOTE.A4, t, 0.08);
        if (this.intensity >= 2 && idx % 4 === 0 && idx % 8 !== 0) {
            this._bell(NOTE.E4, t, 0.055);
        }

        // ── Woodwind arpeggio (8th notes) ───────────────────────────────────
        const ARP = ARPS[barIdx];
        this._woodwind(ARP[b * 2],     t,           bs * 0.44);
        this._woodwind(ARP[b * 2 + 1], t + bs * 0.5, bs * 0.44);

        // Counter-melody answer on beat 1, intensity 2+
        if (this.intensity >= 2 && b === 1) {
            this._woodwind(COUNTER[barIdx], t + bs * 0.33, bs * 0.60);
        }

        // ── Melody phrase every 2 bars (8 beats) ────────────────────────────
        if (idx % 8 === 0) {
            const cycle      = Math.floor(idx / 8);
            const numPhrases = this.intensity >= 2 ? 4 : 3;
            this._melodyPhrase(t, cycle % numPhrases);
        }
    }

    // ── Instruments ───────────────────────────────────────────────────────────

    _kick(t) {
        const osc = this.ctx.createOscillator();
        const g   = this._gain(0);
        osc.frequency.setValueAtTime(165, t);
        osc.frequency.exponentialRampToValueAtTime(38, t + 0.09);
        g.gain.setValueAtTime(1.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(g); g.connect(this.musicBus);
        osc.start(t); osc.stop(t + 0.16);
    }

    _snare(t) {
        // Noise layer
        const src = this._noiseSrc(0.13);
        const f   = this.ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = 0.7;
        const g = this._gain(0);
        g.gain.setValueAtTime(0.5, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        src.connect(f); f.connect(g); g.connect(this.musicBus);
        src.start(t); src.stop(t + 0.15);

        // Tone layer
        const osc = this.ctx.createOscillator();
        const og  = this._gain(0);
        osc.frequency.setValueAtTime(240, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);
        og.gain.setValueAtTime(0.22, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        osc.connect(og); og.connect(this.musicBus);
        osc.start(t); osc.stop(t + 0.08);
    }

    _hihat(t, vol = 1) {
        const src = this._noiseSrc(0.04);
        const f   = this.ctx.createBiquadFilter();
        f.type = 'highpass'; f.frequency.value = 9000;
        const g = this._gain(0);
        g.gain.setValueAtTime(0.13 * vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        src.connect(f); f.connect(g); g.connect(this.musicBus);
        src.start(t); src.stop(t + 0.05);
    }

    // Tambourine-like shaker: bandpass noise around 5kHz
    _shaker(t, vol = 1) {
        const src = this._noiseSrc(0.06);
        const f   = this.ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 5200; f.Q.value = 0.9;
        const g = this._gain(0);
        g.gain.setValueAtTime(0.08 * vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
        src.connect(f); f.connect(g); g.connect(this.musicBus);
        src.start(t); src.stop(t + 0.07);
    }

    // Floor tom: pitch-swept sine, medium punch
    _tom(t, vol = 0.5) {
        const osc = this.ctx.createOscillator();
        const g   = this._gain(0);
        osc.frequency.setValueAtTime(115, t);
        osc.frequency.exponentialRampToValueAtTime(58, t + 0.14);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
        osc.connect(g); g.connect(this.musicBus);
        osc.start(t); osc.stop(t + 0.22);
    }

    _bass(freq, t, dur) {
        const osc = this.ctx.createOscillator();
        const f   = this.ctx.createBiquadFilter();
        const g   = this._gain(0);
        osc.type = 'sawtooth'; osc.frequency.value = freq;
        f.type = 'lowpass'; f.frequency.value = 380; f.Q.value = 1.3;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.58, t + 0.02);
        g.gain.setValueAtTime(0.58, t + dur - 0.04);
        g.gain.linearRampToValueAtTime(0, t + dur);
        osc.connect(f); f.connect(g); g.connect(this.musicBus);
        osc.start(t); osc.stop(t + dur);
    }

    // Bowed-string cello: sawtooth with slow attack, gentle lowpass
    _cello(freq, t, dur, vol = 0.10) {
        const osc = this.ctx.createOscillator();
        const f   = this.ctx.createBiquadFilter();
        const g   = this._gain(0);
        osc.type = 'sawtooth'; osc.frequency.value = freq;
        f.type = 'lowpass'; f.frequency.value = freq * 2.8; f.Q.value = 0.35;
        const attack = Math.min(0.18, dur * 0.22);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + attack);
        g.gain.setValueAtTime(vol, t + dur - 0.09);
        g.gain.linearRampToValueAtTime(0, t + dur);
        osc.connect(f); f.connect(g); g.connect(this.musicBus);
        osc.start(t); osc.stop(t + dur + 0.05);
    }

    // Plucked lute/harp: triangle wave with fast decay transient
    _pluck(freq, t, vol = 0.22) {
        const osc = this.ctx.createOscillator();
        const f   = this.ctx.createBiquadFilter();
        const g   = this._gain(0);
        osc.type = 'triangle'; osc.frequency.value = freq;
        f.type = 'bandpass'; f.frequency.value = freq * 1.8; f.Q.value = 1.4;
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        osc.connect(f); f.connect(g); g.connect(this.musicBus);
        osc.start(t); osc.stop(t + 0.42);
    }

    // Bell accent: detuned sine pair with long decay
    _bell(freq, t, vol = 0.08) {
        for (const det of [0, 1.8]) {
            const osc = this.ctx.createOscillator();
            const g   = this._gain(0);
            osc.type = 'sine'; osc.frequency.value = freq + det;
            g.gain.setValueAtTime(vol, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
            osc.connect(g); g.connect(this.musicBus);
            osc.start(t); osc.stop(t + 1.0);
        }
    }

    _woodwind(freq, t, dur) {
        if (!freq) return;
        const osc  = this.ctx.createOscillator();
        const lfo  = this.ctx.createOscillator();
        const lfog = this._gain(freq * 0.012);
        const f    = this.ctx.createBiquadFilter();
        const g    = this._gain(0);

        osc.type = 'sine'; osc.frequency.value = freq;
        lfo.frequency.value = 5.5;
        lfo.connect(lfog); lfog.connect(osc.frequency);

        f.type = 'bandpass'; f.frequency.value = freq * 1.25; f.Q.value = 2.2;

        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.22, t + 0.045);
        g.gain.setValueAtTime(0.22, t + dur - 0.05);
        g.gain.linearRampToValueAtTime(0, t + dur);

        osc.connect(f); f.connect(g); g.connect(this.musicBus);
        osc.start(t); lfo.start(t);
        osc.stop(t + dur); lfo.stop(t + dur);
    }

    _pad(freqs, t, dur) {
        for (const freq of freqs) {
            for (const det of [-7, 7]) {
                const osc = this.ctx.createOscillator();
                const f   = this.ctx.createBiquadFilter();
                const g   = this._gain(0);
                osc.type = 'sawtooth'; osc.frequency.value = freq; osc.detune.value = det;
                f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 0.25;
                const vol = 0.052 / freqs.length;
                g.gain.setValueAtTime(0, t);
                g.gain.linearRampToValueAtTime(vol, t + 0.5);
                g.gain.setValueAtTime(vol, t + dur - 1.5);
                g.gain.linearRampToValueAtTime(0, t + dur);
                osc.connect(f); f.connect(g); g.connect(this.musicBus);
                osc.start(t); osc.stop(t + dur);
            }
        }
    }

    _melodyPhrase(t, phraseIdx = 0) {
        const bs = this.beatSec;
        const PHRASES = [
            // 0: Original — descending, resolves upward (8 beats)
            [
                { f: NOTE.E4, d: 1.5 }, { f: NOTE.D4, d: 0.5 },
                { f: NOTE.C4, d: 1.0 }, { f: NOTE.A3, d: 1.0 },
                { f: NOTE.G3, d: 1.5 }, { f: NOTE.A3, d: 0.5 },
                { f: NOTE.C4, d: 1.0 }, { f: NOTE.E4, d: 1.0 },
            ],
            // 1: Ascending — hopeful climb to A4 (8 beats)
            [
                { f: NOTE.A3, d: 1.0 }, { f: NOTE.C4, d: 1.0 },
                { f: NOTE.E4, d: 1.0 }, { f: NOTE.G4, d: 1.0 },
                { f: NOTE.A4, d: 1.0 }, { f: NOTE.G4, d: 1.0 },
                { f: NOTE.E4, d: 1.0 }, { f: NOTE.D4, d: 1.0 },
            ],
            // 2: Rhythmic — short-short-long feel (8 beats)
            [
                { f: NOTE.A3, d: 0.5 }, { f: NOTE.C4, d: 0.5 }, { f: NOTE.E4, d: 1.0 },
                { f: NOTE.D4, d: 0.5 }, { f: NOTE.C4, d: 0.5 }, { f: NOTE.A3, d: 1.5 },
                { f: NOTE.G3, d: 0.5 }, { f: NOTE.A3, d: 0.5 }, { f: NOTE.C4, d: 2.5 },
            ],
            // 3: High energy — intensity 2+, prominent A4 (8 beats)
            [
                { f: NOTE.A4, d: 0.5 }, { f: NOTE.G4, d: 0.5 }, { f: NOTE.E4, d: 1.0 },
                { f: NOTE.D4, d: 0.5 }, { f: NOTE.E4, d: 0.5 }, { f: NOTE.G4, d: 1.0 },
                { f: NOTE.A4, d: 1.5 }, { f: NOTE.G4, d: 0.5 }, { f: NOTE.E4, d: 2.0 },
            ],
        ];
        const ph = PHRASES[phraseIdx] || PHRASES[0];
        let cur = t;
        for (const n of ph) {
            this._woodwind(n.f, cur, n.d * bs * 0.88);
            cur += n.d * bs;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    _gain(value) {
        const g = this.ctx.createGain();
        g.gain.value = value;
        return g;
    }

    _noiseSrc(seconds) {
        const size = Math.ceil(this.ctx.sampleRate * seconds);
        const buf  = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
        const src  = this.ctx.createBufferSource();
        src.buffer = buf;
        return src;
    }

    // ── Beat phase (uses scheduled beat log for accuracy at any BPM) ──────────

    getBeatPhase() {
        if (!this.ready || !this._scheduledBeats.length) return 0;
        const now = this.ctx.currentTime;
        // Walk backwards to find the most recent beat that has started
        for (let i = this._scheduledBeats.length - 1; i >= 0; i--) {
            const b = this._scheduledBeats[i];
            if (now >= b.startTime) {
                return Math.min(1, (now - b.startTime) / b.dur);
            }
        }
        return 0;
    }

    // Distance to nearest beat in ms (0 = on-beat)
    getDistToNearestBeat() {
        if (!this.ready || !this._scheduledBeats.length) return 999;
        const now = this.ctx.currentTime;
        for (let i = this._scheduledBeats.length - 1; i >= 0; i--) {
            const b = this._scheduledBeats[i];
            if (now >= b.startTime) {
                const p = Math.min(1, (now - b.startTime) / b.dur);
                return Math.min(p, 1 - p) * b.dur * 1000;
            }
        }
        return 999;
    }

    // ── SFX ───────────────────────────────────────────────────────────────────

    playJump() {
        if (!this.ready) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g   = this._gain(0);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.exponentialRampToValueAtTime(580, t + 0.07);
        g.gain.setValueAtTime(0.28, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
        osc.connect(g); g.connect(this.sfxBus);
        osc.start(t); osc.stop(t + 0.14);
    }

    playPerfect() {
        if (!this.ready) return;
        const t = this.ctx.currentTime;
        [880, 1100, 1320].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const g   = this._gain(0);
            const s   = t + i * 0.05;
            osc.type = 'sine'; osc.frequency.value = f;
            g.gain.setValueAtTime(0.17, s);
            g.gain.exponentialRampToValueAtTime(0.001, s + 0.22);
            osc.connect(g); g.connect(this.sfxBus);
            osc.start(s); osc.stop(s + 0.24);
        });
    }

    playMiss() {
        if (!this.ready) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g   = this._gain(0);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);
        g.gain.setValueAtTime(0.22, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
        osc.connect(g); g.connect(this.sfxBus);
        osc.start(t); osc.stop(t + 0.17);
    }

    playLand() {
        if (!this.ready) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g   = this._gain(0);
        osc.frequency.setValueAtTime(130, t);
        osc.frequency.exponentialRampToValueAtTime(55, t + 0.055);
        g.gain.setValueAtTime(0.38, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        osc.connect(g); g.connect(this.sfxBus);
        osc.start(t); osc.stop(t + 0.08);
    }

    playGameOver() {
        if (!this.ready) return;
        const t = this.ctx.currentTime;
        [440, 330, 220, 110].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const g   = this._gain(0);
            const s   = t + i * 0.09;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, s);
            osc.frequency.exponentialRampToValueAtTime(f * 0.45, s + 0.28);
            g.gain.setValueAtTime(0.3, s);
            g.gain.exponentialRampToValueAtTime(0.001, s + 0.36);
            osc.connect(g); g.connect(this.sfxBus);
            osc.start(s); osc.stop(s + 0.40);
        });
    }
}

const audio = new AudioEngine();
