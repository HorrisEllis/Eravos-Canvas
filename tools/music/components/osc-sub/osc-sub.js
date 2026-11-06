/* eravos.component.osc-sub 1.0.0 — the sub oscillator (retro-dco, glide-808, sub-architect, wub-organism, log-drum … stand on it).
 * NEW code (2026-11-06), proved on its own (osc-sub.test.mjs); moving wub-sub and sub-engine onto it is a later step that must null-render.
 *   octave   −1 or −2 below the note (or 0: at the note) · shapes 0 sine · 1 triangle · 2 square (band-limited, polyBLEP) ·
 *            3 rounded square (tanh of a sine, normalised: a square's weight without its fizz)
 *   phase    reset() starts it at 0 (rising) — on every note, so the sub's first cycle is the same each time (a clean low end);
 *            align(p) sets the phase to p (0…1) — to line the sub up with a kick (feed it the kick's phase)
 *   output   −1 … 1, no DC (every shape is symmetric)
 * Self-contained and allocation-free (its text goes into worklets).
 *   MusicParts.Sub() → { reset(), align(p), phase(), next(freq, sr, octave, shape) → one sample, render(out, n, freq, sr, octave, shape) }
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  function Sub() {
    let ph = 0;
    const TANH_K = 2, TANH_N = Math.tanh(2);   // drive 2: 3rd −15.5 dB (a square −9.5, a triangle −19.1), 7th −41 dB
    function blep(t, dt) { if (t < dt) { t /= dt; return t + t - t * t - 1; } if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; } return 0; }
    function shapeAt(shape, p, dt) {
      if (shape === 1) return p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4;          // triangle, starts at 0 rising
      if (shape === 2) { let v = p < 0.5 ? 1 : -1; v += blep(p, dt); let p2 = p + 0.5; if (p2 >= 1) p2 -= 1; v -= blep(p2, dt); return v; }   // square, rising edge at 0
      const s = Math.sin(2 * Math.PI * p); return shape === 3 ? Math.tanh(TANH_K * s) / TANH_N : s;
    }
    function next(freq, sr, octave, shape) {
      const oct = octave === undefined ? -1 : Math.max(-2, Math.min(0, Math.round(octave)));   // 0, −1, −2 → ÷ 1, 2, 4
      const dt = Math.min(0.5, Math.max(0, freq) / (1 << -oct) / sr);
      const y = shapeAt(shape | 0, ph, dt); ph += dt; if (ph >= 1) ph -= 1; return y;
    }
    return {
      reset() { ph = 0; }, align(p) { ph = p - Math.floor(p); }, phase() { return ph; }, next,
      render(out, n, freq, sr, octave, shape) { for (let j = 0; j < n; j++) out[j] = next(freq, sr, octave, shape); },
    };
  }
  const SHAPES = ['sine', 'triangle', 'square', 'rounded square'];
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { Sub, SUB_SHAPES: SHAPES });
  if (typeof module !== 'undefined' && module.exports) module.exports = { Sub, SUB_SHAPES: SHAPES };
})(typeof window !== 'undefined' ? window : globalThis);
