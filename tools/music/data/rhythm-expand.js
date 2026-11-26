/* ERAVOS RhythmExpand (3.34.1) — the rhythm of your words grows into music.
 * Words → Lyrics → Rhythm places every syllable on the beat (analyse + place). This turns that rhythm into a whole song:
 *   · the words are cut into sections (a blank line = a new section; one block of lines is cut every `per` lines),
 *     each section is as many bars as its words need (rounded up to an even number)
 *   · DRUMS play the words: a strong syllable is a kick (beats 1, 3) or a snare (beats 2, 4), an accent adds a clap, a weak
 *     syllable is a hat, a weak line end is a perc — over a quiet bar of the genre's own groove so the time never drops out
 *   · BASS lands on the strong syllables (the chord's root; a line end goes up to the fifth); bars with no words get the
 *     genre's own bass pattern
 *   · LEAD sings the words' contour: strong syllables climb, a question rises at the line end, a statement comes home
 *   · CHORDS, instruments, presets, effects and the master are the genre's own (Song Engine) — an intro and an outro frame it
 * Same words + genre + seed + flow → the same song. It is a Song Engine song with the words' rhythm in it: the engine's
 * output is untouched (RhythmExpand uses its optional generate(…, X) hook and helpers).
 *   RhythmExpand.write(text, { genre:'darkwave', seed, flow:'spoken', per:4, shape:'verses'|'contrast', contrast:0…1, depth:0…1, dims:0…1, tension:0…1, expr:0…1, piano:bool })  → the song on the canvas
 *   RhythmExpand.shape(text, { contrast })  → the words' shape (lyric-shape): each stanza's part and why — 3.228
 *   RhythmExpand.generate(text, opts)                                            → the recipe steps (no canvas) */
(function () {
  'use strict';
  const R = window.Recipes; if (!R) return;
  const ID = 'eravos.recipe.rhythm-expand'; let pending = null;
  const MT = () => window.MusicTheory, SE = () => window.SongEngine, LR = () => window.LyricRhythm;

  // words → sections: [{ lines, notes (placed syllables, with .off = lead scale offset), steps, bars }]
  // 3.228 shape 'contrast' (his words, 2026-11-25: "i want to make music with contrast. thats my rhytm"): the stanzas are read by the
  // lyric-shape component (MusicParts.LyricShape) — each becomes the part its words already are (verse · chorus · build · drop · break), and
  // a stanza that holds opposites turns line by line. shape 'verses' (the default here) is the song as before: every stanza a verse.
  const LS = () => window.MusicParts && window.MusicParts.LyricShape;
  function shapeOf(text, o) {
    const L = LR(), S = LS(); if (!S) throw new Error('the lyric-shape component is not loaded');
    return S.read(text, { contrast: o.contrast === undefined ? 1 : o.contrast, syllables: (line) => L.analyse(line) });
  }
  function sections(text, o) {
    const L = LR(); if (!L) throw new Error('Lyrics → Rhythm is not loaded');
    let groups = String(text || '').replace(/\r/g, '').split(/\n\s*\n/).map(g => g.split('\n').map(l => l.trim()).filter(Boolean)).filter(g => g.length);
    let shape = null;
    if (o.shape === 'contrast' && groups.length) { shape = shapeOf(text, o); groups = shape.stanzas.map(st => st.lines); }
    else if (groups.length < 2) {
      const lines = groups[0] || [], per = Math.max(1, (o.per | 0) || 4); groups = [];
      for (let i = 0; i < lines.length; i += per) groups.push(lines.slice(i, i + per));
    }
    return groups.map((lines, i) => {
      const pl = L.place(L.analyse(lines.join('\n')), o.flow, o.seed + i), seen = {};
      pl.notes.forEach(n => {   // the melody: strong syllables climb along the line; the line end rises on a question, comes home on a statement
        if (n.last) n.off = n.question ? 4 : 0;
        else if (n.stress) { seen[n.line] = seen[n.line] || 0; n.off = [0, 2, 4, 7, 4, 2][seen[n.line]++ % 6]; }
      });
      const st = shape ? shape.stanzas[i] : null;
      // 3.232 TENSION (his words, 2026-11-26: "Can you add contrasting rhythm or a bunch with tension?"): in a stanza where I and you answer
      // each other, the "you" is pushed off the beat (a 16th at 0.33, a dotted 16th at 0.66, half a beat at 1); the last line is not pushed —
      // it lands, and the first strong syllable of it is the arrival. 0 = as before.
      const T = Math.max(0, Math.min(1, +o.tension || 0)), S2 = window.MusicParts && window.MusicParts.LyricShape;
      if (st && st.dialogue && T > 0 && S2) { const last = Math.max(...pl.notes.map(n => n.line)), push = T < 0.5 ? 1 : T < 0.85 ? 1.5 : 2;
        pl.notes.forEach(n => { if (n.line === last) { n.home = true; return; } if (S2.whoAt(st.clauses[n.line], n.wi) === 'you') { n.s += push; n.tense = true; } });
        const arr = pl.notes.find(n => n.home && n.stress); if (arr) arr.arrival = true;
        pl.steps = Math.max(pl.steps, Math.ceil(Math.max(...pl.notes.map(n => n.s + n.l)) / 16) * 16); }
      return Object.assign({ lines, notes: pl.notes, steps: pl.steps, tension: !!(st && st.dialogue && +o.tension > 0), bars: Math.max(2, 2 * Math.ceil(pl.steps / 32)) }, st ? { kind: st.kind, split: st.split, lineValence: st.lineValence, energy: st.energy, why: st.why } : {});
    });
  }

  function generate(text, o) {
    o = o || {};
    const S = SE(), L = LR(), H = S && S.helpers;
    if (!S || !H || !L) throw new Error('Song Engine and Lyrics → Rhythm must both be loaded');
    const G0 = S.genres().find(g => g.id === (o.genre || 'darkwave')); if (!G0) throw new Error('unknown genre: ' + o.genre);
    // 3.233 THE PIANO (his words, 2026-11-26: "make some sound beautiful. The piano doesn't get enough love."): o.piano adds a Piano part to
    // any genre — the words' rhythm on its keys: rolled chords, chord tones climbing through a line in the breaks, soft dyads under the verses,
    // low octaves on the arrivals; it opens the song alone and closes it with one rolled chord. Its preset follows the genre's mood.
    const PIANO_PRESET = { synthwave: 'Tine Phaser', darkwave: 'Felt Lullaby', 'witch-house': 'Felt Lullaby', house: 'Pop Bright', techno: 'Tine Classic', 'future-bass': 'Pop Bright',
      melodic: 'Concert Grand', dubstep: 'Felt Lullaby', riddim: 'Reed Bark', dnb: 'Tine Classic', neuro: 'Reed Bark', trap: 'Felt Lullaby', lofi: 'Upright Jazz', reggae: 'Dub Honky Skank' };
    const G = o.piano && !G0.parts.piano ? Object.assign({}, G0, { parts: Object.assign({}, G0.parts, { piano: { role: 'keys', organism: 'eravos.piano', preset: PIANO_PRESET[G0.id] || 'Concert Grand', octave: 4, name: 'Piano' } }) }) : G0;
    const flow = L.FLOWS.includes(o.flow) ? o.flow : 'spoken', seed = (o.seed | 0) || 1;
    const secs = sections(text, { flow, seed, per: o.per, shape: o.shape, contrast: o.contrast, tension: o.tension }); if (!secs.length) throw new Error('no words to build a song from');
    const words = (lines) => lines[0].replace(/[^A-Za-z0-9'’ ]/g, '').trim().split(/\s+/).slice(0, 4).join(' ').toLowerCase();
    // 3.34.2: a genre whose parts are not called bass / chords / lead (the Bass Pack) names the parts that sing the words: G.wordsPlay = { verse: [...], frame: [...] }
    const WP = G.wordsPlay || {}, vplay = WP.verse || ['drums', 'bass', 'chords', 'lead'], fplay = WP.frame || ['chords', 'drums'];
    const role = (p) => G.parts[p] && G.parts[p].role, KEYS = G !== G0 ? ['piano'] : [];
    const vplay2 = vplay.concat(KEYS), bplay = (WP.break || vplay.filter(p => !['drums', 'bass'].includes(role(p)))).concat(KEYS), fplay2 = fplay.concat(KEYS);   // a break: no drums, no bass — space
    const form = [{ name: 'intro', kind: 'intro', bars: 4, play: KEYS.length ? ['piano'] : fplay }]   // the piano opens the song alone
      .concat(secs.map((s, i) => { const k = s.kind || 'verse'; return { name: `${k} ${i + 1} · ${words(s.lines)}`, kind: k, bars: s.bars, play: k === 'break' ? bplay : vplay2, words: s }; }))
      .concat([{ name: 'outro', kind: 'outro', bars: 4, play: fplay2 }]);
    const PAD = H.PAD, N = (s, l, n, v) => ({ s, l, n, v });
    // 3.229 DEPTH 0…1 (his words, 2026-11-25: "How does it sound? Like I want it deep as hell."): the whole song sits lower — the lead and
    // the chords down (up to two octaves / one), the bass held longer and harder in the loud parts, the kick heavier, a half-time boom on
    // beat 1 of every drop bar. 0 = as before.
    const D = Math.max(0, Math.min(1, +o.depth || 0)), down = Math.round(D * 2), cdown = D >= 0.34 ? 1 : 0;
    // 3.230 DIMENSIONS 0…1 (his words, 2026-11-26: "No like more dimentions."): deep as in MORE, not only lower — LAYERS (the lead doubled an
    // octave up in the loud parts, then a harmony a third above it), a COUNTER-LINE in the gaps the words leave (their shadow, high and soft),
    // and SPACE (the master's reverb wider and longer). 0 = as before.
    const DIM = Math.max(0, Math.min(1, +o.dims || 0)), LS = window.MusicParts && window.MusicParts.LyricShape;
    // 3.233 EXPRESSION 0…1 (his words, 2026-11-26: "Make sure you use the per note editing, curves … Like multidimentional. Really push Eravos."):
    // every note shaped by the word it carries — its own knob curves (the Song Engine's moves), its bend, its chord, its chance, its ratchet,
    // its humanize: an accent opens and scoops in, a question rises at its end, a statement falls, a light line swells, a dark line plucks
    // closed, the answer talks, the arrival dives; weak syllables are ghosts. 0 = as before (the engine's own random moves stay where it gave them).
    const EX = Math.max(0, Math.min(1, +o.expr || 0)), KN = {}, knobs = (P) => { const pr = Array.isArray(P.preset) ? P.preset[0] : P.preset, k = P.organism + '|' + pr; if (!KN[k]) KN[k] = H.knobsFor ? H.knobsFor(P.organism, pr) : {}; return KN[k]; };
    const shape = (n, P, mv, span) => { if (EX > 0 && H.moveCurves) { const c = H.moveCurves(mv, knobs(P), (span || 0.6) * EX); if (c) n.c = c; } return n; };
    const human = (n, amt) => { if (EX > 0) n.x = Object.assign(n.x || {}, { ht: Math.round(8 * EX * (amt || 1)), hv: +(0.08 * EX * (amt || 1)).toFixed(2) }); return n; };
    const ivOf = (deg, steps, key) => steps.map(d => MT().degreeToMidi(deg + d, 4, key.root, key.scale) - MT().degreeToMidi(deg, 4, key.root, key.scale)).filter(x => x > 0);
    const X = {
      name: o.name || ('Words · ' + secs[0].lines[0].slice(0, 28)),
      form,
      bar(c) {
        const w = c.sec.words;
        if (!w) {                                                   // intro / outro: the genre's own bar (lower with depth)
          if (c.role === 'keys') {   // the piano alone at the start: a slow climb through the chord; at the end one rolled chord, held
            if (c.kind === 'outro') return c.b === 0 ? [Object.assign(N(0, 32, MT().degreeToMidi(c.deg, (c.P.octave || 4) - 1, c.key.root, c.key.scale), 0.6), { x: { iv: ivOf(c.deg, [4, 7, 9, 11], c.key), strum: 90, dir: 'up' } })] : [];
            return [0, 2, 4, 7, 9, 7, 4, 2].map((d, i) => human(N(i * 2, 6, MT().degreeToMidi(c.deg + d, c.P.octave || 4, c.key.root, c.key.scale), 0.32 + 0.06 * (i % 3)), 1.2));
          }
          if (!D) return null;
          if (c.role === 'chords') return H.chordBar(c.sec.chordStyle || c.P.style, c.deg, c.key, c.P.voicing, (c.P.octave || 4) - cdown);
          if (c.role === 'lead') return H.leadBar(c.motif, c.b, c.deg, c.key, c.r, (c.P.octave || 5) - down);
          return null;
        }
        const lo = c.b * 16, here = w.notes.filter(n => n.s >= lo && n.s < lo + 16).map(n => Object.assign({}, n, { s: n.s - lo }));
        // 3.228 contrast: a split stanza turns with its lines — a dark line low and bare, a light line high and full
        const lv = w.split && here.length ? (w.lineValence[here[0].line] || 0) : 0, dark = lv < 0, light = lv > 0;
        const TN = Math.max(0, Math.min(1, +o.tension || 0)), tense = w.tension && here.some(n => n.tense);   // 3.232 the answer off the beat
        if (c.role === 'drums') {
          const k = w.kind || 'verse', mode = dark ? 'none' : (tense && TN >= 0.7) ? 'light' : k === 'build' ? 'build' : (k === 'chorus' || k === 'drop' || light) ? 'main' : 'light', lift = k === 'drop' ? 0.85 : k === 'chorus' || light ? 0.75 : 0.5;
          const out = H.drumBar(G, c.r, mode, c.b, c.sec.bars, 0.5).map(x => Object.assign(x, { v: x.v * lift * (x.n === 36 + PAD.kick ? 1 + 0.25 * D : 1) }));
          if (D >= 0.5 && (k === 'drop' || k === 'chorus') && !dark) out.push(N(0, 2, 36 + PAD.kick, 1));   // the boom on 1
          if (tense && TN >= 0.5) [0, 16 / 3, 32 / 3].forEach(x => out.push(N(+x.toFixed(3), 0.5, 36 + PAD.hat, 0.5)));   // three against four under the answer
          here.filter(n => n.arrival).forEach(n => { out.push(N(n.s, 4, 36 + PAD.crash, 0.9)); out.push(N(n.s, 1, 36 + PAD.kick, 1)); });   // the arrival   // the groove: quiet under a verse, full in a chorus / drop, none under a dark line
          here.forEach(n => {
            if (n.stress) { out.push(N(n.s, 1, 36 + (Math.floor(n.s / 4) % 2 ? PAD.snare : PAD.kick), n.stress === 2 ? 1 : 0.9)); if (n.stress === 2) out.push(N(n.s, 1, 36 + PAD.clap, 0.85)); }
            else if (!dark) out.push(Object.assign(N(n.s, 0.5, 36 + (n.last ? PAD.perc : PAD.hat), n.last ? 0.6 : 0.45), EX > 0 && !n.last ? { pr: +(1 - 0.3 * EX).toFixed(2), x: { hv: +(0.1 * EX).toFixed(2), ht: Math.round(6 * EX) } } : {}));
            if (EX > 0 && n.stress === 2) out.push(Object.assign(N(n.s, 1, 36 + PAD.clap, 0.7), { rt: 3, x: { rs: 'accel', rv: 'grow' } }));   // the accent: a clap that rolls in
          });
          return out;
        }
        if (c.role === 'bass') {
          const strong = here.filter(n => n.stress);
          if (dark) return [N(0, 16, MT().degreeToMidi(c.deg, 1, c.key.root, c.key.scale), 0.8)];   // a dark line: one long low root
          if (!strong.length) return H.bassBar(c.sec.bassStyle || c.P.style, c.deg, c.key, c.r, c.b);
          const loud = D > 0 && ['drop', 'chorus', 'build'].includes(w.kind), hold = loud ? 6 + Math.round(10 * D) : 6;   // depth: the loud parts hold the low end
          if (EX > 0) return strong.map((n, i) => { const x = N(n.s, Math.max(1, Math.min(hold, (strong[i + 1] ? strong[i + 1].s : 16) - n.s)), MT().degreeToMidi(c.deg + (n.tense ? 3 : n.last ? 4 : 0), 1, c.key.root, c.key.scale), Math.min(1, (n.stress === 2 ? 1 : 0.9) * (1 + 0.15 * D)));
            if (n.arrival) { x.b = { from: 0, to: -12, shape: 'late', at: 0.45 }; return shape(x, c.P, 'dive'); }
            if (n.tense) return shape(x, c.P, 'talk'); if (['drop', 'chorus'].includes(w.kind)) return shape(x, c.P, n.stress === 2 ? 'growl' : 'open'); return shape(x, c.P, 'pluck', 0.4); });
          return strong.map((n, i) => N(n.s, Math.max(1, Math.min(hold, (strong[i + 1] ? strong[i + 1].s : 16) - n.s)), MT().degreeToMidi(c.deg + (n.tense ? 3 : n.last ? 4 : 0), 1, c.key.root, c.key.scale), Math.min(1, (n.stress === 2 ? 1 : 0.9) * (1 + 0.15 * D))));
        }
        if (c.role === 'lead') {
          const oct = (c.P.octave || 5) - down + (dark ? -1 : light ? 1 : 0);   // a dark line sung an octave down, a light one an octave up (depth: all lower)
          const sung = here.filter(n => n.stress || n.last), mid = (dg, o2) => MT().degreeToMidi(dg, o2, c.key.root, c.key.scale), loud = ['drop', 'chorus'].includes(w.kind);
          const out = sung.map(n => N(n.s, Math.max(1, Math.min(4, n.l)), mid(c.deg + (n.off || 0) + (n.tense ? 1 : 0), oct), n.stress === 2 ? 1 : 0.85));   // the answer a step off, unresolved
          if (EX > 0) out.forEach((x, k) => { const n = sung[k];
            if (n.last) x.b = n.question ? { from: 0, to: 2, shape: 'late', at: 0.5 } : { from: 0, to: -1, shape: 'late', at: 0.6 };
            else if (n.stress === 2) x.b = { from: -2, to: 0, shape: 'early', at: 0 };
            shape(x, c.P, n.stress === 2 ? 'open' : dark ? 'pluck' : light ? 'swell' : n.tense ? 'talk' : 'pluck', n.stress === 2 ? 0.8 : 0.5); if (!n.stress) human(x); });
          if (DIM >= 0.3 && loud) sung.forEach(n => out.push(N(n.s, Math.max(1, Math.min(4, n.l)), mid(c.deg + (n.off || 0), oct + 1), 0.45)));   // layer: an octave up, softer
          if (DIM >= 0.6 && loud) sung.forEach(n => out.push(N(n.s, Math.max(1, Math.min(4, n.l)), mid(c.deg + (n.off || 0) + 2, oct), 0.5)));   // layer: a third above
          if (DIM >= 0.5 && !loud && LS) { const pt = LS.patterns(here.map(n => ({ s: n.s, l: n.l, stress: n.stress })), { bars: 1 });   // the counter-line: in the words' gaps
            if (pt) pt.shadow.forEach((g, k) => out.push(N(g.s, 1.5, mid(c.deg + [4, 2, 5, 3][k % 4], oct + 1), 0.35 + 0.15 * g.stress))); }
          return out;
        }
        if (c.role === 'keys') {   // the piano under the words
          const o4 = (c.P.octave || 4) + (light ? 1 : 0) - (dark ? 1 : 0), m = (d, oo) => MT().degreeToMidi(c.deg + d, oo === undefined ? o4 : oo, c.key.root, c.key.scale), k = w.kind || 'verse';
          if (k === 'break') { const T2 = [0, 2, 4, 7, 9, 11, 14]; return here.map((n, i) => { const x = human(N(n.s, Math.max(3, n.l * 2), m(T2[(n.si + n.wi) % T2.length]), n.stress === 2 ? 0.62 : n.stress ? 0.5 : 0.36));   // climbing through the chord
            if (n.last) { x.l = 8; x.x = Object.assign(x.x || {}, { iv: ivOf(c.deg, [2, 4, 7], c.key), strum: 70, dir: 'up' }); } return x; }); }
          if (k === 'drop') return here.filter(n => n.arrival || n.stress === 2).map(n => Object.assign(N(n.s, 4, m(0, o4 - 1), 0.8), { x: { iv: [12] } }));   // low octaves on the hits
          return here.filter(n => n.stress).map(n => human(Object.assign(N(n.s, Math.max(2, n.l * 2), m(n.last ? 0 : 2), k === 'chorus' ? 0.5 : 0.4), { x: { iv: ivOf(c.deg + (n.last ? 0 : 2), [2], c.key), strum: 25 } }), 0.8));   // soft dyads under the verse
        }
        if (c.role === 'chords' && D) { const ch = H.chordBar(c.sec.chordStyle || c.P.style, c.deg, c.key, c.P.voicing, (c.P.octave || 4) - cdown);
          if (EX > 0 && ch) { const mv = w.dialogue || w.tension ? 'swell' : w.kind === 'break' ? 'open' : null; if (mv) { const cv = H.moveCurves && H.moveCurves(mv, knobs(c.P), 0.5 * EX); if (cv) ch.forEach(n => { n.c = JSON.parse(JSON.stringify(cv)); }); } }
          return ch; }
        return null;                                               // chords: the genre's own
      },
    };
    const steps = G === G0 ? S.generate(G.id, seed, X) : S.generateWith(G, seed, X);
    if (DIM > 0) steps.forEach(st => { if (st.op === 'configure' && st.target === 'master' && st.params) st.params = Object.assign({}, st.params, {   // space: wider, longer
      reverbMix: Math.min(0.6, (+st.params.reverbMix || 0.2) + 0.2 * DIM), size: Math.min(6, (+st.params.size || 2.2) * (1 + 0.6 * DIM)) }); });
    // onto a canvas that already has a Session / Timeline (the button path): add to those, don't mount a second pair
    if (o.reuse) steps.forEach(s => { if (s.op === 'mount' && (s.organism === 'eravos.session' || s.organism === 'eravos.timeline')) s.reuse = true; });
    return steps;
  }

  // same registration pattern as a Song Engine genre: a hidden recipe; write() runs it with the words
  R.register({ id: ID, label: 'Words → Song', icon: '♫', accent: '#ff7eb6', genome: 'eravos.genome.music', section: 'SONG FROM WORDS', tagline: '', hidden: true,
    get steps() { return pending ? generate(pending.text, pending.o) : []; } });
  window.RhythmExpand = {
    sections, generate, shape: (text, o) => shapeOf(text, o || {}),
    write(text, o) { pending = { text, o: o || {} }; return R.run(ID, Object.assign({ clear: true, origin: { x: 30, y: 20 } }, (o && o.run) || {})); },
  };
})();
