// node tools/music/components/osc-wavetable/osc-wavetable.test.mjs — the wavetable oscillator proves its own numbers (new code).
import { createRequire } from 'module'; const { WT, WT_RECIPES } = createRequire(import.meta.url)('./osc-wavetable.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, w = WT(), t0 = Date.now(), F = w.build(WT_RECIPES.basic), ms = Date.now() - t0;
ok(F === 6, '6 frames'); ok(ms < 250, `built in ${ms} ms`);
// harmonic k's amplitude in one stored cycle (a DFT bin of the table)
function amp(t, k) { let re = 0, im = 0; for (let i = 0; i < w.SIZE; i++) { const x = 2 * Math.PI * k * i / w.SIZE; re += t[i] * Math.cos(x); im += t[i] * Math.sin(x); } return 2 * Math.hypot(re, im) / w.SIZE; }
// ---- frame 0 is a pure sine; the saw's harmonics fall as 1/k
{ const t = w.table(0, 0); ok(amp(t, 1) > 0.99 && amp(t, 2) < 1e-4 && amp(t, 3) < 1e-4, 'frame 0: a pure sine'); }
{ const t = w.table(2, 0), r = amp(t, 1) / amp(t, 4); ok(Math.abs(r - 4) < 0.02, `saw frame: harmonic 4 is 1/4 of harmonic 1 (${r.toFixed(3)})`); }
// ---- mip-maps: at every pitch, the level read has nothing above Nyquist
for (const f of [55, 440, 1760, 5000, 12000]) {
  const dt = f / SR, L = w.levelFor(dt), top = w.MAXH >> L, t = w.table(2, L);
  ok(top * f <= SR / 2, `${f} Hz reads level ${L}: top harmonic ${top} × ${f} = ${top * f} Hz ≤ Nyquist`);
  const above = Math.floor(SR / 2 / f) + 1; if (above < w.SIZE / 2) ok(amp(t, above) < 1e-3, `${f} Hz: harmonic ${above} (above Nyquist) is absent (${amp(t, above).toExponential(1)})`);
  if (L > 0) ok((w.MAXH >> (L - 1)) * f > SR / 2, `${f} Hz: the level above it would alias (so the brightest safe level is used)`);
}
// ---- position morphs: halfway between two frames is their average
{ const ph = 0.137, dt = 220 / SR, a = w.sample(0.4, ph, dt), b = w.sample(0.6, ph, dt), m = w.sample(0.5, ph, dt);
  const x = (F - 1) * 0.5, lo = Math.floor(x); ok(lo === 2 && Math.abs(m - (w.sample(2 / 5, ph, dt) + w.sample(3 / 5, ph, dt)) / 2) < 1e-6, 'position 0.5 = between frames 2 and 3, averaged');
  ok(isFinite(a) && isFinite(b), 'finite'); }
// ---- range
{ let mx = 0; for (let f = 0; f < F; f++) for (let i = 0; i < w.SIZE; i++) mx = Math.max(mx, Math.abs(w.table(f, 0)[i])); ok(mx <= 1.0001 && mx > 0.99, 'every frame peaks at 1'); }
// ---- fast
{ const t1 = process.hrtime.bigint(); let s = 0, ph = 0; const dt = 220 / SR; for (let i = 0; i < 4.8e6; i++) { s += w.sample(0.37, ph, dt); ph += dt; if (ph >= 1) ph -= 1; } const ns = Number(process.hrtime.bigint() - t1) / 4.8e6; ok(ns < 80 && isFinite(s), `${ns.toFixed(1)} ns a sample`); console.log(`  osc-wavetable: ${ns.toFixed(1)} ns/sample, built in ${ms} ms`); }
{ const w2 = WT(); w2.load(w.tables()); ok(w2.frames === F && w2.sample(0.3, 0.2, 0.01) === w.sample(0.3, 0.2, 0.01), 'tables built here, loaded there (a worklet): the same sound'); }
console.log(`✓ osc-wavetable: ${n} checks`);
