// node tools/music/components/progression/progression.test.mjs
import { createRequire } from 'module';
const { PROGRESSIONS, pickProgressions, degreeAt } = createRequire(import.meta.url)('./progression.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
// ---- the ORIGINALS, verbatim ----
const PROG5 = { 'i-VI-III-VII': [1, 6, 3, 7], 'i-iv-v-i': [1, 4, 5, 1], 'vi-IV-I-V': [6, 4, 1, 5], 'i-i-VI-VII': [1, 1, 6, 7], 'i-v-VI-iv': [1, 5, 6, 4] };
const PROG4 = { 'i-VI-III-VII': [1, 6, 3, 7], 'i-iv-v-i': [1, 4, 5, 1], 'vi-IV-I-V': [6, 4, 1, 5], 'i-i-VI-VII': [1, 1, 6, 7] };
ok(JSON.stringify(PROGRESSIONS) === JSON.stringify(PROG5), 'the five, in order (bass-gen, chord-gen)');
ok(JSON.stringify(pickProgressions(Object.keys(PROG4))) === JSON.stringify(PROG4) && Object.keys(pickProgressions(Object.keys(PROG4))).join() === Object.keys(PROG4).join(), 'the four, in order (edm-lab)');
const bassGen = (PROG, P) => (bar) => { const pr = PROG[P.progression]; return pr[Math.floor(bar / +P.chordBars) % pr.length]; };   // bass-gen ownDegree = chord-gen chordAt
const edm = (PROG, P) => (bar) => { const prog = PROG[P.progression]; return prog[Math.floor(bar / P.chordBars) % prog.length]; };          // edm-lab chordAt (no unary plus)
for (const name of Object.keys(PROG5)) for (const cb of [1, 2, 4, '1', '2', '4']) for (let bar = 0; bar < 256; bar++) {
  ok(degreeAt(PROGRESSIONS, name, bar, cb) === bassGen(PROG5, { progression: name, chordBars: cb })(bar), `bass/chord ${name} cb=${cb} bar=${bar}`);
  if (name in PROG4) ok(degreeAt(pickProgressions(Object.keys(PROG4)), name, bar, cb) === edm(PROG4, { progression: name, chordBars: cb })(bar), `edm ${name} cb=${cb} bar=${bar}`);
}
console.log(`progression: ${n} checks passed — every lookup equals bass-gen / chord-gen / edm-lab's own`);
