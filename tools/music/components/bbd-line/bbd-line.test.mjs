// node tools/music/components/bbd-line/bbd-line.test.mjs — the bucket-brigade line proves its own numbers (new sound code).
import { createRequire } from 'module'; const { BBD, BBD_WORKLET, BBD_PARAMS } = createRequire(import.meta.url)('./bbd-line.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, near = (a, b, t) => Math.abs(a - b) <= t, fmt = (x) => x.toFixed(2) + ' dB';
const DEF = Object.fromEntries(BBD_PARAMS.map(p => [p.name, p.defaultValue]));
const P = (o) => { const q = {}; for (const k in DEF) q[k] = [o[k] !== undefined ? o[k] : DEF[k]]; return q; };
function run(x, o, seed) { const k = BBD(); k.setRate(SR, 0.5); k.reset(seed || 1); const N = x.length, y = new Float32Array(N);
  for (let j = 0; j < N; j += 128) k.process([x.subarray(j, j + 128)], [y.subarray(j, j + 128)], Math.min(128, N - j), P(o)); return y; }
const sine = (N, hz, a) => { const x = new Float32Array(N); for (let j = 0; j < N; j++) x[j] = (a || 0.5) * Math.sin(2 * Math.PI * hz * j / SR); return x; };
const clean = { hiss: -120, bleed: -120, compand: 0 };
function gainAt(hz, o) { const N = SR / 2, x = sine(N, hz, 0.25), y = run(x, Object.assign({}, clean, o)); let a = 0, b = 0; for (let j = N / 2; j < N; j++) { a += y[j] * y[j]; b += x[j] * x[j]; } return 10 * Math.log10(a / b); }
// ---- the delay is the time: a 15 Hz sine (one cycle = 67 ms, longer than any delay here) comes out `time` later, by its phase
for (const t of [0.002, 0.01, 0.05]) { const N = SR * 2, f = 15, x = sine(N, f, 0.25), y = run(x, Object.assign({ time: t, stages: 4096 }, clean));
  let re = 0, im = 0, rx = 0, ix = 0; for (let j = SR; j < N; j++) { const c = Math.cos(2 * Math.PI * f * j / SR), s = Math.sin(2 * Math.PI * f * j / SR); re += y[j] * c; im += y[j] * s; rx += x[j] * c; ix += x[j] * s; }
  let dph = Math.atan2(im, re) - Math.atan2(ix, rx); while (dph < 0) dph += 2 * Math.PI; const d = dph / (2 * Math.PI * f);
  ok(near(d, t, 0.0003), `time ${t * 1000} ms: the line delays ${(d * 1000).toFixed(3)} ms`); }
// ---- the clock: delay = stages / (2·clock); passes the lows flat; the bandwidth falls as the clock slows (longer time, fewer stages)
{ const k = BBD(); k.setRate(SR); ok(near(k.clock(0.005, 1024), 102400, 1e-6) && near(k.clock(0.02, 512), 12800, 1e-6), 'clock = stages / (2 · time)'); }
ok(near(gainAt(200, { time: 0.005, stages: 1024 }), 0, 0.3), `200 Hz passes: ${fmt(gainAt(200, { time: 0.005, stages: 1024 }))}`);
{ const fast = gainAt(6000, { time: 0.002, stages: 1024 }), slow = gainAt(6000, { time: 0.02, stages: 512 });
  ok(fast > -1.5, `a fast clock (256 kHz) keeps 6 kHz: ${fmt(fast)}`); ok(slow < -20, `a slow clock (12.8 kHz) takes 6 kHz away: ${fmt(slow)}`); }
{ const a = gainAt(5000, { time: 0.02, stages: 512 }), b = gainAt(5000, { time: 0.02, stages: 2048 }); ok(b > a + 6, `more stages, more bandwidth at the same time (512: ${fmt(a)}, 2048: ${fmt(b)})`); }
// ---- aliasing: a tone above half the clock does not come back as a loud alias (the anti-alias filter)
{ const N = SR / 2, y = run(sine(N, 9000, 0.25), Object.assign({ time: 0.02, stages: 512 }, clean)); let e = 0; for (let j = N / 2; j < N; j++) e += y[j] * y[j];
  const db = 10 * Math.log10(e / (N / 2) / (0.25 * 0.25 / 2)); ok(db < -30, `9 kHz into a 12.8 kHz clock: everything out (alias + leak) ${fmt(db)}`); }
// ---- the compander: a level goes through unchanged; the hiss breathes — near nothing in silence, higher under a loud note
{ for (const a of [0.05, 0.25, 0.7]) { const N = SR / 2, x = sine(N, 300, a), y = run(x, { time: 0.005, stages: 1024, hiss: -120, compand: 1 }); let p = 0, q = 0; for (let j = N / 2; j < N; j++) { p += y[j] * y[j]; q += x[j] * x[j]; }
    ok(near(10 * Math.log10(p / q), 0, 0.6), `compander round trip at ${a}: ${fmt(10 * Math.log10(p / q))}`); } }
{ const N = SR, hissOf = (x, comp) => { const y = run(x, { time: 0.005, stages: 1024, hiss: -60, compand: comp }); const yc = run(x, { time: 0.005, stages: 1024, hiss: -120, compand: comp }); let e = 0; for (let j = N / 2; j < N; j++) e += (y[j] - yc[j]) ** 2; return 10 * Math.log10(e / (N / 2) + 1e-30); };
  const silent = new Float32Array(N), off = hissOf(silent, 0), onSilent = hissOf(silent, 1), onLoud = hissOf(sine(N, 300, 0.5), 1);
  ok(onSilent < off - 20, `compander: hiss in silence ${fmt(onSilent)} vs ${fmt(off)} without it`); ok(onLoud > onSilent + 20, `compander: the hiss rises under a loud note (${fmt(onLoud)})`); }
// ---- the clock bleed is at the clock (an option, off by default); the seed makes the same hiss
{ const N = SR / 2, y = run(new Float32Array(N), { time: 0.02, stages: 256, hiss: -120, bleed: -50, compand: 0 }); let re = 0, im = 0; const f = 256 / 0.04;
  for (let j = N / 2; j < N; j++) { re += y[j] * Math.cos(2 * Math.PI * f * j / SR); im += y[j] * Math.sin(2 * Math.PI * f * j / SR); } const amp = 2 * Math.hypot(re, im) / (N / 2);
  ok(near(20 * Math.log10(amp), -50, 1.5), `bleed −50 dB at the ${f} Hz clock: ${fmt(20 * Math.log10(amp))}`); }
{ const x = sine(SR / 4, 220), a = run(x, { hiss: -60 }, 5), b = run(x, { hiss: -60 }, 5), c = run(x, { hiss: -60 }, 6);
  ok(a.every((v, i) => v === b[i]) && a.some((v, i) => v !== c[i]), 'the same seed, the same hiss; another seed, another'); }
// ---- a chorus sweep (time modulated at audio-block rate) stays bounded and continuous; silence ends in zeros; worklet; cost
{ const k = BBD(); k.setRate(SR); const N = SR * 2, x = sine(N, 440, 0.5), y = new Float32Array(N), t = new Float32Array(128); let pk = 0, jump = 0;
  for (let j = 0; j < N; j += 128) { for (let q = 0; q < 128; q++) t[q] = 0.004 + 0.002 * Math.sin(2 * Math.PI * 0.8 * (j + q) / SR);
    k.process([x.subarray(j, j + 128)], [y.subarray(j, j + 128)], 128, Object.assign(P({}), { time: t })); }
  for (let j = 4800; j < N - 1; j++) { pk = Math.max(pk, Math.abs(y[j])); jump = Math.max(jump, Math.abs(y[j + 1] - y[j])); }
  ok(pk < 0.8 && jump < 0.1, `a 0.8 Hz chorus sweep: peak ${pk.toFixed(3)}, largest step ${jump.toFixed(4)} (no clicks)`); }
{ const x = new Float32Array(SR); x[0] = 1; const y = run(x, Object.assign({}, clean)); ok(y[SR - 1] === 0, 'a decayed line ends in exact zeros'); }
ok(BBD_WORKLET.includes(BBD.toString()) && BBD_PARAMS.length === 5, 'the worklet is the tested kernel, 5 AudioParams');
{ const k = BBD(); k.setRate(SR); const M = SR * 2, x = new Float32Array(128).fill(0.3), y0 = new Float32Array(128), y1 = new Float32Array(128), p = P({});
  const t0 = process.hrtime.bigint(); for (let j = 0; j < M; j += 128) k.process([x, x], [y0, y1], 128, p); const ns = Number(process.hrtime.bigint() - t0) / M;
  console.log(`  cost: ${ns.toFixed(0)} ns per stereo sample`); ok(ns < 3000, 'under 3 µs per stereo sample'); }
console.log(`bbd-line: ${n} checks pass`);
