// node tools/music/components/ensemble-core/ensemble-core.test.mjs — the ensemble proves its own numbers (new sound code).
import { createRequire } from 'module'; const { Ensemble, ENSEMBLE_WORKLET, ENSEMBLE_PARAMS, ENSEMBLE_MODES } = createRequire(import.meta.url)('./ensemble-core.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, near = (a, b, t) => Math.abs(a - b) <= t;
const DEF = Object.fromEntries(ENSEMBLE_PARAMS.map(p => [p.name, p.defaultValue]));
const P = (o) => { const q = {}; for (const k in DEF) q[k] = [o[k] !== undefined ? o[k] : DEF[k]]; return q; };
function run(x, o, each) { const k = Ensemble(); k.setRate(SR); const N = x.length, L = new Float32Array(N), R = new Float32Array(N);
  for (let j = 0; j < N; j += 128) { k.process([x.subarray(j, j + 128)], [L.subarray(j, j + 128), R.subarray(j, j + 128)], Math.min(128, N - j), P(o)); if (each) each(k, j); } return [L, R]; }
const sine = (N, hz, a) => { const x = new Float32Array(N); for (let j = 0; j < N; j++) x[j] = (a || 0.5) * Math.sin(2 * Math.PI * hz * j / SR); return x; };
// ---- mix 0 is the dry signal; one tap, no depth = the input `base` ms later, exactly
{ const x = sine(4800, 330), [L, R] = run(x, { mix: 0 }); ok(L.every((v, i) => v === x[i]) && R.every((v, i) => v === x[i]), 'mix 0: dry, untouched, both sides'); }
{ const x = new Float32Array(4800); x[10] = 1; const [L] = run(x, { taps: 1, depth: 0, depth2: 0, base: 5, mix: 1 }); ok(near(L[10 + 240], 1, 1e-9), 'one tap, no depth: the input 5 ms (240 samples) later'); }
// ---- taps sit evenly around the LFO: 2 taps inverted (Juno), 3 at 120°: their delays average to `base` at every moment (sine)
for (const taps of [2, 3, 4, 8]) { let worst = 0; run(new Float32Array(SR), { taps, shape: 0, base: 4, depth: 2, depth2: 0, rate: 0.7 }, (k) => { let s = 0; for (let t = 0; t < taps; t++) s += k.tapDelays[t]; worst = Math.max(worst, Math.abs(s / taps - 4)); });
  ok(worst < 1e-9, `${taps} taps: their delays average to base at every moment (worst ${worst.toExponential(1)} ms)`); }
{ let sym = 0; run(new Float32Array(SR), { taps: 2, shape: 1, base: 3.5, depth: 1.85, rate: 0.513 }, (k) => { sym = Math.max(sym, Math.abs((k.tapDelays[0] - 3.5) + (k.tapDelays[1] - 3.5))); });
  ok(sym < 1e-9, 'Juno-style: the two taps move in opposite directions (triangle)'); }
// ---- the pitch wobble is the theory: a sine LFO of depth d s at rate r bends f by ± 2π·r·d·f
{ const f = 1000, d = 0.002, r = 0.5, [L] = run(sine(SR * 4, f), { taps: 1, shape: 0, base: 5, depth: d * 1000, depth2: 0, rate: r, mix: 1 }); const fr = [];
  for (let a = SR / 2; a < SR * 4 - 2400; a += 2400) { let c = 0, first = -1, last = -1; for (let j = a; j < a + 2400; j++) if (L[j] <= 0 && L[j + 1] > 0) { const t = j + L[j] / (L[j] - L[j + 1]); if (first < 0) first = t; last = t; c++; } fr.push((c - 1) / ((last - first) / SR)); }
  const want = 2 * Math.PI * r * d * f, swing = (Math.max(...fr) - Math.min(...fr)) / 2; ok(near(swing, want, want * 0.12), `sine 2 ms at 0.5 Hz bends 1 kHz by ±${swing.toFixed(2)} Hz (theory ±${want.toFixed(2)})`); }
// ---- triangle: the delay moves at a steady speed, so the pitch holds a fixed offset (two plateaus), as the Juno chorus does
{ const f = 1000, [L] = run(sine(SR * 4, f), { taps: 1, shape: 1, base: 5, depth: 2, depth2: 0, rate: 0.5, mix: 1 }); const fr = [];
  for (let a = SR / 2; a < SR * 4 - 2400; a += 2400) { let c = 0, first = -1, last = -1; for (let j = a; j < a + 2400; j++) if (L[j] <= 0 && L[j + 1] > 0) { const t = j + L[j] / (L[j] - L[j + 1]); if (first < 0) first = t; last = t; c++; } fr.push((c - 1) / ((last - first) / SR)); }
  const want = 1000 * 0.002 * 4 * 0.5;   // slope of a triangle: 4·depth·rate seconds per second → f·that
  const hi = fr.filter(x => x > 1000 + want * 0.8).length, lo = fr.filter(x => x < 1000 - want * 0.8).length;
  ok(hi > fr.length * 0.3 && lo > fr.length * 0.3, `triangle: the pitch sits ±${want.toFixed(1)} Hz for most of each half (${hi} high, ${lo} low of ${fr.length})`); }
// ---- stereo: spread 0 is mono (L = R); spread 1 with 2 taps decorrelates; levels stay near the input
{ const x = sine(SR * 2, 440), [L0, R0] = run(x, { spread: 0 }), [L1, R1] = run(x, { spread: 1, mix: 1 });
  ok(L0.every((v, i) => v === R0[i]), 'spread 0: left = right');
  const corr = (a, b) => { let p = 0, q = 0, r = 0; for (let j = SR / 2; j < a.length; j++) { p += a[j] * b[j]; q += a[j] * a[j]; r += b[j] * b[j]; } return p / Math.sqrt(q * r); };
  ok(corr(L1, R1) < 0.9, `spread 1: the sides differ (correlation ${corr(L1, R1).toFixed(2)})`);
  const lv = (a) => { let s = 0; for (let j = SR / 2; j < a.length; j++) s += a[j] * a[j]; return 10 * Math.log10(s / (a.length - SR / 2)); }; ok(near(lv(L1) - lv(x), 0, 1), `wet level ≈ the input's (${(lv(L1) - lv(x)).toFixed(2)} dB)`); }
// ---- every machine in the table runs, bounded; 8 taps + both LFOs at their limits stay bounded; worklet; cost
for (const [name, m] of Object.entries(ENSEMBLE_MODES)) { const [L, R] = run(sine(SR, 220), Object.assign({ mix: 0.5 }, m)); let pk = 0; for (let j = 0; j < SR; j++) pk = Math.max(pk, Math.abs(L[j]), Math.abs(R[j])); ok(pk < 1.2 && pk > 0.2, `${name}: plays, bounded (peak ${pk.toFixed(2)})`); }
{ const [L] = run(sine(SR, 220, 1), { taps: 8, base: 40, depth: 20, depth2: 10, rate: 20, rate2: 20, mix: 1 }); let pk = 0; for (const v of L) pk = Math.max(pk, Math.abs(v)); ok(isFinite(pk) && pk < 4, `limits: 8 taps, 20 ms + 10 ms at 20 Hz stay bounded (${pk.toFixed(2)})`); }
ok(ENSEMBLE_WORKLET.includes(Ensemble.toString()) && ENSEMBLE_PARAMS.length === 9, 'the worklet is the tested kernel, 9 AudioParams');
{ const k = Ensemble(); k.setRate(SR); const M = SR * 2, x = new Float32Array(128).fill(0.3), y0 = new Float32Array(128), y1 = new Float32Array(128), p = P(ENSEMBLE_MODES['string machine']);
  const t0 = process.hrtime.bigint(); for (let j = 0; j < M; j += 128) k.process([x], [y0, y1], 128, p); const ns = Number(process.hrtime.bigint() - t0) / M;
  console.log(`  cost: ${ns.toFixed(0)} ns per stereo sample (string machine, 3 taps, 2 LFOs)`); ok(ns < 3000, 'under 3 µs per stereo sample'); }
console.log(`ensemble-core: ${n} checks pass`);
