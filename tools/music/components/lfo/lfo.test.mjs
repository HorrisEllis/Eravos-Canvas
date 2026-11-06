// node tools/music/components/lfo/lfo.test.mjs — the LFO proves its rate, shapes and ranges (new code).
import { createRequire } from 'module'; const { LFO } = createRequire(import.meta.url)('./lfo.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 1000;
const take = (o, sec) => { const l = LFO(); l.set(o, SR); l.reset(); const y = []; for (let i = 0; i < sec * SR; i++) y.push(l.next()); return y; };
// ---- rate: a 2 Hz sine crosses zero upward twice a second
{ const y = take({ shape: 0, rate: 2 }, 5); let up = 0; for (let i = 1; i < y.length; i++) if (y[i - 1] < 0 && y[i] >= 0) up++; ok(up === 9, `2 Hz for 5 s: ${up} upward crossings after the start (10 cycles: 0, 0.5 … 4.5 s; the one at 0 is the start)`); }
// ---- every shape stays in −1…1 (and 0…1 unipolar)
for (let s = 0; s < 7; s++) { const y = take({ shape: s, rate: 3 }, 4), u = take({ shape: s, rate: 3, unipolar: true }, 4);
  ok(Math.min(...y) >= -1 && Math.max(...y) <= 1, `shape ${s}: within −1…1`); ok(Math.min(...u) >= 0 && Math.max(...u) <= 1, `shape ${s}: unipolar within 0…1`); }
// ---- sample & hold: one new value per cycle
{ const y = take({ shape: 5, rate: 4 }, 2); let ch = 0; for (let i = 1; i < y.length; i++) if (y[i] !== y[i - 1]) ch++; ok(ch === 7, `S&H at 4 Hz for 2 s: ${ch} new values after the first (at 0.25, 0.5 … 1.75 s)`); }
// ---- smooth random: no jumps
{ const y = take({ shape: 6, rate: 2 }, 3); let mx = 0; for (let i = 1; i < y.length; i++) mx = Math.max(mx, Math.abs(y[i] - y[i - 1])); ok(mx < 0.02, `smooth random: largest step ${mx.toFixed(4)}`); }
// ---- seeded: the same every time
{ const a = take({ shape: 5, rate: 5 }, 1), b = take({ shape: 5, rate: 5 }, 1); ok(a.join() === b.join(), 'seeded'); }
// ---- fade: rises from 0 over `fade` seconds
{ const y = take({ shape: 4, rate: 1, fade: 1 }, 2); ok(Math.abs(y[0]) < 1e-9 && Math.abs(y[250]) < 0.26 && Math.abs(y[1500]) === 1, 'fade-in over 1 s'); }
// ---- phase: starts where it is told
{ const y = take({ shape: 2, rate: 1, phase: 0.5 }, 0.01); ok(Math.abs(y[0]) < 1e-9, 'saw from phase 0.5 starts at 0'); }
console.log(`✓ lfo: ${n} checks`);
