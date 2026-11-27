// node tools/music/components/energy-curve/energy-curve.test.mjs — the held build and its release (new code).
import { createRequire } from 'module'; const { EnergyCurve } = createRequire(import.meta.url)('./energy-curve.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const near = (a, b, e) => Math.abs(a - b) <= (e || 1e-9);
// ---- before the start: the floor; linear (shape 0): half way at half the hold
{ const c = EnergyCurve(); c.set({ hold: 8, shape: 0, floor: 0.1, peak: 0.9 }); ok(near(c.at(5), 0.1), 'idle → floor'); c.start(10); ok(near(c.at(10), 0.1) && near(c.at(14), 0.5) && near(c.at(17.999), 0.9, 1e-3), 'linear build'); }
// ---- shape 1 waits, then rushes: at half the hold it is under 2 % of the way
{ const c = EnergyCurve(); c.set({ hold: 4, shape: 1 }); c.start(0); ok(c.at(2) < 0.02 && c.at(3.9) > 0.7, `shape 1: ${c.at(2).toFixed(4)} at half, ${c.at(3.9).toFixed(3)} near the end`); }
// ---- the hold's end releases by itself: 99 % gone at Release
{ const c = EnergyCurve(); c.set({ hold: 2, shape: 0, release: 0.5 }); c.start(0); ok(near(c.at(2), 1, 1e-9), 'the peak at the end'); ok(c.at(2.5) < 0.011 && c.at(2.5) > 0.009, `99 % gone at Release: ${c.at(2.5).toFixed(4)}`); ok(c.phase(2.2) === 'release', 'phase release'); }
// ---- RELEASE early: falls from where it was
{ const c = EnergyCurve(); c.set({ hold: 8, shape: 0, release: 1 }); c.start(0); c.release(4); ok(near(c.at(4), 0.5, 1e-9) && c.at(5) < 0.006, `released at 4 s from 0.5 → ${c.at(5).toFixed(4)} a second later`); ok(c.at(6) < c.at(5), 'still falling'); }
// ---- loop: rests, then climbs again
{ const c = EnergyCurve(); c.set({ hold: 2, shape: 0, release: 0.4, loop: 1, rest: 1 }); c.start(0); const cyc = c.cycle(); ok(near(cyc, 2 + 0.6 + 1), 'cycle = hold + 1.5 release + rest');
  ok(near(c.at(cyc + 1), 0.5, 1e-9), `the next build half way: ${c.at(cyc + 1).toFixed(4)}`); }
// ---- the same settings and times, the same values
{ const a = EnergyCurve(), b = EnergyCurve(); [a, b].forEach(c => { c.set({ hold: 3, shape: 0.6 }); c.start(1); }); ok([1.5, 2.7, 3.9, 4.2].every(t => a.at(t) === b.at(t)), 'deterministic'); }
console.log(`✓ energy-curve: ${n} checks`);
