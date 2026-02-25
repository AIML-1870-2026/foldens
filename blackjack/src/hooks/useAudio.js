import { useRef, useCallback } from 'react';

export function useAudio(soundEnabled) {
  const ctxRef = useRef(null);

  function getCtx() {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }

  const playSound = useCallback((key) => {
    if (!soundEnabled) return;
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;

      if (key === 'cardDeal') {
        // White noise burst, 80ms, bandpass 800–2000Hz
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1400;
        bp.Q.value = 0.5;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        src.connect(bp); bp.connect(gain); gain.connect(ctx.destination);
        src.start(t); src.stop(t + 0.08);

      } else if (key === 'cardFlip') {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.13, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1800, t);
        bp.frequency.linearRampToValueAtTime(900, t + 0.13);
        bp.Q.value = 0.8;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
        src.connect(bp); bp.connect(gain); gain.connect(ctx.destination);
        src.start(t); src.stop(t + 0.13);

      } else if (key === 'chipPlace') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.linearRampToValueAtTime(900, t + 0.06);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.06);

      } else if (key === 'win') {
        [[261, 0], [329, 0.13], [392, 0.26]].forEach(([freq, delay]) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.35, t + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.12);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(t + delay); osc.stop(t + delay + 0.12);
        });

      } else if (key === 'blackjack') {
        [[261, 0], [329, 0.11], [392, 0.22], [523, 0.33], [659, 0.44]].forEach(([freq, delay]) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.4, t + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.1);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(t + delay); osc.stop(t + delay + 0.1);
        });

      } else if (key === 'lose') {
        [[440, 0], [349, 0.22]].forEach(([freq, delay]) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const dist = ctx.createWaveShaper();
          const curve = new Float32Array(256);
          for (let i = 0; i < 256; i++) {
            const x = (i * 2) / 256 - 1;
            curve[i] = (Math.PI + 30) * x / (Math.PI + 30 * Math.abs(x));
          }
          dist.curve = curve;
          osc.type = 'sawtooth';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.2, t + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.2);
          osc.connect(dist); dist.connect(gain); gain.connect(ctx.destination);
          osc.start(t + delay); osc.stop(t + delay + 0.2);
        });

      } else if (key === 'push') {
        [0, 0.1].forEach(delay => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 392;
          gain.gain.setValueAtTime(0.25, t + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.08);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(t + delay); osc.stop(t + delay + 0.08);
        });

      } else if (key === 'bust') {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(3000, t);
        lp.frequency.exponentialRampToValueAtTime(200, t + 0.3);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        src.connect(lp); lp.connect(gain); gain.connect(ctx.destination);
        src.start(t); src.stop(t + 0.3);
      }
    } catch (e) {
      // Audio context may be blocked; silently ignore
    }
  }, [soundEnabled]);

  return { playSound };
}
