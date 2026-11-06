// node tools/music/components/scale-key/scale-key.test.mjs — scale-key equals MusicTheory on every 12-tone input, and its own additions prove out.
import { createRequire } from 'module'; import fs from 'fs'; import vm from 'vm'; import path from 'path'; import { fileURLToPath } from 'url';
const req = createRequire(import.meta.url), { KEY } = req('./scale-key.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
// MusicTheory, loaded as the app loads it (a window global)
const here = path.dirname(fileURLToPath(import.meta.url)), sb = { window: {} }; sb.globalThis = sb.window; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(here, '../../core/music-theory.js'), 'utf8'), sb); const MT = sb.window.MusicTheory;
ok(MT && MT.quantize, 'MusicTheory loaded');
let diffs = 0, cases = 0;
for (const sc of Object.keys(KEY.SCALES)) for (let r = 0; r < 12; r++) for (let m = 0; m <= 127; m++) {
  cases++; if (KEY.inScale(m, r, sc) !== MT.inScale(m, r, sc)) diffs++; if (KEY.quantize(m, r, sc) !== MT.quantize(m, r, sc)) diffs++;
  const a = KEY.degreeOf(m, r, sc), b = MT.degreeOf(m, r, sc); if (a.degree !== b.degree || a.octave !== b.octave) diffs++;
}
for (const sc of Object.keys(KEY.SCALES)) for (let r = 0; r < 12; r++) for (let d = -10; d <= 20; d++) for (let o = 0; o < 7; o++) { cases++; if (KEY.degreeToMidi(d, o, r, sc) !== MT.degreeToMidi(d, o, r, sc)) diffs++; }
ok(diffs === 0, `equal to MusicTheory on ${cases} inputs (${diffs} differ)`);
// ---- step: by scale steps
ok(KEY.step(60, 2, 0, 'major') === 64, 'C4 + 2 steps in C major = E4'); ok(KEY.step(60, 7, 0, 'major') === 72, '+7 steps = an octave');
ok(KEY.step(60, -1, 0, 'major') === 59, '−1 step = B3'); ok(KEY.step(61, 0, 0, 'major') === 60, 'off the scale: snapped first (ties down)');
ok(KEY.step(57, 3, 9, 'minor') === 62, 'A3 + 3 steps in A minor = D4');
// every step lands in the scale; stepping up then down returns
for (const sc of ['minor', 'major', 'blues', 'pentatonic_minor']) for (let m = 36; m < 84; m++) { const q = KEY.quantize(m, 9, sc); for (const k of [-9, -2, 1, 5, 13]) { const x = KEY.step(q, k, 9, sc); ok(KEY.inScale(x, 9, sc), `${sc}: step lands in the scale`); ok(KEY.step(x, -k, 9, sc) === q, `${sc}: there and back`); } }
// ---- rel ↔ midi: the Pattern Library's own convention (r = n − root)
for (let r = 0; r < 12; r++) for (let m = 20; m < 100; m++) ok(KEY.fromRel(KEY.toRel(m, r), r) === m, 'round trip');
ok(KEY.toRel(57, 9) === 48 && KEY.fromRel(48, 0) === 48, 'r = n − root');
console.log(`✓ scale-key: ${n} checks (equal to MusicTheory on ${cases} inputs)`);
