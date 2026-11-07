// node tools/music/components/pattern-field/pattern-field.test.mjs — the pattern as a structure: what the shape admits, what emerges
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
globalThis.MusicParts = {}; require('../scale-key/scale-key.js'); const PF = require('./pattern-field.js');
let n = 0, bad = 0; const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL: ' + m); } };
const AM = [[9, 0, 4], [5, 9, 0], [0, 4, 7], [7, 11, 2]];   // i VI III VII in A minor, as pitch classes
const base = { bars: 4, root: 9, scale: 'minor', chords: AM, grid: { k: 5, n: 8 }, range: [33, 57], density: { start: 0.3, end: 0.9, shape: 'rise' }, contour: { shape: 'arch', amount: 9, centre: 41 }, seed: 41 };
// the rhythm: k hits of n, spread evenly, turned by rot
const e = PF.euclid(5, 8, 0); ok(e.reduce((a, b) => a + b) === 5 && e.join('') === '10110110'.split('').map((_, i) => ((i * 5) % 8 < 5 ? 1 : 0)).join(''), 'euclid 5 of 8: five hits, evenly spread (' + e.join('') + ')');
ok(PF.euclid(3, 8, 0).join('') === '10010010' && PF.euclid(4, 16, 0).join('') === '1000100010001000', 'euclid 3 of 8 = the tresillo, 4 of 16 = four on the floor');
ok(PF.euclid(5, 8, 1).join('') !== e.join('') && PF.euclid(5, 8, 1).reduce((a, b) => a + b) === 5, 'rot turns it and keeps the count');
// the shape: every admitted note is in the key, in the bar's chord, in the range, on the grid
const sh = PF.shape(base), tones = [0, 2, 3, 5, 7, 8, 10];
ok(sh.admitted.length > 0 && sh.admitted.every(([s, m]) => m >= 33 && m <= 57 && tones.includes(((m - 9) % 12 + 12) % 12) && AM[Math.floor(s / 16)].includes(m % 12) && e[s % 8] === 1), 'every admitted note is in key, in its bar\'s chord, in range, on the grid (' + sh.admitted.length + ')');
ok(PF.shape(Object.assign({}, base, { chords: null })).admitted.length > sh.admitted.length, 'no chords: every tone of the scale is admitted (a wider shape)');
ok(PF.shape(Object.assign({}, base, { range: [45, 57] })).admitted.length < sh.admitted.length, 'a narrower range admits less');
// what emerges: deterministic, inside the shape, more with more density, the locked note kept whatever the shape
const a = PF.emerge(base), b = PF.emerge(base); ok(JSON.stringify(a.notes) === JSON.stringify(b.notes), 'the same structure and seed → the same notes (' + a.notes.length + ')');
ok(a.notes.every(x => sh.open(x.s, x.n)), 'every note that emerged is one the shape admits');
ok(JSON.stringify(PF.emerge(Object.assign({}, base, { seed: 42 })).notes) !== JSON.stringify(a.notes), 'another seed → another take');
const cnt = (d) => PF.emerge(Object.assign({}, base, { density: { start: d, end: d, shape: 'hold' } })).notes.length;
ok(cnt(0) === 0 && cnt(1) === new Set(sh.admitted.map(x => x[0])).size && cnt(0.2) < cnt(0.5) && cnt(0.5) < cnt(0.8), `density: 0 → silence, 1 → every admitted step, and it grows in between (${cnt(0.2)} < ${cnt(0.5)} < ${cnt(0.8)})`);
const first = a.notes.filter(x => x.s < 32).length, last = a.notes.filter(x => x.s >= 32).length; ok(last > first, `rise: more in the second half (${first} → ${last})`);
const lk = Object.assign({}, base, { locked: [{ s: 1, n: 50 }] }); [lk, Object.assign({}, lk, { range: [33, 40], chords: null, grid: { k: 3, n: 8 } })].forEach((x, i) => {
  const L = PF.emerge(x).notes.find(q => q.s === 1); ok(L && L.n === 50 && L.locked, 'the locked note is kept' + (i ? ' when the shape changes under it' : '')); });
const ca = PF.emerge(Object.assign({}, base, { density: { start: 1, end: 1, shape: 'hold' }, contour: { shape: 'rise', amount: 18, centre: 34 } })).notes;
ok(ca.slice(-8).reduce((m, x) => m + x.n, 0) / 8 > ca.slice(0, 8).reduce((m, x) => m + x.n, 0) / 8 + 6, 'contour rise: the line climbs');
// one place changed → the rest of the line stays (two draws every step)
const c2 = PF.emerge(Object.assign({}, base, { locked: [{ s: 60, n: 45 }] })).notes.filter(x => x.s < 60); ok(JSON.stringify(c2) === JSON.stringify(a.notes.filter(x => x.s < 60)), 'locking a late note leaves every earlier note as it was');
ok(JSON.stringify(PF.clean({ bars: 99, range: [80, 20], grid: { k: 40, n: 8 }, density: { start: -1, end: 4 } })) === JSON.stringify(PF.clean({ bars: 8, range: [80, 81], grid: { k: 8, n: 8 }, density: { start: 0, end: 1 } })), 'clean keeps every field in range');
console.log((bad ? '✗' : '✓') + ` pattern-field: ${n - bad}/${n} checks (${sh.admitted.length} admitted, ${a.notes.length} emerged)`); process.exit(bad ? 1 : 0);
