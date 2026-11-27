/* eravos.component.multiband-splitter 1.0.0 — 2 or 3 bands, Linkwitz-Riley 24 dB/oct (11 planned tools stand on it; first used by Collision).
 * NEW code (2026-11-27, his: "the frequencies how the collide"). Each crossover is two 2nd-order Butterworth low-passes in series (the low side)
 * and two high-passes (the high side): −6 dB each at the crossover, 24 dB/oct, and low + high sum to an allpass — the bands add back to the
 * input's level at every frequency (flat), only the phase turns. With 3 bands the low band also passes the 2nd crossover's allpass, so all
 * three stay in phase with each other and still sum flat.
 *   bands 2 · 3 · f1 20…20000 Hz (low | mid) · f2 > f1 (mid | high, 3 bands only)
 *   MusicParts.Splitter() → { set(f1, f2, bands, sr), process(x) → the bands in .out[0..2] (Float64Array(3)), reset() }  — one channel each
 *   a worklet takes the kernel text `${MP.Splitter}` · MusicParts.lr4Response(f, fc, side) the magnitude for drawing
 * Allocation-free after it is made; self-contained (its text can be stringified into worklets). A component imports no tool. */
(function (root) {
  'use strict';
  function Splitter() {
    // one biquad section: RBJ coefficients, transposed direct form II (state z1 z2)
    function Bq() { return { b0: 1, b1: 0, b2: 0, a1: 0, a2: 0, z1: 0, z2: 0 }; }
    function design(q, type, fc, sr) {
      const w = 2 * Math.PI * Math.min(fc, sr * 0.49) / sr, c = Math.cos(w), al = Math.sin(w) / (2 * Math.SQRT1_2), a0 = 1 + al;
      if (type === 0) { q.b0 = (1 - c) / 2 / a0; q.b1 = (1 - c) / a0; q.b2 = q.b0; } else { q.b0 = (1 + c) / 2 / a0; q.b1 = -(1 + c) / a0; q.b2 = q.b0; }
      q.a1 = -2 * c / a0; q.a2 = (1 - al) / a0;
    }
    function run(q, x) { const y = q.b0 * x + q.z1; q.z1 = q.b1 * x - q.a1 * y + q.z2; q.z2 = q.b2 * x - q.a2 * y; return y; }
    const L1a = Bq(), L1b = Bq(), H1a = Bq(), H1b = Bq(), L2a = Bq(), L2b = Bq(), H2a = Bq(), H2b = Bq(), A2la = Bq(), A2lb = Bq(), A2ha = Bq(), A2hb = Bq();
    const all = [L1a, L1b, H1a, H1b, L2a, L2b, H2a, H2b, A2la, A2lb, A2ha, A2hb];
    const out = new Float64Array(3); let nb = 2, sr = 48000, f1 = 120, f2 = 2000;
    function set(a, b, bands, rate) {
      if (rate) sr = rate; nb = bands === 3 ? 3 : 2; f1 = Math.max(20, Math.min(20000, +a || 120)); f2 = Math.max(f1 * 1.01, Math.min(20000, +b || f1 * 8));
      [L1a, L1b].forEach(q => design(q, 0, f1, sr)); [H1a, H1b].forEach(q => design(q, 1, f1, sr));
      [L2a, L2b, A2la, A2lb].forEach(q => design(q, 0, f2, sr)); [H2a, H2b, A2ha, A2hb].forEach(q => design(q, 1, f2, sr));
    }
    function reset() { for (const q of all) { q.z1 = 0; q.z2 = 0; } }
    function process(x) {
      let lo = run(L1b, run(L1a, x)); const hi = run(H1b, run(H1a, x));
      if (nb === 2) { out[0] = lo; out[1] = hi; out[2] = 0; return out; }
      lo = run(A2lb, run(A2la, lo)) + run(A2hb, run(A2ha, lo));   // the 2nd crossover's allpass (LR4 low + high) keeps the low band in phase
      out[0] = lo; out[1] = run(L2b, run(L2a, hi)); out[2] = run(H2b, run(H2a, hi)); return out;
    }
    set(120, 2000, 2, 48000);
    return { set, process, reset, out, get bands() { return nb; } };
  }
  // the magnitude of one LR4 side at f (for drawing): |H|² of a Butterworth 2nd order, squared again (two in series)
  function lr4Response(f, fc, side) { const r = Math.pow(f / fc, 2), b = side === 'high' ? (r * r) / (1 + r * r) : 1 / (1 + r * r); return b; }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { Splitter, lr4Response });
  if (typeof module !== 'undefined' && module.exports) module.exports = { Splitter, lr4Response };
})(typeof window !== 'undefined' ? window : globalThis);
