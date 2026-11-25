/* eravos.component.lyric-shape 1.0.0 — the shape of the words: where they push, where they rest, where they turn (3.228, 2026-11-25).
 * His words (2026-11-25): "continue making more tools for eravos. i want to make music with contrast. thats my rhytm" · "i want to learn how
 * to make music from my lyrics. that is the point of the rhythm tool"
 * NEW code. It reads any lyrics (a blank line = a new stanza) and says, for each stanza, what its words already do — so the music can do it
 * too, and say why (the WHY is the lesson):
 *   density    syllables per line (many = drive, few = space)          short   the share of short lines (≤ 4 syllables: room to breathe)
 *   stress     the share of strong syllables (punch)                    valence light words − dark words (from a small list, below)
 *   intensity  words that push (stronger, every, completely, scream …), "!" and CAPS
 *   pairs      opposites inside the stanza (light / dark, peaks / valleys, give / back …) — CONTRAST you can hear
 *   refrain    word runs (2+ words, not only small words) that come back in another stanza — what the song keeps returning to
 *   energy     0…1 from density, stress, intensity and the lack of space
 * and gives each stanza a PART — verse · chorus (it carries the refrain, it is not the quietest) · build (just before the loudest) ·
 * drop (the loudest, when it stands clear of the rest) · break (the quietest, when it stands clear) — and a `split` when it holds two or
 * more opposites (its lines take turns: dark lines low and bare, light lines high and full). `contrast` 0…1: how hard neighbours are
 * pushed apart (0 = every stanza a verse, as before). Every choice comes with its reason in plain words (`why`).
 *   MusicParts.LyricShape.read(text, { contrast, syllables(line) → [{ stress }] }) → { stanzas: [...], arc: [kinds], lesson: [steps] }
 * The word lists are data here and small on purpose (static earns its place): they only steer, they never decide alone. A component
 * imports no tool: the syllable counter is passed in (Lyrics → Rhythm's), with a plain vowel-group counter when it is not. */
(function (root) {
  'use strict';
  // opposites (either order, any form that starts with the stem: "peak" finds "peaks"); each pair is one contrast
  const PAIRS = [['light', 'dark'], ['peak', 'valley'], ['high', 'low'], ['up', 'down'], ['rise', 'fall'], ['give', 'back'], ['give', 'take'],
    ['love', 'hate'], ['heaven', 'hell'], ['day', 'night'], ['sun', 'moon'], ['fire', 'ice'], ['hot', 'cold'], ['open', 'close'], ['found', 'lost'],
    ['whole', 'apart'], ['whole', 'broken'], ['near', 'far'], ['begin', 'end'], ['beginning', 'never'], ['always', 'never'], ['everything', 'nothing'],
    ['full', 'empty'], ['loud', 'quiet'], ['silence', 'sound'], ['alive', 'dead'], ['start', 'stop'], ['heal', 'wound'], ['scar', 'heal'],
    ['joy', 'pain'], ['laugh', 'cry'], ['home', 'nowhere'], ['home', 'no where'], ['real', 'fake'], ['fallen', 'rise'], ['shadow', 'light'],
    ['together', 'apart'], ['stay', 'leave'], ['come', 'go'], ['more', 'less'], ['strong', 'weak'], ['perfect', 'imperfect'],
    ['fallen apart', 'restored']];
  const LIGHT = ['love', 'light', 'home', 'restor', 'peak', 'emerge', 'perfect', 'divine', 'lumin', 'heaven', 'joy', 'accept', 'flow', 'soul', 'essence',
    'shine', 'bright', 'warm', 'free', 'alive', 'hope', 'kiss', 'smile', 'gold', 'star', 'universe', 'worth', 'deserve', 'energy', 'heal', 'whole'];
  const DARK = ['pain', 'fall', 'fallen', 'apart', 'wound', 'scar', 'dark', 'valley', 'regret', 'never', 'nowhere', 'scream', 'void', 'alone', 'broken',
    'lost', 'cold', 'tear', 'grief', 'hurt', 'empty', 'shadow', 'gone', 'die', 'dead', 'fear', 'cry', 'away'];
  const PUSH = ['strong', 'stronger', 'every', 'countless', 'complete', 'completely', 'badly', 'scream', 'fire', 'storm', 'burn', 'all', 'total', 'sum',
    'never', 'forever', 'always', 'so', 'universe', 'expansive', 'divine'];
  const SMALL = new Set('a an the of to in on at for and but or nor so as is am are was were be been it its i you he she we they me him her us them my your his our their this that with from by if not no do does did can could will would just like than then there here what when who how all up out off oh me'.split(' '));
  const words = (line) => (String(line).toLowerCase().match(/[a-z’']+/g) || []).map(w => w.replace(/[’']/g, ''));
  const has = (ws, list) => ws.filter(w => list.some(s => w === s || (s.length > 3 && w.startsWith(s)))).length;
  const stemIn = (text, s) => s.includes(' ') ? text.includes(s) : (' ' + text + ' ').match(new RegExp('[^a-z]' + s + '[a-z]*[^a-z]'));
  function plainSyllables(line) { return words(line).flatMap(w => { const n = Math.max(1, (w.replace(/e$/, '').match(/[aeiouy]+/g) || []).length); return Array.from({ length: n }, (_, i) => ({ stress: i === 0 && !SMALL.has(w) ? 1 : 0 })); }); }
  const clamp = (x) => Math.max(0, Math.min(1, x));

  function stanzasOf(text) {
    let g = String(text || '').replace(/\r/g, '').split(/\n\s*\n/).map(b => b.split('\n').map(l => l.trim()).filter(Boolean)).filter(b => b.length);
    if (g.length < 2 && g[0] && g[0].length > 4) { const L = g[0]; g = []; for (let i = 0; i < L.length; i += 4) g.push(L.slice(i, i + 4)); }
    // lines set apart one by one (a blank line after each) read as ONE stanza of spaced lines — up to 4 together: the space is in its shape
    const out = []; g.forEach(b => { const last = out[out.length - 1]; if (b.length === 1 && last && last.spaced && last.length < 4) last.push(b[0]); else { const nb = b.slice(); nb.spaced = b.length === 1; out.push(nb); } });
    return out;
  }
  // word runs of 2–4 words, not only small words, that appear in another stanza
  function refrains(st) {
    const grams = st.map(lines => { const set = new Set(); lines.forEach(l => { const w = words(l); for (let n = 2; n <= 4; n++) for (let i = 0; i + n <= w.length; i++) { const g = w.slice(i, i + n); if (g.some(x => !SMALL.has(x))) set.add(g.join(' ')); } }); return set; });
    return grams.map((set, i) => [...set].filter(g => grams.some((o, j) => j !== i && o.has(g))));
  }

  function read(text, o) {
    o = o || {}; const contrast = o.contrast === undefined ? 1 : clamp(+o.contrast), syl = typeof o.syllables === 'function' ? o.syllables : plainSyllables;
    const st = stanzasOf(text), refs = refrains(st);
    const stanzas = st.map((lines, i) => {
      const per = lines.map(l => syl(l) || []), n = per.reduce((a, s) => a + s.length, 0), strong = per.reduce((a, s) => a + s.filter(x => x.stress).length, 0);
      const ws = words(lines.join(' ')), text1 = ' ' + ws.join(' ') + ' ';
      const light = has(ws, LIGHT), dark = has(ws, DARK), push = has(ws, PUSH) + (lines.join(' ').match(/!/g) || []).length + lines.filter(l => /\b[A-Z]{2,}\b/.test(l)).length;
      const pairs = PAIRS.filter(([a, b]) => stemIn(text1, a) && stemIn(text1, b)).map(([a, b]) => a + ' / ' + b);
      const lineVal = lines.map(l => { const w = words(l); return has(w, LIGHT) - has(w, DARK); });
      const density = n / lines.length, short = lines.spaced ? Math.max(0.75, per.filter(s => s.length <= 4).length / lines.length) : per.filter(s => s.length <= 4).length / lines.length;
      return { i, lines: lines.slice(), spaced: !!lines.spaced, syllables: n, density: +density.toFixed(2), short: +short.toFixed(2), stress: n ? +(strong / n).toFixed(2) : 0,
        valence: +((light - dark) / (light + dark + 1)).toFixed(2), intensity: push, pairs: [...new Set(pairs)], lineValence: lineVal,
        refrain: refs[i].sort((a, b) => b.split(' ').length - a.split(' ').length).slice(0, 3), questions: lines.filter(l => /\?\s*$/.test(l)).length };
    });
    if (!stanzas.length) return { stanzas: [], arc: [], lesson: [] };
    // energy 0…1, scaled across this poem (a quiet poem still has its loudest stanza)
    const span = (k) => { const v = stanzas.map(s => s[k]), lo = Math.min(...v), hi = Math.max(...v); return (x) => hi > lo ? (x - lo) / (hi - lo) : 0.5; };
    const D = span('density'), I = span('intensity'), Sx = span('stress');
    stanzas.forEach(s => { s.energy = +clamp(0.4 * D(s.density) + 0.25 * I(s.intensity) + 0.15 * Sx(s.stress) + 0.2 * (1 - s.short)).toFixed(2); });
    // the parts: only as far as `contrast` asks; each with its reason
    const E = stanzas.map(s => s.energy), sorted = [...E].sort((a, b) => a - b), med = sorted[Math.floor(sorted.length / 2)], gap = 0.18 * (1 - contrast) + 0.05;
    stanzas.forEach(s => { s.kind = 'verse'; s.why = []; s.split = false; });
    if (contrast > 0 && stanzas.length > 1) {
      const loud = stanzas.reduce((a, b) => b.energy > a.energy ? b : a), quiet = stanzas.reduce((a, b) => b.energy < a.energy ? b : a);
      const second = Math.max(...stanzas.filter(s => s !== loud).map(s => s.energy));
      if (loud.energy - second >= gap || stanzas.length <= 3) { loud.kind = 'drop'; loud.why.push('the most words and push in the poem (energy ' + loud.energy + ') — everything plays, the drums at full'); }
      if (quiet !== loud && med - quiet.energy >= gap) { quiet.kind = 'break'; quiet.why.push('the fewest, shortest lines (energy ' + quiet.energy + ') — room to breathe: only chords and the voice, no drums'); }
      stanzas.forEach(s => { if (s.kind === 'verse' && s.refrain.length && s.lines.length > 1) { s.kind = 'chorus'; s.why.push('“' + s.refrain[0] + '” comes back in another stanza — what the song returns to, so it is a chorus: full, the drums on'); } });
      const di = stanzas.indexOf(loud); if (loud.kind === 'drop' && di > 0 && stanzas[di - 1].kind === 'verse') { stanzas[di - 1].kind = 'build'; stanzas[di - 1].why.push('it comes just before the loudest stanza — the drums roll up into it, everything stops half a beat before'); }
      stanzas.forEach(s => { if (s.pairs.length >= (contrast >= 0.5 ? 1 : 2) && s.lines.length > 1) { s.split = true; s.why.push('opposites inside it (' + s.pairs.slice(0, 3).join(', ') + ') — its lines take turns: the dark ones low and bare, the light ones high and full'); } });
    }
    stanzas.forEach(s => { if (!s.why.length) s.why.push(s.kind === 'verse' ? 'it tells the story (energy ' + s.energy + ') — drums, bass and chords under the words' : ''); });
    const lesson = ['Every syllable is a step: a strong one lands on the beat (a kick on 1 and 3, a snare on 2 and 4), a weak one fills between (a hat).',
      'Every stanza is a part of the song. How many syllables a line has is its speed; short lines leave space — and space is part of the music.',
      'Contrast is the rhythm of a song: a quiet stanza next to a loud one makes both stronger. The loudest becomes the drop, the quietest a break.',
      'A line that comes back is what the song is about: it becomes the chorus, and you will want to hear it more than once.',
      'Opposites in one stanza (light and dark, peaks and valleys) can be heard: the music turns with the words, line by line.'];
    return { stanzas, arc: stanzas.map(s => s.kind), lesson, contrast };
  }
  const api = { read, stanzasOf, plainSyllables, PAIRS, LIGHT, DARK, PUSH, version: '1.0.0' };
  root.MusicParts = root.MusicParts || {};
  root.MusicParts.LyricShape = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
