/* eravos.component.curve-edit 1.0.0 — editing a curve of points [[t 0…1, value], …], the way an image editor edits a path: pen, line, points,
 * smooth, erase, move. Spec: curve-edit.spec. Every op returns a new curve (the input is never changed). A component imports no tool.
 *   MusicParts.curveEdit.{ pen, line, movePoint, addPoint, removePoint, nearest, smooth, erase, offset, scale, resample, simplify, at } */
(function (root) {
  'use strict';
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const cp = (c) => (c || []).map(q => [+q[0], +q[1]]).sort((a, b) => a[0] - b[0]);
  function at(c, t) { c = c || []; if (!c.length) return 0; if (t <= c[0][0]) return c[0][1]; const n = c.length; if (t >= c[n - 1][0]) return c[n - 1][1];
    for (let i = 1; i < n; i++) if (t <= c[i][0]) { const a = c[i - 1], b = c[i], w = b[0] - a[0]; return w > 0 ? a[1] + (b[1] - a[1]) * (t - a[0]) / w : b[1]; } return c[n - 1][1]; }
  const ends = (c) => { if (!c.length) return [[0, 0], [1, 0]]; if (c[0][0] > 0) c.unshift([0, c[0][1]]); if (c[c.length - 1][0] < 1) c.push([1, c[c.length - 1][1]]); c[0][0] = 0; c[c.length - 1][0] = 1; return c; };
  const r4 = (q) => [Math.round(q[0] * 1e6) / 1e6, +(+q[1]).toPrecision(8)];
  function pen(curve, stroke) {
    const s = cp(stroke).map(q => [clamp(q[0], 0, 1), q[1]]); if (s.length < 2) return cp(curve);
    const bins = new Map(); s.forEach(([t, v]) => { const b = Math.round(t * 64) / 64; bins.set(b, bins.has(b) ? (bins.get(b) + v) / 2 : v); });
    const pts = Array.from(bins.entries()).sort((a, b) => a[0] - b[0]); const t0 = pts[0][0], t1 = pts[pts.length - 1][0], c = cp(curve);
    const keep = c.filter(q => q[0] < t0 - 1e-9 || q[0] > t1 + 1e-9);
    const out = keep.filter(q => q[0] < t0).concat(pts, keep.filter(q => q[0] > t1));
    return ends(simplify(out, 1e-9, 129).map(r4));
  }
  function line(curve, a, b) {
    if (a[0] > b[0]) [a, b] = [b, a]; a = [clamp(a[0], 0, 1), a[1]]; b = [clamp(b[0], 0, 1), b[1]];
    const c = cp(curve).filter(q => q[0] < a[0] - 1e-9 || q[0] > b[0] + 1e-9);
    return ends(c.filter(q => q[0] < a[0]).concat([a, b], c.filter(q => q[0] > b[0])).map(r4));
  }
  function movePoint(curve, i, t, v) {
    const c = cp(curve); if (!c[i]) return c; const n = c.length;
    const lo = i === 0 ? 0 : c[i - 1][0] + 1e-4, hi = i === n - 1 ? 1 : c[i + 1][0] - 1e-4;
    c[i] = r4([i === 0 ? 0 : i === n - 1 ? 1 : clamp(t, lo, hi), v]); return c;
  }
  function addPoint(curve, t, v) { const c = cp(curve); t = clamp(t, 1e-4, 1 - 1e-4); let i = c.findIndex(q => q[0] > t); if (i < 0) i = c.length; c.splice(i, 0, r4([t, v])); return { curve: c, index: i }; }
  function removePoint(curve, i) { const c = cp(curve); if (c.length <= 2 || i <= 0 || i >= c.length - 1) return c; c.splice(i, 1); return c; }
  function nearest(curve, t, v, sT, sV) { let index = -1, dist = Infinity; cp(curve).forEach((q, i) => { const d = Math.hypot((q[0] - t) * sT, (q[1] - v) * sV); if (d < dist) { dist = d; index = i; } }); return { index, dist }; }
  function resample(curve, n) { const c = cp(curve), out = []; for (let k = 0; k < n; k++) { const t = n > 1 ? k / (n - 1) : 0; out.push([t, at(c, t)]); } return out; }
  function brush(curve, ts, radius, fn) {
    const N = 129, c = resample(curve, N), w = new Float64Array(N);
    // the brush follows the stroke: the gaps between the hand's samples are filled (a fast drag still paints the whole way)
    const path = []; ts.forEach((t, i) => { if (i) { const a = ts[i - 1], steps = Math.ceil(Math.abs(t - a) / (radius / 3)); for (let k = 1; k < steps; k++) path.push(a + (t - a) * k / steps); } path.push(t); });
    path.forEach(t0 => { for (let i = 0; i < N; i++) { const d = Math.abs(i / (N - 1) - t0); if (d < radius) w[i] = Math.max(w[i], 1 - d / radius); } });
    const vals = c.map(q => q[1]), out = fn(vals, w), res = c.map((q, i) => [q[0], vals[i] + (out[i] - vals[i]) * Math.min(1, w[i] * 1.5)]);
    // only where the brush passed is resampled; elsewhere the original points stay
    const touched = (t) => { const i = Math.round(t * (N - 1)); return w[i] > 0 || (i > 0 && w[i - 1] > 0) || (i < N - 1 && w[i + 1] > 0); }, orig = cp(curve).filter(q => !touched(q[0]));
    const mid = res.filter((q, i) => w[i] > 0 || (i > 0 && w[i - 1] > 0) || (i < N - 1 && w[i + 1] > 0));   // with an anchor each side, at its old value
    return ends(simplify(orig.concat(mid).sort((a, b) => a[0] - b[0]), 1e-6, 129).map(r4));
  }
  const smooth = (curve, ts, radius, amount) => brush(curve, ts, radius || 0.06, (v) => v.map((x, i) => { const k = 4; let s = 0, n = 0; for (let j = Math.max(0, i - k); j <= Math.min(v.length - 1, i + k); j++) { s += v[j]; n++; } return x + (s / n - x) * clamp(amount === undefined ? 1 : amount, 0, 1); }));
  const erase = (curve, ts, radius, rest) => brush(curve, ts, radius || 0.05, (v) => v.map(() => rest || 0));
  const offset = (curve, dv) => cp(curve).map(q => r4([q[0], q[1] + dv]));
  const scale = (curve, k, around) => cp(curve).map(q => r4([q[0], around + (q[1] - around) * k]));
  function simplify(curve, eps, max) {   // Ramer–Douglas–Peucker, then the most important points up to max
    const c = cp(curve); if (c.length <= 2) return c;
    const keep = new Set([0, c.length - 1]);
    const rdp = (a, b) => { let idx = -1, d = 0; for (let i = a + 1; i < b; i++) { const t = (c[i][0] - c[a][0]) / ((c[b][0] - c[a][0]) || 1e-9), y = c[a][1] + (c[b][1] - c[a][1]) * t, e = Math.abs(c[i][1] - y); if (e > d) { d = e; idx = i; } } if (idx > 0 && d > eps) { keep.add(idx); rdp(a, idx); rdp(idx, b); } };
    rdp(0, c.length - 1); let out = Array.from(keep).sort((x, y) => x - y).map(i => c[i]);
    while (out.length > (max || 129)) out = out.filter((_, i) => i === 0 || i === out.length - 1 || i % 2 === 0);
    return out;
  }
  const api = { pen, line, movePoint, addPoint, removePoint, nearest, smooth, erase, offset, scale, resample, simplify, at };
  root.MusicParts = root.MusicParts || {}; root.MusicParts.curveEdit = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
