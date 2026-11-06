// node tools/music/components/filter-ladder/filter-ladder.test.mjs — the ladder proves its own numbers (new sound code). Each
// response is MEASURED: a small sine through the kernel (small, so tanh is linear), its steady level against the input's.
import { createRequire } from 'module'; const { Ladder, LADDER_WORKLET, LADDER_PARAMS } = createRequire(import.meta.url)('./filter-ladder.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, near = (x, w, t) => Math.abs(x - w) <= t, fmt = (x) => x.toFixed(2) + ' dB';
const P = (o) => ({ frequency: [o.f || 1000], detune: [o.det || 0], resonance: [o.res || 0], drive: [o.drive || 0], bass: [o.bass || 0], mode: [o.mode || 0] });
function run(input, o) { const k = Ladder(); k.setRate(SR); const N = input.length, y = new Float32Array(N);
  for (let j = 0; j < N; j += 128) k.process([input.subarray(j, j + 128)], [y.subarray(j, j + 128)], Math.min(128, N - j), P(o)); return y; }
function gainAt(hz, o, amp) { amp = amp || 0.001; const N = SR, i = new Float32Array(N); for (let j = 0; j < N; j++) i[j] = amp * Math.sin(2 * Math.PI * hz * j / SR);
  const y = run(i, o); let a = 0, b = 0; for (let j = N * 3 / 4; j < N; j++) { a += y[j] * y[j]; b += i[j] * i[j]; } return 10 * Math.log10(a / b); }
// ---- 4-pole lowpass: flat below, −12.04 dB at the cutoff (four poles × −3.01), 24 dB per octave above; the 2-pole tap −6.02 and 12
for (const fc of [200, 1000, 5000]) {
  ok(near(gainAt(fc / 20, { f: fc }), 0, 0.1), `LP24 passes ${fc / 20} Hz under ${fc}: ${fmt(gainAt(fc / 20, { f: fc }))}`);
  ok(near(gainAt(fc, { f: fc }), -12.04, 0.2), `LP24 −12 dB at its cutoff ${fc} Hz: ${fmt(gainAt(fc, { f: fc }))}`);
  ok(near(gainAt(fc, { f: fc, mode: 1 }), -6.02, 0.2), `LP12 −6 dB at its cutoff ${fc} Hz: ${fmt(gainAt(fc, { f: fc, mode: 1 }))}`);
}
{ const a = gainAt(3000, { f: 300 }), b = gainAt(6000, { f: 300 }); ok(near(a - b, 24, 1.5), `LP24 24 dB/oct: ${fmt(a - b)}`); }
{ const a = gainAt(3000, { f: 300, mode: 1 }), b = gainAt(6000, { f: 300, mode: 1 }); ok(near(a - b, 12, 1), `LP12 12 dB/oct: ${fmt(a - b)}`); }
// ---- highpass taps: stop below (12 / 24 dB per octave), pass above; bandpass: falls either side of the cutoff
{ const a = gainAt(50, { f: 1000, mode: 4 }), b = gainAt(100, { f: 1000, mode: 4 }); ok(near(b - a, 24, 1.5), `HP24 24 dB/oct below: ${fmt(b - a)}`); ok(near(gainAt(15000, { f: 500, mode: 4 }), 0, 0.5), 'HP24 passes high'); }
{ const a = gainAt(50, { f: 1000, mode: 3 }), b = gainAt(100, { f: 1000, mode: 3 }); ok(near(b - a, 12, 1), `HP12 12 dB/oct below: ${fmt(b - a)}`); ok(near(gainAt(15000, { f: 500, mode: 3 }), 0, 0.5), 'HP12 passes high'); }
for (const hz of [100, 1000, 10000]) { const w = hz / 1000, want = 20 * Math.log10(2 * w / (1 + w * w)), got = gainAt(hz, { f: 1000, mode: 2 });   // 2·s/(1+s)²: 0 dB at the cutoff, 6 dB/oct either side
  ok(near(got, want, hz > 5000 ? 1.5 : 0.2), `BP at ${hz} Hz: ${fmt(got)} (theory ${fmt(want)})`); }
// ---- resonance: the peak rises and sits at the cutoff; the passband thins (1/(1+k)) and bass compensation gives it back
{ const pk = gainAt(1000, { f: 1000, res: 0.9 }); ok(pk > 6, `resonance 0.9 peaks at the cutoff: ${fmt(pk)}`);
  ok(pk > gainAt(800, { f: 1000, res: 0.9 }) && pk > gainAt(1250, { f: 1000, res: 0.9 }), 'the peak is at the cutoff, not beside it');
  const thin = gainAt(30, { f: 1000, res: 0.75 }), k = 4.2 * 0.75; ok(near(thin, 20 * Math.log10(1 / (1 + k)), 0.3), `resonance thins the bass to 1/(1+k): ${fmt(thin)}`);
  ok(near(gainAt(30, { f: 1000, res: 0.75, bass: 1 }), 0, 0.3), `bass compensation gives it back: ${fmt(gainAt(30, { f: 1000, res: 0.75, bass: 1 }))}`); }
// ---- drive: the small-signal level is kept; a loud signal is squashed (harmonics), never louder than the clip allows
for (const dr of [0, 12, 24]) ok(near(gainAt(100, { f: 2000, drive: dr }), 0, 0.15), `drive ${dr} dB keeps the small-signal level`);
{ const N = SR / 2, i = new Float32Array(N); for (let j = 0; j < N; j++) i[j] = 0.8 * Math.sin(2 * Math.PI * 110 * j / SR);
  const y = run(i, { f: 8000, drive: 24 }); let pk = 0; for (let j = N / 2; j < N; j++) pk = Math.max(pk, Math.abs(y[j]));
  ok(pk < 0.8 * 0.2, `24 dB of drive saturates inside the loop (peak ${pk.toFixed(3)} for a 0.8 input)`);
  // the 3rd harmonic appears when driven, and not when clean
  const h3 = (y) => { let re = 0, im = 0; for (let j = N / 2; j < N; j++) { re += y[j] * Math.cos(2 * Math.PI * 330 * j / SR); im += y[j] * Math.sin(2 * Math.PI * 330 * j / SR); } return Math.hypot(re, im); };
  const lo = new Float32Array(N); for (let j = 0; j < N; j++) lo[j] = 0.001 * Math.sin(2 * Math.PI * 110 * j / SR);
  ok(h3(y) / 0.8 > 100 * h3(run(lo, { f: 8000 })) / 0.001, 'driven, the 3rd harmonic is there; clean, it is not'); }
// ---- self-oscillation: resonance 1 sings on its own after a click, near the cutoff, and stays bounded for 20 seconds
{ const N = SR * 20, i = new Float32Array(N); i[0] = 0.1; const y = run(i, { f: 800, res: 1 });
  let pk = 0, late = 0; for (let j = 0; j < N; j++) { const a = Math.abs(y[j]); if (!(a < 10)) { pk = Infinity; break; } pk = Math.max(pk, a); if (j > N - SR) late = Math.max(late, a); }
  ok(isFinite(pk) && pk < 2, `bounded for 20 s (peak ${pk.toFixed(3)})`); ok(late > 0.05, `still singing after 19 s (${late.toFixed(3)})`);
  let zc = 0; for (let j = N - SR; j < N - 1; j++) if (y[j] <= 0 && y[j + 1] > 0) zc++; ok(near(zc, 800, 800 * 0.12), `it sings at ${zc} Hz, near the 800 Hz cutoff`); }
// ---- the cutoff follows detune (cents) and stays under Nyquist; silence in gives exact silence (denormals flushed)
ok(near(gainAt(2000, { f: 1000, det: 1200 }), -12.04, 0.3), 'detune +1200 cents moves the cutoff an octave up');
ok(isFinite(gainAt(1000, { f: 40000 })), 'a cutoff past Nyquist is held under it');
{ const N = SR, i = new Float32Array(N); i[0] = 1; const y = run(i, { f: 500, res: 0.5 }); ok(y[N - 1] === 0, 'a decayed tail ends in exact zeros (denormals flushed)'); }
// ---- audio-rate cutoff modulation stays bounded; the worklet carries the same kernel text
{ const k = Ladder(); k.setRate(SR); const N = SR, x = new Float32Array(N), y = new Float32Array(N), f = new Float32Array(128); for (let j = 0; j < N; j++) x[j] = Math.sin(2 * Math.PI * 110 * j / SR) * 0.5;
  let pk = 0; for (let j = 0; j < N; j += 128) { for (let q = 0; q < 128; q++) f[q] = 1000 + 900 * Math.sin(2 * Math.PI * 300 * (j + q) / SR);
    k.process([x.subarray(j, j + 128)], [y.subarray(j, j + 128)], 128, { frequency: f, detune: [0], resonance: [0.95], drive: [6], bass: [0.5], mode: [0] }); }
  for (let j = 0; j < N; j++) pk = Math.max(pk, Math.abs(y[j])); ok(isFinite(pk) && pk < 4, `300 Hz cutoff FM at resonance 0.95 stays bounded (${pk.toFixed(2)})`); }
ok(LADDER_WORKLET.includes(Ladder.toString()) && LADDER_PARAMS.length === 6, 'the worklet is the tested kernel, 6 AudioParams');
// ---- cost
{ const k = Ladder(); k.setRate(SR); const N = SR * 4, x = new Float32Array(128).fill(0.3), y0 = new Float32Array(128), y1 = new Float32Array(128), p = P({ f: 900, res: 0.6, drive: 6 });
  const t = process.hrtime.bigint(); for (let j = 0; j < N; j += 128) k.process([x, x], [y0, y1], 128, p); const ns = Number(process.hrtime.bigint() - t) / N;
  console.log(`  cost: ${ns.toFixed(0)} ns per stereo sample`); ok(ns < 2000, 'under 2 µs per stereo sample'); }
console.log(`filter-ladder: ${n} checks pass`);
