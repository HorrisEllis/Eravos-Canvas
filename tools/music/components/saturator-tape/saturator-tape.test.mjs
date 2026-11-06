// node tools/music/components/saturator-tape/saturator-tape.test.mjs — the tape saturator proves its own numbers (new code).
import { createRequire } from 'module'; const { TapeSat, TAPESAT_WORKLET, TAPESAT_PARAMS } = createRequire(import.meta.url)('./saturator-tape.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, DEF = Object.fromEntries(TAPESAT_PARAMS.map(p => [p.name, p.defaultValue]));
const P = (o) => { const q = {}; for (const k in DEF) q[k] = [o[k] !== undefined ? o[k] : DEF[k]]; return q; };
const CLEAN = { drive: 0, bias: 0, bump: 0, hf: 24000, out: 0, mix: 1 };
function run(x, o, k) { if (!k) { k = TapeSat(); k.setRate(SR); } const N = x.length, y = new Float32Array(N);
  for (let j = 0; j < N; j += 128) { const m = Math.min(128, N - j); k.process([x.subarray(j, j + m)], [y.subarray(j, j + m)], m, P(Object.assign({}, CLEAN, o))); } return y; }
const sine = (N, hz, a) => { const x = new Float32Array(N); for (let j = 0; j < N; j++) x[j] = (a || 1) * Math.sin(2 * Math.PI * hz * j / SR); return x; };
// the level of harmonic h of f0 over a whole number of periods (DFT bin)
function harm(y, f0, h, from) { const N = Math.floor((y.length - from) * f0 / SR) * SR / f0 | 0; let re = 0, im = 0; for (let j = 0; j < N; j++) { const p = 2 * Math.PI * f0 * h * j / SR; re += y[from + j] * Math.cos(p); im += y[from + j] * Math.sin(p); } return 2 * Math.hypot(re, im) / N; }
const gainDb = (hz, o) => { const x = sine(SR, hz, 0.25), y = run(x, o); return 20 * Math.log10(harm(y, hz, 1, SR / 2) / 0.25); };
// ---- clean: drive 0, bias 0, no bump, no gap loss → the signal back, to better than −90 dB (the emphasis and its exact inverse)
{ const x = new Float32Array(SR); for (let j = 0; j < SR; j++) x[j] = 0.6 * Math.sin(2 * Math.PI * 220 * j / SR) + 0.3 * Math.sin(2 * Math.PI * 7300 * j / SR);
  const y = run(x, {}); let e = 0, s = 0; for (let j = 0; j < SR; j++) { e += (y[j] - x[j]) ** 2; s += x[j] ** 2; } const d = 10 * Math.log10(e / s);
  ok(d < -90, `drive 0, the rest off: transparent (${d.toFixed(1)} dB)`); }
// ---- drive: odd harmonics rise with it; with bias 0 no even ones; bias brings the 2nd
{ const x = sine(SR, 100, 0.5);
  const y6 = run(x, { drive: 6 }), y18 = run(x, { drive: 18 }), h3a = harm(y6, 100, 3, SR / 2) / harm(y6, 100, 1, SR / 2), h3b = harm(y18, 100, 3, SR / 2) / harm(y18, 100, 1, SR / 2);
  ok(h3b > h3a * 3 && 20 * Math.log10(h3b) > -30, `3rd harmonic: ${(20 * Math.log10(h3a)).toFixed(1)} dB at 6 dB drive → ${(20 * Math.log10(h3b)).toFixed(1)} dB at 18 dB`);
  const h2 = harm(y18, 100, 2, SR / 2) / harm(y18, 100, 1, SR / 2); ok(20 * Math.log10(h2) < -70, `bias 0: no 2nd harmonic (${(20 * Math.log10(h2)).toFixed(1)} dB)`);
  const yb = run(x, { drive: 18, bias: 0.8 }), h2b = harm(yb, 100, 2, SR / 2) / harm(yb, 100, 1, SR / 2); ok(20 * Math.log10(h2b) > -35, `bias 0.8: a 2nd harmonic (${(20 * Math.log10(h2b)).toFixed(1)} dB)`); }
// ---- level: a full-scale peak stays near full scale; quiet parts come up more (compression)
{ const loud = run(sine(SR, 100, 1), { drive: 18 }), quiet = run(sine(SR, 100, 0.05), { drive: 18 }); let pk = 0; for (let j = SR / 2; j < SR; j++) pk = Math.max(pk, Math.abs(loud[j]));
  ok(pk < 1.3 && pk > 0.7, `full scale in → peak ${pk.toFixed(3)} out`); const gq = harm(quiet, 100, 1, SR / 2) / 0.05, gl = harm(loud, 100, 1, SR / 2) / 1;
  ok(gq > gl * 3, `compression: a quiet tone gains ${(20 * Math.log10(gq)).toFixed(1)} dB, a loud one ${(20 * Math.log10(gl)).toFixed(1)} dB`); }
// ---- the head bump: +6 dB at 80 Hz lifts 80 Hz by 6 dB and leaves 2 kHz alone
{ const b = gainDb(80, { bump: 6, bumpFreq: 80 }), k = gainDb(2000, { bump: 6, bumpFreq: 80 }); ok(Math.abs(b - 6) < 0.3 && Math.abs(k) < 0.3, `bump: 80 Hz ${b.toFixed(2)} dB, 2 kHz ${k.toFixed(2)} dB`); }
// ---- gap loss at 6 kHz: 15 kHz falls ≥ 12 dB, 1 kHz within 0.2 dB
{ const hi = gainDb(15000, { hf: 6000 }), lo = gainDb(1000, { hf: 6000 }); ok(hi < -12 && Math.abs(lo) < 0.2, `gap loss: 15 kHz ${hi.toFixed(1)} dB, 1 kHz ${lo.toFixed(2)} dB`); }
// ---- hysteresis: driven, the curve on the way up differs from the way down (same input, different output)
{ const N = SR, x = sine(N, 200, 0.6), y = run(x, { drive: 8, bias: 0.3, hf: 24000 }); let up = null, dn = null;
  for (let j = SR / 2; j < N - 1; j++) { if (Math.abs(x[j] - 0.3) < 0.006) { if (x[j + 1] > x[j]) up = up === null ? y[j] : up; else dn = dn === null ? y[j] : dn; } }
  ok(up !== null && dn !== null && Math.abs(up - dn) > 0.01, `hysteresis: at 0.3 rising → ${up && up.toFixed(4)}, falling → ${dn && dn.toFixed(4)}`); }
// ---- out and mix
{ const x = sine(4800, 300, 0.5), h = run(x, { out: -6.0206 }); ok(h.every((v, j) => Math.abs(v - x[j] / 2) < 1e-6), 'out −6 dB: half'); const d = run(x, { drive: 24, mix: 0 }); ok(d.every((v, j) => v === x[j]), 'mix 0: the dry signal, exact'); }
// ---- a minute of loud noise, everything up: finite, bounded
{ const N = SR * 60, x = new Float32Array(N); let s = 1; for (let j = 0; j < N; j++) { s = (s * 16807) % 2147483647; x[j] = (s / 2147483647) * 2 - 1; }
  const y = run(x, { drive: 24, bias: 1, bump: 6, hf: 2000, out: 6 }); ok(y.every(v => Number.isFinite(v) && Math.abs(v) < 8), 'a minute of full-scale noise, everything up: finite and bounded'); }
ok(TAPESAT_WORKLET.includes(TapeSat.toString()) && /registerProcessor\('eravos-saturator-tape'/.test(TAPESAT_WORKLET), 'the worklet runs the tested kernel, unchanged');
console.log(`saturator-tape: ${n} checks passed — transparent when clean, harmonics with drive and bias, compression, bump, gap loss, hysteresis`);
