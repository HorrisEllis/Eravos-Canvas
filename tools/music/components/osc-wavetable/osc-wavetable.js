/* eravos.component.osc-wavetable 1.0.0 — the wavetable oscillator (phase 1 · 11 tools stand on it). NEW code (2026-11-06, first used
 * by Swarm Oscillator); extracting it out of syn-osc banks and wobble-bass 4.x tables is a later step that must null-render.
 *
 * A table is FRAMES single cycles, each written as harmonic amplitudes (a recipe — no recordings: the tables are maths), rendered at
 * 2048 samples per cycle and mip-mapped per octave: level L keeps harmonics 1 … 1024 >> L, so whatever the pitch, the level read has
 * nothing above Nyquist (proved in osc-wavetable.test.mjs). Position 0…1 morphs across the frames (linear between neighbours).
 *   MusicParts.WT()                 → { build(recipes), load(tables), tables(), sample(pos, ph, dt), frames, levelFor(dt), table(frame, level) }
 *                                     build on the main thread, post tables() to a worklet, load() there (never build on the audio thread)
 *   MusicParts.WT_RECIPES.basic     the built-in table: sine → triangle → saw → square → pulse 25% → formant (6 frames)
 *   recipe: (k) → amplitude of harmonic k (sine phase); 0 for none
 * Allocation-free after build(); self-contained (stringified into worklets). A component imports no tool. */
(function (root) {
  'use strict';
  function WT() {
    const SIZE = 2048, MAXH = 1024, LEVELS = 11;
    const SIN = new Float64Array(SIZE); for (let i = 0; i < SIZE; i++) SIN[i] = Math.sin(2 * Math.PI * i / SIZE);
    let tabs = [], F = 0;   // tabs[frame][level] = Float32Array(SIZE + 1) (the extra sample wraps, for interpolation)
    function render(recipe, maxH) {
      const t = new Float32Array(SIZE + 1), amps = []; for (let k = 1; k <= maxH; k++) { const a = recipe(k); if (a) amps.push(k, a); }
      // sin(k·2πi/SIZE) is SIN[(k·i) mod SIZE] exactly — a lookup, not a sine per term (build ~10× faster)
      for (let i = 0; i < SIZE; i++) { let s = 0; for (let j = 0; j < amps.length; j += 2) s += amps[j + 1] * SIN[(amps[j] * i) & (SIZE - 1)]; t[i] = s; }
      let mx = 0; for (let i = 0; i < SIZE; i++) mx = Math.max(mx, Math.abs(t[i])); if (mx > 0) for (let i = 0; i < SIZE; i++) t[i] /= mx;
      t[SIZE] = t[0]; return t;
    }
    function build(recipes) {
      tabs = recipes.map(r => { const lv = []; for (let L = 0; L < LEVELS; L++) lv.push(render(r, Math.max(1, MAXH >> L))); return lv; });
      F = tabs.length; return F;
    }
    // the level whose top harmonic stays under Nyquist at this pitch (dt = f / sample rate)
    function levelFor(dt) { const allowed = 0.5 / Math.max(1e-9, dt); let L = 0; while (L < LEVELS - 1 && (MAXH >> L) > allowed) L++; return L; }
    function read(t, ph) { const x = ph * SIZE, i = x | 0, f = x - i; return t[i] + (t[i + 1] - t[i]) * f; }
    function sample(pos, ph, dt) {
      if (!F) return 0; const L = levelFor(dt), p = (pos < 0 ? 0 : pos > 1 ? 1 : pos) * (F - 1), a = p | 0, b = a + 1 < F ? a + 1 : a, w = p - a;
      const x = read(tabs[a][L], ph); return w ? x + (read(tabs[b][L], ph) - x) * w : x;
    }
    // tables built elsewhere (the main thread, then posted to a worklet: building blocks for ~0.2 s, never on the audio thread)
    function load(t) { tabs = t; F = t.length; return F; }
    return { build, load, sample, levelFor, tables: () => tabs, table: (f, L) => tabs[f] && tabs[f][L], get frames() { return F; }, SIZE, MAXH };
  }
  // the built-in table, as harmonic recipes
  const BASIC = [
    (k) => k === 1 ? 1 : 0,                                                        // sine
    (k) => k % 2 ? ((k - 1) / 2 % 2 ? -1 : 1) / (k * k) : 0,                         // triangle
    (k) => 1 / k,                                                                    // saw
    (k) => k % 2 ? 1 / k : 0,                                                        // square
    (k) => Math.sin(Math.PI * k * 0.25) / k,                                         // pulse 25%
    (k) => Math.exp(-Math.pow((k - 9) / 3, 2)) * 0.9 + (k === 1 ? 0.5 : 0) + 0.15 / k,  // formant: a bump around the 9th harmonic
  ];
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { WT, WT_RECIPES: { basic: BASIC }, WT_FRAMES: ['sine', 'triangle', 'saw', 'square', 'pulse', 'formant'] });
  if (typeof module !== 'undefined' && module.exports) module.exports = { WT, WT_RECIPES: { basic: BASIC }, WT_FRAMES: ['sine', 'triangle', 'saw', 'square', 'pulse', 'formant'] };
})(typeof window !== 'undefined' ? window : globalThis);
