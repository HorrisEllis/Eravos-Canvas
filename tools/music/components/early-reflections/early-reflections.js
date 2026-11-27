/* eravos.component.early-reflections 1.0.0 — a room's first echoes (4 planned tools stand on it; first used by Spatial Organism). NEW code
 * (2026-11-27). Twelve taps: each is a wall the sound bounced off once or twice on its way (the image-source idea, simplified to a shoebox):
 * its time is the extra path / 343 m/s, its level falls with that path and with each bounce (Absorption), its side alternates left / right
 * and widens with Spread, and each later tap is darker (Damping). Size scales every path; Pre-delay holds the first one back.
 *   size 2…60 m · predelay 0…100 ms · absorption 0…0.95 · damping 0…1 · spread 0…1 · level 0…1
 *   MusicParts.Reflections() → { set({ size, predelay, absorption, damping, spread, level }, sr), process(x) → [L, R] in .out, taps() → [{ t s, g, pan }], reset() }
 * Allocation-free after it is made (a 0.5 s ring); self-contained (stringified into worklets). A component imports no tool. */
(function (root) {
  'use strict';
  function Reflections() {
    // the shoebox paths (in units of the room's size) and how many walls each touched — fixed, so a setting always makes the same room
    const PATH = [0.27, 0.34, 0.41, 0.49, 0.56, 0.63, 0.74, 0.83, 0.95, 1.07, 1.21, 1.38], HITS = [1, 1, 1, 1, 2, 1, 2, 2, 2, 3, 2, 3], SIDE = [-1, 1, -0.6, 0.6, -1, 1, -0.3, 0.3, -0.8, 0.8, -0.5, 0.5];
    const K = PATH.length, N = 32768, buf = new Float64Array(N), out = new Float64Array(2);
    const d = new Float64Array(K), gL = new Float64Array(K), gR = new Float64Array(K), lpA = new Float64Array(K), lpZ = new Float64Array(K), tapsOut = [];
    let sr = 48000, w = 0, S = { size: 12, predelay: 8, absorption: 0.35, damping: 0.4, spread: 0.8, level: 0.5 };
    function set(o, rate) {
      if (rate) sr = rate; Object.keys(S).forEach(k => { if (o && o[k] !== undefined) S[k] = +o[k]; });
      S.size = Math.max(2, Math.min(60, S.size)); S.absorption = Math.max(0, Math.min(0.95, S.absorption));
      tapsOut.length = 0;
      for (let k = 0; k < K; k++) {
        const path = PATH[k] * S.size, t = Math.min(0.49, S.predelay / 1000 + path / 343), g = S.level * Math.pow(1 - S.absorption, HITS[k]) / (1 + path / 4);
        const pan = SIDE[k] * S.spread, th = (pan + 1) * Math.PI / 4; d[k] = t * sr; gL[k] = g * Math.cos(th); gR[k] = g * Math.sin(th);
        lpA[k] = 1 - Math.exp(-2 * Math.PI * (16000 * Math.pow(1 - 0.85 * S.damping, 1 + k * 0.25)) / sr);
        tapsOut.push({ t, g, pan });
      }
    }
    function process(x) {
      buf[w & (N - 1)] = x; let L = 0, R = 0;
      for (let k = 0; k < K; k++) { const p = w - d[k], i = Math.floor(p), f = p - i, a = buf[(i + N) & (N - 1)], b = buf[(i + 1 + N) & (N - 1)], v = a + (b - a) * f;
        lpZ[k] += lpA[k] * (v - lpZ[k]); if (Math.abs(lpZ[k]) < 1e-20) lpZ[k] = 0; L += lpZ[k] * gL[k]; R += lpZ[k] * gR[k]; }
      w = (w + 1) & 0x7fffffff; out[0] = L; out[1] = R; return out;
    }
    function reset() { buf.fill(0); lpZ.fill(0); }
    set({}, 48000);
    return { set, process, reset, out, taps: () => tapsOut };
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { Reflections });
  if (typeof module !== 'undefined' && module.exports) module.exports = { Reflections };
})(typeof window !== 'undefined' ? window : globalThis);
