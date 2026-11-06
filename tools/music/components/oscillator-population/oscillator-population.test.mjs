// node tools/music/components/oscillator-population/oscillator-population.test.mjs — coupled oscillators prove their behaviour.
import { createRequire } from 'module'; const { POP } = createRequire(import.meta.url)('./oscillator-population.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, F0 = 220;
// run a population for `sec` seconds; the mean coherence over the last half
function run(o, sec = 2) {
  const p = POP(32); p.configure(o.n || 9, o.spread === undefined ? 30 : o.spread, 7); p.set(Object.assign({ coupling: 0, mode: 1, pull: 0, drift: 0, cluster: 0 }, o));
  const N = Math.round(sec * SR); let r = 0, m = 0; for (let i = 0; i < N; i++) { p.step(o.f0 || F0, SR); if (i > N / 2) { r += p.R; m++; } }
  return { p, R: r / m };
}
// ---- free: the voices drift through each other — beating, not locked
const free = run({ mode: 0 }); ok(free.R < 0.6, `free: coherence ${free.R.toFixed(2)} (scattered, beating)`);
// ---- coupled, strong: they lock
const lock = run({ mode: 1, coupling: 1 }); ok(lock.R > 0.97, `coupled at 1: coherence ${lock.R.toFixed(3)} (locked)`);
// ---- the lock grows with coupling (a threshold, as Kuramoto predicts)
{ const rs = [0, 0.2, 0.5, 1].map(k => run({ mode: 1, coupling: k }).R); ok(rs[3] > rs[0] + 0.3 && rs[3] >= rs[2] - 0.02, `coherence by coupling 0 → 1: ${rs.map(x => x.toFixed(2)).join(' → ')}`); }
// ---- chaotic: repulsive, they push apart (less together than free)
const ch = run({ mode: 3, coupling: 1 }); ok(ch.R < free.R && ch.R < 0.3, `chaotic: coherence ${ch.R.toFixed(2)} (pushed apart, under free ${free.R.toFixed(2)})`);
// ---- snap: every phase to the mean at once
{ const { p } = run({ mode: 0 }, 0.3); p.snap(); ok(p.R > 0.9999, `snap: coherence ${p.R.toFixed(5)}`); }
// ---- frequencies: free voices keep their own pitch (spread, in cents); one voice is the note itself
{ const p = POP(32); p.configure(3, 50, 1); p.set({ mode: 0, coupling: 0, drift: 0, pull: 0 }); let a = 0; const N = SR; for (let i = 0; i < N; i++) { p.step(F0, SR); a += p.dt(2); }
  const hz = a; ok(Math.abs(1200 * Math.log2(hz / F0) - 50) < 0.5, `the top voice sits +50 cents: ${(1200 * Math.log2(hz / F0)).toFixed(2)}`); }
{ const p = POP(32); p.configure(1, 50, 1); p.set({ mode: 1, coupling: 1, drift: 0 }); let a = 0; for (let i = 0; i < SR; i++) { p.step(F0, SR); a += p.dt(0); } ok(Math.abs(a - F0) < 0.01, `one voice is the note: ${a.toFixed(3)} Hz`); }
// ---- pull: while coupled, the voices' own frequencies come together (adaptive frequency)
{ const p = POP(32); p.configure(9, 40, 3); p.set({ mode: 1, coupling: 0.8, pull: 1, drift: 0 }); for (let i = 0; i < 3 * SR; i++) p.step(F0, SR);
  let mx = 0; for (let i = 0; i < 9; i++) mx = Math.max(mx, Math.abs(p.cents(i))); ok(mx < 12, `pull: after 3 s the widest voice is ${mx.toFixed(1)} cents from the note (was 40)`); }
// ---- harmonic: Cluster 1 puts voice 2 on 3/2 of the note (a fifth) and keeps it locked there
{ const p = POP(32); p.configure(3, 0, 1); p.set({ mode: 2, coupling: 0.6, cluster: 1, drift: 0 }); let a = 0, r = 0; for (let i = 0; i < SR; i++) { p.step(F0, SR); a += p.dt(1); if (i > SR / 2) r += p.R; }
  ok(Math.abs(a / F0 - 1.5) < 0.002, `harmonic: voice 2 at ${(a / F0).toFixed(4)} × the note (3/2)`); ok(r / (SR / 2) > 0.95, `harmonic: locked on its ratio (${(r / (SR / 2)).toFixed(3)})`); }
// ---- drift: bounded, and the same every time (seeded)
{ const a = run({ mode: 0, drift: 1 }, 1).p, b = run({ mode: 0, drift: 1 }, 1).p; let mx = 0, same = true; for (let i = 0; i < 9; i++) { mx = Math.max(mx, Math.abs(a.cents(i) - (9 > 1 ? 30 * (2 * i / 8 - 1) : 0))); if (a.phase(i) !== b.phase(i)) same = false; }
  ok(mx <= 15.01, `drift at 1: within ±15 cents (${mx.toFixed(2)})`); ok(same, 'seeded: the same wander every time'); }
// ---- cost: 32 voices
{ const p = POP(32); p.configure(32, 30, 1); p.set({ mode: 1, coupling: 0.5, drift: 0.3, pull: 0.5 }); const t0 = process.hrtime.bigint(); for (let i = 0; i < SR; i++) p.step(F0, SR); const us = Number(process.hrtime.bigint() - t0) / SR / 1000;
  ok(us < 6, `32 voices: ${us.toFixed(2)} µs a sample`); console.log(`  oscillator-population: 32 voices ${(us * 1000).toFixed(0)} ns/sample`); }
console.log(`✓ oscillator-population: ${n} checks (free R ${free.R.toFixed(2)} · locked ${lock.R.toFixed(3)} · chaotic ${ch.R.toFixed(2)})`);
