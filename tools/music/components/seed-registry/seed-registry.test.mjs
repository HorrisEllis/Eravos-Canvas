// node tools/music/components/seed-registry/seed-registry.test.mjs — named seeds are stable, rerolls are written down, nothing is hidden.
import { createRequire } from 'module'; const { Seeds, mulberry32 } = createRequire(import.meta.url)('./seed-registry.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const a = Seeds(42), b = Seeds(42), c = Seeds(43);
ok(a.seed('p/editor/lane1') === b.seed('p/editor/lane1'), 'the same path, the same seed (any run, any machine)');
ok(a.seed('p/editor/lane1') !== a.seed('p/editor/lane2'), 'another path, another seed'); ok(a.seed('x') !== c.seed('x'), 'another project, another seed');
{ const r1 = a.rng('p/x'), r2 = b.rng('p/x'); let same = true; for (let i = 0; i < 1000; i++) if (r1() !== r2()) same = false; ok(same, 'rng by path: the same sequence'); }
{ const s0 = a.seed('p/y'), s1 = a.reroll('p/y'); ok(s1 !== s0, 'reroll: a new seed'); ok(a.history('p/y')[0] === s0, 'the old one kept in its history'); ok(a.seed('p/y') === s1, 'and the new one used from now on');
  const b2 = Seeds(42); b2.reroll('p/y'); ok(b2.seed('p/y') === s1, 'a reroll is itself repeatable'); }
{ const j = JSON.parse(JSON.stringify(a.toJSON())), d = Seeds(); d.fromJSON(j); ok(d.seed('p/y') === a.seed('p/y') && d.seed('q') === a.seed('q') && d.history('p/y').length === 1, 'saved and loaded exactly'); }
// mulberry32: uniform enough (16 bins over 160k draws within 3 %), in 0…1
{ const r = mulberry32(7), bins = new Array(16).fill(0); let lo = 1, hi = 0; for (let i = 0; i < 160000; i++) { const x = r(); lo = Math.min(lo, x); hi = Math.max(hi, x); bins[Math.floor(x * 16)]++; }
  ok(lo >= 0 && hi < 1, 'in 0…1'); ok(bins.every(b => Math.abs(b - 10000) < 300), 'uniform within 3 %'); }
// the same generator as the SDK's dsp.mulberry32 (core/sdk-music.js), output for output — copied here as it is there
{ const sdk = (seed) => { let a = seed >>> 0; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  let same = 0; for (const sd of [0, 1, 84, 1234, 0xffffffff, 2 ** 31]) { const x = mulberry32(sd), y = sdk(sd); for (let i = 0; i < 5000; i++) if (x() === y()) same++; } ok(same === 30000, `equal to dsp.mulberry32: ${same}/30000`); }
console.log(`✓ seed-registry: ${n} checks`);
