/* eravos.component.unison-stack 1.0.0 — 1–16 voices of any source (11 planned tools stand on it, docs/eco-graph.md). NEW code
 * (2026-11-06); the layout is Supersaw's own (supersaw.engine.js makeVoice), so moving Supersaw onto it is a later step that can
 * null-render: same detune law, same blend, same level, same equal-power pan.
 *
 * It owns no oscillator: it says, per voice, how far to detune, where to pan, how loud, and where its phase starts — any source
 * (osc-va, osc-wavetable, a sample, a whole FM patch) is then played once per voice with those numbers.
 *   voices   1…16 · position x of voice i = i/(n−1)·2 − 1 (−1 … +1; one voice sits at 0)
 *   detune   0…1 → 0…100 cents at the outermost voice (Supersaw's range), shaped by the curve:
 *              0 linear d(x)=x · 1 exp d(x)=sign(x)·(2^(3|x|)−1)/7 · 2 supersaw d(x)=x·(0.25+0.75x²) (JP-8000-style, Supersaw's)
 *   spread   0…1 stereo width: pan θ = (x·spread + 1)·π/4, L = cos θ, R = sin θ (equal power, StereoPannerNode's law)
 *   blend    0…1 centre against sides: the centre voice 1 − 0.4·blend, the others blend (Supersaw's mix) — all ÷ √n
 *   phase    0 free (each voice keeps running) · 1 reset (all start at 0) · 2 seeded random (the same seed, the same start)
 *   MusicParts.UnisonStack() → { layout(n, detune, curve, spread, blend, phaseMode, seed) → count, cents, pan, gain, gainL,
 *                               gainR, phase (Float64Array(16) each, preallocated), curveAt(curve, x) }
 * Allocation-free after it is made, self-contained (the text can be stringified into worklets). A component imports no tool. */
(function (root) {
  'use strict';
  function UnisonStack() {
    const MAX = 16;
    const cents = new Float64Array(MAX), pan = new Float64Array(MAX), gain = new Float64Array(MAX), gainL = new Float64Array(MAX),
      gainR = new Float64Array(MAX), phase = new Float64Array(MAX), pos = new Float64Array(MAX);
    function curveAt(curve, x) {
      if (curve === 0) return x;
      if (curve === 1) { const a = x < 0 ? -x : x, v = (Math.pow(2, 3 * a) - 1) / 7; return x < 0 ? -v : v; }
      return x * (0.25 + 0.75 * x * x);
    }
    // a seeded hash in 0…1 (mulberry32 of seed + voice): no Math.random, so the same seed always starts the same way
    function hash(seed, i) {
      let t = ((seed | 0) + Math.imul(i + 1, 0x9E3779B9)) | 0;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    const out = { count: 1, cents, pan, gain, gainL, gainR, phase, pos, curveAt, layout, MAX };
    function layout(n, detune, curve, spread, blend, phaseMode, seed) {
      n = Math.max(1, Math.min(MAX, Math.round(n || 1)));
      const det = Math.max(0, Math.min(1, detune || 0)) * 100, sp = Math.max(0, Math.min(1, spread || 0)), mix = Math.max(0, Math.min(1, blend === undefined ? 0.5 : blend));
      const c = Math.max(0, Math.min(2, Math.round(curve === undefined ? 2 : curve))), root2 = Math.sqrt(n);
      for (let i = 0; i < n; i++) {
        const x = n === 1 ? 0 : (i / (n - 1)) * 2 - 1, centre = n === 1 || Math.abs(x) < 1e-6;
        pos[i] = x; cents[i] = curveAt(c, x) * det;
        const th = (x * sp + 1) * Math.PI / 4; pan[i] = x * sp;
        gain[i] = (centre ? 1 - mix * 0.4 : mix) / root2; gainL[i] = gain[i] * Math.cos(th); gainR[i] = gain[i] * Math.sin(th);
        phase[i] = phaseMode === 2 ? hash(seed || 0, i) : phaseMode === 1 ? 0 : -1;   // −1 = free: leave the voice where it is
      }
      for (let i = n; i < MAX; i++) { pos[i] = 0; cents[i] = 0; pan[i] = 0; gain[i] = 0; gainL[i] = 0; gainR[i] = 0; phase[i] = 0; }
      out.count = n; return out;
    }
    return out;
  }
  const CURVES = ['linear', 'exp', 'supersaw'], PHASES = ['free', 'reset', 'seeded random'];
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { UnisonStack, UNISON_CURVES: CURVES, UNISON_PHASES: PHASES });
  if (typeof module !== 'undefined' && module.exports) module.exports = { UnisonStack, UNISON_CURVES: CURVES, UNISON_PHASES: PHASES };
})(typeof window !== 'undefined' ? window : globalThis);
