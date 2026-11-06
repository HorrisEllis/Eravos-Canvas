/* eravos.component.modal-resonator 1.0.0 — a bank of resonant modes (Piano's tine and reed; drum foundry, log drum, percussion physics …).
 * NEW code (2026-11-06, for Piano — his "yes"), proved on its own (modal-resonator.test.mjs).
 *   tick(x) → the sum of the modes: each a two-pole resonator  y = 2r·cos(w)·y1 − r²·y2 + g·sin(w)·x, r from its T60 (the time to fall
 *             60 dB): a unit impulse rings at exactly g · rⁿ · sin((n+1)w) — frequency, decay and level each exact
 *   set(freqs Hz, t60s s, gains, sr) · scale(k) (all modes × k, for a new note, keeping their decays) · reset() · energy (≈ how loud it rings)
 *   modes above 0.45 × the sample rate are skipped (no aliasing; always stable)
 *   MusicParts.MODAL_SHAPES (data, ratios to the first mode): beam (clamped-free — a tine, a reed) · bar (free-free) · body (a soundboard's
 *   low modes, for a piano's wood). Up to 64 modes. Real-time safe: tick() allocates nothing.
 *   MusicParts.Modal() · MusicParts.MODAL_SHAPES · MusicParts.modalT60(r, sr) / modalR(t60, sr)
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  function Modal() {
    const MAX = 64;
    const f = new Float64Array(MAX), t60 = new Float64Array(MAX), g = new Float64Array(MAX), a1 = new Float64Array(MAX), a2 = new Float64Array(MAX), b = new Float64Array(MAX), y1 = new Float64Array(MAX), y2 = new Float64Array(MAX);
    let n = 0, used = 0, sr = 48000, k = 1;
    function coef(i) {
      const fr = f[i] * k; if (!(fr > 0) || fr >= 0.45 * sr) { a1[i] = a2[i] = b[i] = 0; return false; }
      const w = 2 * Math.PI * fr / sr, r = Math.pow(0.001, 1 / (Math.max(1e-3, t60[i]) * sr));
      a1[i] = 2 * r * Math.cos(w); a2[i] = -r * r; b[i] = g[i] * Math.sin(w);   // a unit impulse rings at amplitude g: y[n] = g · rⁿ · sin((n+1)w)
      return true;
    }
    const api = {
      set(freqs, t60s, gains, rate) {
        sr = rate || sr; n = Math.min(MAX, freqs.length); k = 1;
        for (let i = 0; i < n; i++) { f[i] = +freqs[i]; t60[i] = +(t60s[i] !== undefined ? t60s[i] : t60s[t60s.length - 1]); g[i] = +(gains[i] !== undefined ? gains[i] : 0); }
        used = 0; for (let i = 0; i < n; i++) if (coef(i)) used = i + 1;
      },
      scale(s) { k = s; used = 0; for (let i = 0; i < n; i++) if (coef(i)) used = i + 1; },
      reset() { y1.fill(0); y2.fill(0); },
      get modes() { return n; },
      get energy() { let e = 0; for (let i = 0; i < used; i++) e += y1[i] * y1[i] + y2[i] * y2[i]; return e; },
      tick(x) {
        let s = 0;
        for (let i = 0; i < used; i++) {
          let y = a1[i] * y1[i] + a2[i] * y2[i] + b[i] * x;
          if (y < 1e-20 && y > -1e-20) y = 0;
          y2[i] = y1[i]; y1[i] = y; s += y;
        }
        return s;
      },
    };
    return api;
  }
  const MODAL_SHAPES = {
    beam: [1, 6.267, 17.547, 34.386, 56.843],            // clamped-free (Euler–Bernoulli): a tine, a reed
    bar: [1, 2.756, 5.404, 8.933, 13.344],               // free-free: a marimba bar, a glockenspiel
    body: [1, 1.47, 2.09, 2.81, 3.62, 4.73, 6.11, 7.6],  // a soundboard's low modes (a spread set, relative to the first ~110 Hz)
  };
  const modalR = (t60, sr) => Math.pow(0.001, 1 / (t60 * sr)), modalT60 = (r, sr) => Math.log(0.001) / (Math.log(r) * sr);
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { Modal, MODAL_SHAPES, modalR, modalT60 });
  if (typeof module !== 'undefined' && module.exports) module.exports = { Modal, MODAL_SHAPES, modalR, modalT60 };
})(typeof window !== 'undefined' ? window : globalThis);
