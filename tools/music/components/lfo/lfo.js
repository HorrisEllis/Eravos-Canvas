/* eravos.component.lfo 1.1.0 — the low-frequency oscillator (phase 1 · the most-reached unbuilt component: 27 tools stand on it).
 * NEW code (2026-11-06, first used by Swarm Oscillator); moving today's LFO tool onto it (drawn shapes, tempo sync, retrigger modes)
 * is a later step that must null-render.
 *   shapes  0 sine · 1 triangle · 2 saw up · 3 saw down · 4 square · 5 sample & hold · 6 smooth random (both seeded: the same every time)
 *   rate 0.01–50 Hz · phase 0…1 (where reset() starts) · fade 0–10 s (rises from 0 after each reset) · bipolar −1…1 or unipolar 0…1
 *   7 pendulum 1.1.0 (2026-11-27, his: "The pendulum swing, highes and lows. Oscillatory."): a swing whose time is warped by lean
 *            −1…1 — lean > 0 lingers high and rushes through the low, lean < 0 the other way; lean 0 is the sine exactly.
 *            p → sin(2π·(p + b·(cos 2πp − 1)/2π)), b = 0.6·lean (the warp's speed 1 − b·sin 2πp stays > 0: it never stops or reverses).
 *            pendulumAt(p, lean) is exported so a tool drawing the shape uses the same law.
 *   MusicParts.LFO() → { set({ shape, rate, phase, fade, unipolar, lean }, sr), reset(), next() → value, phase }
 * Allocation-free; self-contained (stringified into worklets). A component imports no tool. */
(function (root) {
  'use strict';
  function LFO() {
    // inside LFO, so the kernel text a worklet takes (`${MP.LFO}`) carries it
    function pendulumAt(p, lean) { const b = 0.6 * (lean || 0); return Math.sin(2 * Math.PI * p + b * (Math.cos(2 * Math.PI * p) - 1)); }
    let shape = 0, rate = 1, ph0 = 0, fade = 0, uni = false, lean = 0, sr = 48000, ph = 0, t = 0, seed = 12345, held = 0, a = 0, b = 0;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2147483648 - 1; };
    function set(o, rateHz) { if (rateHz) sr = rateHz; if (!o) return; if (o.shape !== undefined) shape = o.shape | 0; if (o.rate !== undefined) rate = Math.min(50, Math.max(0.01, o.rate));
      if (o.phase !== undefined) ph0 = o.phase; if (o.fade !== undefined) fade = Math.max(0, o.fade); if (o.unipolar !== undefined) uni = !!o.unipolar; if (o.lean !== undefined) lean = Math.max(-1, Math.min(1, +o.lean || 0)); }
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
        case 7: v = pendulumAt(ph, lean); break;
        default: { const u = ph * ph * (3 - 2 * ph); v = a + (b - a) * u; }   // smooth random: eased between two random points
      }
      ph += rate / sr; if (ph >= 1) { ph -= 1; held = rnd(); a = b; b = rnd(); }
      if (fade > 0 && t < fade) { v *= t / fade; t += 1 / sr; }
      return uni ? 0.5 + 0.5 * v : v;
    }
    reset();
    return { set, reset, next, pendulumAt, get phase() { return ph; } };
  }
  const pendulumAt = LFO().pendulumAt;   // the same law, for a tool that draws or builds the shape
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { LFO, pendulumAt, LFO_PENDULUM: pendulumAt, LFO_SHAPES: ['sine', 'triangle', 'saw up', 'saw down', 'square', 'sample & hold', 'smooth random', 'pendulum'] });
  if (typeof module !== 'undefined' && module.exports) module.exports = { LFO, pendulumAt, LFO_SHAPES: ['sine', 'triangle', 'saw up', 'saw down', 'square', 'sample & hold', 'smooth random', 'pendulum'] };
})(typeof window !== 'undefined' ? window : globalThis);
