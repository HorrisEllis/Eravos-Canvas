/* eravos.component.ensemble-core 1.0.0 — chorus, ensemble, string machine: several modulated taps on one line (retro-dco,
 * supersaw-cathedral, hoover-engine, air-horn, ensemble-organism stand on it). NEW sound code (2026-11-06), proved on its own.
 *   taps    1 … 8 reads of one delay line; tap k's LFOs are offset by k/taps of a cycle (2 taps = inverted, the Juno way; 3 = 120°,
 *           the string machine way); taps alternate left / right, `spread` sets how far apart (0 = all centred, mono)
 *   delay   base ms + depth ms × LFO 1 (rate Hz) + depth2 ms × LFO 2 (rate2 Hz) — LFO 2 is the fast shimmer of an ensemble / I+II
 *   shape   0 sine · 1 triangle (a triangle moves the delay at a steady speed, so the pitch sits a fixed amount sharp, then flat)
 *   mix     0 dry … 1 wet (wet = the taps of a side ÷ √(its taps))
 * The settings of known machines are DATA (ENSEMBLE_MODES), not code: Juno-style I / II / I+II, a string machine, a Dimension-style
 * doubler. (Rates and depths as commonly measured from those circuits; they are starting points, every number stays yours.)
 * Character: put a bbd-line in front of it (or after) for the bucket-brigade sound; this core is the clean modulated taps.
 * Real-time safe: the buffer is made once (setRate); process() allocates nothing; denormals flushed. Mono in (or the mean of two), stereo out.
 *   MusicParts.Ensemble() · ENSEMBLE_WORKLET (the SAME kernel text) · ensemble(ac, opts?) → Promise<AudioWorkletNode 'eravos-ensemble'>
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  function Ensemble() {
    const MAXT = 8, TINY = 1e-20;
    let sr = 48000, size = 0, buf = null, w = 0, ph1 = 0, ph2 = 0;
    const tapD = new Float64Array(MAXT);
    function read(pos) {
      let i = Math.floor(pos); const f = pos - i; i = ((i % size) + size) % size;
      const xm = buf[i === 0 ? size - 1 : i - 1], x0 = buf[i], x1 = buf[i + 1 >= size ? i + 1 - size : i + 1], x2 = buf[i + 2 >= size ? i + 2 - size : i + 2];
      const c1 = 0.5 * (x1 - xm), c2 = xm - 2.5 * x0 + 2 * x1 - 0.5 * x2, c3 = 0.5 * (x2 - xm) + 1.5 * (x0 - x1);
      return ((c3 * f + c2) * f + c1) * f + x0;
    }
    function wave(shape, p) { p -= Math.floor(p); return shape === 1 ? (p < 0.5 ? 4 * p - 1 : 3 - 4 * p) : Math.sin(2 * Math.PI * p); }
    const v = (A, j) => A.length > 1 ? A[j] : A[0];
    const api = {
      setRate(rate) { sr = rate; size = Math.ceil(0.08 * rate) + 8; buf = new Float32Array(size); w = 0; ph1 = ph2 = 0; },
      reset() { if (buf) buf.fill(0); ph1 = ph2 = 0; },
      tapDelays: tapD,   // each tap's delay in ms, as of the last sample processed (for meters and tests)
      process(ins, outs, n, P) {
        if (!buf) api.setRate(sr);
        const taps = Math.max(1, Math.min(MAXT, Math.round(P.taps[0]))), shape = Math.round(P.shape[0]) === 1 ? 1 : 0;
        const L = outs[0], R = outs[1] || null, i0 = ins[0], i1 = ins[1];
        const gs = 1 / Math.sqrt(Math.ceil(taps / 2));
        for (let j = 0; j < n; j++) {
          const base = v(P.base, j), d1 = v(P.depth, j), d2 = v(P.depth2, j), sp = Math.max(0, Math.min(1, v(P.spread, j))), mix = Math.max(0, Math.min(1, v(P.mix, j)));
          const x = i0 ? (i1 ? 0.5 * (i0[j] + i1[j]) : i0[j]) : 0;
          buf[w] = x;
          let wl = 0, wr = 0;
          for (let k = 0; k < taps; k++) {
            const off = k / taps, ms = Math.min(78, Math.max(0.05, base + d1 * wave(shape, ph1 + off) + d2 * wave(shape, ph2 + off)));
            tapD[k] = ms; const y = read(w - ms * sr / 1000);
            if (taps === 1) { wl += y; wr += y; }
            else { const left = k % 2 === 0, a = (1 + sp) / 2, b = (1 - sp) / 2;   // a left tap: a to L, b to R (spread 0: half to each, mono)
              if (left) { wl += a * y; wr += b * y; } else { wl += b * y; wr += a * y; } }
          }
          if (taps > 2) { wl *= gs; wr *= gs; }   // each side ÷ √(its taps): 2 taps (one a side) need nothing
          ph1 += v(P.rate, j) / sr; if (ph1 >= 1) ph1 -= 1; ph2 += v(P.rate2, j) / sr; if (ph2 >= 1) ph2 -= 1;
          let ol = x * (1 - mix) + wl * mix, or = x * (1 - mix) + wr * mix;
          if (ol < TINY && ol > -TINY) ol = 0; if (or < TINY && or > -TINY) or = 0;
          L[j] = ol; if (R) R[j] = or;
          w++; if (w >= size) w = 0;
        }
      },
    };
    return api;
  }
  const PARAMS = [
    { name: 'taps', defaultValue: 2, minValue: 1, maxValue: 8, automationRate: 'k-rate' },
    { name: 'base', defaultValue: 3.5, minValue: 0.5, maxValue: 40, automationRate: 'a-rate' },
    { name: 'depth', defaultValue: 1.85, minValue: 0, maxValue: 20, automationRate: 'a-rate' },
    { name: 'rate', defaultValue: 0.513, minValue: 0.01, maxValue: 20, automationRate: 'a-rate' },
    { name: 'depth2', defaultValue: 0, minValue: 0, maxValue: 10, automationRate: 'a-rate' },
    { name: 'rate2', defaultValue: 6, minValue: 0.01, maxValue: 20, automationRate: 'a-rate' },
    { name: 'shape', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    { name: 'spread', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
    { name: 'mix', defaultValue: 0.5, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
  ];
  // the machines, as data — starting points (every number is a param the tool exposes)
  const MODES = {
    'juno I':        { taps: 2, base: 3.5, depth: 1.85, rate: 0.513, depth2: 0, shape: 1, spread: 1 },
    'juno II':       { taps: 2, base: 3.5, depth: 1.85, rate: 0.863, depth2: 0, shape: 1, spread: 1 },
    'juno I+II':     { taps: 2, base: 3.2, depth: 0.25, rate: 9.75, depth2: 0, shape: 0, spread: 1 },
    'string machine':{ taps: 3, base: 6.0, depth: 1.5, rate: 0.6, depth2: 0.25, rate2: 6, shape: 0, spread: 0.8 },
    'dimension':     { taps: 4, base: 8.0, depth: 0.6, rate: 0.25, depth2: 0, shape: 1, spread: 0.6 },
  };
  const ENSEMBLE_WORKLET = `const Ensemble = ${Ensemble.toString()};
class EravosEnsemble extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(PARAMS)}; }
  constructor() { super(); this.k = Ensemble(); this.k.setRate(sampleRate); }
  process(inputs, outputs, p) { const out = outputs[0]; if (!out || !out.length) return true; this.k.process(inputs[0] || [], out, out[0].length, p); return true; }
}
registerProcessor('eravos-ensemble', EravosEnsemble);`;
  function ensemble(ac, o) {
    o = o || {};
    const SDK = root.OrganismSDK, load = SDK && SDK.loadWorklet ? SDK.loadWorklet(ac, 'eravos-ensemble', ENSEMBLE_WORKLET)
      : ac.audioWorklet.addModule(URL.createObjectURL(new Blob([ENSEMBLE_WORKLET], { type: 'text/javascript' })));
    return Promise.resolve(load).then(() => new AudioWorkletNode(ac, 'eravos-ensemble', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [2], parameterData: Object.assign({}, o.mode && MODES[o.mode] || {}, o.params || {}) }));
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { Ensemble, ENSEMBLE_WORKLET, ENSEMBLE_PARAMS: PARAMS, ENSEMBLE_MODES: MODES, ensemble });
  if (typeof module !== 'undefined' && module.exports) module.exports = { Ensemble, ENSEMBLE_WORKLET, ENSEMBLE_PARAMS: PARAMS, ENSEMBLE_MODES: MODES, ensemble };
})(typeof window !== 'undefined' ? window : globalThis);
