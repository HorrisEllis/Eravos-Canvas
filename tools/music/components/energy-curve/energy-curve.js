/* eravos.component.energy-curve 1.0.0 — a held build and its release, as a curve over time (9 planned tools stand on it; first used by
 * Tension Field). NEW code (2026-11-27, his: "the way it creates ripples and tension"). From a start, the curve climbs from Floor to Peak over
 * Hold seconds (Shape: 0 a straight line … 1 it waits and then rushes, the way a build does), and at RELEASE — the end of the hold, or any
 * moment it is told to — it falls back to Floor over Release seconds (an exponential drop: 99 % gone at Release). With Loop it rests Rest
 * seconds at the floor and climbs again. Pure arithmetic of time: the same settings and times always give the same value.
 *   MusicParts.EnergyCurve() → { set({ hold, shape, release, floor, peak, loop, rest }), start(t), release(t), at(t) → value, phase(t) → 'build' | 'release' | 'rest' | 'idle' }
 * Allocation-free; self-contained (stringified into worklets). A component imports no tool. */
(function (root) {
  'use strict';
  function EnergyCurve() {
    const S = { hold: 8, shape: 0.6, release: 0.2, floor: 0, peak: 1, loop: 0, rest: 0 };
    let t0 = -1, tr = -1, vr = 0;
    function set(o) { if (o) Object.keys(S).forEach(k => { if (o[k] !== undefined) S[k] = +o[k]; }); S.hold = Math.max(0.01, S.hold); S.release = Math.max(0.001, S.release); S.rest = Math.max(0, S.rest); }
    const climb = (x) => { const p = 1 + 6 * Math.max(0, Math.min(1, S.shape)); return Math.pow(x, p); };   // shape 0 → linear; 1 → x^7 (waits, then rushes)
    function build(t) { const x = Math.max(0, Math.min(1, (t - t0) / S.hold)); return S.floor + (S.peak - S.floor) * climb(x); }
    function start(t) { t0 = t; tr = -1; }
    function release(t) { if (t0 < 0 || t < t0) return; vr = tr >= 0 && t >= tr ? at(t) : build(t); tr = t; }
    function cycle() { return S.hold + S.release * 1.5 + S.rest; }
    function at(t) {
      if (t0 < 0 || t < t0) return S.floor;
      if (tr >= 0 && t >= tr) { const k = (t - tr) / S.release; if (S.loop > 0.5 && t - tr >= S.release * 1.5 + S.rest) { t0 = tr + S.release * 1.5 + S.rest; tr = -1; return at(t); } return S.floor + (vr - S.floor) * Math.exp(-4.6 * k); }
      if (t - t0 >= S.hold) { tr = t0 + S.hold; vr = S.peak; return at(t); }   // the hold's end releases by itself
      return build(t);
    }
    function phase(t) { if (t0 < 0 || t < t0) return 'idle'; const v = at(t); if (tr < 0) return 'build'; return t - tr < S.release * 1.5 ? 'release' : (v, 'rest'); }
    return { set, start, release, at, phase, cycle, get started() { return t0; }, get released() { return tr; } };
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { EnergyCurve });
  if (typeof module !== 'undefined' && module.exports) module.exports = { EnergyCurve };
})(typeof window !== 'undefined' ? window : globalThis);
