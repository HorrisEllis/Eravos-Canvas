/* eravos.component.karplus-string 1.0.0 — a string (Piano's strings; pluck forge, percussion physics).
 * NEW code (2026-11-06, for Piano — his "yes"), proved on its own (karplus-string.test.mjs).
 *   tick(excitation) → the string: a loop of  delay line (N samples) → Thiran allpass (the fraction) → stiffness allpasses (stretch) →
 *   one-pole low-pass (bright) → loss  → back in with the excitation.
 *   set(f0, sr, { t60, bright, stretch, detune }):
 *     tuning   EXACT: the loop's total phase delay at f0 is made sr / f0 — the low-pass's and the allpasses' own delay at f0 is worked out
 *              (complex response) and taken off; the Thiran coefficient is corrected for its own error at f0 (a few fixed-point steps): the loop's delay at f0 is sr / f0 to 1e-6 samples; measured < 0.5 cent.
 *     t60      the time the fundamental takes to fall 60 dB (the loss per pass, with the low-pass's own loss at f0 taken out; never a gain
 *              above 1 anywhere, so a very dark, long string decays a little sooner than asked — stable always)
 *     bright   0…1: the loop low-pass (dark … open); higher partials die sooner when dark, as on a real string
 *     stretch  0…1: four first-order allpasses with c = −0.6 · stretch: higher partials run a shorter loop, so they are sharp — a stiff
 *              string, a piano's stretch. Kept inside the loop length (low notes take the full amount; very high ones are eased off)
 *     detune   cents (for a second or third string of the same note)
 *   reset() · energy. 20 Hz – 5 kHz. Real-time safe: tick() allocates nothing (the line is sized once to 20 Hz at the rate).
 *   MusicParts.KString() · MusicParts.kstringLoopDelay(o) (the phase delay of the loop at a frequency, for tests and tools)
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  const M = 4;
  // phase delay (samples) of a filter given by numerator / denominator polynomials in z⁻¹, at w (rad/sample)
  function phaseDelay(b, a, w) {
    let nr = 0, ni = 0, dr = 0, di = 0;
    for (let k = 0; k < b.length; k++) { nr += b[k] * Math.cos(-k * w); ni += b[k] * Math.sin(-k * w); }
    for (let k = 0; k < a.length; k++) { dr += a[k] * Math.cos(-k * w); di += a[k] * Math.sin(-k * w); }
    const ph = Math.atan2(ni, nr) - Math.atan2(di, dr); let p = -ph; while (p < 0) p += 2 * Math.PI; return p / w;
  }
  function magnitude(b, a, w) {
    let nr = 0, ni = 0, dr = 0, di = 0;
    for (let k = 0; k < b.length; k++) { nr += b[k] * Math.cos(-k * w); ni += b[k] * Math.sin(-k * w); }
    for (let k = 0; k < a.length; k++) { dr += a[k] * Math.cos(-k * w); di += a[k] * Math.sin(-k * w); }
    return Math.hypot(nr, ni) / Math.hypot(dr, di);
  }
  function KString() {
    let sr = 48000, size = 0, buf = null, w = 0, N = 2, eta = 0, thX = 0, thY = 0, p = 0, lpY = 0, loss = 0.99, c = 0;
    const apX = new Float64Array(M), apY = new Float64Array(M);
    const api = {
      set(f0, rate, o) {
        o = o || {}; if (rate && rate !== sr) { sr = rate; buf = null; }
        if (!buf) { size = Math.ceil(sr / 20) + 8; buf = new Float64Array(size); w = 0; }
        const f = Math.max(20, Math.min(5000, f0 * Math.pow(2, (o.detune || 0) / 1200))), w0 = 2 * Math.PI * f / sr, D = sr / f;
        p = 0.85 * (1 - Math.max(0, Math.min(1, o.bright === undefined ? 0.6 : o.bright)));   // the loop low-pass pole: y = (1 − p)x + p·y1
        const lpB = [1 - p], lpA = [1, -p], dLP = phaseDelay(lpB, lpA, w0);
        // stiffness: as much as fits in the loop (at least 1.5 samples left for the line + the fraction)
        c = -0.6 * Math.max(0, Math.min(1, o.stretch || 0));
        let dAP = c ? phaseDelay([c, 1], [1, c], w0) : 1; while (c && dLP + M * dAP > D - 1.6) { c *= 0.8; dAP = phaseDelay([c, 1], [1, c], w0); if (c > -1e-3) { c = 0; dAP = 1; } }
        const apTotal = c ? M * dAP : 0;
        let R = D - dLP - apTotal; N = Math.floor(R - 0.5); if (N < 1) N = 1; let frac = R - N;   // the Thiran's delay 0.5 … 1.5 (stable, flat)
        eta = (1 - frac) / (1 + frac);
        let f2 = frac; for (let it = 0; it < 6; it++) { const err = phaseDelay([eta, 1], [1, eta], w0) - frac; f2 -= err; eta = (1 - f2) / (1 + f2); }   // corrected for its own error at f0 (converges in a few steps)
        const lpMag = magnitude(lpB, lpA, w0);
        loss = Math.min(0.99995, Math.pow(0.001, 1 / (Math.max(0.01, o.t60 || 2) * f)) / lpMag);   // per pass, so the fundamental falls 60 dB in t60 — never above 1 at any frequency (below f0 the low-pass passes more): a very dark string just dies a little sooner, as a real one does
      },
      reset() { if (buf) buf.fill(0); thX = thY = lpY = 0; apX.fill(0); apY.fill(0); },
      loop: () => ({ N, eta, c, p, loss }),   // the loop as set (tests: its delay at f0 is sr / f0)
      get energy() { if (!buf) return 0; let e = 0; for (let i = 0; i < N; i++) { const v = buf[(w - 1 - i + size) % size]; e += v * v; } return e; },
      tick(x) {
        if (!buf) api.set(220, sr, {});
        let r = w - N; if (r < 0) r += size; const y = buf[r];
        // fraction (Thiran, first order)
        let v = eta * y + thX - eta * thY; thX = y; thY = v;
        // stiffness (four first-order allpasses)
        if (c) for (let k = 0; k < M; k++) { const o = c * v + apX[k] - c * apY[k]; apX[k] = v; apY[k] = o; v = o; }
        // damping, loss
        lpY = (1 - p) * v + p * lpY; if (lpY < 1e-20 && lpY > -1e-20) lpY = 0;
        buf[w] = x + lpY * loss; if (++w >= size) w = 0;
        return y;
      },
    };
    return api;
  }
  // the loop's total phase delay at a frequency (tests: the tuning is exact at f0, and shorter above it when stretched)
  function kstringLoopDelay(N, eta, c, p, w) { return N + phaseDelay([eta, 1], [1, eta], w) + (c ? M * phaseDelay([c, 1], [1, c], w) : 0) + phaseDelay([1 - p], [1, -p], w); }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { KString, kstringLoopDelay });
  if (typeof module !== 'undefined' && module.exports) module.exports = { KString, kstringLoopDelay, phaseDelay };
})(typeof window !== 'undefined' ? window : globalThis);
