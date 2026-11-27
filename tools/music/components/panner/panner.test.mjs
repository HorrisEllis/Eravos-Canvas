// node tools/music/components/panner/panner.test.mjs — the panner proves its angle, distance and ears (new code).
import { createRequire } from 'module'; const { Panner } = createRequire(import.meta.url)('./panner.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000;
function run(o, f, sec) { const p = Panner(); p.set(o, SR); const L = [], R = []; for (let i = 0; i < SR * (sec || 0.5); i++) { const v = p.process(f(i)); L.push(v[0]); R.push(v[1]); } return { L, R }; }
const rms = (a, from) => { let s = 0, c = 0; for (let i = from || 0; i < a.length; i++) { s += a[i] * a[i]; c++; } return Math.sqrt(s / c); };
const sine = (hz) => (i) => Math.sin(2 * Math.PI * hz * i / SR), dB = (x) => 20 * Math.log10(x + 1e-15);
// ---- angle: equal power; centre −3 dB each side; hard left = right silent; ears 0 at distance 0 = the gains only (no delay, no filter)
{ const c = run({ angle: 0, distance: 0 }, sine(500)); ok(Math.abs(dB(rms(c.L, 1000)) - dB(Math.SQRT1_2 * Math.SQRT1_2)) < 0.05, 'centre: −3 dB a side');
  const l = run({ angle: -1 }, sine(500)); ok(rms(l.R, 1000) < 1e-9, 'hard left: right silent');
  for (const a of [-0.7, -0.2, 0.4, 0.9]) { const r = run({ angle: a }, sine(500)), p = rms(r.L, 1000) ** 2 + rms(r.R, 1000) ** 2; ok(Math.abs(p - 0.5) < 0.005, `equal power at ${a}: ${p.toFixed(4)}`); }
  const z = run({ angle: 0.3, distance: 0 }, (i) => i === 10 ? 1 : 0, 0.01); ok(Math.abs(z.R[10] - Math.sin(1.3 * Math.PI / 4)) < 1e-12, 'distance 0, ears 0: an impulse comes out at once, scaled only'); }
// ---- distance: level −18 dB at 1, later (12 ms), darker
{ const near = run({ distance: 0 }, sine(500)), far = run({ distance: 1 }, sine(500)); const dl = dB(rms(far.L, 2000)) - dB(rms(near.L, 2000)); ok(dl < -17 && dl > -19.5, `distance 1: ${dl.toFixed(1)} dB (−18 and the air)`);
  const imp = run({ distance: 1 }, (i) => i === 0 ? 1 : 0, 0.05); let at = 0, m = 0; imp.L.forEach((v, i) => { if (Math.abs(v) > m) { m = Math.abs(v); at = i; } }); ok(Math.abs(at / SR * 1000 - 12) < 0.2, `arrives ${(at / SR * 1000).toFixed(2)} ms later`);
  const hiNear = rms(run({ distance: 0 }, sine(8000)).L, 2000), hiFar = rms(run({ distance: 1 }, sine(8000)).L, 2000), loFar = rms(far.L, 2000) / rms(near.L, 2000);
  ok(hiFar / hiNear < loFar * 0.5, `the air takes the highs: 8 kHz falls more than 500 Hz (${dB(hiFar / hiNear).toFixed(1)} vs ${dB(loFar).toFixed(1)} dB)`); }
// ---- ears: the far ear later (≤ 0.66 ms) and darker at hard right; ears 0 → none
{ const imp = run({ angle: 1, ears: 1 }, (i) => i === 0 ? 1 : 0, 0.01); let a = 0, mL = 0; imp.L.forEach((v, i) => { if (Math.abs(v) > mL) { mL = Math.abs(v); a = i; } });
  ok(Math.abs(a / SR * 1000 - 0.66) < 0.05, `far ear at ${(a / SR * 1000).toFixed(3)} ms`);
  const st = run({ angle: 0.7, ears: 0 }, sine(6000)), bi = run({ angle: 0.7, ears: 1 }, sine(6000)), lo = run({ angle: 0.7, ears: 1 }, sine(200)), lo0 = run({ angle: 0.7, ears: 0 }, sine(200));
  const hiLoss = rms(bi.L, 2000) / rms(st.L, 2000), loLoss = rms(lo.L, 2000) / rms(lo0.L, 2000); ok(hiLoss < 0.6 && loLoss > 0.95, `head shadow: the far ear loses 6 kHz (${dB(hiLoss).toFixed(1)} dB), keeps 200 Hz (${dB(loLoss).toFixed(2)} dB)`); }
console.log(`✓ panner: ${n} checks`);
