// node tools/music/components/key-detector/key-detector.test.mjs — the key and mode of a recording (new code, Song Import SI1).
import { createRequire } from 'module'; const { KeyDetector } = createRequire(import.meta.url)('./key-detector.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const SR = 22050, hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
// chords as notes (each with a few harmonics), a bass under each, a bar each
function song(chords, sec = 1) { const x = new Float32Array(Math.ceil(chords.length * sec * SR));
  chords.forEach((ch, c) => { const s = Math.round(c * sec * SR); ch.forEach((m, j) => { const f = hz(m), a = j === 0 ? 0.25 : 0.12;
    for (let i = 0; i < sec * SR; i++) { const env = Math.min(1, i / 400) * Math.exp(-i / (SR * 0.8)), p = 2 * Math.PI * f * i / SR; x[s + i] += a * env * (Math.sin(p) + 0.4 * Math.sin(2 * p) + 0.2 * Math.sin(3 * p)); } }); });
  return x; }
const tri = (root, minor) => [root - 12, root, root + (minor ? 3 : 4), root + 7];
const cases = [
  ['C major (I IV V I)', [tri(60), tri(65), tri(67), tri(60), tri(60), tri(65), tri(67), tri(60)], 'C', 'major'],
  ['A minor (i iv v i)', [tri(57, 1), tri(62, 1), tri(64, 1), tri(57, 1), tri(57, 1), tri(62, 1), tri(64, 1), tri(57, 1)], 'A', 'minor'],
  ['F# minor (i iv V i — the V major, as only the minor key has it)', [tri(66, 1), tri(71, 1), tri(61), tri(66, 1), tri(66, 1), tri(71, 1), tri(61), tri(66, 1)], 'F#', 'minor'],
  ['E♭ major (I vi IV V)', [tri(63), tri(60, 1), tri(68), tri(70), tri(63), tri(60, 1), tri(68), tri(63)], 'D#', 'major'],
  ['G major (I V vi IV)', [tri(67), tri(62), tri(64, 1), tri(60), tri(67), tri(62), tri(64, 1), tri(67)], 'G', 'major']];
for (const [name, ch, key, mode] of cases) { const r = KeyDetector.analyse(song(ch), SR); ok(r.key === key && r.mode === mode, `${name}: ${r.key} ${r.mode} (conf ${r.conf.toFixed(2)})`); ok(r.chroma.length === 12 && Math.max(...r.chroma) === 1, `${name}: chroma of twelve`); }
// silence says nothing for sure
{ const r = KeyDetector.analyse(new Float32Array(SR), SR); ok(r.conf === 0, `silence: conf ${r.conf}`); }
console.log(`key-detector: ${n} checks pass`);
