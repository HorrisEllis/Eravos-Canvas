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
console.log(`✓ ratio-set: ${n} checks (equal to Embodiment Lab's ${Object.keys(lab).length} sets)`);
