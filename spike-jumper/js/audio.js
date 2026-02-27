// ─── Audio Engine — Procedural Organic Soundtrack ─────────────────────────────
// 100 BPM, A-minor, strings pad + woodwind arpeggio + percussion

const BEAT_SEC = 60 / 100;       // 0.6 s per beat
const BAR_SEC  = BEAT_SEC * 4;   // 2.4 s per measure
const LOOK_AHEAD      = 0.14;    // schedule this far ahead
const SCHEDULE_TICK   = 25;      // ms between scheduler calls

const NOTE = {
    A1: 55.00, E2: 82.41,
    A2: 110.00, C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00,
    A3: 220.00, C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00,
    A4: 440.00
};

class AudioEngine {
    constructor() {
        this.ctx        = null;
        this.masterGain = null;
        this.musicBus   = null;
        this.sfxBus     = null;
        this.ready      = false;
        this.running    = false;
        this.musicStart = 0;
        this.nextBeat   = 0;
        this.beatIdx    = 0;
        this._timer     = null;
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

        this.running    = true;
        this.musicStart = this.ctx.currentTime + 0.05;
        this.nextBeat   = this.musicStart;
        this.beatIdx    = 0;

        // Long sustain pad underneath everything
        this._pad([NOTE.A2, NOTE.E3, NOTE.A3, NOTE.C4], this.musicStart, BAR_SEC * 120);

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
        // Reset timing without re-creating context
        if (!this.ready) { this._init(); }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        this.running    = true;
        if (this.masterGain) {
            this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
            this.masterGain.gain.setValueAtTime(0.80, this.ctx.currentTime);
        }
        this.musicStart = this.ctx.currentTime + 0.05;
        this.nextBeat   = this.musicStart;
        this.beatIdx    = 0;
        this._pad([NOTE.A2, NOTE.E3, NOTE.A3, NOTE.C4], this.musicStart, BAR_SEC * 120);
        if (!this._timer) this._timer = setInterval(() => this._scheduler(), SCHEDULE_TICK);
    }

    // ── Scheduler ─────────────────────────────────────────────────────────────

    _scheduler() {
        if (!this.running) return;
        while (this.nextBeat < this.ctx.currentTime + LOOK_AHEAD) {
            this._beatAt(this.nextBeat, this.beatIdx);
            this.nextBeat += BEAT_SEC;
            this.beatIdx++;
        }
    }

    _beatAt(t, idx) {
        const b = idx % 4;   // beat 0-3 within bar

        // Percussion
        if (b === 0 || b === 2) this._kick(t);
        if (b === 1 || b === 3) this._snare(t);
        this._hihat(t, b % 2 === 0 ? 0.55 : 1.0);

        // Off-beat hi-hat (8th note feel)
        this._hihat(t + BEAT_SEC * 0.5, 0.35);

        // Bass
        if (b === 0) this._bass(NOTE.A2, t, BEAT_SEC * 1.85);
        if (b === 2) this._bass(NOTE.E2, t, BEAT_SEC * 1.85);

        // Woodwind arpeggio (8th notes)
        const ARP = [NOTE.A3, NOTE.C4, NOTE.E4, NOTE.G4, NOTE.E4, NOTE.D4, NOTE.C4, NOTE.A3];
        this._woodwind(ARP[b * 2],     t,                   BEAT_SEC * 0.44);
        this._woodwind(ARP[b * 2 + 1], t + BEAT_SEC * 0.5, BEAT_SEC * 0.44);

        // Melody phrase every 2 bars (8 beats)
        if (idx % 8 === 0) this._melodyPhrase(t);
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

    _woodwind(freq, t, dur) {
        if (!freq) return;
        const osc  = this.ctx.createOscillator();
        const lfo  = this.ctx.createOscillator();
        const lfog = this._gain(freq * 0.012);  // vibrato
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

    _melodyPhrase(t) {
        // 2-bar pentatonic phrase (8 beats)
        const ph = [
            { f: NOTE.E4, d: 1.5 }, { f: NOTE.D4, d: 0.5 },
            { f: NOTE.C4, d: 1.0 }, { f: NOTE.A3, d: 1.0 },
            { f: NOTE.G3, d: 1.5 }, { f: NOTE.A3, d: 0.5 },
            { f: NOTE.C4, d: 1.0 }, { f: NOTE.E4, d: 1.0 },
        ];
        let cur = t;
        for (const n of ph) {
            this._woodwind(n.f, cur, n.d * BEAT_SEC * 0.88);
            cur += n.d * BEAT_SEC;
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

    // ── Beat phase (0..1 within current beat) ─────────────────────────────────

    getBeatPhase() {
        if (!this.ready || !this.musicStart) return 0;
        const e = this.ctx.currentTime - this.musicStart;
        return e < 0 ? 0 : (e / BEAT_SEC) % 1;
    }

    // Distance to nearest beat in ms (0 = on beat, up to 300ms = halfway)
    getDistToNearestBeat() {
        const p = this.getBeatPhase();
        return Math.min(p, 1 - p) * BEAT_SEC * 1000;
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
