/* eravos.component.random-source 1.0.0 — seeded randomness (7 planned tools stand on it: tape memory, analog drift, parameter weather …).
 * NEW code (2026-11-06, for Tape Memory — his "yes"), proved on its own (random-source.test.mjs).
 *   ch0  a random value: a new one every 1/rate s; smooth 0 = steps (sample-and-hold), 1 = a cosine glide to the next; dist: 0 uniform ·
 *        1 gaussian (σ = 1/3 of the range, clipped) · 2 beta(a, b) · 3 histogram (setHistogram(weights)); out = offset + depth · v
 *        (v in −1…1, or 0…1 when unipolar)
 *   ch1  an event gate: events arrive at `density` a second on average (Poisson), each `eventLen` s long — crackle, dropouts, glitches
 *   seed the same seed gives the same values, sample for sample (reset() starts it again)
 * Real-time safe: process() allocates nothing.
 *   MusicParts.rng(seed) → () => 0…1 (mulberry32, for plain JS) · MusicParts.Random() the kernel · MusicParts.RANDOM_WORKLET (the SAME
 *   kernel text) · MusicParts.randomSource(ac, opts?) → Promise<AudioWorkletNode 'eravos-random'> (params: RANDOM_PARAMS)
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  function rng(seed) { let a = (seed >>> 0) || 1; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function Random() {
    let sr = 48000, R = rng(1), seed = 1, ph = 1, prev = 0, next = 0, held = 0, gate = 0, cnt = 0, gaussSpare = null;
    const hist = new Float64Array(32); let histN = 0, histTotal = 0;
    // a value in −1…1 (bipolar) drawn from the chosen distribution
    function gauss() { if (gaussSpare !== null) { const g = gaussSpare; gaussSpare = null; return g; } let u = 0, v = 0, s = 0; do { u = R() * 2 - 1; v = R() * 2 - 1; s = u * u + v * v; } while (s >= 1 || s === 0); const m = Math.sqrt(-2 * Math.log(s) / s); gaussSpare = v * m; return u * m; }
    function gamma(k) { if (k < 1) { const u = R(); return gamma(1 + k) * Math.pow(u || 1e-12, 1 / k); } const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = gauss(); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = R(); if (u < 1 - 0.0331 * x * x * x * x || Math.log(u || 1e-12) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } }
    function draw(dist, a, b) {
      if (dist === 1) { const g = gauss() / 3; return g > 1 ? 1 : g < -1 ? -1 : g; }
      if (dist === 2) { const x = gamma(a), y = gamma(b); return (x / (x + y)) * 2 - 1; }
      if (dist === 3 && histN > 0 && histTotal > 0) { let u = R() * histTotal, i = 0; for (; i < histN - 1; i++) { u -= hist[i]; if (u < 0) break; } return ((i + R()) / histN) * 2 - 1; }
      return R() * 2 - 1;
    }
    const v = (A, j) => A.length > 1 ? A[j] : A[0];
    const api = {
      setRate(rate) { sr = rate; },
      reset(s) { if (s !== undefined) seed = (s >>> 0) || 1; R = rng(seed); ph = 1; prev = next = held = 0; gate = 0; cnt = 0; gaussSpare = null; },
      setHistogram(w) { histN = Math.min(32, (w && w.length) || 0); histTotal = 0; for (let i = 0; i < histN; i++) { hist[i] = Math.max(0, +w[i] || 0); histTotal += hist[i]; } },
      draw: (dist, a, b) => draw(dist || 0, a || 2, b || 2),
      process(ins, outs, n, P) {
        const s = Math.round(P.seed[0]) >>> 0; if (s !== seed) api.reset(s);
        const o0 = outs[0], o1 = outs[1], dist = Math.round(P.dist[0]), a = Math.max(0.1, P.a[0]), b = Math.max(0.1, P.b[0]), uni = P.unipolar[0] >= 0.5;
        for (let j = 0; j < n; j++) {
          const rate = Math.max(0.01, v(P.rate, j)), sm = Math.max(0, Math.min(1, v(P.smooth, j)));
          ph += rate / sr;
          if (ph >= 1) { ph -= Math.floor(ph); prev = next; next = draw(dist, a, b); held = next; }
          const lin = sm > 0 ? prev + (next - prev) * (0.5 - 0.5 * Math.cos(Math.PI * ph)) : held, x = sm > 0 ? held * (1 - sm) + lin * sm : held;
          const val = uni ? (x + 1) / 2 : x;
          if (o0) o0[j] = v(P.offset, j) + v(P.depth, j) * val;
          // events (Poisson): each sample has density/sr chance of starting one; one lasts eventLen
          if (cnt > 0) { cnt--; gate = cnt > 0 ? 1 : 0; }
          else if (R() < Math.max(0, v(P.density, j)) / sr) { cnt = Math.max(1, Math.round(Math.max(0.0005, v(P.eventLen, j)) * sr)); gate = 1; }
          else gate = 0;
          if (o1) o1[j] = gate;
        }
      },
    };
    return api;
  }
  const PARAMS = [
    { name: 'rate', defaultValue: 4, minValue: 0.01, maxValue: 200, automationRate: 'a-rate' },
    { name: 'smooth', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
    { name: 'dist', defaultValue: 0, minValue: 0, maxValue: 3, automationRate: 'k-rate' },
    { name: 'a', defaultValue: 2, minValue: 0.1, maxValue: 20, automationRate: 'k-rate' },
    { name: 'b', defaultValue: 2, minValue: 0.1, maxValue: 20, automationRate: 'k-rate' },
    { name: 'seed', defaultValue: 1, minValue: 1, maxValue: 2147483647, automationRate: 'k-rate' },
    { name: 'depth', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
    { name: 'offset', defaultValue: 0, minValue: -1, maxValue: 1, automationRate: 'a-rate' },
    { name: 'unipolar', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    { name: 'density', defaultValue: 0, minValue: 0, maxValue: 200, automationRate: 'a-rate' },
    { name: 'eventLen', defaultValue: 0.002, minValue: 0.0005, maxValue: 2, automationRate: 'a-rate' },
  ];
  const RANDOM_WORKLET = `const rng = ${rng.toString()};
const Random = ${Random.toString()};
class EravosRandom extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(PARAMS)}; }
  constructor(o) { super(); this.k = Random(); this.k.setRate(sampleRate); this.k.reset((o && o.processorOptions && o.processorOptions.seed) || 1); if (o && o.processorOptions && o.processorOptions.histogram) this.k.setHistogram(o.processorOptions.histogram); this.port.onmessage = (e) => { if (e.data && e.data.histogram) this.k.setHistogram(e.data.histogram); }; }
  process(inputs, outputs, p) { const out = outputs[0]; if (!out || !out.length) return true; this.k.process([], out, out[0].length, p); return true; }
}
registerProcessor('eravos-random', EravosRandom);`;
  function randomSource(ac, o) {
    o = o || {};
    const SDK = root.OrganismSDK, load = SDK && SDK.loadWorklet ? SDK.loadWorklet(ac, 'eravos-random', RANDOM_WORKLET)
      : ac.audioWorklet.addModule(URL.createObjectURL(new Blob([RANDOM_WORKLET], { type: 'text/javascript' })));
    return Promise.resolve(load).then(() => new AudioWorkletNode(ac, 'eravos-random', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], parameterData: o.params || {}, processorOptions: { seed: o.seed || 1, histogram: o.histogram || null } }));
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { rng, Random, RANDOM_WORKLET, RANDOM_PARAMS: PARAMS, randomSource });
  if (typeof module !== 'undefined' && module.exports) module.exports = { rng, Random, RANDOM_WORKLET, RANDOM_PARAMS: PARAMS, randomSource };
})(typeof window !== 'undefined' ? window : globalThis);
