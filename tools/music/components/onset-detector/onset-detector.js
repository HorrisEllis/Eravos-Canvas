/* eravos.component.onset-detector 1.0.0 — where each hit starts, how strong, and in which band (low · mid · high · all): Song Import SI1 and
 * SI2 (specs/eravos.song-import.spec; his words 2026-11-28: "Can we make the canvas import a song and open the relevant tools to make it?").
 * NEW code. Spectral flux (Bello et al. 2005; Dixon 2006): the log-compressed energy that ARRIVED in each band since the frame before, from
 * spectral-features' frames; an onset is a peak of that flux above an adaptive threshold — the median of the last Window frames × Sensitivity
 * plus a floor — at least Gap after the band's last onset. The peak is confirmed one frame later (it must fall after it), so an onset is
 * reported one hop late, stamped with its own time (the frame's centre).
 *   bands: low 20–150 Hz (kicks, bass) · mid 150–2000 Hz (snares, stabs) · high 6–16 kHz (hats) · all 20 Hz–16 kHz
 *   MusicParts.OnsetDetector(SpectralFrames?) → { set({ size, hop, sensitivity, floor, gap }, sr), push(x) → how many onsets were found,
 *     onsets (the last ones found: { t, band, strength }), env (the all-band flux of the last frame — the beat tracker's input), envLow / envMid (the low and mid bands'), reset() }
 *   MusicParts.OnsetDetector.analyse(samples, sr, o) → { onsets: [...], env: Float32Array (one value per frame), low / mid (the low and mid bands'), frameRate, t0 (the first frame's time) } (a whole recording; allocates)
 * Allocation-free in push() (fixed rings; the onsets of a push go into a fixed list). Self-contained with spectral-features' kernel beside it. */
(function (root) {
  'use strict';
  const BANDS = [['low', 20, 150], ['mid', 150, 2000], ['high', 6000, 16000], ['all', 20, 16000]];
  function OnsetDetector(SF) {
    SF = SF || (root.MusicParts && root.MusicParts.SpectralFrames) || (typeof require === 'function' ? require('../spectral-features/spectral-features.js').SpectralFrames : null);
    const sf = SF(), B = BANDS.length, WIN = 16;
    let sr = 48000, sensitivity = 1.5, floor = 1, gap = 0.06;
    const hist = BANDS.map(() => new Float32Array(WIN)), tmp = new Float32Array(WIN), prev = new Float32Array(B), prev2 = new Float32Array(B), prevT = new Float64Array(B), last = new Float64Array(B), thr = new Float32Array(B);
    let hi = 0, nf = 0, env = 0, envLow = 0, envMid = 0, framed = false; const found = [];
    for (let i = 0; i < 8; i++) found.push({ t: 0, band: '', strength: 0 });
    let nFound = 0;
    function set(o, rate) { if (rate) sr = rate; o = o || {};
      if (o.sensitivity !== undefined) sensitivity = Math.max(1, Math.min(4, +o.sensitivity));
      if (o.floor !== undefined) floor = Math.max(0, +o.floor);
      if (o.gap !== undefined) gap = Math.max(0.005, Math.min(1, +o.gap));
      sf.set({ size: o.size !== undefined ? o.size : 1024, hop: o.hop !== undefined ? o.hop : 256 }, sr); reset(); }
    function reset() { sf.reset(); hist.forEach(h => h.fill(0)); prev.fill(0); prev2.fill(0); last.fill(-1e9); hi = 0; nf = 0; env = 0; nFound = 0; }
    function median(h) { for (let i = 0; i < WIN; i++) tmp[i] = h[i]; tmp.sort(); return 0.5 * (tmp[WIN / 2 - 1] + tmp[WIN / 2]); }
    function push(x) {
      nFound = 0; framed = sf.push(x); if (!framed) return 0;
      const t = sf.time;
      for (let b = 0; b < B; b++) {
        const f = sf.flux(BANDS[b][1], BANDS[b][2]) / Math.max(1, Math.sqrt((BANDS[b][2] - BANDS[b][1]) / 100));   // per band, so a wide band does not swamp a narrow one
        if (b === B - 1) env = f; if (b === 0) envLow = f; if (b === 1) envMid = f;
        // the frame before is an onset if it peaked over its threshold and this one is lower
        if (nf >= 2 && prev[b] > thr[b] && prev[b] >= prev2[b] && prev[b] > f && prevT[b] - last[b] >= gap && nFound < found.length) {
          last[b] = prevT[b]; const o = found[nFound++]; o.t = prevT[b]; o.band = BANDS[b][0]; o.strength = prev[b];
        }
        thr[b] = median(hist[b]) * sensitivity + floor;   // the threshold for this frame, from the frames before it
        hist[b][hi] = f; prev2[b] = prev[b]; prev[b] = f; prevT[b] = t;
      }
      hi = (hi + 1) % WIN; nf++;
      return nFound;
    }
    return { set, push, reset, get onsets() { return found.slice(0, nFound); }, get env() { return env; }, get envLow() { return envLow; }, get envMid() { return envMid; }, get framed() { return framed; }, get frameRate() { return sr / sf.hop; }, BANDS: BANDS.map(b => b[0]) };
  }
  OnsetDetector.analyse = function (samples, sr, o) {
    const d = OnsetDetector(o && o.SpectralFrames); d.set(o || {}, sr); const onsets = [], env = [], low = [], mid = [];
    for (let i = 0; i < samples.length; i++) { const n = d.push(samples[i]); if (d.framed) { env.push(d.env); low.push(d.envLow); mid.push(d.envMid); } for (let k = 0; k < n; k++) { const x = d.onsets[k]; onsets.push({ t: x.t, band: x.band, strength: x.strength }); } }
    return { onsets, env: Float32Array.from(env), low: Float32Array.from(low), mid: Float32Array.from(mid), frameRate: d.frameRate, t0: ((o && o.size) || 1024) / 2 / sr };
  };
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { OnsetDetector, ONSET_BANDS: BANDS.map(b => b[0]) });
  if (typeof module !== 'undefined' && module.exports) module.exports = { OnsetDetector, ONSET_BANDS: BANDS.map(b => b[0]) };
})(typeof window !== 'undefined' ? window : globalThis);
