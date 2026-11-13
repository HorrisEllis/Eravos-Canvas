/* eravos.component.mod-tree 1.1.0 (1.1: a modulator's amount, m.amt 0–1; absent = 1, every 1.0 signal samples bit-identically) — a value over a span as a SIGNAL (a drawn base + modulators) where every modulator's rate and depth are
 * signals too: modulation that nests to any level (bounded at 8). His words (2026-11-08): "full modulation, waveform, oscillation, like all
 * the ways to edit a sound, give it as much depth as possible. fractally and recursively." Spec: mod-tree.spec. A component imports no tool.
 *   MusicParts.modTree.sample(sig, N) → Float64Array · at(sig, t) · resample(arr, n) → [[t, v]] · get(root, path) · set(root, path, v)
 *   · depthOf(sig) · count(sig) · signal(base?) · mod(shape?, rate?, depth?) · SHAPES · MAX_DEPTH */
(function (root) {
  'use strict';
  const MAX_DEPTH = 8, SHAPES = ['sine', 'triangle', 'saw', 'ramp', 'square', 'random', 'smooth', 'drawn'];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const frac = (x) => x - Math.floor(x);
  // a small seeded hash → −1…1 (the same seed and step → the same value, on every machine)
  function rnd(seed, k) { let h = (Math.imul((seed | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(k | 0, 0xc2b2ae35)) >>> 0; h ^= h >>> 16; h = Math.imul(h, 0x7feb352d) >>> 0; h ^= h >>> 15; h = Math.imul(h, 0x846ca68b) >>> 0; h ^= h >>> 16; return (h / 4294967295) * 2 - 1; }
  function baseAt(P, t) {
    if (!P || !P.length) return 0; if (t <= P[0][0]) return +P[0][1]; const n = P.length; if (t >= P[n - 1][0]) return +P[n - 1][1];
    let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m][0] <= t) lo = m; else hi = m; }
    const a = P[lo], b = P[hi], w = b[0] - a[0]; return w > 0 ? +a[1] + (b[1] - a[1]) * (t - a[0]) / w : +b[1];
  }
  function drawnAt(W, x) {   // one cycle, wraps: the last point joins the first
    if (!W || !W.length) return Math.sin(x * 2 * Math.PI); x = frac(x);
    const n = W.length; if (n === 1) return +W[0][1];
    for (let i = 0; i < n; i++) { const a = W[i], b = W[(i + 1) % n], bx = i + 1 < n ? b[0] : b[0] + 1, ax = a[0], xx = x < ax && i === n - 1 ? x + 1 : x;
      if (xx >= ax && xx <= bx) { const w = bx - ax; return w > 0 ? +a[1] + (b[1] - a[1]) * (xx - ax) / w : +b[1]; } }
    return +W[0][1];
  }
  function wave(m, ph) {
    const x = frac(ph), k = Math.floor(ph), s = m.seed | 0;
    switch (m.shape) {
      case 'triangle': return 1 - 4 * Math.abs(x - 0.5);
      case 'saw': return 2 * x - 1;
      case 'ramp': return 1 - 2 * x;
      case 'square': return x < 0.5 ? 1 : -1;
      case 'random': return rnd(s, k);
      case 'smooth': { const a = rnd(s, k), b = rnd(s, k + 1), u = x * x * (3 - 2 * x); return a + (b - a) * u; }
      case 'drawn': return clamp(drawnAt(m.wave, x), -1, 1);
      default: return Math.sin(x * 2 * Math.PI);
    }
  }
  function sampleAt(sig, N, lvl) {
    const out = new Float64Array(N); if (!sig) return out;
    for (let i = 0; i < N; i++) out[i] = baseAt(sig.base, N > 1 ? i / (N - 1) : 0);
    if (lvl >= MAX_DEPTH || !Array.isArray(sig.mods)) return out;
    for (const m of sig.mods) {
      if (!m || m.on === false) continue;
      const rate = sampleAt(m.rate, N, lvl + 1), depth = sampleAt(m.depth, N, lvl + 1), fade = clamp(+m.fade || 0, 0, 1), dt = N > 1 ? 1 / (N - 1) : 0;
      const amt = m.amt === undefined ? 1 : clamp(+m.amt, 0, 1);   // 1.1 (2026-11-13): the layer's AMOUNT — how much of this modulator plays (absent = all of it)
      let ph = +m.phase || 0;
      for (let i = 0; i < N; i++) {
        const t = N > 1 ? i / (N - 1) : 0, f = fade > 0 ? Math.min(1, t / fade) : 1;
        out[i] += depth[i] * f * amt * wave(m, ph);
        ph += Math.max(0, rate[i]) * dt;   // the rate integrated (trapezoid would be finer; at 128+ samples per span this is inaudible)
      }
    }
    return out;
  }
  const sample = (sig, N) => sampleAt(sig, Math.max(2, N | 0), 0);
  const at = (sig, t) => { const a = sample(sig, 257); const x = clamp(t, 0, 1) * 256, i = Math.floor(x); return i >= 256 ? a[256] : a[i] + (a[i + 1] - a[i]) * (x - i); };
  function resample(arr, n) { const N = arr.length, out = []; for (let k = 0; k < n; k++) { const t = n > 1 ? k / (n - 1) : 0, x = t * (N - 1), i = Math.floor(x), v = i >= N - 1 ? arr[N - 1] : arr[i] + (arr[i + 1] - arr[i]) * (x - i); out.push([Math.round(t * 1e4) / 1e4, +v.toPrecision(6)]); } return out; }
  function get(rootObj, path) { let o = rootObj; for (const k of path || []) { if (o == null) return undefined; o = o[k]; } return o; }
  function set(rootObj, path, value) {   // a copy along the path; everything else shared
    if (!path || !path.length) return value;
    const [k, ...rest] = path, src = rootObj == null ? (typeof k === 'number' ? [] : {}) : rootObj;
    const copy = Array.isArray(src) ? src.slice() : Object.assign({}, src); copy[k] = set(src[k], rest, value); return copy;
  }
  const depthOf = (sig) => !sig || !Array.isArray(sig.mods) || !sig.mods.length ? 0 : 1 + Math.max(...sig.mods.map(m => Math.max(depthOf(m.rate), depthOf(m.depth))));
  const count = (sig) => !sig || !Array.isArray(sig.mods) ? 0 : sig.mods.reduce((n, m) => n + 1 + count(m.rate) + count(m.depth), 0);
  const signal = (base) => ({ base: base || [[0, 0], [1, 0]], mods: [] });
  const mod = (shape, rate, depth) => ({ shape: SHAPES.includes(shape) ? shape : 'sine', rate: signal([[0, rate === undefined ? 4 : rate], [1, rate === undefined ? 4 : rate]]), depth: signal([[0, depth === undefined ? 1 : depth], [1, depth === undefined ? 1 : depth]]), phase: 0, fade: 0, seed: 1, on: true });
  const api = { sample, at, resample, get, set, depthOf, count, signal, mod, wave, baseAt, SHAPES, MAX_DEPTH };
  root.MusicParts = root.MusicParts || {}; root.MusicParts.modTree = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
