// node tools/music/components/saturator-tube/saturator-tube.test.mjs — the tube saturator proves its own numbers (new code).
import { createRequire } from 'module'; const { TubeSat, TUBESAT_WORKLET, TUBESAT_PARAMS } = createRequire(import.meta.url)('./saturator-tube.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, DEF = Object.fromEntries(TUBESAT_PARAMS.map(p => [p.name, p.defaultValue]));
const P = (o) => { const q = {}; for (const k in DEF) q[k] = [o[k] !== undefined ? o[k] : DEF[k]]; return q; };
const CLEAN = { drive: 0, bias: 0, tone: 0, out: 0, mix: 1 };
function run(x, o) { const k = TubeSat(); k.setRate(SR); const N = x.length, y = new Float32Array(N);
  for (let j = 0; j < N; j += 128) { const m = Math.min(128, N - j); k.process([x.subarray(j, j + m)], [y.subarray(j, j + m)], m, P(Object.assign({}, CLEAN, o))); } return y; }
const sine = (N, hz, a) => { const x = new Float32Array(N); for (let j = 0; j < N; j++) x[j] = (a || 1) * Math.sin(2 * Math.PI * hz * j / SR); return x; };
function harm(y, f0, h, from) { const N = Math.floor((y.length - from) * f0 / SR) * SR / f0 | 0; let re = 0, im = 0; for (let j = 0; j < N; j++) { const p = 2 * Math.PI * f0 * h * j / SR; re += y[from + j] * Math.cos(p); im += y[from + j] * Math.sin(p); } return 2 * Math.hypot(re, im) / N; }
const db = (r) => 20 * Math.log10(r);
// ---- clean: drive 0 → the signal exactly, whatever the bias
{ const x = sine(SR, 220, 0.8); for (const bias of [0, 1]) { const y = run(x, { bias }); ok(y.every((v, j) => v === x[j]), `drive 0, bias ${bias}: the signal exactly`); } }
// ---- drive: odd harmonics rise with it; bias 0 gives no even ones; bias brings the 2nd, and more with more bias
{ const x = sine(SR, 100, 0.5), r = (y, h) => harm(y, 100, h, SR / 2) / harm(y, 100, 1, SR / 2);
  const y6 = run(x, { drive: 6 }), y18 = run(x, { drive: 18 });
  ok(r(y18, 3) > r(y6, 3) * 3 && db(r(y18, 3)) > -30, `3rd harmonic: ${db(r(y6, 3)).toFixed(1)} dB at 6 dB drive → ${db(r(y18, 3)).toFixed(1)} dB at 18 dB`);
  ok(db(r(y18, 2)) < -80, `bias 0: no 2nd harmonic (${db(r(y18, 2)).toFixed(1)} dB)`);
  const b3 = run(x, { drive: 12, bias: 0.3 }), b9 = run(x, { drive: 12, bias: 0.9 });
  ok(db(r(b3, 2)) > -35 && r(b9, 2) > r(b3, 2), `bias: the 2nd harmonic ${db(r(b3, 2)).toFixed(1)} dB at 0.3 → ${db(r(b9, 2)).toFixed(1)} dB at 0.9`);
  // asymmetry: the negative half clips harder than the positive
  let mx = 0, mn = 0; for (let j = SR / 2; j < SR; j++) { mx = Math.max(mx, b9[j]); mn = Math.min(mn, b9[j]); }
  ok(mx > -mn * 1.1, `harder on the way down: +${mx.toFixed(3)} / ${mn.toFixed(3)}`); }
// ---- DC: a heavily biased tube leaves no offset (the mean over a second, once settled)
{ const y = run(sine(SR * 2, 100, 0.8), { drive: 24, bias: 1 }); let m = 0; for (let j = SR; j < SR * 2; j++) m += y[j]; m /= SR; ok(Math.abs(m) < 1e-3, `bias 1, drive 24: DC ${m.toExponential(1)}`); }
// ---- level: a full-scale peak stays near full scale; quiet parts come up
{ const loud = run(sine(SR, 100, 1), { drive: 18 }), quiet = run(sine(SR, 100, 0.05), { drive: 18 }); let pk = 0; for (let j = SR / 2; j < SR; j++) pk = Math.max(pk, Math.abs(loud[j]));
  ok(pk < 1.35 && pk > 0.7, `full scale in → peak ${pk.toFixed(3)} out`);
  const gq = harm(quiet, 100, 1, SR / 2) / 0.05, gl = harm(loud, 100, 1, SR / 2); ok(gq > gl * 3, `compression: quiet ${db(gq).toFixed(1)} dB, loud ${db(gl).toFixed(1)} dB`); }
// ---- tone: +1 tilts up (8 kHz above 125 Hz by ~12 dB), −1 down, about 1 kHz
{ const g = (hz, tone) => db(harm(run(sine(SR, hz, 0.25), { tone }), hz, 1, SR / 2) / 0.25);
  const up = g(8000, 1) - g(125, 1), dn = g(8000, -1) - g(125, -1), mid = g(1000, 1);
  ok(up > 9 && up < 13 && dn < -9 && dn > -13 && Math.abs(mid) < 1, `tone ±1: 8 kHz vs 125 Hz ${up.toFixed(1)} / ${dn.toFixed(1)} dB, 1 kHz ${mid.toFixed(2)} dB`); }
// ---- out and mix
{ const x = sine(4800, 300, 0.5), h = run(x, { out: -6.0206 }); ok(h.every((v, j) => Math.abs(v - x[j] / 2) < 1e-6), 'out −6 dB: half');
  const d = run(x, { drive: 24, bias: 1, mix: 0 }); ok(d.every((v, j) => v === x[j]), 'mix 0: the dry signal, exact'); }
// ---- a minute of loud noise, everything up: finite, bounded
{ const N = SR * 60, x = new Float32Array(N); let s = 1; for (let j = 0; j < N; j++) { s = (s * 16807) % 2147483647; x[j] = (s / 2147483647) * 2 - 1; }
  const y = run(x, { drive: 24, bias: 1, tone: 1, out: 6 }); ok(y.every(v => Number.isFinite(v) && Math.abs(v) < 8), 'a minute of full-scale noise, everything up: finite and bounded'); }
ok(TUBESAT_WORKLET.includes(TubeSat.toString()) && /registerProcessor\('eravos-saturator-tube'/.test(TUBESAT_WORKLET), 'the worklet runs the tested kernel, unchanged');
console.log(`saturator-tube: ${n} checks passed — exact when clean, odd harmonics with drive, even with bias, no DC, compression, tilt`);
