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
// ---- 1.1 (N2): defaults are 1.0 exactly — the same phases, sample for sample, as the code before (kept beside the test as a fixture)
{ const old = createRequire(import.meta.url)('./fixtures/oscillator-population-1.0.js').POP;
  for (const o of [{ mode: 1, coupling: 0.6, pull: 0.5, drift: 0.3 }, { mode: 2, coupling: 0.8, cluster: 1 }, { mode: 3, coupling: 0.7 }]) {
    const a = POP(16), b = old(16); a.configure(12, 40, 7); b.configure(12, 40, 7); a.set(o); b.set(o); let same = true;
    for (let i = 0; i < SR; i++) { a.step(F0, SR); b.step(F0, SR); if (i % 97 === 0) for (let v = 0; v < 12; v++) if (a.phase(v) !== b.phase(v)) same = false; }
    ok(same, `mode ${o.mode}: with restless, form and fm at 0, every phase equals 1.0's for a second`); } }
// ---- restless: locked → burst → locked again, by itself (R swings between a solid wave and a cloud, several times in 8 s)
{ const p = POP(16); p.configure(12, 30, 3); p.set({ mode: 1, coupling: 0.9, pull: 0.6, drift: 0.1, restless: 0.7 }); let low = 0, high = 0, state = 0, cyc = 0;
  for (let i = 0; i < SR * 8; i++) { p.step(F0, SR); if (i % 480 === 0) { const R = p.R; if (R < 0.6) low++; if (R > 0.9) high++; if (state === 0 && R > 0.92) state = 1; else if (state === 1 && R < 0.6) { cyc++; state = 0; } } }
  ok(cyc >= 3, `restless 0.7: ${cyc} lock → burst cycles in 8 s`); ok(low > 20 && high > 20, `it spends time both locked (${high}) and scattered (${low})`);
  const q = POP(16); q.configure(12, 30, 3); q.set({ mode: 1, coupling: 0.9, pull: 0.6, drift: 0.1 }); let lowQ = 0; for (let i = 0; i < SR * 8; i++) { q.step(F0, SR); if (i > SR * 2 && i % 480 === 0 && q.R < 0.6) lowQ++; }
  ok(lowQ === 0, 'without restless, once locked it stays locked'); }
// ---- form: harmonic mode glides from unison to the chord over `form` seconds (voice 1 → 3/2)
{ const p = POP(8); p.configure(4, 0, 1); p.set({ mode: 2, coupling: 0.6, cluster: 1, form: 2 }); const at = {};
  for (let i = 0; i < SR * 8; i++) { p.step(F0, SR); if (i === SR / 4) at.early = p.ratio(1); if (i === SR * 2) at.mid = p.ratio(1); if (i === SR * 8 - 1) at.late = p.ratio(1); }
  ok(at.early > 1 && at.early < 1.2, `form 2 s: at 0.25 s voice 1 is still near unison (${at.early.toFixed(3)})`); ok(at.mid > 1.25 && at.mid < 1.45, `at 2 s it is on its way (${at.mid.toFixed(3)})`); ok(Math.abs(at.late - 1.5) < 0.01, `by 8 s it sits on the fifth (${at.late.toFixed(3)})`); }
// ---- fm: the swarm's own sum frequency-modulates its voices — a stack of sines becomes a bright FM spectrum (centroid up > 1 octave)
{ const centroid = (o) => { const p = POP(8); p.configure(6, 8, 2); p.set(Object.assign({ mode: 1, coupling: 0.4 }, o)); const N = 8192, y = new Float64Array(N);
    for (let i = 0; i < SR / 2; i++) p.step(F0, SR); for (let j = 0; j < N; j++) { p.step(F0, SR); let v = 0; for (let k = 0; k < 6; k++) v += Math.sin(2 * Math.PI * p.phase(k)); y[j] = v; }
    let w = 0, t = 0; for (let f = 50; f < 6000; f += 25) { let re = 0, im = 0; for (let j = 0; j < N; j += 2) { re += y[j] * Math.cos(2 * Math.PI * f * j / SR); im += y[j] * Math.sin(2 * Math.PI * f * j / SR); } const e = re * re + im * im; w += e * f; t += e; } return w / t; };
  const off = centroid({}), on = centroid({ fm: 1 }); ok(on > off * 2, `field FM: the swarm's brightness ${off.toFixed(0)} Hz → ${on.toFixed(0)} Hz`);
  const p = POP(8); p.configure(6, 8, 2); p.set({ mode: 1, coupling: 0.4, fm: 1 }); let bad = false; for (let i = 0; i < SR * 4; i++) { p.step(F0, SR); for (let k = 0; k < 6; k++) { const d = p.dt(k); if (!(d >= 0 && d <= 0.49)) bad = true; } } ok(!bad, 'field FM at full stays bounded (every step 0…0.49 of a cycle) for 4 s'); }
console.log(`✓ oscillator-population: ${n} checks (free R ${free.R.toFixed(2)} · locked ${lock.R.toFixed(3)} · chaotic ${ch.R.toFixed(2)})`);
