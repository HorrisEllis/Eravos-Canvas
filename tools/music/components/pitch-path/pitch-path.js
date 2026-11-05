/* eravos.component.pitch-path 1.0.0 — a note's pitch along a drawn path (his words, 2026-11-05: "make it easier and the drawing more smooth
 * and connects to each other"). A note's bend could only go from → to with one easing shape, so a drawn wave became many short notes with
 * corners between them, each restarting the sound. A PATH is many points through the note, joined by a monotone cubic (Fritsch–Carlson):
 * smooth, and never overshooting past what was drawn. The piano roll draws it and the engine plays it with this same function.
 *   MusicParts.pathAt(path, f) → semitones at f (0…1 of the note)          path: [[f, semitones], …] f ascending, 0 first, 1 last
 *   MusicParts.smoothLine(pts, win) → the hand's jitter taken out (a local straight-line fit; the ends follow the line's trend)
 *   MusicParts.simplifyPath(path, eps, max) → at most `max` points, none further than eps semitones from the smooth line through all
 * A component imports no tool. */
(function (root) {
  'use strict';
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  // monotone cubic Hermite tangents (Fritsch–Carlson) — cached on the array
  function tangents(P) {
    if (P._m && P._m.length === P.length) return P._m;
    const n = P.length, d = [], m = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) d.push((P[i + 1][1] - P[i][1]) / ((P[i + 1][0] - P[i][0]) || 1e-9));
    if (n === 2) { m[0] = m[1] = d[0]; }
    else if (n > 2) {
      m[0] = d[0]; m[n - 1] = d[n - 2];
      for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
      for (let i = 0; i < n - 1; i++) { if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; } }
    }
    try { Object.defineProperty(P, '_m', { value: m, enumerable: false, configurable: true }); } catch (e) {}
    return m;
  }
  function pathAt(P, f) {
    if (!P || !P.length) return 0; if (P.length === 1) return P[0][1];
    if (f <= P[0][0]) return P[0][1]; if (f >= P[P.length - 1][0]) return P[P.length - 1][1];
    let i = 0, lo = 0, hi = P.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (P[mid][0] <= f) lo = mid; else hi = mid; } i = lo;
    const m = tangents(P), x0 = P[i][0], x1 = P[i + 1][0], h = (x1 - x0) || 1e-9, t = (f - x0) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * P[i][1] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * P[i + 1][1] + (t3 - t2) * h * m[i + 1];
  }
  // a local straight-line fit over ±win points (in the middle that is the moving average; at the ends it follows the line's trend
  // instead of keeping the hand's last wobble, which left a hook at the start and end of a stroke)
  function smoothLine(pts, win) {
    win = win || 2; if (pts.length < 3) return pts.map(p => p.slice());
    const n = pts.length;
    return pts.map((p, i) => {
      const a = Math.max(0, i - win), b = Math.min(n - 1, i + win); let sx = 0, sy = 0, sxx = 0, sxy = 0, k = 0;
      for (let j = a; j <= b; j++) { const x = pts[j][0], y = pts[j][1]; sx += x; sy += y; sxx += x * x; sxy += x * y; k++; }
      const den = k * sxx - sx * sx; if (Math.abs(den) < 1e-12) return [p[0], sy / k];
      const m = (k * sxy - sx * sy) / den; return [p[0], (sy - m * sx) / k + m * p[0]];
    });
  }
  // keep points until the cubic through the kept ones is within eps of every point (greedy refinement), at most `max`
  function simplifyPath(P, eps, max) {
    eps = eps || 0.08; max = max || 48; if (P.length <= 2) return P.map(p => p.slice());
    const keep = new Set([0, P.length - 1]);
    for (let guard = 0; guard < max; guard++) {
      const K = Array.from(keep).sort((a, b) => a - b).map(i => P[i]); let worst = -1, wd = eps;
      for (let i = 0; i < P.length; i++) { if (keep.has(i)) continue; const dd = Math.abs(pathAt(K, P[i][0]) - P[i][1]); if (dd > wd) { wd = dd; worst = i; } }
      if (worst < 0 || keep.size >= max) break; keep.add(worst);
    }
    return Array.from(keep).sort((a, b) => a - b).map(i => [+P[i][0].toFixed(4), Math.round(P[i][1] * 100) / 100]);
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { pathAt, smoothLine, simplifyPath });
  if (typeof module !== 'undefined' && module.exports) module.exports = { pathAt, smoothLine, simplifyPath };
})(typeof window !== 'undefined' ? window : globalThis);
