/* eravos.component.spectral-features 1.0.0 — what a sound's spectrum is doing, frame by frame: the magnitudes, the energy in any band, the
 * flux (how much new energy arrived), the centroid (its brightness). The ground floor of Song Import (specs/eravos.song-import.spec SI1:
 * onset-detector and key-detector read their frames from it). NEW code (2026-11-28, his: "Can we make the canvas import a song and open the
 * relevant tools to make it?").
 *   a short-time Fourier transform: frame Size (512 … 8192, a power of two; 2048) with a Hann window, a new frame every Hop samples (512)
 *   MusicParts.SpectralFrames() → { set({ size, hop }, sr), push(x) → true when a new frame is ready, mag (Float32Array size/2 + 1, the
 *     magnitudes of the last frame), band(lo, hi) its energy between two frequencies, flux(lo, hi) the energy that arrived since the frame
 *     before (log-compressed, half-wave: only rises count), centroid (Hz), binHz, time (seconds since reset: the frame's centre), reset() }
 * Allocation-free after set() (its buffers are fixed for a size); self-contained (stringified into worklets). A component imports no tool. */
(function (root) {
  'use strict';
  // in-place radix-2 FFT of re / im (length a power of two)
  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let len = 2; len <= n; len <<= 1) { const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
      for (let i = 0; i < n; i += len) { let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) { const p = i + k, q = p + len / 2, xr = re[q] * cr - im[q] * ci, xi = re[q] * ci + im[q] * cr;
          re[q] = re[p] - xr; im[q] = im[p] - xi; re[p] += xr; im[p] += xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } }
  }
  function SpectralFrames() {
    let sr = 48000, size = 2048, hop = 512, ring, win, re, im, mag, prevLog, curLog, w = 0, filled = 0, since = 0, frames = 0;
    function alloc() { ring = new Float32Array(size); win = new Float32Array(size); re = new Float32Array(size); im = new Float32Array(size);
      mag = new Float32Array(size / 2 + 1); prevLog = new Float32Array(size / 2 + 1); curLog = new Float32Array(size / 2 + 1);
      for (let i = 0; i < size; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / size); }
    function set(o, rate) { if (rate) sr = rate; o = o || {};
      if (o.size !== undefined) { let s = 512; while (s < +o.size && s < 8192) s <<= 1; size = s; }
      if (o.hop !== undefined) hop = Math.max(32, Math.min(size, Math.round(+o.hop)));
      alloc(); reset(); }
    function reset() { ring.fill(0); prevLog.fill(0); curLog.fill(0); mag.fill(0); w = 0; filled = 0; since = 0; frames = 0; }
    function analyse() {
      for (let i = 0; i < size; i++) { re[i] = ring[(w + i) % size] * win[i]; im[i] = 0; }
      fft(re, im);
      const g = 2 / (size * 0.5);   // a full-scale sine reads 1 at its bin (Hann's gain 0.5)
      for (let k = 0; k <= size / 2; k++) { mag[k] = Math.hypot(re[k], im[k]) * g; prevLog[k] = curLog[k]; curLog[k] = Math.log(1 + 100 * mag[k]); }
      frames++;
    }
    function push(x) { ring[w] = x; w = (w + 1) % size; if (filled < size) filled++; since++;
      if (filled === size && since >= hop) { since = 0; analyse(); return true; } return false; }
    const bin = (hz) => Math.max(0, Math.min(size / 2, Math.round(hz * size / sr)));
    function band(lo, hi) { let e = 0; for (let k = bin(lo), K = bin(hi); k <= K; k++) e += mag[k] * mag[k]; return e; }
    function flux(lo, hi) { if (frames < 2) return 0; let f = 0; for (let k = bin(lo), K = bin(hi); k <= K; k++) { const d = curLog[k] - prevLog[k]; if (d > 0) f += d; } return f; }
    function centroid() { let s = 0, m = 0; for (let k = 1; k <= size / 2; k++) { s += k * mag[k]; m += mag[k]; } return m > 0 ? s / m * sr / size : 0; }
    alloc();
    return { set, push, reset, band, flux, get mag() { return mag; }, get centroid() { return centroid(); }, get binHz() { return sr / size; }, get size() { return size; }, get hop() { return hop; },
      get time() { return (frames ? (size + (frames - 1) * hop) - size / 2 : 0) / sr; }, get frames() { return frames; } };
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { SpectralFrames, FFT: fft });
  if (typeof module !== 'undefined' && module.exports) module.exports = { SpectralFrames, FFT: fft };
})(typeof window !== 'undefined' ? window : globalThis);
