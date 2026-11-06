// node tools/music/components/stereo-tools/stereo-tools.test.mjs — panning and mono-below prove their numbers (new code).
import { createRequire } from 'module'; const { panL, panR, spread, MonoBelow, correlation } = createRequire(import.meta.url)('./stereo-tools.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, db = (x) => 20 * Math.log10(x);
// ---- equal power: L² + R² = 1 everywhere; −3 dB each in the middle; hard left is left only
for (const x of [-1, -0.5, 0, 0.3, 1]) ok(Math.abs(panL(x) ** 2 + panR(x) ** 2 - 1) < 1e-12, `equal power at ${x}`);
ok(Math.abs(db(panL(0)) + 3.0103) < 1e-3, 'middle: −3 dB each side'); ok(panR(-1) < 1e-12 && Math.abs(panL(-1) - 1) < 1e-12, 'hard left');
// ---- spread: 5 voices at width 1 → −1, −0.5, 0, 0.5, 1; one voice in the middle
ok(JSON.stringify([0, 1, 2, 3, 4].map(i => spread(i, 5, 1))) === '[-1,-0.5,0,0.5,1]', 'spread evenly'); ok(spread(0, 1, 1) === 0, 'one voice: the middle');
// level of a sine (after the filter settles) in one channel
function through(hz, side, cutoff) {
  const m = MonoBelow(); m.set(cutoff, SR); const N = SR, L = new Float32Array(N), R = new Float32Array(N);
  for (let j = 0; j < N; j++) { const s = Math.sin(2 * Math.PI * hz * j / SR); L[j] = s; R[j] = side ? -s : s; }
  for (let j = 0; j < N; j += 128) m.process(L.subarray(j, j + 128), R.subarray(j, j + 128), Math.min(128, N - j));
  let e = 0; for (let j = N / 2; j < N; j++) e += L[j] * L[j]; return { db: 10 * Math.log10(e / (N / 2) / 0.5), L, R };
}
// ---- mono in → exactly the same out (at any frequency)
for (const hz of [30, 120, 1000]) { const r = through(hz, false, 120); let d = 0; for (let j = 0; j < SR; j++) d = Math.max(d, Math.abs(r.L[j] - Math.sin(2 * Math.PI * hz * j / SR))); ok(d < 1e-6, `mono ${hz} Hz passes untouched (max diff ${d.toExponential(1)})`); }
// ---- side below the cutoff is taken out; side well above it passes
{ const lo = through(30, true, 200).db, hi = through(4000, true, 200).db; ok(lo < -12, `side at 30 Hz with mono below 200 Hz: ${lo.toFixed(1)} dB`); ok(hi > -0.5, `side at 4 kHz: ${hi.toFixed(2)} dB (passes)`); }
// ---- correlation
{ const a = Float32Array.from({ length: 480 }, (_, j) => Math.sin(j / 7)); ok(Math.abs(correlation(a, a, 480) - 1) < 1e-9, 'same → 1'); ok(Math.abs(correlation(a, a.map(x => -x), 480) + 1) < 1e-9, 'inverted → −1'); }
console.log(`✓ stereo-tools: ${n} checks`);
