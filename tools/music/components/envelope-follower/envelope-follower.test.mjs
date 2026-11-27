// node tools/music/components/envelope-follower/envelope-follower.test.mjs — the follower proves its times and range (new code).
import { createRequire } from 'module'; const { Follower } = createRequire(import.meta.url)('./envelope-follower.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 48000, F = (o) => { const f = Follower(); f.set(o, SR); return f; };
// ---- attack: a step of 1 reaches 63 % of itself in Attack ms (the level, before Range)
{ const f = F({ attack: 10, release: 100 }); let t = -1; for (let i = 0; i < SR; i++) { f.next(1); if (f.level >= 0.632 && t < 0) t = i; } ok(Math.abs(t / SR * 1000 - 10) < 0.5, `attack 10 ms: 63 % at ${(t / SR * 1000).toFixed(2)} ms`); }
// ---- release: from 1, falls to 37 % in Release ms; Hold keeps it first
for (const hold of [0, 50]) { const f = F({ attack: 0.1, release: 200, hold }); for (let i = 0; i < SR * 0.1; i++) f.next(1); let t = -1; for (let i = 0; i < SR; i++) { f.next(0); if (f.level <= 0.368 && t < 0) t = i; }
  ok(Math.abs(t / SR * 1000 - (200 + hold)) < 3, `release 200 ms, hold ${hold}: 37 % at ${(t / SR * 1000).toFixed(1)} ms`); }
// ---- range: 0 dBFS → 1, the floor → 0, half way in dB → 0.5
{ const v = (amp) => { const f = F({ attack: 0.1, release: 1000, floor: -48 }); let e = 0; for (let i = 0; i < SR * 0.05; i++) e = f.next(amp); return e; };
  ok(Math.abs(v(1) - 1) < 0.01, `0 dBFS → ${v(1).toFixed(3)}`); ok(Math.abs(v(Math.pow(10, -24 / 20)) - 0.5) < 0.01, `−24 dB of −48 → ${v(Math.pow(10, -24 / 20)).toFixed(3)}`); ok(v(Math.pow(10, -60 / 20)) === 0, 'under the floor → 0'); }
// ---- rms of a full-scale sine reads −3 dB (0.707); silence reads 0 and leaves no denormals
{ const f = F({ attack: 20, release: 50, mode: 1 }); for (let i = 0; i < SR; i++) f.next(Math.sin(2 * Math.PI * 100 * i / SR)); ok(Math.abs(f.level - Math.SQRT1_2) < 0.03, `rms of a sine ${f.level.toFixed(3)}`);
  for (let i = 0; i < SR * 20; i++) f.next(0); ok(f.level === 0, 'silence → exactly 0'); }
console.log(`✓ envelope-follower: ${n} checks`);
