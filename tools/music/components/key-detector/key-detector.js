/* eravos.component.key-detector 1.0.0 — a recording's key and mode (A minor, C major …), with how sure, and the twelve notes' weight: Song
 * Import SI1 (specs/eravos.song-import.spec; his words 2026-11-28: "Can we make the canvas import a song and open the relevant tools to make
 * it?"). NEW code.
 *   chroma: every frame of spectral-features (size 8192, so a low note's bins are a semitone apart), each bin from Low to High Hz given to its
 *   nearest note (A = 440 Hz), its magnitude log-compressed, summed over the recording; a frame quieter than the gate adds nothing.
 *   the key: the chroma correlated with the Krumhansl–Kessler major and minor profiles (Krumhansl 1990) on each of the twelve tonics — the
 *   best of the 24; conf = how far it stands above the second best (0…1). The relative major / minor (C major and A minor share their notes)
 *   are told apart by where the weight sits — the profiles carry that.
 *   MusicParts.KeyDetector(SpectralFrames?) → { set({ low, high }, sr), push(x), result() → { key: 'A', tonic (0 = C … 11 = B), mode:
 *     'minor' | 'major', conf, chroma [12], scores [24] }, reset() }   ·   KeyDetector.analyse(samples, sr, o) → result
 * push() is allocation-free; result() allocates (it is asked once, at the end). Self-contained with spectral-features' kernel beside it. */
(function (root) {
  'use strict';
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  const MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  function corr(a, b) { const n = a.length; let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n;
    let s = 0, sa = 0, sb = 0; for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; s += x * y; sa += x * x; sb += y * y; } return sa && sb ? s / Math.sqrt(sa * sb) : 0; }
  function KeyDetector(SF) {
    SF = SF || (root.MusicParts && root.MusicParts.SpectralFrames) || (typeof require === 'function' ? require('../spectral-features/spectral-features.js').SpectralFrames : null);
    const sf = SF(), chroma = new Float64Array(12); let sr = 48000, low = 55, high = 2000, pcOf = null;
    function set(o, rate) { if (rate) sr = rate; o = o || {}; if (o.low !== undefined) low = Math.max(20, +o.low); if (o.high !== undefined) high = Math.min(sr / 2, +o.high);
      sf.set({ size: 8192, hop: 2048 }, sr); pcOf = new Int8Array(sf.size / 2 + 1);
      for (let k = 0; k <= sf.size / 2; k++) { const f = k * sr / sf.size; pcOf[k] = f < low || f > high ? -1 : ((Math.round(12 * Math.log2(f / 440)) % 12) + 12 + 9) % 12; }
      reset(); }
    function reset() { sf.reset(); chroma.fill(0); }
    function push(x) { if (!sf.push(x)) return false; const m = sf.mag; let e = 0; for (let k = 0; k < m.length; k++) e += m[k] * m[k];
      if (e < 1e-8) return true; for (let k = 0; k < m.length; k++) { const p = pcOf[k]; if (p >= 0) chroma[p] += Math.log(1 + 1000 * m[k]); } return true; }
    function result() { const c = Array.from(chroma), scores = [];
      for (let t = 0; t < 12; t++) { const rot = c.slice(t).concat(c.slice(0, t)); scores.push(corr(rot, MAJOR)); }
      for (let t = 0; t < 12; t++) { const rot = c.slice(t).concat(c.slice(0, t)); scores.push(corr(rot, MINOR)); }
      const order = scores.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]), b = order[0][1], tonic = b % 12, mode = b < 12 ? 'major' : 'minor';
      const conf = Math.max(0, Math.min(1, (order[0][0] - order[1][0]) * 5));
      const mx = Math.max(...c) || 1; return { key: NAMES[tonic], tonic, mode, conf, chroma: c.map(v => v / mx), scores }; }
    return { set, push, reset, result };
  }
  KeyDetector.analyse = function (samples, sr, o) { const k = KeyDetector(o && o.SpectralFrames); k.set(o || {}, sr); for (let i = 0; i < samples.length; i++) k.push(samples[i]); return k.result(); };
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { KeyDetector, KEY_NAMES: NAMES });
  if (typeof module !== 'undefined' && module.exports) module.exports = { KeyDetector, KEY_NAMES: NAMES };
})(typeof window !== 'undefined' ? window : globalThis);
