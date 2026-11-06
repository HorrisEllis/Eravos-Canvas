// node tools/music/components/bitcrusher/bitcrusher.test.mjs — the bitcrusher proves its own numbers (new code).
import { createRequire } from 'module'; const { Crusher, CRUSHER_WORKLET, CRUSHER_PARAMS } = createRequire(import.meta.url)('./bitcrusher.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, DEF = Object.fromEntries(CRUSHER_PARAMS.map(p => [p.name, p.defaultValue]));
const P = (o) => { const q = {}; for (const k in DEF) q[k] = [o[k] !== undefined ? o[k] : DEF[k]]; return q; };
function run(x, o, k) { if (!k) { k = Crusher(); k.setRate(SR); k.reset(7); } const N = x.length, y = new Float32Array(N);
  for (let j = 0; j < N; j += 128) { const m = Math.min(128, N - j); k.process([x.subarray(j, j + m)], [y.subarray(j, j + m)], m, P(o)); } return y; }
const sine = (N, hz, a) => { const x = new Float32Array(N); for (let j = 0; j < N; j++) x[j] = (a || 1) * Math.sin(2 * Math.PI * hz * j / SR); return x; };
const db = (a, b) => { let s = 0, e = 0; for (let j = 0; j < a.length; j++) { s += b[j] * b[j]; e += (a[j] - b[j]) ** 2; } return 10 * Math.log10(e / s); };
const rms = (a, from) => { let s = 0; for (let j = from || 0; j < a.length; j++) s += a[j] * a[j]; return Math.sqrt(s / (a.length - (from || 0))); };
// ---- 24 bits at the context's rate: untouched, sample for sample
{ const x = sine(SR / 4, 997, 0.8), y = run(x, {}); ok(y.every((v, j) => v === x[j]), '24 bits, full rate: the signal untouched'); }
// ---- bits: 8 bits' error is a step / √12 (the quantiser is exact); 1 bit has at most three levels
{ const x = new Float32Array(SR); for (let j = 0; j < SR; j++) x[j] = 0.9 * Math.sin(2 * Math.PI * 441.3 * j / SR) * (0.5 + 0.5 * Math.sin(j / 9001));
  const y = run(x, { bits: 8 }), q = 2 / 256, e = new Float32Array(SR); for (let j = 0; j < SR; j++) e[j] = y[j] - x[j];
  ok(Math.abs(rms(e) / (q / Math.sqrt(12)) - 1) < 0.08, `8 bits: error ${rms(e).toExponential(3)} ≈ step/√12 ${(q / Math.sqrt(12)).toExponential(3)}`);
  ok(y.every(v => Math.abs(v / q - Math.round(v / q)) < 1e-6), '8 bits: every sample on the grid');
  const y1 = run(x, { bits: 1 }); ok(new Set(Array.from(y1)).size <= 3, `1 bit: ${new Set(Array.from(y1)).size} levels`); }
// ---- rate: 8 kHz at 48 kHz holds each value exactly 6 samples
{ const x = sine(SR / 2, 333, 0.7), y = run(x, { rate: 8000 }); const lens = []; let c = 1; for (let j = 1; j < y.length; j++) { if (y[j] === y[j - 1]) c++; else { lens.push(c); c = 1; } }
  ok(lens.slice(1).every(l => l % 6 === 0), `8 kHz: every hold a multiple of 6 samples (${[...new Set(lens.slice(1))].slice(0, 4).join(', ')})`); }
// ---- aa: a 10 kHz tone taken down to 8 kHz folds to 2 kHz — with the filter on, ≥ 30 dB less of it
{ const x = sine(SR, 10000, 0.8), off = rms(run(x, { rate: 8000, aa: 0 }), 2000), on = rms(run(x, { rate: 8000, aa: 1 }), 2000);
  ok(20 * Math.log10(off / on) > 30, `aa: the alias is ${(20 * Math.log10(off / on)).toFixed(1)} dB lower`);
  const lo = sine(SR, 300, 0.8), pass = rms(run(lo, { rate: 8000, aa: 1 }), 2000) / rms(lo, 2000); ok(pass > 0.89, `aa: 300 Hz passes (${(20 * Math.log10(pass)).toFixed(2)} dB)`); }
// ---- jitter: hold lengths wander, their mean stays one period
{ const x = sine(SR, 333, 0.7), y = run(x, { rate: 4000, jitter: 1 }); const lens = []; let c = 1; for (let j = 1; j < y.length; j++) { if (y[j] === y[j - 1]) c++; else { lens.push(c); c = 1; } }
  const m = lens.reduce((a, b) => a + b, 0) / lens.length; ok(new Set(lens).size > 3 && Math.abs(m - 12) < 0.8, `jitter: ${new Set(lens).size} different hold lengths, mean ${m.toFixed(2)} (12)`); }
// ---- dither: a tone a third of a step tall vanishes without it, and survives (as noise) with it
{ const q = 2 / 256, x = sine(SR, 500, q * 0.3), dry = run(x, { bits: 8 }), dith = run(x, { bits: 8, dither: 1 });
  let corr = 0, sx = 0, sy = 0; for (let j = 0; j < SR; j++) { corr += x[j] * dith[j]; sx += x[j] * x[j]; sy += dith[j] * dith[j]; } corr /= Math.sqrt(sx * sy);
  ok(dry.every(v => v === 0), 'without dither: below half a step, silence'); ok(corr > 0.1, `with dither: the tone is in it (correlation ${corr.toFixed(3)})`); }
// ---- mix 0: dry, exact
{ const x = sine(4800, 220, 0.5), y = run(x, { bits: 4, rate: 3000, mix: 0 }); ok(y.every((v, j) => v === x[j]), 'mix 0: the dry signal, exact'); }
// ---- a minute of everything moving: every sample finite and within ±1
{ const x = sine(SR * 60, 77, 1), y = run(x, { bits: 3, rate: 1234, aa: 1, jitter: 0.6, dither: 1 }); ok(y.every(v => Number.isFinite(v) && Math.abs(v) <= 1), 'a minute crushed hard: finite, inside ±1'); }
ok(CRUSHER_WORKLET.includes(Crusher.toString()) && /registerProcessor\('eravos-bitcrusher'/.test(CRUSHER_WORKLET), 'the worklet runs the tested kernel, unchanged');
console.log(`bitcrusher: ${n} checks passed — exact quantiser, holds on time, the anti-alias filter, jitter, dither, transparent when off`);
