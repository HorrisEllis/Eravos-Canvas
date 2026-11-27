/* eravos.component.panner 1.0.0 — a point in space around the listener (first used by Spatial Organism). NEW code (2026-11-27, his: "i want a
 * bunch of spacial tools"). One sound (the input's mid, L+R / 2) placed at an ANGLE and a DISTANCE:
 *   angle −1 (hard left) … 0 (ahead) … 1 (hard right) — equal-power gains (stereo-tools' law: L² + R² = 1)
 *   distance 0 (at the ear) … 1 (far): LEVEL falls as 1 / (1 + 7·d) (−18 dB at 1, about the inverse-distance law from 0.5 m to 4 m),
 *            AIR takes the highs (a one-pole low-pass from 20 kHz at 0 down to 2.5 kHz at 1), PRE-DELAY grows (0 … 12 ms: the sound arrives later)
 *   ears 0 … 1 (binaural): the far ear hears it later (up to 0.66 ms, a head's width) and darker (head shadow) — 0 = plain stereo, exactly
 *   MusicParts.Panner() → { set({ angle, distance, ears }, sr), process(x) → [L, R] in .out (Float64Array(2)), reset() }
 * Allocation-free after it is made (a 1 s delay ring); self-contained (stringified into worklets). A component imports no tool. */
(function (root) {
  'use strict';
  function Panner() {
    const N = 65536, buf = new Float64Array(N), out = new Float64Array(2);
    let sr = 48000, w = 0, ang = 0, dist = 0, ears = 0, gL = Math.SQRT1_2, gR = Math.SQRT1_2, lvl = 1, airA = 1, airZ = 0, pre = 0, itdL = 0, itdR = 0, shA = 1, shZL = 0, shZR = 0;
    const onePole = (hz) => 1 - Math.exp(-2 * Math.PI * Math.min(hz, sr * 0.45) / sr);
    function set(o, rate) {
      if (rate) sr = rate; o = o || {};
      if (o.angle !== undefined) ang = Math.max(-1, Math.min(1, +o.angle || 0)); if (o.distance !== undefined) dist = Math.max(0, Math.min(1, +o.distance || 0)); if (o.ears !== undefined) ears = Math.max(0, Math.min(1, +o.ears || 0));
      const th = (ang + 1) * Math.PI / 4; gL = Math.cos(th); gR = Math.sin(th);
      lvl = 1 / (1 + 7 * dist); airA = dist <= 0 ? 1 : onePole(20000 * Math.pow(2500 / 20000, dist)); pre = dist * 0.012 * sr;
      const itd = ears * 0.00066 * sr * Math.abs(ang); itdL = ang > 0 ? itd : 0; itdR = ang < 0 ? itd : 0;
      shA = onePole(20000 * Math.pow(1800 / 20000, ears * Math.abs(ang)));
    }
    // read the ring `d` samples back, linearly between samples
    function tap(d) { const p = w - d, i = Math.floor(p), f = p - i, a = buf[(i + N) & (N - 1)], b = buf[(i + 1 + N) & (N - 1)]; return a + (b - a) * f; }
    function process(x) {
      airZ += airA * (x - airZ); if (Math.abs(airZ) < 1e-20) airZ = 0;
      buf[w & (N - 1)] = airZ * lvl;
      let l = tap(pre + itdL) * gL, r = tap(pre + itdR) * gR; w = (w + 1) & 0x7fffffff;
      if (ears > 0) { if (ang > 0) { shZL += shA * (l - shZL); l = shZL; } else if (ang < 0) { shZR += shA * (r - shZR); r = shZR; } }
      out[0] = l; out[1] = r; return out;
    }
    function reset() { buf.fill(0); airZ = 0; shZL = 0; shZR = 0; }
    set({}, 48000);
    return { set, process, reset, out };
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { Panner });
  if (typeof module !== 'undefined' && module.exports) module.exports = { Panner };
})(typeof window !== 'undefined' ? window : globalThis);
