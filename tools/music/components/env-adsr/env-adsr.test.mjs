// node tools/music/components/env-adsr/env-adsr.test.mjs — the ADSR proves its times and levels (new code).
import { createRequire } from 'module'; const { ADSR } = createRequire(import.meta.url)('./env-adsr.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, db = (x) => 20 * Math.log10(x);
const run = (e, sec) => { let v = 0; for (let i = 0; i < Math.round(sec * SR); i++) v = e.next(); return v; };
// ---- attack: 1 at exactly `a` seconds
{ const e = ADSR(); e.set(0.1, 0.2, 0.5, 0.3, SR); e.gate(true); let i = 0; while (e.next() < 1) i++; ok(Math.abs(i + 1 - 0.1 * SR) <= 1, `attack reaches 1 at ${((i + 1) / SR).toFixed(5)} s (0.1)`); }
// ---- decay: 60 dB of the way to sustain in `d` seconds, then holds the sustain level
{ const e = ADSR(); e.set(0.001, 0.2, 0.5, 0.3, SR); e.gate(true); run(e, 0.001); const v = run(e, 0.2); ok(Math.abs((v - 0.5) / 0.5 - 0.001) < 0.0002, `decay: ${((v - 0.5)).toExponential(2)} above sustain after d (0.0005)`);
  ok(Math.abs(run(e, 2) - 0.5) < 1e-6, 'holds the sustain level'); ok(e.stage === 2, 'stage: sustain');
  // ---- release: −60 dB in `r`, then idle
  e.gate(false); const r = run(e, 0.3); ok(Math.abs(db(r / 0.5) + 60) < 0.2, `release: ${db(r / 0.5).toFixed(2)} dB after r (−60)`); run(e, 1); ok(e.done && e.level === 0, 'then idle'); }
// ---- retrigger mid-release: starts from where it is (no click: no jump between samples)
{ const e = ADSR(); e.set(0.05, 0.1, 0.8, 0.5, SR); e.gate(true); run(e, 0.3); e.gate(false); const before = run(e, 0.1); e.gate(true); const after = e.next(); ok(Math.abs(after - before) < 1 / (0.05 * SR) + 1e-9, `retrigger: ${before.toFixed(4)} → ${after.toFixed(4)} (one attack step)`); }
// ---- never outside 0…1
{ const e = ADSR(); e.set(0.003, 0.01, 1, 0.01, SR); let lo = 1, hi = 0; for (let k = 0; k < 50; k++) { e.gate(k % 2 === 0); for (let i = 0; i < 300; i++) { const v = e.next(); lo = Math.min(lo, v); hi = Math.max(hi, v); } } ok(lo >= 0 && hi <= 1, `range ${lo}…${hi}`); }
console.log(`✓ env-adsr: ${n} checks`);
