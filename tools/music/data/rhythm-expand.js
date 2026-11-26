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
 *   RhythmExpand.write(text, { genre:'darkwave', seed, flow:'spoken', per:4, shape:'verses'|'contrast', contrast:0…1, depth:0…1, dims:0…1 })  → the song on the canvas
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
      return Object.assign({ lines, notes: pl.notes, steps: pl.steps, bars: Math.max(2, 2 * Math.ceil(pl.steps / 32)) }, st ? { kind: st.kind, split: st.split, lineValence: st.lineValence, energy: st.energy, why: st.why } : {});
    });
  }

  function generate(text, o) {
    o = o || {};
    const S = SE(), L = LR(), H = S && S.helpers;
    if (!S || !H || !L) throw new Error('Song Engine and Lyrics → Rhythm must both be loaded');
    const G = S.genres().find(g => g.id === (o.genre || 'darkwave')); if (!G) throw new Error('unknown genre: ' + o.genre);
    const flow = L.FLOWS.includes(o.flow) ? o.flow : 'spoken', seed = (o.seed | 0) || 1;
    const secs = sections(text, { flow, seed, per: o.per, shape: o.shape, contrast: o.contrast }); if (!secs.length) throw new Error('no words to build a song from');
    const words = (lines) => lines[0].replace(/[^A-Za-z0-9'’ ]/g, '').trim().split(/\s+/).slice(0, 4).join(' ').toLowerCase();
    // 3.34.2: a genre whose parts are not called bass / chords / lead (the Bass Pack) names the parts that sing the words: G.wordsPlay = { verse: [...], frame: [...] }
    const WP = G.wordsPlay || {}, vplay = WP.verse || ['drums', 'bass', 'chords', 'lead'], fplay = WP.frame || ['chords', 'drums'];
    const role = (p) => G.parts[p] && G.parts[p].role, bplay = WP.break || vplay.filter(p => !['drums', 'bass'].includes(role(p)));   // a break: no drums, no bass — space
    const form = [{ name: 'intro', kind: 'intro', bars: 4, play: fplay }]
      .concat(secs.map((s, i) => { const k = s.kind || 'verse'; return { name: `${k} ${i + 1} · ${words(s.lines)}`, kind: k, bars: s.bars, play: k === 'break' ? bplay : vplay, words: s }; }))
      .concat([{ name: 'outro', kind: 'outro', bars: 4, play: fplay }]);
    const PAD = H.PAD, N = (s, l, n, v) => ({ s, l, n, v });
    // 3.229 DEPTH 0…1 (his words, 2026-11-25: "How does it sound? Like I want it deep as hell."): the whole song sits lower — the lead and
    // the chords down (up to two octaves / one), the bass held longer and harder in the loud parts, the kick heavier, a half-time boom on
    // beat 1 of every drop bar. 0 = as before.
    const D = Math.max(0, Math.min(1, +o.depth || 0)), down = Math.round(D * 2), cdown = D >= 0.34 ? 1 : 0;
    // 3.230 DIMENSIONS 0…1 (his words, 2026-11-26: "No like more dimentions."): deep as in MORE, not only lower — LAYERS (the lead doubled an
    // octave up in the loud parts, then a harmony a third above it), a COUNTER-LINE in the gaps the words leave (their shadow, high and soft),
    // and SPACE (the master's reverb wider and longer). 0 = as before.
    const DIM = Math.max(0, Math.min(1, +o.dims || 0)), LS = window.MusicParts && window.MusicParts.LyricShape;
    const X = {
      name: o.name || ('Words · ' + secs[0].lines[0].slice(0, 28)),
      form,
      bar(c) {
        const w = c.sec.words;
        if (!w) {                                                   // intro / outro: the genre's own bar (lower with depth)
          if (!D) return null;
          if (c.role === 'chords') return H.chordBar(c.sec.chordStyle || c.P.style, c.deg, c.key, c.P.voicing, (c.P.octave || 4) - cdown);
          if (c.role === 'lead') return H.leadBar(c.motif, c.b, c.deg, c.key, c.r, (c.P.octave || 5) - down);
          return null;
        }
        const lo = c.b * 16, here = w.notes.filter(n => n.s >= lo && n.s < lo + 16).map(n => Object.assign({}, n, { s: n.s - lo }));
        // 3.228 contrast: a split stanza turns with its lines — a dark line low and bare, a light line high and full
        const lv = w.split && here.length ? (w.lineValence[here[0].line] || 0) : 0, dark = lv < 0, light = lv > 0;
        if (c.role === 'drums') {
          const k = w.kind || 'verse', mode = dark ? 'none' : k === 'build' ? 'build' : (k === 'chorus' || k === 'drop' || light) ? 'main' : 'light', lift = k === 'drop' ? 0.85 : k === 'chorus' || light ? 0.75 : 0.5;
          const out = H.drumBar(G, c.r, mode, c.b, c.sec.bars, 0.5).map(x => Object.assign(x, { v: x.v * lift * (x.n === 36 + PAD.kick ? 1 + 0.25 * D : 1) }));
          if (D >= 0.5 && (k === 'drop' || k === 'chorus') && !dark) out.push(N(0, 2, 36 + PAD.kick, 1));   // the boom on 1   // the groove: quiet under a verse, full in a chorus / drop, none under a dark line
          here.forEach(n => {
            if (n.stress) { out.push(N(n.s, 1, 36 + (Math.floor(n.s / 4) % 2 ? PAD.snare : PAD.kick), n.stress === 2 ? 1 : 0.9)); if (n.stress === 2) out.push(N(n.s, 1, 36 + PAD.clap, 0.85)); }
            else if (!dark) out.push(N(n.s, 0.5, 36 + (n.last ? PAD.perc : PAD.hat), n.last ? 0.6 : 0.45));
          });
          return out;
        }
        if (c.role === 'bass') {
          const strong = here.filter(n => n.stress);
          if (dark) return [N(0, 16, MT().degreeToMidi(c.deg, 1, c.key.root, c.key.scale), 0.8)];   // a dark line: one long low root
          if (!strong.length) return H.bassBar(c.sec.bassStyle || c.P.style, c.deg, c.key, c.r, c.b);
          const loud = D > 0 && ['drop', 'chorus', 'build'].includes(w.kind), hold = loud ? 6 + Math.round(10 * D) : 6;   // depth: the loud parts hold the low end
          return strong.map((n, i) => N(n.s, Math.max(1, Math.min(hold, (strong[i + 1] ? strong[i + 1].s : 16) - n.s)), MT().degreeToMidi(c.deg + (n.last ? 4 : 0), 1, c.key.root, c.key.scale), Math.min(1, (n.stress === 2 ? 1 : 0.9) * (1 + 0.15 * D))));
        }
        if (c.role === 'lead') {
          const oct = (c.P.octave || 5) - down + (dark ? -1 : light ? 1 : 0);   // a dark line sung an octave down, a light one an octave up (depth: all lower)
          const sung = here.filter(n => n.stress || n.last), mid = (dg, o2) => MT().degreeToMidi(dg, o2, c.key.root, c.key.scale), loud = ['drop', 'chorus'].includes(w.kind);
          const out = sung.map(n => N(n.s, Math.max(1, Math.min(4, n.l)), mid(c.deg + (n.off || 0), oct), n.stress === 2 ? 1 : 0.85));
          if (DIM >= 0.3 && loud) sung.forEach(n => out.push(N(n.s, Math.max(1, Math.min(4, n.l)), mid(c.deg + (n.off || 0), oct + 1), 0.45)));   // layer: an octave up, softer
          if (DIM >= 0.6 && loud) sung.forEach(n => out.push(N(n.s, Math.max(1, Math.min(4, n.l)), mid(c.deg + (n.off || 0) + 2, oct), 0.5)));   // layer: a third above
          if (DIM >= 0.5 && !loud && LS) { const pt = LS.patterns(here.map(n => ({ s: n.s, l: n.l, stress: n.stress })), { bars: 1 });   // the counter-line: in the words' gaps
            if (pt) pt.shadow.forEach((g, k) => out.push(N(g.s, 1.5, mid(c.deg + [4, 2, 5, 3][k % 4], oct + 1), 0.35 + 0.15 * g.stress))); }
          return out;
        }
        if (c.role === 'chords' && D) return H.chordBar(c.sec.chordStyle || c.P.style, c.deg, c.key, c.P.voicing, (c.P.octave || 4) - cdown);
        return null;                                               // chords: the genre's own
      },
    };
    const steps = S.generate(G.id, seed, X);
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
