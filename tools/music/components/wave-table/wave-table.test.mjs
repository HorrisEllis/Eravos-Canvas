// node tools/music/components/wave-table/wave-table.test.mjs — the component equals the two functions it replaced, coefficient for coefficient.
import { createRequire } from 'module'; const { periodicWave, phaseWave } = createRequire(import.meta.url)('./wave-table.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const spy = () => { const s = { createPeriodicWave(re, im, o) { s.re = re; s.im = im; s.o = o; return { re, im }; } }; return s; };
// ---- the two ORIGINALS, verbatim from the tools before this change ----
function lfoMakeWave(ac, fn, phaseDeg) {   // tools/music/tools/modulation/lfo/lfo.engine.js (2.0.0)
  const M = 1024, N = 33, re = new Float32Array(N), im = new Float32Array(N), ph = (phaseDeg || 0) / 360;
  const y = new Float32Array(M); for (let i = 0; i < M; i++) y[i] = fn(((i / M) + ph) % 1);
  for (let n = 0; n < N; n++) { let a = 0, b = 0; for (let i = 0; i < M; i++) { const w = 2 * Math.PI * n * i / M; a += y[i] * Math.cos(w); b += y[i] * Math.sin(w); } re[n] = (n ? 2 : 1) * a / M; im[n] = 2 * b / M; }
  return { wave: ac.createPeriodicWave(re, im, { disableNormalization: true }), dc: re[0] };
}
function wubMakeWave(ac, fn, phase) {   // tools/music/tools/wubs/wub-rate/wub-rate.engine.js
  const M = 1024, N = 40, re = new Float32Array(N), im = new Float32Array(N), y = new Float32Array(M);
  for (let i = 0; i < M; i++) y[i] = fn(((i / M) + phase) % 1);
  for (let n = 0; n < N; n++) { let a = 0, b = 0; for (let i = 0; i < M; i++) { const w = 2 * Math.PI * n * i / M; a += y[i] * Math.cos(w); b += y[i] * Math.sin(w); } re[n] = (n ? 2 : 1) * a / M; im[n] = 2 * b / M; }
  return { wave: ac.createPeriodicWave(re, im, { disableNormalization: true }), dc: re[0] };
}
const same = (a, b) => a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
const shapes = { sine: p => Math.sin(2 * Math.PI * p), tri: p => p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4, square: p => p < 0.5 ? 1 : -1, saw: p => 1 - 2 * p, cos: p => -Math.cos(2 * Math.PI * p), flat: () => 0 };
for (const [name, fn] of Object.entries(shapes)) {
  for (const deg of [0, 45, 90, 137, 270, 359, undefined]) {   // the LFO's phase is degrees; the tool passes degrees/360 to the component
    const a = spy(), b = spy(), ra = lfoMakeWave(a, fn, deg), rb = periodicWave(b, fn, { phase: (deg || 0) / 360, harmonics: 33 });
    ok(same(a.re, b.re) && same(a.im, b.im) && Object.is(ra.dc, rb.dc) && b.o.disableNormalization === true, `lfo ${name} @ ${deg}°`);
  }
  for (const ph of [0, 0.125, 0.5, 0.731, 0.999]) {   // Wub Rate's phase is already a fraction
    const a = spy(), b = spy(), ra = wubMakeWave(a, fn, ph), rb = periodicWave(b, fn, { phase: ph, harmonics: 40 });
    ok(same(a.re, b.re) && same(a.im, b.im) && Object.is(ra.dc, rb.dc), `wub-rate ${name} @ ${ph}`);
  }
}
// ---- fx-moddelay / fx-phaser's own phaseWave, verbatim ----
const origPhaseWave = (ac, deg) => { const r = deg * Math.PI / 180; return ac.createPeriodicWave(new Float32Array([0, Math.sin(r)]), new Float32Array([0, Math.cos(r)]), { disableNormalization: true }); };
for (const deg of [0, 1, 30, 90, 120, 180, 270, 359.5, 720, -45]) { const a = spy(), b = spy(); origPhaseWave(a, deg); phaseWave(b, deg); ok(same(a.re, b.re) && same(a.im, b.im) && b.o.disableNormalization === true, `phaseWave ${deg}°`); }
{ const b = spy(); periodicWave(b, shapes.sine); ok(b.re.length === 33, 'default harmonics 33'); }
console.log(`wave-table: ${n} checks passed — bit-identical to the LFO's, Wub Rate's, Mod Delay's and Phaser's own copies`);
