// node tools/music/components/mod-tree/mod-tree.test.mjs — modulation that nests: every claim in mod-tree.spec, measured.
import { createRequire } from 'module'; const M = createRequire(import.meta.url)('./mod-tree.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const N = 2049, zc = (a) => { let z = 0; for (let i = 1; i < a.length; i++) if ((a[i - 1] < 0) !== (a[i] < 0)) z++; return z; };
// a flat base is itself
const flat = M.sample(M.signal([[0, 3], [1, 3]]), 64); ok(flat.every(v => v === 3), 'a flat base is itself');
ok(Math.abs(M.at(M.signal([[0, 0], [1, 10]]), 0.25) - 2.5) < 1e-9, 'the base is linear between its points');
// a sine at rate 4, depth 2: four cycles of ±2
const s1 = M.signal([[0, 0], [1, 0]]); s1.mods.push(M.mod('sine', 4, 2)); const a1 = M.sample(s1, N);
ok(Math.abs(Math.max(...a1) - 2) < 1e-3 && Math.abs(Math.min(...a1) + 2) < 1e-3, 'depth 2 swings ±2');
ok(zc(a1) === 8 || zc(a1) === 7, 'rate 4 = four cycles (' + zc(a1) + ' zero crossings)');
// a rate that rises sweeps: the second half crosses zero more often than the first
const s2 = M.signal(); const m2 = M.mod('sine', 2, 1); m2.rate.base = [[0, 2], [1, 20]]; s2.mods.push(m2); const a2 = M.sample(s2, N);
ok(zc(a2.slice(N / 2)) > zc(a2.slice(0, N / 2)) * 1.5, 'a rising rate sweeps (' + zc(a2.slice(0, N / 2)) + ' → ' + zc(a2.slice(N / 2)) + ')');
// two levels: the depth's own modulation multiplies (depth swings 0…2 → the outer wave's size breathes)
const s3 = M.signal(); const m3 = M.mod('sine', 16, 1); m3.depth.base = [[0, 1], [1, 1]]; m3.depth.mods.push(M.mod('sine', 1, 1)); s3.mods.push(m3); const a3 = M.sample(s3, N);
const q = (lo, hi) => Math.max(...Array.from(a3.slice(lo, hi)).map(Math.abs)); ok(q(N * 0.2 | 0, N * 0.3 | 0) > 1.7 && q(N * 0.7 | 0, N * 0.8 | 0) < 0.4, 'depth of a depth: the wave breathes (' + q(N * 0.2 | 0, N * 0.3 | 0).toFixed(2) + ' vs ' + q(N * 0.7 | 0, N * 0.8 | 0).toFixed(2) + ')');
// eight levels compute; a ninth is ignored
function deep(k) { const s = M.signal([[0, 1], [1, 1]]); if (k > 0) { const m = M.mod('sine', 3, 0.5); m.depth = deep(k - 1); s.mods.push(m); } return s; }
const d8 = deep(8), d9 = deep(9); ok(M.depthOf(d9) === 9 && M.count(d8) === 8, 'the tree knows its depth and size');
const t0 = Date.now(); const a8 = M.sample(d8, 1000), ms = Date.now() - t0; ok(a8.every(Number.isFinite), 'eight levels compute'); ok(ms < 50, '1,000 samples of eight levels in ' + ms + ' ms');
const s9 = M.signal(); let cur = s9; for (let k = 0; k < 10; k++) { const m = M.mod('square', 1, 1); cur.mods.push(m); cur = m.depth; cur.base = [[0, 1], [1, 1]]; }
ok(Array.from(M.sample(s9, 100)).every(Number.isFinite), 'ten levels: the ones past eight are left out, never a hang');
// seeded random repeats exactly and changes with the seed
const r = (seed) => { const s = M.signal(); const m = M.mod('random', 8, 1); m.seed = seed; s.mods.push(m); return Array.from(M.sample(s, 300)); };
ok(JSON.stringify(r(7)) === JSON.stringify(r(7)), 'the same seed, the same values'); ok(JSON.stringify(r(7)) !== JSON.stringify(r(8)), 'another seed, other values');
ok(new Set(r(7).map(v => v.toFixed(6))).size <= 9, 'random steps once per cycle (8 cycles)');
const sm = M.signal(); const ms2 = M.mod('smooth', 4, 1); sm.mods.push(ms2); const asm = M.sample(sm, N); let jump = 0; for (let i = 1; i < N; i++) jump = Math.max(jump, Math.abs(asm[i] - asm[i - 1])); ok(jump < 0.02, 'smooth random glides (largest step ' + jump.toFixed(4) + ')');
// a drawn wave plays its points
const dw = M.signal(); const md = M.mod('drawn', 1, 1); md.wave = [[0, 0], [0.25, 1], [0.5, 0], [0.75, -1]]; dw.mods.push(md);
ok(Math.abs(M.at(dw, 0.25) - 1) < 0.02 && Math.abs(M.at(dw, 0.75) + 1) < 0.02 && Math.abs(M.at(dw, 0.5)) < 0.02, 'a drawn cycle plays what was drawn');
// fade starts at zero
const fd = M.signal(); const mf = M.mod('square', 8, 1); mf.fade = 0.5; fd.mods.push(mf); const af = M.sample(fd, N); ok(Math.abs(af[0]) < 1e-9 && Math.abs(af[N - 1]) === 1, 'fade-in starts at 0 and reaches full');
// get / set by path leave the original untouched
const P = ['mods', 0, 'rate', 'base']; const s4 = M.signal(); s4.mods.push(M.mod('sine', 4, 1)); const before = JSON.stringify(s4);
const s5 = M.set(s4, P, [[0, 9], [1, 9]]); ok(JSON.stringify(s4) === before, 'set leaves the original as it was'); ok(M.get(s5, P)[0][1] === 9, 'get reads what set wrote');
ok(M.resample(M.sample(s1, 512), 64).length === 64 && M.resample(M.sample(s1, 512), 64)[63][0] === 1, 'resample: 64 points, 0 to 1');
console.log(`mod-tree: ${n} checks passed`);
