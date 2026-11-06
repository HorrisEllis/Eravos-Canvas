// node tools/music/components/modal-resonator/modal-resonator.test.mjs — the modal bank proves its own numbers (new code).
import { createRequire } from 'module'; const { Modal, MODAL_SHAPES, modalR, modalT60 } = createRequire(import.meta.url)('./modal-resonator.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, near = (a, b, t) => Math.abs(a - b) <= t;
const ring = (m, N, x0) => { const y = new Float64Array(N); for (let j = 0; j < N; j++) y[j] = m.tick(j === 0 ? (x0 === undefined ? 1 : x0) : 0); return y; };
const bin = (y, hz, from, len) => { let re = 0, im = 0; for (let j = 0; j < len; j++) { const p = 2 * Math.PI * hz * j / SR; re += y[from + j] * Math.cos(p); im += y[from + j] * Math.sin(p); } return 2 * Math.hypot(re, im) / len; };
// ---- one mode: exactly its frequency, amplitude and decay
{ const m = Modal(); m.set([440], [1], [0.5], SR); const y = ring(m, SR * 2);
  let pk = 0; for (let j = 0; j < 200; j++) pk = Math.max(pk, Math.abs(y[j])); ok(near(pk, 0.5, 0.005), `a unit impulse rings at the mode's gain (peak ${pk.toFixed(4)})`);
  const env = (t) => { let p = 0; for (let j = Math.round(t * SR); j < Math.round(t * SR) + 220; j++) p = Math.max(p, Math.abs(y[j])); return p; };
  ok(near(20 * Math.log10(env(1) / env(0)), -60, 0.5), `T60 1 s: −60 dB after one second (${(20 * Math.log10(env(1) / env(0))).toFixed(2)} dB)`);
  let z = 0; for (let j = 1; j < SR; j++) if (y[j - 1] < 0 && y[j] >= 0) z++; ok(Math.abs(z - 440) <= 1, `440 Hz: ${z} cycles in a second`); }
// ---- a beam (a tine): its modes where the shape says, each at its own level
{ const m = Modal(), f0 = 220, r = MODAL_SHAPES.beam.slice(0, 3); m.set(r.map(x => x * f0), [2, 1, 0.5], [1, 0.3, 0.1], SR); const y = ring(m, SR);
  const a = r.map(x => bin(y, x * f0, 0, 4800)), base = bin(y, f0 * 1.5, 0, 4800);
  ok(a[0] > a[1] && a[1] > a[2] && a[2] > base * 4, `beam modes at 220 · ${(r[1] * f0).toFixed(0)} · ${(r[2] * f0).toFixed(0)} Hz, falling in level, far above the gaps`);
  ok(near(MODAL_SHAPES.beam[1], 6.267, 0.001) && near(MODAL_SHAPES.bar[1], 2.756, 0.001), 'the shapes are the beam (clamped-free) and bar (free-free) ratios'); }
// ---- scale: a new note moves every mode, keeping its decay
{ const m = Modal(); m.set([200, 600], [1, 1], [1, 1], SR); m.scale(2); const y = ring(m, SR / 2); ok(bin(y, 400, 0, 4800) > 10 * bin(y, 200, 0, 4800) && bin(y, 1200, 0, 4800) > 10 * bin(y, 600, 0, 4800), 'scale(2): 200 → 400 Hz, 600 → 1200 Hz'); }
// ---- above 0.45 × the sample rate: skipped (no alias, stable); a 64-mode bank stays finite for 20 s, rings out
{ const m = Modal(); m.set([1000, 30000], [1, 1], [1, 1], SR); ok(m.energy === 0, 'silent before an input'); const y = ring(m, SR / 4); ok(bin(y, 18000, 0, 4800) < 0.01 && bin(y, 1000, 0, 4800) > 0.3, 'a mode above 21.6 kHz is skipped');
  const big = Modal(), fr = [], tt = [], gg = []; for (let i = 0; i < 64; i++) { fr.push(80 * (i + 1) * (1 + 0.001 * i * i)); tt.push(0.5 + i * 0.05); gg.push(1 / (i + 1)); } big.set(fr, tt, gg, SR);
  const z = ring(big, SR * 20); ok(z.every(Number.isFinite), '64 modes, 20 s: every sample finite'); ok(Math.abs(z[SR * 20 - 1]) < 1e-6, 'rung out'); }
ok(near(modalT60(modalR(1.7, SR), SR), 1.7, 1e-9), 'modalR / modalT60 are inverses');
console.log(`modal-resonator: ${n} checks passed — each mode's frequency, level and decay exact; shapes as data; safe at the top`);
