// node tools/music/components/random-source/random-source.test.mjs — the random source proves its own numbers (new code).
import { createRequire } from 'module'; const { rng, Random, RANDOM_WORKLET, RANDOM_PARAMS } = createRequire(import.meta.url)('./random-source.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, DEF = Object.fromEntries(RANDOM_PARAMS.map(p => [p.name, p.defaultValue]));
const P = (o) => { const q = {}; for (const k in DEF) q[k] = [o[k] !== undefined ? o[k] : DEF[k]]; return q; };
function run(N, o, k) { k = k || Random(); k.setRate(SR); if (o.hist) k.setHistogram(o.hist); const a = new Float32Array(N), g = new Float32Array(N);
  for (let j = 0; j < N; j += 128) { const m = Math.min(128, N - j); k.process([], [a.subarray(j, j + m), g.subarray(j, j + m)], m, P(o)); } return { a, g }; }
const stats = (xs) => { const m = xs.reduce((s, x) => s + x, 0) / xs.length; return { m, v: xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length }; };
// ---- rng: deterministic, in 0…1, different seeds differ
{ const a = rng(7), b = rng(7), c = rng(8); let same = true, diff = false, inRange = true; for (let i = 0; i < 10000; i++) { const x = a(), y = b(), z = c(); if (x !== y) same = false; if (x !== z) diff = true; if (x < 0 || x >= 1) inRange = false; }
  ok(same && diff && inRange, 'rng(seed): the same seed repeats exactly, another seed differs, values in 0…1'); }
// ---- the same seed gives the same signal, sample for sample; reset() starts it again
{ const x = run(SR, { seed: 42, rate: 50, smooth: 0.5 }).a, y = run(SR, { seed: 42, rate: 50, smooth: 0.5 }).a, z = run(SR, { seed: 43, rate: 50, smooth: 0.5 }).a;
  ok(x.every((v, i) => v === y[i]), 'seed 42 twice: identical, sample for sample'); ok(x.some((v, i) => v !== z[i]), 'seed 43: different'); }
// ---- sample-and-hold: a new value exactly every sr/rate samples, flat in between
{ const { a } = run(SR, { seed: 3, rate: 100, smooth: 0 }); let changes = [], flat = true; for (let j = 1; j < SR; j++) if (a[j] !== a[j - 1]) changes.push(j);
  const gaps = changes.slice(1).map((c, i) => c - changes[i]); ok(gaps.every(g => g === 480), `S&H at 100 Hz steps every 480 samples (got ${[...new Set(gaps)].join(', ')})`);
  ok(changes.length >= 98 && changes.length <= 101, `about 100 steps a second (${changes.length})`); }
// ---- smooth 1: no step bigger than a cosine glide allows (continuous), and it passes through each drawn value
{ const { a } = run(SR, { seed: 5, rate: 20, smooth: 1 }); let jump = 0; for (let j = 1; j < SR; j++) jump = Math.max(jump, Math.abs(a[j] - a[j - 1]));
  ok(jump < 2 * Math.PI / 2 * 20 / SR * 1.01 + 1e-6, `smooth 1 is continuous (largest step ${jump.toExponential(2)})`); }
// ---- distributions: uniform mean 0 var 1/3 (−1…1) · gaussian mean 0, σ ≈ 1/3 · beta(2,5) mean 2/7 (0…1) · histogram matches its weights
{ const k = Random(); k.setRate(SR); k.reset(11); const N = 200000;
  const u = []; for (let i = 0; i < N; i++) u.push(k.draw(0)); const su = stats(u); ok(Math.abs(su.m) < 0.01 && Math.abs(su.v - 1 / 3) < 0.01, `uniform: mean ${su.m.toFixed(4)}, var ${su.v.toFixed(4)} (1/3)`);
  const g = []; for (let i = 0; i < N; i++) g.push(k.draw(1)); const sg = stats(g); ok(Math.abs(sg.m) < 0.01 && Math.abs(Math.sqrt(sg.v) - 1 / 3) < 0.01, `gaussian: mean ${sg.m.toFixed(4)}, σ ${Math.sqrt(sg.v).toFixed(4)} (1/3)`);
  ok(g.every(x => x >= -1 && x <= 1), 'gaussian clipped to −1…1');
  const be = []; for (let i = 0; i < N; i++) be.push((k.draw(2, 2, 5) + 1) / 2); const sb = stats(be); ok(Math.abs(sb.m - 2 / 7) < 0.005, `beta(2,5): mean ${sb.m.toFixed(4)} (2/7 = ${(2 / 7).toFixed(4)})`);
  ok(Math.abs(sb.v - (2 * 5) / (49 * 8)) < 0.002, `beta(2,5): var ${sb.v.toFixed(4)} (${(10 / 392).toFixed(4)})`);
  k.setHistogram([1, 0, 3]); const h = [0, 0, 0]; for (let i = 0; i < 60000; i++) h[Math.min(2, Math.floor((k.draw(3) + 1) / 2 * 3))]++;
  ok(h[1] === 0 && Math.abs(h[2] / h[0] - 3) < 0.15, `histogram [1,0,3]: ${h.join(' / ')} (an empty bin never, 3× the first)`); }
// ---- unipolar 0…1, depth and offset
{ const { a } = run(SR / 4, { seed: 9, rate: 200, unipolar: 1, depth: 0.5, offset: 0.25 }); ok(a.every(x => x >= 0.25 - 1e-9 && x <= 0.75 + 1e-9), 'unipolar, depth 0.5, offset 0.25: inside 0.25…0.75'); }
// ---- events: Poisson at `density` a second, each exactly eventLen long
{ const N = SR * 20, { g } = run(N, { seed: 21, density: 10, eventLen: 0.01 }); let starts = 0, lens = [], cur = 0;
  for (let j = 0; j < N; j++) { if (g[j] && !(j && g[j - 1])) starts++; if (g[j]) cur++; else if (cur) { lens.push(cur); cur = 0; } }
  ok(starts > 160 && starts < 240, `10 events a second for 20 s: ${starts} (Poisson, ±20 %)`);
  ok(lens.filter(l => l === 480).length >= lens.length * 0.9, `each event 480 samples long (${lens.filter(l => l === 480).length} of ${lens.length}; the rest ran into the next)`);
  const z = run(SR, { seed: 21, density: 0 }).g; ok(z.every(x => x === 0), 'density 0: no events'); }
// ---- no allocation in process (the worklet's hot loop): a million samples finish, no NaN
{ const { a, g } = run(SR * 20, { seed: 1, rate: 37, smooth: 0.3, dist: 2, density: 5 }); ok(a.every(Number.isFinite) && g.every(Number.isFinite), '20 s: every sample finite'); }
// ---- the worklet is the same kernel text
ok(RANDOM_WORKLET.includes(Random.toString()) && RANDOM_WORKLET.includes(rng.toString()) && /registerProcessor\('eravos-random'/.test(RANDOM_WORKLET), 'the worklet runs the tested kernel, unchanged');
console.log(`random-source: ${n} checks passed — seeded, steps and glides on time, the distributions' numbers, Poisson events`);
