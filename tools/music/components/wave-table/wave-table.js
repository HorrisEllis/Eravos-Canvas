/* eravos.component.wave-table 1.0.0 — a drawn cycle → a PeriodicWave (+ its DC)
 * Extracted (phase 0 · P0.1) from eravos.lfo and eravos.wub-rate, which each carried the same function. Same arithmetic, same
 * order of operations: the harmonics a tool gets are the ones it computed itself before (proved in wave-table.test.mjs, which
 * holds the two original inline copies and compares every coefficient bit for bit).
 *   MusicParts.periodicWave(ac, fn, { phase, harmonics }) → { wave, dc }
 *     fn        cycle position 0..1 → value −1..1
 *     phase     fraction of a cycle the shape is rotated by (0..1); the LFO passes degrees/360
 *     harmonics how many harmonics (0..N−1) are kept; the LFO uses 33, Wub Rate 40 — each tool keeps its own number
 *     dc        harmonic 0 — WebAudio drops it, so the tool adds it back as a constant offset
 *   MusicParts.phaseWave(ac, deg) → PeriodicWave   a plain sine rotated by deg degrees (fx-moddelay, fx-phaser)
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  function periodicWave(ac, fn, o) {
    const ph = (o && o.phase) || 0, N = (o && o.harmonics) || 33, M = 1024;
    const re = new Float32Array(N), im = new Float32Array(N), y = new Float32Array(M);
    for (let i = 0; i < M; i++) y[i] = fn(((i / M) + ph) % 1);
    for (let n = 0; n < N; n++) { let a = 0, b = 0; for (let i = 0; i < M; i++) { const w = 2 * Math.PI * n * i / M; a += y[i] * Math.cos(w); b += y[i] * Math.sin(w); } re[n] = (n ? 2 : 1) * a / M; im[n] = 2 * b / M; }
    return { wave: ac.createPeriodicWave(re, im, { disableNormalization: true }), dc: re[0] };
  }
  // one sine cycle rotated by `deg` degrees (harmonic 1 only, no DC): the stereo-offset LFO of Mod Delay and Phaser, which carried one copy each
  function phaseWave(ac, deg) { const r = deg * Math.PI / 180; return ac.createPeriodicWave(new Float32Array([0, Math.sin(r)]), new Float32Array([0, Math.cos(r)]), { disableNormalization: true }); }
  root.MusicParts = root.MusicParts || {};
  root.MusicParts.periodicWave = periodicWave; root.MusicParts.phaseWave = phaseWave;
  if (typeof module !== 'undefined' && module.exports) module.exports = { periodicWave, phaseWave };
})(typeof window !== 'undefined' ? window : globalThis);
