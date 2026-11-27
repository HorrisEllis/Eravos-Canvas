// node tools/music/components/multiband-splitter/multiband-splitter.test.mjs — the splitter proves its crossover (new code).
import { createRequire } from 'module'; const { Splitter, lr4Response } = createRequire(import.meta.url)('./multiband-splitter.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000;
// steady-state amplitude of each band and of their sum for a sine at f (after a settle)
function measure(f, f1, f2, bands) {
  const s = Splitter(); s.set(f1, f2, bands, SR); const N = Math.round(SR * 0.6), settle = Math.round(SR * 0.4); const pk = [0, 0, 0], sum = [0];
  for (let i = 0; i < N; i++) { const o = s.process(Math.sin(2 * Math.PI * f * i / SR)); if (i < settle) continue; for (let b = 0; b < 3; b++) pk[b] = Math.max(pk[b], Math.abs(o[b])); sum[0] = Math.max(sum[0], Math.abs(o[0] + o[1] + o[2])); }
  return { pk, sum: sum[0] };
}
const db = (x) => 20 * Math.log10(x);
// ---- 2 bands: −6 dB each at the crossover; the sum flat (±0.05 dB) from 30 Hz to 15 kHz
{ const m = measure(120, 120, 0, 2); ok(Math.abs(db(m.pk[0]) + 6.02) < 0.15 && Math.abs(db(m.pk[1]) + 6.02) < 0.15, `crossover 120 Hz: low ${db(m.pk[0]).toFixed(2)} dB, high ${db(m.pk[1]).toFixed(2)} dB (−6.02)`);
  for (const f of [30, 60, 120, 240, 1000, 5000, 15000]) { const s = measure(f, 120, 0, 2).sum; ok(Math.abs(db(s)) < 0.05, `2 bands sum flat at ${f} Hz: ${db(s).toFixed(3)} dB`); } }
// ---- slopes, LR4 = 1/(1 + (f/fc)^4): an octave away −24.6 dB, two octaves −48.2 dB
{ for (const [f, side, want] of [[240, 0, -24.6], [480, 0, -48.2], [60, 1, -24.6], [30, 1, -48.2]]) { const v = db(measure(f, 120, 0, 2).pk[side]); ok(Math.abs(v - want) < 0.6, `${side ? 'high' : 'low'} band at ${f} Hz: ${v.toFixed(1)} dB (${want})`); } }
// ---- 3 bands: the sum stays flat (the low band takes the 2nd crossover's allpass), the mid is −6 at both crossovers
{ for (const f of [40, 110, 300, 1500, 3000, 9000]) { const s = measure(f, 110, 1500, 3).sum; ok(Math.abs(db(s)) < 0.06, `3 bands sum flat at ${f} Hz: ${db(s).toFixed(3)} dB`); }
  const a = measure(110, 110, 1500, 3).pk[1], b = measure(1500, 110, 1500, 3).pk[1]; ok(Math.abs(db(a) + 6) < 0.5 && Math.abs(db(b) + 6) < 0.5, `mid band −6 at both crossovers: ${db(a).toFixed(2)} / ${db(b).toFixed(2)} dB`); }
// ---- the drawn response agrees with the kernel; stable and silent after a reset
{ ok(Math.abs(db(lr4Response(120, 120, 'low')) + 6.02) < 0.01, 'lr4Response −6.02 dB at fc'); const s = Splitter(); s.set(80, 0, 2, SR); for (let i = 0; i < 1000; i++) s.process(Math.random() * 2 - 1); s.reset(); const o = s.process(0); ok(o[0] === 0 && o[1] === 0, 'reset: silent'); }
console.log(`✓ multiband-splitter: ${n} checks`);
