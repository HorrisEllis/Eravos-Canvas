/* eravos.component.pitch-tracker 1.0.0 — what pitch a voice (or any single line) is singing, now, and how sure (VL1 of the Voice Lab;
 * 6 planned tools stand on it). NEW code (2026-11-27, his: "Full t pain auto tune. Synthesized voice. Everything needed for remixing").
 * YIN (de Cheveigné & Kawahara 2002): the cumulative-mean-normalised difference d'(τ) of a frame against itself τ samples later; the first
 * dip under Threshold is the period (the first, not the deepest: a deeper dip at 2τ is the octave below, the classic mistake — the octave
 * guard). Parabolic interpolation between samples gives the period to a fraction of a sample (cents-level accuracy at any pitch).
 *   frame 2048 · hop 256 (at 48 kHz: 43 ms seen, a new reading every 5.3 ms) · min 50 Hz … max 1500 Hz · threshold 0.15
 *   confidence 1 − d'(τ) (0…1); voiced when the confidence ≥ 1 − threshold AND the frame is louder than Gate (−50 dBFS); unvoiced → hz 0
 *   MusicParts.PitchTracker() → { set({ min, max, threshold, gate }, sr), push(x) → true when a new reading is ready, hz, conf, voiced,
 *                                 cents(refHz) the reading against a reference, reset() }
 * Allocation-free after it is made (its frame and difference buffers are fixed); self-contained (stringified into worklets). A component
 * imports no tool. */
(function (root) {
  'use strict';
  function PitchTracker() {
    const N = 2048, HOP = 256, buf = new Float32Array(N), frame = new Float32Array(N), d = new Float32Array(N / 2 + 1);
    let sr = 48000, minHz = 50, maxHz = 1500, thr = 0.15, gateLin = Math.pow(10, -50 / 20), w = 0, filled = 0, since = 0;
    const out = { hz: 0, conf: 0, voiced: false };
    function set(o, rate) { if (rate) sr = rate; if (!o) return; if (o.min !== undefined) minHz = Math.max(20, +o.min); if (o.max !== undefined) maxHz = Math.min(sr / 4, +o.max);
      if (o.threshold !== undefined) thr = Math.max(0.01, Math.min(0.5, +o.threshold)); if (o.gate !== undefined) gateLin = Math.pow(10, Math.max(-120, Math.min(0, +o.gate)) / 20); }
    function reset() { buf.fill(0); w = 0; filled = 0; since = 0; out.hz = 0; out.conf = 0; out.voiced = false; }
    // one reading from the last N samples (the ring unrolled into `frame`)
    function analyse() {
      for (let i = 0; i < N; i++) frame[i] = buf[(w + i) % N];
      let e = 0; for (let i = 0; i < N; i++) e += frame[i] * frame[i]; const rms = Math.sqrt(e / N);
      const tMin = Math.max(2, Math.floor(sr / maxHz)), tMax = Math.min(N / 2 - 1, Math.ceil(sr / minHz)), W = N / 2;
      d[0] = 1; let run = 0;
      for (let t = 1; t <= tMax + 1; t++) {   // the difference of the frame with itself t samples later, then normalised by its running mean
        let s = 0; for (let i = 0; i < W; i++) { const q = frame[i] - frame[i + t]; s += q * q; }
        run += s; d[t] = run > 0 ? s * t / run : 1;
      }
      let tau = -1;
      for (let t = tMin; t <= tMax; t++) if (d[t] < thr) { while (t + 1 <= tMax && d[t + 1] < d[t]) t++; tau = t; break; }   // the FIRST dip under the threshold, to its bottom
      if (tau < 0) { let best = 1e9; for (let t = tMin; t <= tMax; t++) if (d[t] < best) { best = d[t]; tau = t; } }        // none under: the lowest (reported unsure)
      const a = d[tau - 1], b = d[tau], c = d[tau + 1], den = a - 2 * b + c, shift = den !== 0 ? 0.5 * (a - c) / den : 0;
      const period = tau + Math.max(-1, Math.min(1, shift));
      out.conf = Math.max(0, Math.min(1, 1 - b));
      out.voiced = rms >= gateLin && b < thr;
      out.hz = out.voiced ? sr / period : 0;
    }
    function push(x) {
      buf[w] = x; w = (w + 1) % N; if (filled < N) filled++;
      if (++since >= HOP && filled >= N) { since = 0; analyse(); return true; }
      return false;
    }
    const cents = (ref) => out.hz > 0 && ref > 0 ? 1200 * Math.log2(out.hz / ref) : 0;
    return { set, push, reset, cents, get hz() { return out.hz; }, get conf() { return out.conf; }, get voiced() { return out.voiced; }, FRAME: N, HOP };
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { PitchTracker });
  if (typeof module !== 'undefined' && module.exports) module.exports = { PitchTracker };
})(typeof window !== 'undefined' ? window : globalThis);
