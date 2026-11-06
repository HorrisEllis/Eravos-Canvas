/* eravos.component.stereo-tools 1.0.0 — panning, spread and mono-below (phase 1 · 17 tools stand on it). NEW code (2026-11-06, first
 * used by Swarm Oscillator); extracting it out of wobble-bass (width, mono below) is a later step that must null-render.
 *   panL(x), panR(x)        equal-power gains for x −1 (left) … 1 (right): panL² + panR² = 1, both −3 dB in the middle
 *   spread(i, n, width)     where the i-th of n voices sits: evenly from −width to +width (one voice: the middle)
 *   MonoBelow()             { set(hz, sr), process(L, R, n) in place }: below hz the side signal is taken out (mid only), above it
 *                           the stereo is untouched. Only the side is filtered (two one-pole high-passes, 12 dB/oct) and the mid
 *                           never is, so a mono signal comes out exactly as it went in, at every frequency.
 *   correlation(L, R, n)    −1…1 over a block (1 = mono, 0 = unrelated, −1 = out of phase)
 * Allocation-free after construction; self-contained (stringified into worklets). A component imports no tool. */
(function (root) {
  'use strict';
  function panL(x) { return Math.cos((x < -1 ? -1 : x > 1 ? 1 : x) * Math.PI / 4 + Math.PI / 4); }
  function panR(x) { return Math.sin((x < -1 ? -1 : x > 1 ? 1 : x) * Math.PI / 4 + Math.PI / 4); }
  function spread(i, n, width) { return n < 2 ? 0 : width * (2 * i / (n - 1) - 1); }
  function MonoBelow() {
    let a = 0, z1 = 0, z2 = 0, on = true, hz = 120, sr = 48000;
    function set(f, rate) { if (rate) sr = rate; hz = f; on = f > 0; a = 1 - Math.exp(-2 * Math.PI * Math.max(1, f) / sr); }
    // the side signal is high-passed (two one-pole high-passes, 12 dB/oct below hz); the mid is not touched, so mono passes exactly
    function process(L, R, n) {
      if (!on) return;
      for (let j = 0; j < n; j++) {
        const mid = 0.5 * (L[j] + R[j]), side = 0.5 * (L[j] - R[j]);
        z1 += a * (side - z1); const h1 = side - z1; z2 += a * (h1 - z2); const h2 = h1 - z2;
        if (z1 < 1e-20 && z1 > -1e-20) z1 = 0; if (z2 < 1e-20 && z2 > -1e-20) z2 = 0;
        L[j] = mid + h2; R[j] = mid - h2;
      }
    }
    set(hz, sr);
    return { set, process, reset() { z1 = z2 = 0; } };
  }
  function correlation(L, R, n) { let lr = 0, ll = 0, rr = 0; for (let j = 0; j < n; j++) { lr += L[j] * R[j]; ll += L[j] * L[j]; rr += R[j] * R[j]; } return ll && rr ? lr / Math.sqrt(ll * rr) : 1; }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { panL, panR, spread, MonoBelow, correlation });
  if (typeof module !== 'undefined' && module.exports) module.exports = { panL, panR, spread, MonoBelow, correlation };
})(typeof window !== 'undefined' ? window : globalThis);
