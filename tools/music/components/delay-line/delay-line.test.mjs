// node tools/music/components/delay-line/delay-line.test.mjs — the delay line proves its own numbers (new sound code).
import { createRequire } from 'module'; const { Delay, DELAY_WORKLET, DELAY_PARAMS } = createRequire(import.meta.url)('./delay-line.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, near = (a, b, t) => Math.abs(a - b) <= t;
const DEF = Object.fromEntries(DELAY_PARAMS.map(p => [p.name, p.defaultValue]));
const P = (o) => { const q = {}; for (const k in DEF) q[k] = [o[k] !== undefined ? o[k] : DEF[k]]; q.lowcut = [o.lowcut || 1]; q.damp = [o.damp || 22000]; return q; };
function run(x, o, k, at) { k = k || Delay(); if (!at) k.setRate(SR, o.max || 20); const N = x.length, y = new Float32Array(N);
  for (let j = 0; j < N; j += 128) { const q = typeof o === 'function' ? o(j) : o; k.process([x.subarray(j, j + 128)], [y.subarray(j, j + 128)], Math.min(128, N - j), P(q)); } return y; }
const imp = (N) => { const x = new Float32Array(N); x[0] = 1; return x; };
const sine = (N, hz, a) => { const x = new Float32Array(N); for (let j = 0; j < N; j++) x[j] = (a || 1) * Math.sin(2 * Math.PI * hz * j / SR); return x; };
// ---- an impulse comes out exactly `time` later, once (no feedback, wet only), in both modes
for (const mode of [0, 1]) { const y = run(imp(SR), { time: 0.25, feedback: 0, mix: 1, mode }); let at = -1, other = 0; for (let j = 0; j < SR; j++) { if (Math.abs(y[j]) > 0.99) at = j; else other = Math.max(other, Math.abs(y[j])); }
  ok(at === 12000 && other < 1e-9, `mode ${mode}: the impulse arrives at 12000 samples (0.25 s), once — got ${at}`); }
// ---- fractional delay: a 200 Hz sine 100.37 samples late, equal to the exact shifted sine (Hermite)
{ const y = run(sine(SR / 4, 200), { time: 100.37 / SR, feedback: 0, mix: 1 }); let e = 0, s = 0; for (let j = 2000; j < SR / 4; j++) { const want = Math.sin(2 * Math.PI * 200 * (j - 100.37) / SR); e += (y[j] - want) ** 2; s += want * want; }
  const db = 10 * Math.log10(e / s); ok(db < -80, `fractional 100.37-sample delay is exact to ${db.toFixed(1)} dB`); }
// ---- feedback: each echo is feedback × the last, one period apart; 20 s is reachable
{ const y = run(imp(SR * 2), { time: 0.1, feedback: 0.5, mix: 1 }); const e = [1, 2, 3, 4].map(k => y[4800 * k]);
  ok(e.every((v, i) => near(v, Math.pow(0.5, i), 1e-6)), `echoes 1, 0.5, 0.25, 0.125: ${e.map(v => v.toFixed(4)).join(', ')}`); }
{ const y = run(imp(SR * 21), { time: 20, feedback: 0, mix: 1 }); ok(near(y[SR * 20], 1, 1e-6), 'a 20 second delay arrives at 20 s'); }
// ---- tempo sync: 1.5 beats at 120 bpm = 0.75 s, whatever time says
{ const y = run(imp(SR), { time: 0.1, sync: 1.5, bpm: 120, feedback: 0, mix: 1 }); ok(near(y[36000], 1, 1e-6) && Math.abs(y[4800]) < 1e-9, 'sync 1.5 beats at 120 bpm lands at 0.75 s'); }
// ---- mix: 0 is the dry signal exactly, 0.5 half of each
{ const x = sine(4800, 330), y = run(x, { time: 0.01, feedback: 0.6, mix: 0 }); ok(y.every((v, j) => v === x[j]), 'mix 0 is the dry signal, untouched');
  const z = run(imp(SR / 2), { time: 0.1, feedback: 0, mix: 0.5 }); ok(near(z[0], 0.5, 1e-9) && near(z[4800], 0.5, 1e-6), 'mix 0.5: half dry, half wet'); }
// ---- damp: every repeat is darker (8 kHz loses more than 200 Hz per echo); low cut thins each repeat's lows
{ const lv = (hz, o) => { const N = SR, x = new Float32Array(N); for (let j = 0; j < 2400; j++) x[j] = Math.sin(2 * Math.PI * hz * j / SR); const y = run(x, Object.assign({ time: 0.1, feedback: 0.9, mix: 1 }, o));
    const e = (a) => { let s = 0; for (let j = a; j < a + 2400; j++) s += y[j] * y[j]; return s; }; return 10 * Math.log10(e(4800 * 4) / e(4800)); };   // 4th echo against the 1st
  const hi = lv(8000, { damp: 2000 }), lo = lv(200, { damp: 2000 }); ok(hi < lo - 15, `damp 2 kHz: 8 kHz falls ${hi.toFixed(1)} dB over three repeats, 200 Hz ${lo.toFixed(1)} dB`);
  const thin = lv(60, { lowcut: 400 }), full = lv(4000, { lowcut: 400 }); ok(thin < full - 15, `low cut 400 Hz: 60 Hz falls ${thin.toFixed(1)} dB, 4 kHz ${full.toFixed(1)} dB`); }
// ---- feedback past 1 with drive saturates, bounded; without drive at 1.0 it holds; freeze keeps it exactly, input shut
{ const y = run(sine(SR * 10, 220, 0.5), { time: 0.05, feedback: 1.2, drive: 12, mix: 1 }); let pk = 0; for (const v of y) pk = Math.max(pk, Math.abs(v)); ok(isFinite(pk) && pk < 3, `feedback 1.2 with 12 dB drive stays bounded over 10 s (peak ${pk.toFixed(2)})`); }
{ const k = Delay(); k.setRate(SR, 2); const N = SR * 10, x = sine(N, 440, 0.5); for (let j = SR / 2; j < N; j++) x[j] = j > SR * 3 ? 0.9 : 0;   // after 3 s, a loud input the freeze must ignore
  const y = run(x, (j) => ({ time: 0.25, feedback: 0.3, mix: 1, freeze: j >= SR / 2 ? 1 : 0, damp: 3000, drive: 6 }), k, true);
  const rms = (a) => { let s = 0; for (let j = a; j < a + 12000; j++) s += y[j] * y[j]; return Math.sqrt(s / 12000); }; const a = rms(SR), b = rms(N - 12000);
  ok(a > 0.1 && near(20 * Math.log10(b / a), 0, 0.01), `freeze holds what is in the line for 9 s (${(20 * Math.log10(b / a)).toFixed(4)} dB), new input shut out`); }
// ---- a change of time: TAPE bends the pitch (glides), DIGITAL does not (cross-fades)
{ const zc = (y, a, b) => { let c = 0; for (let j = a; j < b; j++) if (y[j] <= 0 && y[j + 1] > 0) c++; return c / ((b - a) / SR); };
  const x = sine(SR * 2, 1000, 0.5), o = (mode) => (j) => ({ time: j < SR ? 0.5 : 0.25, feedback: 0, mix: 1, mode });
  const tape = run(x, o(0)), dig = run(x, o(1));
  const tGlide = zc(tape, SR + 200, SR + 2600), dAfter = zc(dig, SR + 2000, SR + 12000), dBefore = zc(dig, SR / 2 + 1000, SR - 1000);
  ok(tGlide > 1500, `tape: shortening the time bends the pitch up while it glides (${tGlide.toFixed(0)} Hz from 1000)`);
  ok(near(dBefore, 1000, 15) && near(dAfter, 1000, 15), `digital: the pitch stays 1000 Hz (${dBefore.toFixed(0)} → ${dAfter.toFixed(0)})`);
  let jump = 0; for (let j = SR - 200; j < SR + 3000; j++) jump = Math.max(jump, Math.abs(dig[j + 1] - dig[j])); ok(jump < 0.2, `digital cross-fades without a click (largest step ${jump.toFixed(3)})`); }
// ---- modulation: a 3 ms LFO at 1 Hz wobbles the pitch (chorus/flutter), bounded around the input's
{ const y = run(sine(SR * 2, 1000, 0.5), { time: 0.02, feedback: 0, mix: 1, modDepth: 3, modRate: 1 }); const f = [];
  for (let a = SR / 2; a < SR * 2 - 4800; a += 4800) { let c = 0; for (let j = a; j < a + 4800; j++) if (y[j] <= 0 && y[j + 1] > 0) c++; f.push(c * 10); }
  ok(Math.max(...f) > 1008 && Math.min(...f) < 992 && Math.max(...f) < 1030, `mod depth wobbles the pitch ${Math.min(...f)}–${Math.max(...f)} Hz`); }
// ---- silence ends in exact zeros; the worklet is the tested kernel; cost
{ const y = run(imp(SR * 3), { time: 0.05, feedback: 0.7, mix: 1, damp: 3000 }); ok(y[SR * 3 - 1] === 0, 'a dying tail ends in exact zeros (denormals flushed)'); }
ok(DELAY_WORKLET.includes(Delay.toString()) && DELAY_PARAMS.length === 12, 'the worklet is the tested kernel, 12 AudioParams');
{ const k = Delay(); k.setRate(SR, 20); const N = SR * 4, x = new Float32Array(128).fill(0.3), y0 = new Float32Array(128), y1 = new Float32Array(128), p = P({ time: 0.3, feedback: 0.6, damp: 5000, drive: 6, modDepth: 2 });
  const t = process.hrtime.bigint(); for (let j = 0; j < N; j += 128) k.process([x, x], [y0, y1], 128, p); const ns = Number(process.hrtime.bigint() - t) / N;
  console.log(`  cost: ${ns.toFixed(0)} ns per stereo sample`); ok(ns < 3000, 'under 3 µs per stereo sample'); }
console.log(`delay-line: ${n} checks pass`);
