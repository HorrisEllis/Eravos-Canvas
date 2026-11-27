/* eravos.component.tension-meter 1.0.0 — how much tension a sound carries, now (6 planned tools stand on it; first used by Tension Field).
 * NEW code (2026-11-27, his: "the way it creates ripples and tension"). Four kinds are HEARD from the audio, each 0…1, and summed by weights:
 *   loudness   the level (RMS over ~300 ms) on a dB range: −48 dBFS → 0, 0 dBFS → 1
 *   brightness where the sound's weight sits (the spectral centre, estimated from how fast it changes: a first difference's energy against
 *              its own — 2·sin(π f / sr) for a sine), on a log range: 150 Hz → 0, 6 kHz → 1
 *   density    hits per second (a rise of 4 dB inside 20 ms is a hit), over the last 2 s: 0 → 0, 8 per second → 1
 *   motion     how fast the brightness moves (measured every 100 ms, smoothed over ~0.5 s): still → 0, half the range a second (a sweep of
 *              ~2.7 octaves a second) → 1; one octave a second reads ~0.38
 * The two kinds the planned spec also names — harmonic (needs the notes) and pitch instability — are open: they read notes, not audio.
 *   MusicParts.TensionMeter() → { set({ wLoud, wBright, wDense, wMotion }, sr), block(L, R, n) → state { loudness, brightness, density, motion, sum } }
 * Allocation-free after it is made; self-contained (stringified into worklets). A component imports no tool. */
(function (root) {
  'use strict';
  function TensionMeter() {
    let sr = 48000, since = 0, ms = 0, msD = 0, prev = 0, aLoud = 0, aBr = 0, br = 0, brPrev = 0, mot = 0, aMot = 0, fast = 0, slow = 0, aFast = 0, aSlow = 0, armed = true;
    const W = { wLoud: 1, wBright: 1, wDense: 1, wMotion: 1 }, HITS = new Float64Array(64); let hn = 0, t = 0;
    const st = { loudness: 0, brightness: 0, density: 0, motion: 0, sum: 0 };
    function set(o, rate) { if (rate) sr = rate; if (o) Object.keys(W).forEach(k => { if (o[k] !== undefined) W[k] = Math.max(0, +o[k]); });
      const k = (s) => Math.exp(-1 / Math.max(1, s * sr)); aLoud = k(0.3); aBr = k(0.15); aMot = k(0.5); aFast = k(0.004); aSlow = k(0.06); }
    function block(L, R, n) {
      let e = 0, d = 0;
      for (let i = 0; i < n; i++) {
        const x = R ? (L[i] + R[i]) * 0.5 : L[i], dx = x - prev; prev = x; e += x * x; d += dx * dx;
        const a = x < 0 ? -x : x; fast = aFast * fast + (1 - aFast) * a; slow = aSlow * slow + (1 - aSlow) * a;
        // a hit: the fast level jumps 4 dB over the slow one (and re-arms once it falls back)
        if (armed && fast > 1e-4 && fast > slow * 1.585) { HITS[hn++ & 63] = t + i / sr; armed = false; } else if (!armed && fast < slow * 1.12) armed = true;
      }
      t += n / sr;
      const bl = Math.pow(aLoud, n); ms = bl * ms + (1 - bl) * (e / n);
      const bb = Math.pow(aBr, n); msD = bb * msD + (1 - bb) * (d / n);
      const db = 10 * Math.log10(ms + 1e-20); st.loudness = db <= -48 ? 0 : db >= 0 ? 1 : 1 + db / 48;
      const ratio = Math.min(2, Math.sqrt(msD / (ms + 1e-20))), f = Math.asin(ratio / 2) * sr / Math.PI;
      br = ms < 1e-10 ? 0 : Math.max(0, Math.min(1, Math.log(Math.max(f, 1) / 150) / Math.log(6000 / 150)));
      st.brightness = br;
      since += n / sr; if (since >= 0.1) { const r = Math.abs(br - brPrev) / since, bm = Math.pow(aMot, since * sr); mot = bm * mot + (1 - bm) * r; brPrev = br; since = 0; } st.motion = Math.min(1, mot / 0.5);
      let c = 0; for (let k = 0; k < 64 && k < hn; k++) if (t - HITS[k] <= 2) c++; st.density = Math.min(1, c / 2 / 8);
      const wsum = W.wLoud + W.wBright + W.wDense + W.wMotion;
      st.sum = wsum > 0 ? (W.wLoud * st.loudness + W.wBright * st.brightness + W.wDense * st.density + W.wMotion * st.motion) / wsum : 0;
      return st;
    }
    function reset() { since = 0; ms = 0; msD = 0; prev = 0; br = 0; brPrev = 0; mot = 0; fast = 0; slow = 0; hn = 0; t = 0; armed = true; HITS.fill(0); }
    set({}, 48000);
    return { set, block, reset, state: st };
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { TensionMeter });
  if (typeof module !== 'undefined' && module.exports) module.exports = { TensionMeter };
})(typeof window !== 'undefined' ? window : globalThis);
