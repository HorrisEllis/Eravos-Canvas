/* eravos.component.osc-va 1.0.0 — the virtual-analog oscillator (phase 1 · 26 tools stand on it, docs/eco-graph.md). NEW code
 * (2026-11-06, first used by Swarm Oscillator); extracting it out of syn-osc and wobble-bass is a later step that must null-render.
 *
 * Band-limited by polyBLEP (Välimäki & Huovilainen, "Antialiasing oscillators in subtractive synthesis", 2007): the step in a saw or
 * pulse is smoothed over one sample either side, so the harmonics a naive saw would fold back below Nyquist are cut down (measured
 * in osc-va.test.mjs against a naive saw). The triangle is drawn directly: its harmonics fall 12 dB/oct, so what folds is small
 * (measured, not assumed).
 *   phase in cycles 0…1, dt = frequency / sample rate (0 < dt ≤ 0.5); output −1…1, DC ≈ 0 (the pulse's DC, 2w − 1, is taken out and it is scaled back into −1…1)
 *   MusicParts.VA()  → { saw(ph, dt), pulse(ph, dt, w), square(ph, dt), tri(ph), blep(t, dt), sample(shape, ph, dt, w) }
 *                      shape 0 saw · 1 pulse · 2 square · 3 triangle
 * Allocation-free, self-contained (the text is stringified into worklets). A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  function VA() {
    function blep(t, dt) {
      if (t < dt) { t /= dt; return t + t - t * t - 1; }
      if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
      return 0;
    }
    function saw(ph, dt) { return 2 * ph - 1 - blep(ph, dt); }
    function pulse(ph, dt, w) {
      w = w < 0.02 ? 0.02 : w > 0.98 ? 0.98 : w;
      let v = ph < w ? 1 : -1; v += blep(ph, dt);
      let p2 = ph - w; if (p2 < 0) p2 += 1; v -= blep(p2, dt);
      return (v - (2 * w - 1)) / (w > 0.5 ? 2 * w : 2 - 2 * w);   // DC out, then scaled back into −1…1 (a narrow pulse sits off-centre)
    }
    function square(ph, dt) { return pulse(ph, dt, 0.5); }
    function tri(ph) { return ph < 0.5 ? 4 * ph - 1 : 3 - 4 * ph; }
    function sample(shape, ph, dt, w) { return shape === 0 ? saw(ph, dt) : shape === 1 ? pulse(ph, dt, w) : shape === 2 ? square(ph, dt) : tri(ph); }
    return { blep, saw, pulse, square, tri, sample };
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { VA, VA_SHAPES: ['saw', 'pulse', 'square', 'triangle'] });
  if (typeof module !== 'undefined' && module.exports) module.exports = { VA, VA_SHAPES: ['saw', 'pulse', 'square', 'triangle'] };
})(typeof window !== 'undefined' ? window : globalThis);
