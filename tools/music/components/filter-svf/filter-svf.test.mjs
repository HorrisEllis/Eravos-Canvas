// node tools/music/components/filter-svf/filter-svf.test.mjs — the state-variable filter proves its own numbers (it is new sound code:
// there is nothing older for it to equal). Each response is MEASURED: a sine through the kernel, its steady-state level against the input.
import { createRequire } from 'module'; const { SVF, SVF_WORKLET, SVF_PARAMS } = createRequire(import.meta.url)('./filter-svf.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000;
const P = (o) => ({ frequency: [o.f || 1000], detune: [o.det || 0], resonance: [o.res || 0], gain: [o.gain || 0], mode: [o.mode || 0], stages: [o.stages || 1] });
// level (dB) of a sine at hz after the filter, measured over its last 1/4 second (transient gone)
function gainAt(hz, o) {
  const k = SVF(); k.setRate(SR); const N = SR, i = new Float32Array(N), y = new Float32Array(N);
  for (let j = 0; j < N; j++) i[j] = Math.sin(2 * Math.PI * hz * j / SR);
  for (let j = 0; j < N; j += 128) k.process([i.subarray(j, j + 128)], [y.subarray(j, j + 128)], Math.min(128, N - j), P(o));
  let a = 0, b = 0; for (let j = N * 3 / 4; j < N; j++) { a += y[j] * y[j]; b += i[j] * i[j]; }
  return 10 * Math.log10(a / b);
}
const near = (x, want, tol) => Math.abs(x - want) <= tol;
const fmt = (x) => x.toFixed(2) + ' dB';
// ---- lowpass: Butterworth at resonance 0 (flat, −3.01 dB at the cutoff), 12 / 24 / 36 dB per octave
for (const fc of [100, 1000, 5000]) {
  ok(near(gainAt(fc / 10, { f: fc }), 0, 0.05), `LP passes ${fc / 10} Hz under a ${fc} Hz cutoff: ${fmt(gainAt(fc / 10, { f: fc }))}`);
  ok(near(gainAt(fc, { f: fc }), -3.01, 0.15), `LP −3 dB at its cutoff ${fc} Hz: ${fmt(gainAt(fc, { f: fc }))}`);
}
for (const [st, slope] of [[1, 12], [2, 24], [3, 36]]) {
  const a = gainAt(2000, { f: 250, stages: st }), b = gainAt(4000, { f: 250, stages: st });
  ok(near(a - b, slope, 1.2), `LP ${slope} dB/oct with ${st} stage(s): ${fmt(a - b)} per octave (2 → 4 kHz, cutoff 250 Hz)`);
}
// ---- highpass mirrors it
ok(near(gainAt(10000, { f: 1000, mode: 1 }), 0, 0.05) && near(gainAt(1000, { f: 1000, mode: 1 }), -3.01, 0.15), 'HP flat above, −3 dB at the cutoff');
{ const a = gainAt(125, { f: 4000, mode: 1, stages: 2 }), b = gainAt(62.5, { f: 4000, mode: 1, stages: 2 }); ok(near(a - b, 24, 1.2), `HP 24 dB/oct with 2 stages: ${fmt(a - b)}`); }
// ---- bandpass: 0 dB at its centre, falling either side; notch: a deep hole at the cutoff
ok(near(gainAt(1000, { f: 1000, mode: 2, res: 0.5 }), 0, 0.1), 'BP 0 dB at its centre');
ok(gainAt(4000, { f: 1000, mode: 2, res: 0.5 }) < -10 && gainAt(250, { f: 1000, mode: 2, res: 0.5 }) < -10, 'BP falls away either side');
ok(gainAt(1000, { f: 1000, mode: 3 }) < -60, `notch deeper than −60 dB at the cutoff: ${fmt(gainAt(1000, { f: 1000, mode: 3 }))}`);
ok(near(gainAt(100, { f: 1000, mode: 3 }), 0, 0.2) && near(gainAt(10000, { f: 1000, mode: 3 }), 0, 0.2), 'notch flat away from it');
// ---- resonance: a peak that grows with it
{ const r0 = gainAt(1000, { f: 1000, res: 0 }), r5 = gainAt(1000, { f: 1000, res: 0.5 }), r9 = gainAt(1000, { f: 1000, res: 0.9 });
  ok(r5 > r0 + 4 && r9 > r5 + 8, `resonance raises the peak: ${fmt(r0)} → ${fmt(r5)} → ${fmt(r9)}`); }
// ---- bell and shelves: the gain they are given, where they are given it
ok(near(gainAt(1000, { f: 1000, mode: 5, gain: 9, res: 0.3 }), 9, 0.2), 'bell +9 dB at its centre');
ok(near(gainAt(1000, { f: 1000, mode: 5, gain: -9, res: 0.3 }), -9, 0.2), 'bell −9 dB at its centre');
ok(near(gainAt(40, { f: 1000, mode: 6, gain: 6 }), 6, 0.2) && near(gainAt(15000, { f: 1000, mode: 6, gain: 6 }), 0, 0.2), 'low shelf +6 dB below, 0 above');
ok(near(gainAt(15000, { f: 1000, mode: 7, gain: -6 }), -6, 0.3) && near(gainAt(40, { f: 1000, mode: 7, gain: -6 }), 0, 0.2), 'high shelf −6 dB above, 0 below');
ok(near(gainAt(300, { f: 1000, mode: 8 }), 0, 0.05) && near(gainAt(3000, { f: 1000, mode: 8 }), 0, 0.05), 'all-pass: flat everywhere');
// ---- detune: cents move the cutoff (key-track, envelope, velocity and LFOs arrive here)
ok(near(gainAt(2000, { f: 1000, det: 1200 }), -3.01, 0.15), 'detune +1200 cents = the cutoff an octave up');
// ---- range: clamped to 16 Hz … 20 kHz and under 0.49 × the sample rate, never a NaN
ok(Number.isFinite(gainAt(100, { f: 1e6 })) && Number.isFinite(gainAt(100, { f: 0 })) && Number.isFinite(gainAt(100, { f: -5 })), 'cutoff outside the range is clamped, never NaN');
// ---- stable to self-oscillation and to wild modulation: 20 s, resonance 1, cutoff swept at audio rate across the whole range
{ const k = SVF(); k.setRate(SR); const B = 128, x = new Float32Array(B), y = new Float32Array(B), f = new Float32Array(B), r = new Float32Array(B); let peak = 0, bad = false, ph = 0;
  for (let blk = 0; blk < SR * 20 / B; blk++) {
    for (let j = 0; j < B; j++) { ph += 2 * Math.PI * 30 / SR; x[j] = blk < 10 ? (Math.random() * 2 - 1) : 0; f[j] = 20 * Math.pow(1000, 0.5 + 0.5 * Math.sin(ph)); r[j] = 1; }
    for (const mode of [0]) k.process([x], [y], B, { frequency: f, detune: [0], resonance: r, gain: [0], mode: [mode], stages: [3] });
    for (let j = 0; j < B; j++) { if (!Number.isFinite(y[j])) bad = true; peak = Math.max(peak, Math.abs(y[j])); }
  }
  ok(!bad && peak < 1e4, `resonance 1, cutoff swept 20 Hz – 20 kHz at 30 Hz for 20 s: bounded (peak ${peak.toFixed(1)}), no NaN`); }
// ---- denormals: once the input stops, the state goes to exact zero (no slow CPU-eating tail)
{ const k = SVF(); k.setRate(SR); const B = 128, x = new Float32Array(B), y = new Float32Array(B); x[0] = 1;
  k.process([x], [y], B, P({ f: 200, res: 0.2 })); x[0] = 0; let blocks = 0, last = 1;
  while (blocks < SR * 30 / B) { k.process([x], [y], B, P({ f: 200, res: 0.2 })); last = y[B - 1]; blocks++; if (last === 0 && y.every(v => v === 0)) break; }
  ok(last === 0, `decays to exact zero after the input stops (${(blocks * B / SR).toFixed(2)} s)`); }
// ---- real-time safe: process() makes no objects or arrays (read from its source)
{ const src = SVF.toString(), body = src.slice(src.indexOf('process(ins, outs, n, P)'));
  ok(!/\bnew\b|\[\s*\]|\{\s*\}|=>|\.map\(|\.slice\(|\.concat\(/.test(body.slice(0, body.indexOf('\n      },'))), 'process() allocates nothing'); }
// ---- the worklet plays the SAME kernel (its text is the kernel's text)
ok(SVF_WORKLET.includes(SVF.toString()) && /registerProcessor\('eravos-svf'/.test(SVF_WORKLET), 'the worklet holds the tested kernel verbatim');
ok(SVF_PARAMS.map(p => p.name).join() === 'frequency,detune,resonance,gain,mode,stages', 'its six parameters, all automatable');
// ---- cost: nanoseconds per sample, stereo, 3 stages, cutoff moving every sample (the worst case)
{ const k = SVF(); k.setRate(SR); const B = 128, l = new Float32Array(B).map(() => Math.random() - 0.5), r = l.slice(), yl = new Float32Array(B), yr = new Float32Array(B), f = new Float32Array(B).map((_, j) => 300 + j * 10);
  const blocks = 4000, t0 = process.hrtime.bigint(); for (let b = 0; b < blocks; b++) k.process([l, r], [yl, yr], B, { frequency: f, detune: [0], resonance: [0.7], gain: [0], mode: [0], stages: [3] });
  const ns = Number(process.hrtime.bigint() - t0) / (blocks * B);
  ok(ns < 2000, `cost ${ns.toFixed(0)} ns per stereo sample, worst case (${(ns * SR / 1e7).toFixed(2)} % of one core at 48 kHz)`);
  console.log(`  cost: ${ns.toFixed(0)} ns per stereo sample, 3 stages, cutoff moving every sample → ${(ns * SR / 1e7).toFixed(2)} % of a core`); }
console.log(`filter-svf: ${n} checks passed — measured responses, slopes, resonance, bell/shelves, detune, range, stability, denormals, no allocation`);
