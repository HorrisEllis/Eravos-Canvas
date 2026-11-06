/* eravos.component.lfo 1.0.0 — the low-frequency oscillator (phase 1 · the most-reached unbuilt component: 27 tools stand on it).
 * NEW code (2026-11-06, first used by Swarm Oscillator); moving today's LFO tool onto it (drawn shapes, tempo sync, retrigger modes)
 * is a later step that must null-render.
 *   shapes  0 sine · 1 triangle · 2 saw up · 3 saw down · 4 square · 5 sample & hold · 6 smooth random (both seeded: the same every time)
 *   rate 0.01–50 Hz · phase 0…1 (where reset() starts) · fade 0–10 s (rises from 0 after each reset) · bipolar −1…1 or unipolar 0…1
 *   MusicParts.LFO() → { set({ shape, rate, phase, fade, unipolar }, sr), reset(), next() → value, phase }
 * Allocation-free; self-contained (stringified into worklets). A component imports no tool. */
(function (root) {
  'use strict';
  function LFO() {
    let shape = 0, rate = 1, ph0 = 0, fade = 0, uni = false, sr = 48000, ph = 0, t = 0, seed = 12345, held = 0, a = 0, b = 0;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2147483648 - 1; };
    function set(o, rateHz) { if (rateHz) sr = rateHz; if (!o) return; if (o.shape !== undefined) shape = o.shape | 0; if (o.rate !== undefined) rate = Math.min(50, Math.max(0.01, o.rate));
      if (o.phase !== undefined) ph0 = o.phase; if (o.fade !== undefined) fade = Math.max(0, o.fade); if (o.unipolar !== undefined) uni = !!o.unipolar; }
    function reset() { ph = ph0 - Math.floor(ph0); t = 0; seed = 12345; held = rnd(); a = held; b = rnd(); }
    function next() {
      let v;
      switch (shape) {
        case 0: v = Math.sin(2 * Math.PI * ph); break;
        case 1: v = ph < 0.5 ? 4 * ph - 1 : 3 - 4 * ph; break;
        case 2: v = 2 * ph - 1; break;
        case 3: v = 1 - 2 * ph; break;
        case 4: v = ph < 0.5 ? 1 : -1; break;
        case 5: v = held; break;
        default: { const u = ph * ph * (3 - 2 * ph); v = a + (b - a) * u; }   // smooth random: eased between two random points
      }
      ph += rate / sr; if (ph >= 1) { ph -= 1; held = rnd(); a = b; b = rnd(); }
      if (fade > 0 && t < fade) { v *= t / fade; t += 1 / sr; }
      return uni ? 0.5 + 0.5 * v : v;
    }
    reset();
    return { set, reset, next, get phase() { return ph; } };
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { LFO, LFO_SHAPES: ['sine', 'triangle', 'saw up', 'saw down', 'square', 'sample & hold', 'smooth random'] });
  if (typeof module !== 'undefined' && module.exports) module.exports = { LFO, LFO_SHAPES: ['sine', 'triangle', 'saw up', 'saw down', 'square', 'sample & hold', 'smooth random'] };
})(typeof window !== 'undefined' ? window : globalThis);
