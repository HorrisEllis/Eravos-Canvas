/* eravos.component.masking-analyzer 1.0.0 — where two sounds collide: per band, how much A and B are both loud (first used by Collision).
 * NEW code (2026-11-27, his: "the frequencies how the collide"). Two magnitude spectra in dB (e.g. two AnalyserNodes' getFloatFrequencyData)
 * are gathered into bands a third of an octave wide (24…30 bands from 20 Hz up — the ear hears a band about that wide as one, so two sounds in
 * one band fight for it). Per band: A's and B's power, and their COLLISION 0…1 = how loud the quieter of the two is, between the floor (0) and
 * the louder one (1): 1 when both are equally loud there, 0 when either is under the floor. A one-number total: the collision weighted by
 * how loud the band is. Analysis only (not on the audio thread): it never touches the sound.
 *   MusicParts.masking(aDb, bDb, { binHz, lo = 20, hi = 16000, perOctave = 3, floor = −70 }) → { bands: [{ lo, hi, a, b, collide }], total }
 * A component imports no tool. */
(function (root) {
  'use strict';
  function edges(lo, hi, per) { const e = []; for (let f = lo; f < hi * 1.0001; f *= Math.pow(2, 1 / per)) e.push(f); return e; }
  function masking(aDb, bDb, o) {
    o = o || {}; const binHz = o.binHz || 48000 / 2048, floor = o.floor === undefined ? -70 : o.floor, e = edges(o.lo || 20, o.hi || 16000, o.perOctave || 3);
    const bands = []; let wsum = 0, csum = 0;
    for (let k = 0; k + 1 < e.length; k++) {
      const i0 = Math.max(1, Math.floor(e[k] / binHz)), i1 = Math.max(i0 + 1, Math.ceil(e[k + 1] / binHz));
      let pa = 0, pb = 0, n = 0; for (let i = i0; i < i1 && i < aDb.length && i < bDb.length; i++) { pa += Math.pow(10, aDb[i] / 10); pb += Math.pow(10, bDb[i] / 10); n++; }
      const a = n ? 10 * Math.log10(pa / n + 1e-30) : -200, b = n ? 10 * Math.log10(pb / n + 1e-30) : -200;
      const qu = Math.min(a, b), lou = Math.max(a, b), collide = qu <= floor ? 0 : Math.max(0, Math.min(1, (qu - floor) / Math.max(1e-9, lou - floor)));
      bands.push({ lo: e[k], hi: e[k + 1], a, b, collide });
      const w = Math.max(0, lou - floor); wsum += w; csum += w * collide;
    }
    return { bands, total: wsum > 0 ? csum / wsum : 0 };
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { masking });
  if (typeof module !== 'undefined' && module.exports) module.exports = { masking };
})(typeof window !== 'undefined' ? window : globalThis);
