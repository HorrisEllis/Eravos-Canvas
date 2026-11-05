import { store, restore, nullDb, judge, isUnstable, GATE_DB } from './null-render-core.mjs';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const sine = (amp, len = 48000, hz = 220) => Float32Array.from({ length: len }, (_, i) => amp * Math.sin(2 * Math.PI * hz * i / 48000));
// 1. identical → deep null, store/restore round-trip well under the gate even for a quiet render (−50 dBFS)
for (const amp of [0.9, 0.05, 0.003]) {
  const a = sine(amp), { scale, i16 } = store(a), r = nullDb(restore(scale, i16), a);
  ok(r.relDb < -80, `round trip at amp ${amp}: ${r.relDb.toFixed(1)} dB`); ok(judge(r) === 'PASS', 'identical passes');
}
// 2. a 0.2 % gain change = −54 dB → must FAIL the −60 dB gate; a 0.05 % change = −66 dB must PASS
{ const a = sine(0.5), r1 = nullDb(a, a.map(x => x * 1.002)), r2 = nullDb(a, a.map(x => x * 1.0005));
  ok(Math.abs(r1.relDb - (-54)) < 0.5 && judge(r1) === 'FAIL', `0.2% gain → ${r1.relDb.toFixed(1)} dB`);
  ok(Math.abs(r2.relDb - (-66)) < 0.5 && judge(r2) === 'PASS', `0.05% gain → ${r2.relDb.toFixed(1)} dB`); }
// 3. a one-sample shift of a 1 kHz tone is far over the gate (timing changes cannot hide)
{ const a = sine(0.5, 48000, 1000), b = new Float32Array(a.length); b.set(a.subarray(0, a.length - 1), 1); ok(judge(nullDb(a, b)) === 'FAIL', 'one-sample shift fails'); }
// 4. NaN and a length change fail; a silent reference is judged absolutely
{ const a = sine(0.5), b = Float32Array.from(a); b[100] = NaN; ok(judge(nullDb(a, b)) === 'FAIL', 'NaN fails'); ok(judge(nullDb(a, a.subarray(0, 47000))) === 'FAIL', 'length change fails'); }
{ const z = new Float32Array(48000), s = z.map(() => 1e-7); ok(nullDb(z, s).absolute && judge(nullDb(z, s)) === 'PASS', 'silent ref, tiny residual passes');
  ok(judge(nullDb(z, z.map(() => 1e-3))) === 'FAIL', 'silent ref, audible residual fails'); }
// 5. unstable renders are named, not passed
{ const a = sine(0.5), b = a.map((x, i) => x + 0.01 * Math.sin(i * 12.9898)); ok(isUnstable(a, b), 'a render that differs from itself is unstable'); ok(!isUnstable(a, Float32Array.from(a)), 'identical twice is stable'); ok(judge({ relDb: 0 }, { unstable: true }) === 'UNSTABLE', 'verdict'); }
ok(GATE_DB === -60, 'gate is −60 dB (spec)');
console.log(`null-render-core: ${n} checks passed`);
