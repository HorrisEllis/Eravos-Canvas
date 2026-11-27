// node tools/music/components/ratio-set/ratio-set.test.mjs — every set computed from its formula; equal to Embodiment Lab's own sets.
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const req = createRequire(import.meta.url), { RATIOS } = req('./ratio-set.js'), here = path.dirname(fileURLToPath(import.meta.url));
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const PHI = (1 + Math.sqrt(5)) / 2, c = (a, b) => Math.abs(RATIOS.cents(a) - RATIOS.cents(b));
ok(c(RATIOS.SETS['φ golden'][1][0], PHI) < 1e-9, 'φ'); ok(c(RATIOS.SETS['√2'][1][0], Math.SQRT2) < 1e-9, '√2'); ok(c(RATIOS.SETS['π/2'][1][0], Math.PI / 2) < 1e-9, 'π/2');
ok(c(RATIOS.SETS['e/2'][1][0], Math.E / 2) < 1e-9, 'e/2'); ok(c(RATIOS.SETS['2^(1/φ)'][1][0], Math.pow(2, 1 / PHI)) < 1e-9, '2^(1/φ)');
ok(RATIOS.SETS['φ series'].every(([r], k) => c(r, Math.pow(PHI, k)) < 1e-9), 'φⁿ'); ok(RATIOS.SETS.membrane[0][0] === 1, 'membrane over its first mode');
// equal to Embodiment Lab's SETS (read from its engine, not copied): the same ratios and weights
const src = fs.readFileSync(path.join(here, '../../tools/embodiment/embodiment-lab/embodiment-lab.engine.js'), 'utf8');
const body = src.slice(src.indexOf('const PHI'), src.indexOf('const TONES')); const lab = new Function(body + '; return SETS;')();
for (const k of Object.keys(lab)) { ok(RATIOS.SETS[k], 'has ' + k); ok(lab[k].length === RATIOS.SETS[k].length && lab[k].every(([r, w], i) => c(r, RATIOS.SETS[k][i][0]) < 1e-9 && Math.abs(w - RATIOS.SETS[k][i][1]) < 1e-12), k + ' equals the Lab'); }
// ratios(name, n): a fixed count, octave-repeating, every set
for (const k of RATIOS.names()) { const r = RATIOS.ratios(k, 8); ok(r.length === 8 && r.every(([x, w]) => isFinite(x) && x > 0 && w > 0), k + ' 8 ratios'); }
ok(c(RATIOS.ratios('√2', 7)[5][0], 2) < 1e-9 && c(RATIOS.ratios('√2', 7)[6][0], 2 * Math.SQRT2) < 1e-9, 'past the end: the set again, an octave up');
// numbers → ratios
ok(RATIOS.fromNumbers([200, 300, 500]).map(x => x[0]).join() === '1,1.5,2.5', 'numbers as ratios'); const lg = RATIOS.fromNumbers([1, 10, 100], 'log');
ok(lg[0][0] === 1 && Math.abs(lg[2][0] - 8) < 1e-9, 'log: over three octaves'); ok(RATIOS.fromNumbers([-1, 'x']).length === 1, 'bad numbers dropped');
// 1.1.0 the full spectrum, across: measured spectra, a roughness model, an order computed from fused to apart
const near = (a, b, e) => Math.abs(a - b) < (e || 1e-3);
ok(near(RATIOS.SETS['free bar'][1][0], Math.pow(7.8532 / 4.7300, 2), 1e-3), 'free bar: (7.8532 / 4.7300)² = 2.7565 — the free–free beam roots (Fletcher & Rossing)');
ok(near(RATIOS.SETS['clamped bar'][1][0], Math.pow(4.6941 / 1.8751, 2), 1e-3), 'clamped bar: (4.6941 / 1.8751)² = 6.267 — the cantilever roots');
ok(near(RATIOS.SETS['2.1 stretch'][1][0], 2.1) && near(RATIOS.SETS['2.1 stretch'][3][0], 2.1 * 2.1), "2.1 stretch: its 'octaves' are 2.1, 4.41");
ok(near(RATIOS.SETS.tritave[2][0], 3), 'tritave: 3:1 at its third partial');
const sp = RATIOS.spectrum(); ok(sp.length === RATIOS.names().length, 'every set is on the spectrum');
ok(sp.slice(0, 3).every(x => x.inharm === 0) && sp.slice(0, 3).map(x => x.name).includes('harmonic'), 'fused first: ' + sp.slice(0, 3).map(x => x.name));
ok(sp.findIndex(x => x.name === 'e/2') > sp.findIndex(x => x.name === 'church bell') && sp.findIndex(x => x.name === 'church bell') > sp.findIndex(x => x.name === 'stretched string'), 'harmonic → stretched → bell → irrational');
ok(sp.every((x, i) => !i || x.inharm >= sp[i - 1].inharm), 'ordered by inharmonicity');
ok(RATIOS.dissonance([[1, 1], [1.06, 1]], 220) > RATIOS.dissonance([[1, 1], [2, 1]], 220) * 10, 'roughness: a semitone apart is far rougher than an octave (Plomp & Levelt)');
ok(RATIOS.dissonance([[1, 1], [1.0001, 1]], 220) < RATIOS.dissonance([[1, 1], [1.06, 1]], 220), 'unison is smooth, the rough band is near a quarter of the critical band');
const m0 = RATIOS.morph(0, 6), m1 = RATIOS.morph(1, 6), mh = RATIOS.morph(0.5, 6);
ok(m0.from === sp[0].name && m1.to === sp[sp.length - 1].name && m0.ratios.length === 6, 'morph: 0 = the first, 1 = the last');
ok(mh.ratios.every(([r, w]) => isFinite(r) && r > 0 && w >= 0), 'every point between is a spectrum');
const a = RATIOS.morph(0.30, 6), b = RATIOS.morph(0.3001, 6); ok(a.ratios.every(([r], k) => Math.abs(Math.log(r / b.ratios[k][0])) < 0.01), 'it glides: a small move, a small change');
console.log(`✓ ratio-set: ${n} checks (equal to Embodiment Lab's ${Object.keys(lab).length} sets)`);
