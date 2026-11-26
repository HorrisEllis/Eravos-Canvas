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
// 1.1.0 patterns: words · mirror · shadow · pendulum
const P = L.patterns([{ s: 0, l: 2, stress: 1 }, { s: 2, l: 1, stress: 0 }, { s: 4, l: 2, stress: 1 }, { s: 8, l: 4, stress: 1 }]);
ok(P.bars === 1 && P.words.length === 4, 'one bar of words');
ok(P.mirror.map(x => x.s).join() === '4,10,13,14' && P.mirror.filter(x => x.stress).length === 3, 'mirror: the bar played back, stress kept: ' + P.mirror.map(x => x.s));
ok(P.shadow.map(x => x.s).join() === '6,12,14' && P.shadow.find(x => x.s === 12).stress === 1, 'shadow: the rests on the 8ths become hits: ' + P.shadow.map(x => x.s));
const P2 = L.patterns([{ s: 0, l: 2, stress: 1 }, { s: 6, l: 2, stress: 0 }, { s: 20, l: 2, stress: 1 }]);
ok(P2.bars === 2 && P2.pendulum.bars === 2 && P2.pendulum.notes.map(x => x.s).join() === '0,6,24,30', 'pendulum: as long out as back: ' + P2.pendulum.notes.map(x => x.s));
ok(L.patterns([]) === null, 'no syllables, no patterns');
ok(L.patterns(Array.from({ length: 40 }, (_, i) => ({ s: i * 4, l: 2, stress: 1 }))).bars === 4, 'at most 4 bars');
// 1.2.0 who speaks: call and answer
const cl = L.clausesOf('I loved you with all of me. You loved the thought of me.'); ok(cl.length === 2 && cl[0].who === 'I' && cl[1].who === 'you' && cl[1].start === 7, 'two clauses, I then you: ' + JSON.stringify(cl));
const cm = L.clausesOf('I wanted closeness, you wanted the distance'); ok(cm.length === 2 && cm[1].who === 'you' && cm[1].start === 3, 'a comma, then you: ' + JSON.stringify(cm));
ok(L.whoAt(cl, 3) === 'I' && L.whoAt(cl, 7) === 'you', 'a word finds its speaker');
ok(L.clausesOf('even the painful moments', 'I')[0].who === 'I', 'a clause with no speaker carries the one before');
const dl = L.read('I wanted all of you. You wanted fairytales.\nI wanted closeness, you wanted distance.'); ok(dl.stanzas[0].dialogue, 'a dialogue stanza');
ok(dl.stanzas[0].why.some(w => /off the beat/.test(w)), 'and it says why');
// 1.3.0 invariants: what stays the same (invented lines)
const POEM2 = 'I gave you the morning light.\nYou gave me the night.\nI held the open sky.\nYou held the dark.\n\nI found the fire in the cold.\nYou found the cold in the fire.\nI sang the high notes, low and bright.\nYou sang them low.\n\nI carried the sun through the dark.\nYou carried the moon.\nI was the day you could not hold.\nYou were the night.';
const iv = L.invariants(POEM2); const key = (k) => iv.invariants.find(c => c.key === k);
ok(iv.by === 'stanza' && iv.units === 3, 'three stanzas read: ' + iv.units);
ok(key('dialogue') && key('dialogue').holds === 1, 'I and you in every stanza');
ok(key('parallel') && key('parallel').holds === 1, 'the same frame said twice, the speaker swapped, in every stanza');
ok(key('opposites') && key('opposites').holds === 1, 'light and dark together, every stanza');
ok(key('shape') && key('shape').value === 4, 'four lines each: the form is square');
ok(iv.invariants.every(c => c.keep && c.what && c.where), 'each says what it is, where it holds and what the music keeps');
ok(L.invariants('One line only.\nAnd another.').invariants.length === 0, 'one stanza proves nothing stays the same');
const pieces = L.invariants([POEM2, 'I ran to you.\nYou walked away.\n\nI called the light.\nYou kept the dark.', 'the rain on the glass\nthe glass in the rain'], { hold: 0.6 });
ok(pieces.by === 'piece' && pieces.units === 3, 'several texts: piece by piece');
ok(pieces.invariants.some(c => c.key === 'opposites') && pieces.all.find(c => c.key === 'dialogue').holds === 0.67, 'across pieces: opposites hold, I / you in two of three (the third has neither)');
ok(Array.isArray(pieces.variants), 'and what changes');
console.log(`✓ lyric-shape: ${n} checks`);
