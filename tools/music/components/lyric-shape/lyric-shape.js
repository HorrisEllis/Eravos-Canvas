/* eravos.component.lyric-shape 1.3.0 — the shape of the words: where they push, where they rest, where they turn (3.228, 2026-11-25).
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
 *   MusicParts.LyricShape.patterns(placedSyllables, { bars }) → { bars, words, mirror, shadow, pendulum: { bars, notes } } (1.1.0)
 *   MusicParts.LyricShape.invariants(text | [texts], { by, hold }) → what stays the same in every stanza / piece, and what changes (1.3.0)
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
  // 1.2.0 WHO SPEAKS (his words, 2026-11-26: "Can you add contrasting rhythm or a bunch with tension?" — with "I loved you with all of me. You loved
  // the thought of me."): each line cut into clauses at . ; ! ? — a clause is "I" (I, I'm, me, my …), "you" (you, your …), "we", or carries
  // the one before it. Word indices are counted as Lyrics → Rhythm counts them (! and ? are not words), so a syllable finds its clause.
  const WHO = { i: 'I', "i'm": 'I', im: 'I', "i've": 'I', ive: 'I', "i'd": 'I', "i'll": 'I', me: 'I', my: 'I', mine: 'I', myself: 'I',
    you: 'you', "you're": 'you', youre: 'you', "you've": 'you', "you'd": 'you', "you'll": 'you', your: 'you', yours: 'you', yourself: 'you', we: 'we', us: 'we', our: 'we' };
  const SUBJ = new Set(['i', "i'm", 'im', "i've", "i'd", "i'll", 'you', "you're", "you've", "you'd", "you'll", 'we']);
  function clausesOf(line, carry) {
    const out = []; let wi = 0, who = carry || null, start = true, soft = false;
    (String(line).match(/[A-Za-z0-9'’]+|[.;!?]+|,/g) || []).forEach(t => {
      if (/^[.;!?]+$/.test(t)) { start = true; return; }
      if (t === ',') { soft = true; return; }   // after a comma, "I …" / "you …" starts a clause too ("I wanted closeness, you wanted the distance")
      const w = t.toLowerCase().replace(/’/g, "'");
      if (soft && !start && SUBJ.has(w) && WHO[w] !== who) start = true; soft = false;
      if (start) { if (WHO[w]) who = WHO[w]; out.push({ start: wi, who: who || 'none' }); start = false; }
      wi++;
    });
    return out.length ? out : [{ start: 0, who: carry || 'none' }];
  }
  const whoAt = (clauses, wi) => { let w = clauses[0].who; clauses.forEach(c => { if (wi >= c.start) w = c.who; }); return w; };

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
      let carry = null; const clauses = lines.map(l => { const c = clausesOf(l, carry); carry = c[c.length - 1].who; return c; });
      const whos = new Set(clauses.flat().map(c => c.who)), dialogue = whos.has('I') && whos.has('you');
      const density = n / lines.length, short = lines.spaced ? Math.max(0.75, per.filter(s => s.length <= 4).length / lines.length) : per.filter(s => s.length <= 4).length / lines.length;
      return { i, lines: lines.slice(), spaced: !!lines.spaced, syllables: n, density: +density.toFixed(2), short: +short.toFixed(2), stress: n ? +(strong / n).toFixed(2) : 0,
        valence: +((light - dark) / (light + dark + 1)).toFixed(2), intensity: push, pairs: [...new Set(pairs)], lineValence: lineVal,
        clauses, dialogue, refrain: refs[i].sort((a, b) => b.split(' ').length - a.split(' ').length).slice(0, 3), questions: lines.filter(l => /\?\s*$/.test(l)).length };
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
    if (contrast > 0) stanzas.forEach(s => { if (s.dialogue) s.why.push('I and you answer each other — the "you" falls off the beat (tension), the last line lands back on it (release)'); });
    stanzas.forEach(s => { if (!s.why.length) s.why.push(s.kind === 'verse' ? 'it tells the story (energy ' + s.energy + ') — drums, bass and chords under the words' : ''); });
    const lesson = ['Every syllable is a step: a strong one lands on the beat (a kick on 1 and 3, a snare on 2 and 4), a weak one fills between (a hat).',
      'Every stanza is a part of the song. How many syllables a line has is its speed; short lines leave space — and space is part of the music.',
      'Contrast is the rhythm of a song: a quiet stanza next to a loud one makes both stronger. The loudest becomes the drop, the quietest a break.',
      'A line that comes back is what the song is about: it becomes the chorus, and you will want to hear it more than once.',
      'Opposites in one stanza (light and dark, peaks and valleys) can be heard: the music turns with the words, line by line.',
      'Tension is a beat that does not land where you expect: when "I" speaks the words sit on the beat; when "you" answers they fall just off it, and the last line brings them home.'];
    return { stanzas, arc: stanzas.map(s => s.kind), lesson, contrast };
  }
  // ---------------------------------------------------------------- 1.1.0 PATTERNS from the words' rhythm (3.229; his words, 2026-11-25: "More of
  // my rhythm. Make patterns." — and his own law, the same day: "The amount of time the pendulum swings to the left is directly proportional to
  // the amount of time in takes to swing to the right."). From one stanza's placed syllables ([{ s, l, stress }] in 16ths), four rhythms:
  //   words     as the words fall                         mirror    the same bar played back, right to left (the pendulum's return)
  //   shadow    the rests become the hits (negative space: what the words leave out, on the 8ths)
  //   pendulum  the words, then their mirror — as long out as back
  // each ≤ `bars` bars (default 4), whole bars; stress kept (a mirrored strong syllable stays strong; a shadow hit on a beat is strong).
  function patterns(notes, o) {
    o = o || {}; const maxBars = Math.max(1, Math.min(8, o.bars || 4)), src = (notes || []).filter(n => isFinite(n.s) && n.s >= 0).map(n => ({ s: +n.s, l: Math.max(0.25, +n.l || 1), stress: n.stress | 0 }));
    if (!src.length) return null;
    const end = Math.max(...src.map(n => n.s + n.l)), bars = Math.max(1, Math.min(maxBars, Math.ceil(end / 16))), L = bars * 16, inL = src.filter(n => n.s < L);
    const r3 = (x) => Math.round(x * 1000) / 1000;
    const words = inL.map(n => ({ s: r3(n.s), l: r3(Math.min(n.l, L - n.s)), stress: n.stress }));
    const mirror = words.map(n => ({ s: r3(Math.max(0, L - n.s - n.l)), l: n.l, stress: n.stress })).sort((a, b) => a.s - b.s);
    const busy = new Array(L).fill(false); words.forEach(n => { for (let k = Math.floor(n.s); k < Math.min(L, Math.ceil(n.s + n.l)); k++) busy[k] = true; });
    const shadow = []; for (let k = 0; k < L; k += 2) if (!busy[k] && !busy[k + 1]) shadow.push({ s: k, l: 2, stress: k % 4 === 0 ? 1 : 0 });
    const half = Math.max(1, Math.floor(bars / 2)), H = half * 16, w2 = words.filter(n => n.s < H), pendulum = w2.map(n => ({ s: n.s, l: Math.min(n.l, H - n.s), stress: n.stress }))
      .concat(w2.map(n => ({ s: r3(2 * H - n.s - Math.min(n.l, H - n.s)), l: Math.min(n.l, H - n.s), stress: n.stress }))).sort((a, b) => a.s - b.s);
    return { bars, words, mirror, shadow, pendulum: { bars: half * 2, notes: pendulum } };
  }
  // ---------------------------------------------------------------- 1.3.0 INVARIANTS (3.239; his words, 2026-11-26: "Also what about the structure
  // of my words? Like invariants?"). What stays the same — in every stanza of a piece, or in every piece of his — and what changes. Each
  // invariant is a property measured on every unit (a stanza, or a whole piece when several are given), kept when it holds in ≥ `hold` of them
  // (default 0.75), with how strongly (its share) and what the music can KEEP because of it; the properties that change most are the variants:
  // what the music can CHANGE. Nothing is judged: the structure he writes in, measured.
  //   LyricShape.invariants(textOrTexts, { by: 'stanza'|'piece', hold, syllables }) → { units, invariants: [{ key, what, holds, value, keep }], variants: [...] }
  const SUBJECTS = { I: 'I', you: 'you', we: 'we' };
  function frameOf(clauseWords) { return clauseWords.map(w => WHO[w] ? '·' : w).filter(w => !SMALL.has(w) || w === '·'); }
  function parallel(lines) {   // two clauses, different speakers, the same frame: "I loved you with all of me. You loved the thought of me."
    const cl = []; let carry = null;
    lines.forEach(l => { const ws = words(l), c = clausesOf(l, carry); carry = c[c.length - 1].who; c.forEach((x, k) => cl.push({ who: x.who, ws: ws.slice(x.start, k + 1 < c.length ? c[k + 1].start : ws.length) })); });
    let n = 0; for (let i = 1; i < cl.length; i++) { const a = cl[i - 1], b = cl[i]; if (a.who === b.who || a.who === 'none' || b.who === 'none') continue;
      const fa = new Set(frameOf(a.ws)), fb = frameOf(b.ws), shared = fb.filter(w => w !== '·' && fa.has(w)).length; if (shared >= 1 && a.ws[0] !== b.ws[0]) n++; }
    return n;
  }
  function unitFeatures(lines, syl) {
    const per = lines.map(l => (syl(l) || []).length), mean = per.reduce((a, b) => a + b, 0) / (per.length || 1);
    const sd = Math.sqrt(per.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (per.length || 1)), ws = words(lines.join(' ')), t1 = ' ' + ws.join(' ') + ' ';
    let carry = null; const whos = new Set(); lines.forEach(l => { const c = clausesOf(l, carry); carry = c[c.length - 1].who; c.forEach(x => whos.add(x.who)); });
    const first = lines.map(l => words(l)[0]).filter(Boolean), top = first.reduce((m, w) => (m[w] = (m[w] || 0) + 1, m), {}), lead = Object.keys(top).sort((a, b) => top[b] - top[a])[0];
    const lv = lines.map(l => { const w = words(l); return has(w, LIGHT) - has(w, DARK); }), half = Math.ceil(lv.length / 2);
    const startV = lv.slice(0, half).reduce((a, b) => a + b, 0), endV = lv.slice(half).reduce((a, b) => a + b, 0);
    return { lines: lines.length, perLine: +mean.toFixed(1), steady: mean ? sd / mean : 1, dialogue: whos.has('I') && whos.has('you'), speaker: whos.has('I') ? 'I' : whos.has('you') ? 'you' : whos.has('we') ? 'we' : 'none',
      opposites: PAIRS.filter(([a, b]) => stemIn(t1, a) && stemIn(t1, b)).length, parallel: parallel(lines), anaphora: lead && first.length > 1 ? top[lead] / first.length : 0, lead,
      shortEnd: per.length > 1 && per[per.length - 1] < mean * 0.8, turn: endV - startV, questions: lines.filter(l => /\?\s*$/.test(l)).length, both: has(ws, LIGHT) > 0 && has(ws, DARK) > 0 };
  }
  function invariants(input, o) {
    o = o || {}; const syl = typeof o.syllables === 'function' ? o.syllables : plainSyllables, hold = o.hold === undefined ? 0.75 : +o.hold;
    const texts = Array.isArray(input) ? input : [input], by = o.by || (texts.length > 1 ? 'piece' : 'stanza');
    const units = by === 'piece' ? texts.map(t => stanzasOf(t).flat()) : stanzasOf(texts.join('\n\n'));
    const F = units.filter(u => u.length).map(u => unitFeatures(u, syl)), n = F.length; if (!n) return { units: 0, invariants: [], variants: [] };
    const share = (fn) => F.filter(fn).length / n, U = by === 'piece' ? 'piece' : 'stanza', every = (x) => x >= 0.999 ? 'every ' + U : Math.round(x * 100) + ' % of the ' + U + 's';
    const vals = (k) => F.map(f => f[k]), avg = (k) => vals(k).reduce((a, b) => a + b, 0) / n;
    const cv = (k) => { const m = avg(k), v = vals(k); return m ? Math.sqrt(v.reduce((a, b) => a + (b - m) * (b - m), 0) / n) / m : 0; };
    const C = [
      { key: 'dialogue', holds: share(f => f.dialogue), what: 'I and you, both', keep: 'call and answer in every part: "I" on the beat, "you" off it' },
      { key: 'parallel', holds: share(f => f.parallel > 0), what: 'one frame said twice, the speaker swapped ("I loved … / You loved …")', keep: 'one motif played twice — the same rhythm, the answer in another register' },
      { key: 'opposites', holds: share(f => f.opposites > 0 || f.both), what: 'light and dark together', keep: 'the turn inside every part: dark lines low and bare, light lines high and full' },
      { key: 'speaker', holds: Math.max(...['I', 'you', 'we'].map(w => share(f => f.speaker === w))), value: ['I', 'you', 'we'].sort((a, b) => share(f => f.speaker === b) - share(f => f.speaker === a))[0], what: 'the same voice speaks first', keep: 'one lead voice through the song' },
      { key: 'meter', holds: share(f => f.steady < 0.35), value: +avg('perLine').toFixed(1), what: 'lines of a steady length (about ' + avg('perLine').toFixed(0) + ' syllables)', keep: 'one bar per line, one groove under all of it' },
      { key: 'shape', holds: cv('lines') < 0.2 ? 1 - cv('lines') : 0, value: Math.round(avg('lines')), what: 'the same number of lines (about ' + Math.round(avg('lines')) + ')', keep: 'every part the same length — the form is square' },
      { key: 'anaphora', holds: share(f => f.anaphora >= 0.5), what: 'lines that start the same way', keep: 'the same pickup into every line' },
      { key: 'resolve', holds: share(f => f.shortEnd), what: 'a shorter last line', keep: 'every part closes early: the last bar leaves space' },
      { key: 'rise', holds: share(f => f.turn > 0), what: 'it ends lighter than it starts', keep: 'every part climbs: dark low at the start, the light at the top at the end' },
      { key: 'fall', holds: share(f => f.turn < 0), what: 'it ends darker than it starts', keep: 'every part sinks: it starts open and ends low' },
      { key: 'questions', holds: share(f => f.questions > 0), what: 'a question', keep: 'a phrase left open (it rises, unresolved) in every part' },
    ].map(c => Object.assign(c, { holds: +c.holds.toFixed(2), where: every(c.holds) }));
    const invariantsL = n < 2 ? [] : C.filter(c => c.holds >= hold).sort((a, b) => b.holds - a.holds);   // one unit proves nothing stays the same
    const variants = [{ key: 'length', amount: +cv('perLine').toFixed(2), what: 'how long the lines are', change: 'the speed: more syllables a line, busier drums' },
      { key: 'lines', amount: +cv('lines').toFixed(2), what: 'how many lines', change: 'how long each part is' },
      { key: 'opposites', amount: +cv('opposites').toFixed(2), what: 'how many opposites', change: 'how hard the part turns' },
      { key: 'turn', amount: +(Math.sqrt(vals('turn').reduce((a, b) => a + b * b, 0) / n)).toFixed(2), what: 'which way it turns', change: 'up or down, part by part' }]
      .filter(v => v.amount >= 0.3 && !invariantsL.some(c => c.key === v.key)).sort((a, b) => b.amount - a.amount);
    return { by, units: n, invariants: invariantsL, all: C, variants, features: F };
  }
  const api = { read, patterns, invariants, clausesOf, whoAt, stanzasOf, plainSyllables, PAIRS, LIGHT, DARK, PUSH, version: '1.3.0' };
  root.MusicParts = root.MusicParts || {};
  root.MusicParts.LyricShape = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
