// node tools/music/components/filter-formant/filter-formant.test.mjs — the component builds the same graph and sets the same values
// as the two copies it replaced (Wobble Bass, Wub Filter), for every vowel pair, formant shift and resonance.
import { createRequire } from 'module'; const { VOWELS, vowels, formantBands, formantMorph, formantSet } = createRequire(import.meta.url)('./filter-formant.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const dbToGain = (db) => Math.pow(10, db / 20);   // tools/music/core/sdk-music.js dsp.dbToGain
// a fake AudioContext that logs every node made and every connection, in order
function fakeAc() {
  const log = [], ids = new Map(); let k = 0; const id = (o) => { if (!ids.has(o)) ids.set(o, o._name || ('n' + (k++))); return ids.get(o); };
  const param = (owner, name) => ({ _name: id(owner) + '.' + name, value: 0 });
  const node = (kind) => { const o = { kind, connect(d) { log.push(['connect', id(o), d._name || id(d)]); } }; o._id = id(o); log.push(['make', kind, id(o)]); return o; };
  return { log, ac: { createBiquadFilter() { const o = node('biquad'); o.type = 'lowpass'; o.frequency = param(o, 'frequency'); o.Q = param(o, 'Q'); o.detune = param(o, 'detune'); return o; },
    createGain() { const o = node('gain'); o.gain = param(o, 'gain'); return o; } } };
}
// ---- the ORIGINALS, verbatim from the tools before this change ----
const OLD_WOB = { OO: { f: [300, 870, 2240], g: [0, -10, -24] }, OH: { f: [450, 800, 2830], g: [0, -6, -20] }, AH: { f: [730, 1090, 2440], g: [0, -4, -14] }, EH: { f: [530, 1840, 2480], g: [0, -8, -12] }, EE: { f: [270, 2290, 3010], g: [0, -12, -10] }, UH: { f: [640, 1190, 2390], g: [0, -5, -18] }, AE: { f: [660, 1720, 2410], g: [0, -6, -14] }, IH: { f: [390, 1990, 2550], g: [0, -10, -12] }, ER: { f: [490, 1350, 1690], g: [0, -6, -10] } };
const OLD_WUB = { OO: { f: [300, 870, 2240], g: [0, -10, -24] }, OH: { f: [450, 800, 2830], g: [0, -6, -20] }, AH: { f: [730, 1090, 2440], g: [0, -4, -14] }, AE: { f: [660, 1720, 2410], g: [0, -6, -12] }, EH: { f: [530, 1840, 2480], g: [0, -8, -12] }, EE: { f: [270, 2290, 3010], g: [0, -12, -10] }, YOI: { f: [380, 1400, 2600], g: [0, -5, -12] } };
function wobOld(ac, formIn, formOut, uni) {   // wobble-bass.engine.js 4.1: the bank (built early) and its morph (built after the LFO)
  const bands = [0, 1, 2].map(() => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; const g = ac.createGain(); formIn.connect(b); b.connect(g); g.connect(formOut); return { b, g }; });
  const bandScale = bands.map(bd => { const f = ac.createGain(), gg = ac.createGain(); uni.connect(f); f.connect(bd.b.frequency); uni.connect(gg); gg.connect(bd.g.gain); return { f, gg }; });
  return (A, B, shift, q) => { const fs = Math.pow(2, shift / 12); bands.forEach((bd, i) => { bd.b.frequency.value = Math.min(18000, A.f[i] * fs); bd.b.Q.value = 4 + q * 0.9; bandScale[i].f.gain.value = (B.f[i] - A.f[i]) * fs; const ga = dbToGain(A.g[i]), gb = dbToGain(B.g[i]); bd.g.gain.value = ga; bandScale[i].gg.gain.value = gb - ga; }); return bands.map((bd, i) => [bd.b.frequency.value, bd.b.Q.value, bandScale[i].f.gain.value, bd.g.gain.value, bandScale[i].gg.gain.value, bd.b.type]); };
}
function wubOld(ac, vIn, vOut, pos, cutMod) {   // wub-filter.engine.js 1.0.0
  const bands = [0, 1, 2].map(() => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; const g = ac.createGain(); vIn.connect(b); b.connect(g); g.connect(vOut); const fScale = ac.createGain(), gScale = ac.createGain(); pos.connect(fScale); fScale.connect(b.frequency); pos.connect(gScale); gScale.connect(g.gain); cutMod.connect(b.detune); return { b, g, fScale, gScale }; });
  const set = (A, B, shift, q) => { const fs = Math.pow(2, shift / 12); bands.forEach((bd, i) => { bd.b.frequency.value = A.f[i] * fs; bd.b.Q.value = 4 + q * 0.9; bd.fScale.gain.value = (B.f[i] - A.f[i]) * fs; const ga = dbToGain(A.g[i]), gb = dbToGain(B.g[i]); bd.g.gain.value = ga; bd.gScale.gain.value = gb - ga; }); return bands.map(bd => [bd.b.frequency.value, bd.b.Q.value, bd.fScale.gain.value, bd.g.gain.value, bd.gScale.gain.value, bd.b.type]); };
  set.bands = bands; return set;
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b) && a.flat().every((v, i) => Object.is(v, b.flat()[i]));
const pins = (ac) => { const mk = (nm) => { const o = { _name: nm, connect() {} }; return o; }; return { i: mk('IN'), o: mk('OUT'), m: mk('MOD'), c: mk('CUT') }; };
// the table: every old vowel is in the one table with its values (Wub Filter's AE is its override)
const W = vowels(), U = vowels({ AE: OLD_WUB.AE });
for (const v of Object.keys(OLD_WOB)) ok(JSON.stringify(W[v]) === JSON.stringify(OLD_WOB[v]), 'wobble vowel ' + v);
for (const v of Object.keys(OLD_WUB)) ok(JSON.stringify(U[v]) === JSON.stringify(OLD_WUB[v]), 'wub-filter vowel ' + v);
ok(Object.keys(VOWELS).slice(0, 9).join() === Object.keys(OLD_WOB).join(), 'Wobble Bass keeps its vowel order (YOI joins at the end)');
ok(Object.isFrozen(VOWELS) && vowels().OO !== undefined && vowels({ X: 1 }).X === 1 && VOWELS.X === undefined, 'the table is frozen; overrides go on a copy');
// the graph: same nodes, same connections, same order
{ const a = fakeAc(), b = fakeAc(), pa = pins(), pb = pins();
  wobOld(a.ac, pa.i, pa.o, pa.m); MusicPartsWob(b.ac, pb.i, pb.o, pb.m);
  ok(JSON.stringify(a.log) === JSON.stringify(b.log), 'Wobble Bass graph: same nodes and connections in the same order'); }
{ const a = fakeAc(), b = fakeAc(), pa = pins(), pb = pins();
  const oldB = wubOld(a.ac, pa.i, pa.o, pa.m, pa.c).bands, newB = MusicPartsWub(b.ac, pb.i, pb.o, pb.m, pb.c);
  // Wub Filter's order changes only in WHEN each band's morph is wired (after all bands, not inside each): every node gets the same
  // inputs in the same order (so every sum adds in the same order). Nodes are named by role: band i's b, g, fScale, gScale.
  const roles = (bands) => { const r = new Map(); bands.forEach((bd, i) => ['b', 'g', 'fScale', 'gScale'].forEach(k => { r.set(bd[k], k + i); })); return r; };
  const into = (log, bands, ac) => { const r = roles(bands), name = (x) => x; const byId = new Map(); bands.forEach((bd, i) => ['b', 'g', 'fScale', 'gScale'].forEach(k => byId.set(idOf(log, bd[k]), k + i)));
    const lab = (s) => { const [head, ...rest] = s.split('.'); return (byId.get(head) || head) + (rest.length ? '.' + rest.join('.') : ''); };
    const m = {}; log.filter(x => x[0] === 'connect').forEach(([, s, d]) => (m[lab(d)] = m[lab(d)] || []).push(lab(s))); return JSON.stringify(Object.keys(m).sort().map(k => [k, m[k]])); };
  ok(into(a.log, oldB) === into(b.log, newB), 'Wub Filter graph: every node has the same inputs in the same order'); }
function idOf(log, node) { return node._id; }
function MusicPartsWob(ac, i, o, m) { const bands = formantBands(ac, i, o, 3); formantMorph(ac, bands, m); return bands; }
function MusicPartsWub(ac, i, o, m, c) { const bands = formantBands(ac, i, o, 3); formantMorph(ac, bands, m); bands.forEach(bd => c.connect(bd.b.detune)); return bands; }
const read = (bands) => bands.map(bd => [bd.b.frequency.value, bd.b.Q.value, bd.fScale.gain.value, bd.g.gain.value, bd.gScale.gain.value, bd.b.type]);
// the values: every vowel pair × formant shift × resonance
const shifts = [-24, -12, -7, -0.5, 0, 3, 12, 24], qs = [0.5, 1, 6, 12.5, 20];
for (const a of Object.keys(OLD_WOB)) for (const b of Object.keys(OLD_WOB)) for (const sh of shifts) for (const q of qs) {
  const x = fakeAc(), y = fakeAc(), px = pins(), py = pins(), set = wobOld(x.ac, px.i, px.o, px.m), bands = MusicPartsWob(y.ac, py.i, py.o, py.m);
  formantSet(bands, W[a], W[b], { shift: sh, q, maxHz: 18000, dbToGain });
  ok(same(set(OLD_WOB[a], OLD_WOB[b], sh, q), read(bands)), `wobble ${a}→${b} shift ${sh} q ${q}`);
}
for (const a of Object.keys(OLD_WUB)) for (const b of Object.keys(OLD_WUB)) for (const sh of shifts) for (const q of qs) {
  const x = fakeAc(), y = fakeAc(), px = pins(), py = pins(), set = wubOld(x.ac, px.i, px.o, px.m, px.c), bands = MusicPartsWub(y.ac, py.i, py.o, py.m, py.c);
  formantSet(bands, U[a], U[b], { shift: sh, q, dbToGain });
  ok(same(set(OLD_WUB[a], OLD_WUB[b], sh, q), read(bands)), `wub-filter ${a}→${b} shift ${sh} q ${q}`);
}
console.log(`filter-formant: ${n} checks passed — the same graph and values as Wobble Bass's and Wub Filter's own copies`);
