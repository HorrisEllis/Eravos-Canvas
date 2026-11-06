// node tools/music/components/pattern-store/pattern-store.test.mjs — patterns as data: clips round-trip, nesting flattens, grow is self-similar.
import { createRequire } from 'module'; const req = createRequire(import.meta.url);
const { PatternStore, flatten, grow, patternDiff } = req('./pattern-store.js'), { KEY } = req('../scale-key/scale-key.js'), { Seeds } = req('../seed-registry/seed-registry.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const S = PatternStore();
// ---- a Timeline clip's notes round-trip bit for bit (bends, per-note knobs and all)
const clip = [{ s: 0, l: 4, n: 57, v: 0.8 }, { s: 4, l: 2.5, n: 60, v: 0.6, b: { from: 0, to: -12, shape: 'dive', at: 0.3 } }, { s: 8, l: 8, n: 64, v: 1, k: { cutoff: 1200 } }];
{ const { id } = S.put({ name: 'clip', len: 16, notes: clip }), back = S.get(id); ok(JSON.stringify(back.notes) === JSON.stringify(clip), 'clip notes round-trip exactly');
  ok(JSON.stringify(flatten(back, S).notes) === JSON.stringify(clip), 'and flatten gives them back unchanged'); }
// ---- versions: every save a new version, the old kept
{ const a = S.put({ id: 'v1', name: 'v', len: 16, notes: [{ s: 0, l: 1, n: 60, v: 0.8 }] }), b = S.put(Object.assign(S.get('v1'), { notes: [{ s: 0, l: 1, n: 62, v: 0.8 }] }));
  ok(a.v === 1 && b.v === 2 && S.versions('v1').join() === '1,2', 'two versions'); ok(S.get('v1', 1).notes[0].n === 60 && S.get('v1').notes[0].n === 62, 'the old one is kept');
  const d = patternDiff(S.get('v1', 1), S.get('v1')); ok(d.added.length === 1 && d.removed.length === 1, 'diff: one note changed pitch = one removed, one added'); }
// ---- nesting: a bar of a pattern placed 4 times, transposed, reversed
const cell = { id: 'cell', name: 'cell', len: 4, notes: [{ s: 0, l: 1, n: 60, v: 0.8 }, { s: 1, l: 1, n: 63, v: 0.8 }, { s: 2, l: 2, n: 67, v: 0.8 }] }; S.put(cell);
const bar = { id: 'bar', name: 'bar', len: 16, notes: [], places: [{ ref: 'cell', at: 0 }, { ref: 'cell', at: 4, xf: { transpose: 5 } }, { ref: 'cell', at: 8, xf: { reverse: true } }, { ref: 'cell', at: 12, xf: { invert: true } }] }; S.put(bar);
{ const f = flatten(S.get('bar'), S).notes; ok(f.length === 12, '4 places × 3 notes');
  ok(f.filter(x => x.s >= 4 && x.s < 8).map(x => x.n).join() === '65,68,72', 'transpose +5');
  ok(f.filter(x => x.s >= 8 && x.s < 12).map(x => x.s + ':' + x.n).join() === '8:67,10:63,11:60', 'reverse: mirrored in time');
  ok(f.filter(x => x.s >= 12).map(x => x.n).join() === '60,57,53', 'invert: mirrored in pitch around the first note'); }
// ---- deeper: a phrase of bars of cells (3 levels), and scale steps in a key
S.put({ id: 'phrase', name: 'phrase', len: 64, notes: [], places: [{ ref: 'bar', at: 0 }, { ref: 'bar', at: 16, xf: { steps: 2 } }, { ref: 'bar', at: 32, xf: { stretch: 2 } }] });
{ const f = flatten(S.get('phrase'), S, { key: { root: 0, scale: 'minor' }, KEY }).notes; ok(f.length === 36, '3 levels flatten: 36 notes');
  const up = f.filter(x => x.s >= 16 && x.s < 32); ok(up.every(x => KEY.inScale(x.n, 0, 'minor')), 'scale steps land in the key'); ok(Math.max(...f.map(x => x.s + x.l)) === 64, 'stretch ×2 fills its 32 sixteenths'); }
// ---- cycles and depth are refused, by name, not hung
S.put({ id: 'a', len: 4, notes: [{ s: 0, l: 1, n: 60 }], places: [{ ref: 'b', at: 0 }] }); S.put({ id: 'b', len: 4, notes: [], places: [{ ref: 'a', at: 2 }] });
{ const r = flatten(S.get('a'), S); ok(r.refused.some(x => /a \(cycle\)/.test(x)), 'a → b → a: the cycle is refused: ' + r.refused.join()); ok(r.notes.length === 1, 'and the rest still plays'); }
{ const r = flatten(S.get('phrase'), S, { depth: 1 }); ok(r.refused.some(x => /deeper/.test(x)), 'depth limit named'); }
// ---- every and chance (by named seed: the same every time, another seed another result)
S.put({ id: 'ev', len: 16, notes: [], places: [{ ref: 'cell', at: 0, xf: { every: 2 } }] });
ok(flatten(S.get('ev'), S, { rep: 0 }).notes.length === 3 && flatten(S.get('ev'), S, { rep: 1 }).notes.length === 0, 'every 2: on repeats 0, 2, 4 …');
{ S.put({ id: 'ch', len: 64, notes: [], places: Array.from({ length: 16 }, (_, i) => ({ ref: 'cell', at: i * 4, xf: { chance: 0.5 } })) });
  const sd = Seeds(9), a = flatten(S.get('ch'), S, { rng: (p) => sd.rng(p) }).notes, b = flatten(S.get('ch'), S, { rng: (p) => Seeds(9).rng(p) }).notes;
  ok(JSON.stringify(a) === JSON.stringify(b), 'chance: the same seed, the same notes'); ok(a.length > 10 && a.length < 38, `chance 0.5: ${a.length} of 48 notes`);
  sd.reroll('ch/0/chance'); const c = flatten(S.get('ch'), S, { rng: (p) => sd.rng(p) }).notes; ok(JSON.stringify(c) !== JSON.stringify(a), 'reroll: another variation'); }
// ---- grow: the fractal — depth d has |base| × |rule|^d notes, each fitted inside its parent
{ const base = { name: 'base', len: 16, notes: [{ s: 0, l: 8, n: 48, v: 0.9 }, { s: 8, l: 8, n: 55, v: 0.9 }] }, rule = { len: 4, notes: [{ s: 0, l: 1, n: 60, v: 0.8 }, { s: 1, l: 1, n: 67, v: 0.8 }, { s: 2, l: 2, n: 72, v: 0.8 }] };
  ok(grow(base, rule, 0).notes.length === 2, 'depth 0 = the base');
  for (const d of [1, 2, 3]) { const g = grow(base, rule, d); ok(g.notes.length === 2 * 3 ** d, `depth ${d}: ${g.notes.length} notes (2 × 3^${d})`); ok(g.notes.every(x => x.s >= 0 && x.s + x.l <= 16 + 1e-9), `depth ${d}: inside the base`); }
  const g1 = grow(base, rule, 1).notes; ok(g1.slice(0, 3).map(x => x.n).join() === '48,55,60' && g1[2].s === 4, 'each base note becomes the rule on its pitch, fitted to its length'); }
// ---- save and load the whole store
{ const T = PatternStore(); T.fromJSON(JSON.parse(JSON.stringify(S.toJSON()))); ok(JSON.stringify(flatten(T.get('phrase'), T, { key: { root: 0, scale: 'minor' }, KEY }).notes) === JSON.stringify(flatten(S.get('phrase'), S, { key: { root: 0, scale: 'minor' }, KEY }).notes), 'saved and loaded: the same music'); ok(T.versions('v1').join() === '1,2', 'versions too'); }
console.log(`✓ pattern-store: ${n} checks`);
