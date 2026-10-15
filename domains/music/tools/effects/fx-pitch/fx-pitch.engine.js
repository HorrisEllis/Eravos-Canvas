/* eravos.fx-pitch 1.0.0 — Pitch (P11 gate F) · spec eravos.organism.fx-pitch · inherits STD.fx
 * Real-time pitch shifter in an AudioWorklet: each voice is a delay line whose delay sweeps at (1 − ratio) samples per
 * sample, read by two heads half a window apart and crossfaded sin²/cos² (they sum to exactly 1 — no level wobble).
 * ratio = 2^((semitones + cents/100)/12), glided. Up to two HARMONY voices: the input's pitch is tracked (autocorrelation,
 * every 40 ms) and each harmony sits a 3rd / 5th / octave above IN THE SONG KEY — so harmonies are never out of key.
 * Latency (half a window) is reported to the ledger. Declared deviation: no formant preservation (spec marked it optional
 * and CPU-heavy; it is not offered rather than offered half-working — §1.3). */
(function () {
  'use strict';
  const S = OrganismSDK.STD, SDK = OrganismSDK;
  const PITCH = `
class EravosPitch extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'ratio', defaultValue: 1, minValue: 0.25, maxValue: 4, automationRate: 'k-rate' }, { name: 'h1', defaultValue: 0, minValue: 0, maxValue: 4, automationRate: 'k-rate' }, { name: 'h2', defaultValue: 0, minValue: 0, maxValue: 4, automationRate: 'k-rate' },
      { name: 'hLevel', defaultValue: 0.6, minValue: 0, maxValue: 1, automationRate: 'k-rate' }, { name: 'win', defaultValue: 50, minValue: 20, maxValue: 100, automationRate: 'k-rate' }, { name: 'glide', defaultValue: 0, minValue: 0, maxValue: 1000, automationRate: 'k-rate' }, { name: 'semi', defaultValue: 0, minValue: -24, maxValue: 24, automationRate: 'k-rate' }];
  }
  constructor() { super(); this.N = 1 << 16; this.buf = [new Float32Array(this.N), new Float32Array(this.N)]; this.w = 0; this.ph = [0, 0.33, 0.66]; this.r = [1, 0, 0]; }
  read(c, d) { const N = this.N, p = this.w - d - 2; let i = Math.floor(p); const f = p - i; i = ((i % N) + N) % N; const b = this.buf[c]; return b[i] + (b[(i + 1) % N] - b[i]) * f; }
  process(inputs, outputs, P) {
    const inp = inputs[0], out = outputs[0], n = out[0].length, N = this.N;
    const win = Math.max(64, P.win[0] * 0.001 * sampleRate), g = P.glide[0] > 0 ? 1 - Math.exp(-1 / (P.glide[0] * 0.001 * sampleRate)) : 1;
    const m = Math.pow(2, P.semi[0] / 12), target = [P.ratio[0] * m, P.h1[0] * m, P.h2[0] * m], hL = P.hLevel[0];
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < 2; c++) { const x = inp[c] || inp[0]; this.buf[c][this.w] = x ? x[i] : 0; }
      let L = 0, R = 0;
      for (let v = 0; v < 3; v++) {
        const t = target[v]; if (v > 0 && t <= 0) { this.r[v] = 0; continue; }
        this.r[v] = this.r[v] <= 0 ? t : this.r[v] + (t - this.r[v]) * g;
        let ph = this.ph[v] + (1 - this.r[v]) / win; ph -= Math.floor(ph); this.ph[v] = ph;
        const ph2 = (ph + 0.5) % 1, w1 = Math.sin(Math.PI * ph) ** 2, w2 = 1 - w1, lvl = v ? hL : 1;
        L += lvl * (w1 * this.read(0, ph * win) + w2 * this.read(0, ph2 * win));
        R += lvl * (w1 * this.read(1, ph * win) + w2 * this.read(1, ph2 * win));
      }
      out[0][i] = L; if (out[1]) out[1][i] = R;
      this.w = (this.w + 1) % N;
    }
    return true;
  }
}
registerProcessor('eravos-pitch-shifter', EravosPitch);`;
  const HARM = ['off', '3rd', '5th', 'oct', '-oct'];
  OrganismFactory.define({
    id: 'eravos.fx-pitch', domain: 'music', version: '1.0.0', label: 'Pitch', icon: '♮', accent: '#ff44aa', phase: 'P11',
    category: 'Effects', blurb: 'Shift any sound up or down live — chipmunk, demon, doubles — and add harmonies that stay in key.',
    size: { w: 560, h: 480 }, minSize: { w: 420, h: 380 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.fx'],
    hooks: SDK.fxHooks([S.theory_in('pitch.hook.theory_in'), S.mod_in('pitch.hook.mod_semitones', 'semitones')]),
    config: [
      { key: 'semitones', type: 'number', default: 0, min: -24, max: 24, step: 1, unit: 'st', label: 'Semitones', group: 'PITCH' },
      { key: 'cents', type: 'number', default: 0, min: -100, max: 100, step: 1, unit: 'c', label: 'Cents', group: 'PITCH' },
      { key: 'window', type: 'number', default: 50, min: 30, max: 80, step: 1, unit: 'ms', label: 'Window', group: 'PITCH', hint: 'shorter = tighter on drums, longer = smoother on voices' },
      { key: 'glide', type: 'number', default: 0, min: 0, max: 500, step: 1, unit: 'ms', label: 'Glide', group: 'PITCH' },
      { key: 'harm1', type: 'enum', options: HARM, default: 'off', label: 'Harmony 1', group: 'HARMONY' },
      { key: 'harm2', type: 'enum', options: HARM, default: 'off', label: 'Harmony 2', group: 'HARMONY' },
      { key: 'harmLevel', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Harm level', group: 'HARMONY' },
    ].concat(SDK.STD_FX_CONFIG),
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, MT = window.MusicTheory;
      const fx = SDK.fxShell(ctx);
      let node = null, lastNote = null;
      const ratioOf = () => Math.pow(2, (P.get('semitones') + P.get('cents') / 100) / 12);
      // a harmony voice's ratio: the detected note's diatonic 3rd / 5th in the song key (octaves are exact)
      function harmRatio(kind) {
        if (kind === 'off') return 0; if (kind === 'oct') return 2; if (kind === '-oct') return 0.5;
        if (lastNote === null) return 0; const k = ctx.key, base = Math.round(lastNote);
        const dg = MT.degreeOf(base, k.root, k.scale), step = kind === '3rd' ? 2 : 4;
        const target = MT.degreeToMidi(dg.degree + step, dg.octave, k.root, k.scale);
        return Math.pow(2, (target - MT.quantize(base, k.root, k.scale)) / 12) * ratioOf();
      }
      function apply(now) {
        if (!node) return; const t = ac.currentTime, set = (k, v) => { const a = node.parameters.get(k); if (now) a.setValueAtTime(v, t); else a.setTargetAtTime(v, t, 0.005); };
        set('ratio', ratioOf()); set('win', P.get('window')); set('glide', P.get('glide')); set('hLevel', P.get('harmLevel'));
        set('h1', harmRatio(P.get('harm1'))); set('h2', harmRatio(P.get('harm2')));
        fx.setLatency(P.get('window') / 2000);
      }
      ctx.ready = ctx.loadWorklet('eravos-pitch-shifter', PITCH).then(() => {
        node = new AudioWorkletNode(ac, 'eravos-pitch-shifter', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2] }); ctx.track(node);
        fx.wetIn.connect(node); node.connect(fx.wetOut);
        const semMod = ctx.modBus('semitones', { min: -24, max: 24 }); semMod.connect(node.parameters.get('semi')); apply(true);
      }).catch(() => { fx.wetIn.connect(fx.wetOut); ctx.fault('RUNTIME_003', 'Pitch: AudioWorklet unavailable — passing the sound through unshifted'); });
      ['semitones', 'cents', 'window', 'glide', 'harm1', 'harm2', 'harmLevel'].forEach(k => P.onChange(k, () => apply(false)));
      ctx.onKey(() => apply(false));
      // pitch tracking for the harmonies (only runs while a harmony is on)
      const an = ac.createAnalyser(); an.fftSize = 2048; fx.wetIn.connect(an); ctx.track(an); const td = new Float32Array(2048);
      function f0() {
        an.getFloatTimeDomainData(td); let e = 0; for (let i = 0; i < td.length; i++) e += td[i] * td[i]; if (e / td.length < 1e-5) return null;
        const sr = ac.sampleRate, lo = Math.floor(sr / 1000), hi = Math.floor(sr / 70); let best = 0, bl = 0;
        for (let L = lo; L <= hi; L++) { let c = 0; for (let i = 0; i < td.length - L; i += 2) c += td[i] * td[i + L]; if (c > best) { best = c; bl = L; } }
        return bl ? sr / bl : null;
      }
      ctx.interval(() => { if (P.get('harm1') === 'off' && P.get('harm2') === 'off') return; const f = f0(); if (f) { const n = MT.midiOfHz(f); if (lastNote === null || Math.abs(n - lastNote) > 0.5) { lastNote = n; apply(false); } } ctx.emitUI('pitch', { inHz: f }); }, 40);
      ctx.internals = { get node() { return node; } };
      return { unmount() {} };
    },
  });
})();
