// node tools/music/components/osc-sub/osc-sub.test.mjs — the sub oscillator proves its pitch, shapes, phase and band-limiting.
import { createRequire } from 'module'; const { Sub } = createRequire(import.meta.url)('./osc-sub.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, near = (a, b, t) => Math.abs(a - b) <= t;
const gen = (f, oct, shape, N) => { const s = Sub(), y = new Float64Array(N || SR); s.render(y, y.length, f, SR, oct, shape); return y; };
const harm = (y, f) => { let re = 0, im = 0; for (let j = 0; j < y.length; j++) { re += y[j] * Math.cos(2 * Math.PI * f * j / SR); im += y[j] * Math.sin(2 * Math.PI * f * j / SR); } return 2 * Math.hypot(re, im) / y.length; };
const db = (a, b) => 20 * Math.log10(a / b);
// ---- pitch: −1 and −2 octaves (and 0), exact, for every shape
for (const shape of [0, 1, 2, 3]) for (const [oct, div] of [[0, 1], [-1, 2], [-2, 4]]) { const f = 220, y = gen(f, oct, shape); const want = f / div;
  ok(harm(y, want) > 0.5 && harm(y, want * 1.5) < 0.05, `shape ${shape}, octave ${oct}: the fundamental is ${want} Hz`); }
// ---- shapes: every one symmetric (no DC, no even harmonics), within ±1; square ~ 1/n odd harmonics, triangle 1/n², rounded square
//      between (its 3rd well under a square's, its 7th tiny)
for (const shape of [0, 1, 2, 3]) { const y = gen(110, -1, shape); let s = 0, pk = 0; for (const v of y) { s += v; pk = Math.max(pk, Math.abs(v)); }
  ok(Math.abs(s / y.length) < 1e-3 && pk <= 1.0001, `shape ${shape}: no DC, within ±1 (peak ${pk.toFixed(4)})`);
  ok(harm(y, 110) < 1e-3 * harm(y, 55), `shape ${shape}: no 2nd harmonic`); }
{ const sq = gen(110, -1, 2), tri = gen(110, -1, 1), rs = gen(110, -1, 3), si = gen(110, -1, 0), h = (y, k) => harm(y, 55 * k);
  ok(near(db(h(sq, 3), h(sq, 1)), db(1, 3), 0.3) && near(db(h(sq, 5), h(sq, 1)), db(1, 5), 0.3), `square: 3rd ${db(h(sq, 3), h(sq, 1)).toFixed(2)} dB, 5th ${db(h(sq, 5), h(sq, 1)).toFixed(2)} dB (1/n)`);
  ok(near(db(h(tri, 3), h(tri, 1)), db(1, 9), 0.3), `triangle: 3rd ${db(h(tri, 3), h(tri, 1)).toFixed(2)} dB (1/n²)`);
  ok(db(h(rs, 3), h(rs, 1)) < db(h(sq, 3), h(sq, 1)) - 1 && db(h(rs, 7), h(rs, 1)) < -38 && db(h(rs, 3), h(rs, 1)) > db(h(tri, 3), h(tri, 1)), `rounded square: 3rd ${db(h(rs, 3), h(rs, 1)).toFixed(1)} dB (between triangle and square), 7th ${db(h(rs, 7), h(rs, 1)).toFixed(1)} dB`);
  ok(db(h(si, 3), h(si, 1)) < -100, 'sine: pure'); }
// ---- band-limited square: at a high note, what folds back below the fundamental is far under a naive square's
{ const f = 3700, N = SR, y = gen(f, 0, 2, N), naive = new Float64Array(N); let p = 0; for (let j = 0; j < N; j++) { naive[j] = p < 0.5 ? 1 : -1; p += f / SR; if (p >= 1) p -= 1; }
  // aliases of odd harmonics land at |k·f − m·SR|; measure energy at the first few under f that are not harmonics
  const aliasAt = []; for (let k = 3; k < 40; k += 2) { let a = (k * f) % SR; if (a > SR / 2) a = SR - a; if (Math.abs(a - Math.round(a / f) * f) > 50) aliasAt.push(a); }
  const sum = (y) => aliasAt.slice(0, 8).reduce((s, a) => s + harm(y, a) ** 2, 0); const gain = 10 * Math.log10(sum(y) / sum(naive));
  ok(aliasAt.length >= 8 && gain < -10,   // polyBLEP is gentle this high (osc-va asks ≥ 8 dB); measured −13.5
   `polyBLEP square at 3.7 kHz: the first 8 aliases ${gain.toFixed(1)} dB under a naive square's`); }
// ---- phase: reset starts every note the same (sine at 0, rising); align puts it where a kick is; the same notes → the same samples
{ const s = Sub(); s.render(new Float64Array(777), 777, 100, SR, -1, 0); s.reset(); const a = s.next(100, SR, -1, 0), b = s.next(100, SR, -1, 0); ok(a === 0 && b > 0, 'reset: the sub starts at 0, rising'); }
{ const s = Sub(); s.align(0.25); ok(near(s.next(100, SR, -1, 0), 1, 1e-12), 'align(0.25): the sine at its peak'); s.align(1.75); ok(near(s.phase(), 0.75, 1e-12), 'align wraps into 0…1'); }
{ const a = gen(87.3, -1, 3, 4800), b = gen(87.3, -1, 3, 4800); ok(a.every((v, i) => v === b[i]), 'deterministic: the same note, the same samples'); }
// ---- a frequency change mid-note keeps the phase (no click): glide from 110 to 55 Hz
{ const s = Sub(), N = SR / 2; let prev = 0, jump = 0; for (let j = 0; j < N; j++) { const f = 110 - 55 * j / N, y = s.next(f, SR, -1, 0); if (j) jump = Math.max(jump, Math.abs(y - prev)); prev = y; }
  ok(jump < 2 * Math.PI * 55 / SR * 1.01, `a glide keeps the phase: the largest step ${jump.toFixed(5)} is a sine's own`); }
{ const s = Sub(), y = new Float64Array(128), M = SR * 4; const t0 = process.hrtime.bigint(); for (let j = 0; j < M; j += 128) s.render(y, 128, 110, SR, -1, 3); const ns = Number(process.hrtime.bigint() - t0) / M;
  console.log(`  cost: ${ns.toFixed(0)} ns per sample (rounded square)`); ok(ns < 500, 'under 0.5 µs per sample'); }
console.log(`osc-sub: ${n} checks pass`);
