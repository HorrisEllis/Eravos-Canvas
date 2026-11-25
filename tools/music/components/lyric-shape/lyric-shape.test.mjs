// node tools/music/components/lyric-shape/lyric-shape.test.mjs — the shape of the words: stanzas, energy, opposites, refrains, parts, reasons.
import { createRequire } from 'module';
const req = createRequire(import.meta.url), L = req('./lyric-shape.js');
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('FAIL: ' + m); process.exit(1); } };
const POEM = [
  'Every night I run through every street of the city',
  'every light is burning stronger than the fire in me',
  'and I never stop and I never sleep at all',
  '',
  'quiet now',
  '',
  'still',
  '',
  'you were the light',
  'and I was the dark',
  'your peaks, my valleys',
  '',
  'Hold me close tonight',
  'you were the light',
].join('\n');
const r = L.read(POEM);
// stanzas: blank lines cut; single spaced lines join into one stanza of spaced lines
ok(r.stanzas.length === 4, 'four stanzas: ' + r.stanzas.length);
ok(r.stanzas[1].spaced && r.stanzas[1].lines.join('|') === 'quiet now|still', 'spaced single lines read as one stanza');
// energy: the dense, pushing stanza is loudest; the spaced one quietest
const E = r.stanzas.map(s => s.energy); ok(E[0] === Math.max(...E), 'the dense stanza is loudest: ' + E); ok(E[1] === Math.min(...E), 'the spaced stanza is quietest: ' + E);
ok(E.every(e => e >= 0 && e <= 1), 'energy in 0…1');
// parts
ok(r.stanzas[0].kind === 'drop', 'loudest → drop: ' + r.arc); ok(r.stanzas[1].kind === 'break', 'quietest → break: ' + r.arc);
ok(r.stanzas[2].refrain.includes('the light') && r.stanzas[2].kind === 'chorus', 'a run that comes back → chorus: ' + r.stanzas[2].refrain);
ok(r.stanzas[2].pairs.includes('light / dark') && r.stanzas[2].pairs.includes('peak / valley') && r.stanzas[2].split, 'opposites found, the stanza splits');
ok(r.stanzas[2].lineValence[0] > 0 && r.stanzas[2].lineValence[1] < 0, 'a light line and a dark line');
ok(r.stanzas.every(s => s.why.length && s.why.every(w => typeof w === 'string' && w.length > 10)), 'every part has its reason');
ok(r.lesson.length >= 4, 'the lesson');
// contrast 0 = every stanza a verse (as before), nothing split
const z = L.read(POEM, { contrast: 0 }); ok(z.arc.every(k => k === 'verse') && !z.stanzas.some(s => s.split), 'contrast 0: all verses');
// deterministic; a passed-in syllable counter is used
ok(JSON.stringify(L.read(POEM)) === JSON.stringify(r), 'same words → same shape');
let calls = 0; L.read(POEM, { syllables: (l) => { calls++; return L.plainSyllables(l); } }); ok(calls === 10, 'the given syllable counter reads each line: ' + calls);
// edges
ok(L.read('').stanzas.length === 0 && L.read('   \n\n ').arc.length === 0, 'no words, no shape');
const one = L.read('just one line here'); ok(one.stanzas.length === 1 && one.arc.length === 1, 'one line, one stanza');
console.log(`✓ lyric-shape: ${n} checks`);
