/* ERAVOS "Floor Falls" songbook (3.70) — data only. James, 2026-10-24: "more floor falls out and raven drop. curves and deep bass
 * drops," (said of Floor Falls Out: "like the part after 24. bass drops, curves").
 * What happens after bar 24 in Floor Falls Out (Heavy Drops #5901), read from what the Song Engine writes, and what these songs keep:
 *   bar 25  the PAUSE: one bar, the sub alone, diving two octaves late in the bar — the floor falls out (her voice fits here)
 *   bar 26  the DROP, half-time: the sub holds the root and dives an octave at the end of every 4-bar phrase; the Wobble changes its rate
 *           on every note (1/8 · 1/16 · 1/8t · 1/4t), slides in from a 4th or 5th above, and on the phrase's last bar holds one note that
 *           bends down while its wobble SPEEDS UP (1/8 → 1/32); a screech answers with glides; the Wobble's depth swings on a curve.
 * What these songs add:
 *   DEEP THAT IS HEARD — the sub plays its real note (Octave 0: C#1 = 35 Hz) instead of two octaves under it, and no dive goes below
 *           ~18 Hz (measured on his #5901 session, 2026-10-24: a third of the sub's energy was under 20 Hz — felt by nobody, costing
 *           headroom). Sub Engine's own 24 Hz floor turns the end of every dive into the fall-away.
 *   RAVEN DROP — the second drop is hers: the Reese "Her Drop" (the bass of "Make a song for her") talks over the sub, its filter
 *           opening every phrase (a curve), a slow pitch ripple on it (a curve that oscillates: "Ripples", after his song).
 *   A MOVE PER SONG — what the floor does in the pause: falls (one dive) · stairs (four steps down) · freefall (every bass and the pad
 *           bend down together on Pitch curves) · rises (the sub climbs back up out of the floor into the hit).
 *   HIS PAD — the dark Supersaw pad from his own fix of #5901 (cutoff 2400, slow attack, level 0.35), not the bright Pad Forge.
 * Original parts in the style — nothing here copies a record. */
(function () {
  'use strict';
  const SE = window.SongEngine; if (!SE) return;
  const MT = () => window.MusicTheory;
  const S = (name, kind, bars, play, o) => Object.assign({ name, kind, bars, play }, o || {});
  const FLOOR = 14;   // the lowest pitch a dive reaches (MIDI 14 ≈ 18 Hz); the Sub Engine's 24 Hz floor fades what is under it
  const dive = (note, by) => Math.max(-24, Math.min(0, Math.max(by, FLOOR - note)));
  const MOVES = ['falls', 'stairs', 'freefall', 'rises'];
  // the song's move comes from its seed, so its notes and its curves agree (bar() and curves() both read it): 7001 falls · 7002 stairs …
  const moveOf = (seed) => MOVES[((Math.round(+seed) || 1) - 1) % MOVES.length];
  const DROP = { kick: 'X.........x.....', snare: '........X.......', clap: '........X.......', hat: 'x.x.x.x.x.x.x.x.', ohat: '......x.......x.' };
  const DROP2 = { kick: 'X.....x...x.....', snare: '........X.......', clap: '........X.......', hat: 'xxx.x.xxx.x.x.xx', perc: '...o......o..o..' };
  const LIGHT = { kick: 'X.......X.......', hat: '..x...x...x...x.' };
  const FORM = [
    S('intro', 'intro', 8, ['pad', 'drums'], { drums: 'light' }),
    S('verse', 'verse', 8, ['drums', 'sub', 'pad'], { drums: 'light' }),
    S('build', 'build', 8, ['drums', 'pad', 'lead']),
    S('pause', 'pause', 1, ['sub']),
    S('drop', 'drop', 16, ['drums', 'sub', 'growl', 'screech']),
    S('break', 'break', 8, ['pad', 'lead'], { drums: 'none' }),
    S('build 2', 'build', 8, ['drums', 'pad', 'lead']),
    S('pause 2', 'pause', 1, ['sub']),
    S('drop 2', 'drop', 16, ['drums', 'sub', 'reese', 'screech'], { drums: 'main2' }),
    S('outro', 'outro', 8, ['pad', 'drums'], { drums: 'light' }),
  ];
  function bar(cx) {
    const { partKey: p, kind, b, deg, key, sec, r, seed } = cx, at = (d, o) => MT().degreeToMidi(d, o, key.root, key.scale), n = [], N = (s, l, m, v, extra) => n.push(Object.assign({ s, l, n: m, v: v || 0.95 }, extra || {}));
    const phraseEnd = b % 4 === 3, lastBar = b === sec.bars - 1, mv = moveOf(seed);
    if (p === 'sub') {
      const root = at(deg, 1);
      if (kind === 'pause') {
        if (mv === 'stairs') { [0, -3, -7, -12].forEach((st, i) => N(i * 4, 4, root + st, 1 - i * 0.05, { b: { from: 0, to: dive(root + st, i === 3 ? -12 : -3), shape: 'late', at: 0.4 } })); return n; }
        if (mv === 'rises') { N(0, 15, root, 1, { b: { from: dive(root, -24), to: 0, shape: 'late', at: 0 } }); return n; }   // climbs back out of the floor
        N(0, 16, root, 1, { b: { from: 0, to: dive(root, -24), shape: 'late', at: 0.1 } }); return n;   // falls / freefall: the floor falls out
      }
      if (kind === 'drop') {
        if (lastBar) { N(0, 16, root, 1, { b: { from: 0, to: dive(root, -24), shape: 'late', at: 0.35 } }); return n; }
        N(0, phraseEnd ? 16 : 10, root, 1, phraseEnd ? { b: { from: 0, to: dive(root, -12), shape: 'late', at: 0.5 } } : null); if (!phraseEnd) N(12, 4, root, 0.85); return n;
      }
      return null;
    }
    if (p === 'growl' && kind === 'drop') {   // Floor Falls Out's drop: a wobble rate per note, slides from above, a speed-up into each turn
      const lo = at(deg, 2), hi = at(deg + 4, 2), oct = at(deg, 3), v = b % 4;
      if (v === 0) { N(0, 4, lo, 1, { p: { div: '1/8' } }); N(4, 2, lo, 0.9, { p: { div: '1/16' } }); N(8, 6, hi, 0.95, { p: { div: '1/8t' }, b: { from: 5, to: 0, shape: 'early' } }); }
      else if (v === 1) { N(0, 3, lo, 1, { p: { div: '1/16' } }); N(3, 3, oct, 0.9, { p: { div: '1/16' }, b: { from: 0, to: -12, shape: 'linear' } }); N(8, 8, lo, 0.95, { p: { div: '1/4t' } }); }
      else if (v === 2) { N(0, 6, lo, 1, { p: { div: '1/8t' } }); N(6, 2, hi, 0.85, { p: { div: '1/16' } }); N(8, 4, oct, 0.95, { p: { div: '1/16' }, b: { from: 7, to: 0, shape: 'early' } }); N(12, 4, lo, 0.9, { p: { div: '1/8' } }); }
      else N(0, 16, lo, 1, { p: { div: '1/8' }, b: { from: 0, to: lastBar ? -12 : -5, shape: 'late', at: 0.4, osc: { rate: '1/8', rateTo: '1/32', depth: 0.4, shape: 'sine' } } });
      return n;
    }
    if (p === 'reese' && kind === 'drop') {   // Raven Drop's bass talks: long notes that slide in, a fifth that answers, a slow talk, a dive at the turn
      const lo = at(deg, 3), v = b % 4;
      if (v === 0) { N(0, 6, lo, 1, { b: { from: -2, to: 0, shape: 'early' } }); N(6, 2, lo + 7, 0.85); N(8, 8, lo, 0.95, { b: { from: 0, to: 0, osc: { rate: '1/8', depth: 0.5, shape: 'sine', fade: 0.3 } } }); }
      else if (v === 1) { N(0, 3, lo, 1); N(3, 3, lo + 3, 0.9, { b: { from: 2, to: 0, shape: 'early' } }); N(8, 8, lo + 5, 0.95, { b: { from: 0, to: -5, shape: 'late', at: 0.5 } }); }
      else if (v === 2) { N(0, 4, lo, 1); N(4, 4, lo + 12, 0.9, { b: { from: 0, to: -12, shape: 'linear' } }); N(8, 8, lo, 0.95, { b: { from: 0, to: 0, osc: { rate: '1/16', rateTo: '1/4', depth: 0.6, shape: 'triangle' } } }); }
      else N(0, 16, lo, 1, { b: { from: 0, to: lastBar ? -12 : -7, shape: 'late', at: 0.45, osc: { rate: '1/8', rateTo: '1/32', depth: 0.35, shape: 'sine' } } });
      return n;
    }
    if (p === 'screech' && kind === 'drop') {
      const h = at(deg + 2, 4);
      if (b % 2 === 1) { N(4, 2, h, 0.85, { b: { from: -5, to: 0, shape: 'early' } }); N(12, 3, h + 12, 0.9, { b: { from: 0, to: -12, shape: 'late', at: 0.3 } }); }
      else if (r() < 0.5) N(14, 2, h, 0.7, { b: { from: 12, to: 0, shape: 'early' } });
      return n;
    }
    if (p === 'lead' && kind === 'build') {   // the climb: one long note a bar, the last one rises an octave and shivers
      const m = at(deg + [0, 0, 2, 2, 4, 4, 5, 7][b % 8], 4);
      N(0, 16, m, 0.6 + 0.4 * b / Math.max(1, sec.bars - 1), lastBar ? { b: { from: 0, to: 12, shape: 'early', osc: { rate: '1/16', rateTo: '1/32', depth: 0.3, shape: 'sine', fade: 0.3 } } } : null);
      return n;
    }
    return null;
  }
  // the curves: the pad rises (or falls) into every pause, the Wobble's depth swings, the Reese opens every phrase and ripples;
  // freefall: every bass and the pad bend down together through the pause
  function curves(secs, r, o) {
    const out = [], mv = moveOf(o.seed), add = (part, key, name, pts, osc) => out.push(Object.assign({ part, key, name, points: pts }, osc ? { osc } : {}));
    secs.forEach((s) => {
      const e = s.bar + s.bars;
      if (s.kind === 'build') add('pad', '@pitch', 'Pad riser', [[s.bar, 0], [e - 0.05, mv === 'rises' ? 12 : 7], [e, 0]]);
      if (s.kind === 'pause' && mv === 'freefall') { const fall = [[s.bar, 0], [e - 0.02, -12], [e, 0]]; add('growl', '@pitch', 'Freefall', fall); add('reese', '@pitch', 'Freefall', fall); add('pad', '@pitch', 'Pad riser', [[s.bar, 0], [e - 0.02, -12], [e, 0]]); }
      if (s.name === 'drop') add('growl', 'depth', 'Wobble depth', [[s.bar, 3], [e - 0.05, 6], [e, 3]], { rate: '1/2', depth: 1.2, shape: 'triangle' });
      if (s.name === 'drop 2') {
        const pts = []; for (let b = s.bar; b < e; b += 4) pts.push([b, 380], [b + 3.9, 1500]); pts.push([e, 380]);
        add('reese', 'cutoff', 'Reese opens', pts);
        add('reese', '@pitch', 'Ripples', [[s.bar, 0], [e - 0.05, 0]], { rate: '1/2', depth: 0.3, shape: 'sine' });
      }
    });
    const m = new Map(); out.forEach(c => { const k = c.part + '|' + c.key; if (!m.has(k)) m.set(k, Object.assign({}, c, { points: [] })); const t = m.get(k); t.points.push(...c.points); if (c.osc) t.osc = c.osc; });
    return Array.from(m.values()).map(c => Object.assign(c, { points: c.points.sort((a, b) => a[0] - b[0]) }));
  }
  const G = {
    id: 'hd-floor-falls', label: 'Floor Falls (deep drops)', icon: '🕳', accent: '#ff2266', family: 'EDM', category: 'heavy',
    bpm: [140, 144], roots: [1, 9, 4, 6, 11], scales: ['phrygian', 'minor'], progs: [[1, 1, 6, 7], [1, 6, 4, 5], [1, 2, 1, 7], [1, 1, 4, 6], [1, 7, 6, 7]],
    tagline: 'Floor Falls Out, again and deeper: the floor falls (or steps, or freefalls, or rises) in the pause, a half-time drop that wobbles per note, and a second drop where Raven Drop’s Reese talks, opens and ripples',
    drums: { main: DROP, main2: DROP2, light: LIGHT, none: {} }, leadRhythm: 'sparse', bar, form: FORM, curves,
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Heavy (Dubstep/Trap)', name: 'Drums' },
      sub: { role: 'bass', organism: 'eravos.sub-engine', preset: ['Dubstep Sub Layer', 'Deep Sine', 'Earthquake Drop'], style: 'half', name: 'Sub',
        configure: { octave: 0, floor: 24, level: 0.32, phantom: 0.35 } },
      growl: { role: 'bass', organism: 'eravos.wobble-bass', preset: ['Classic Wub 1/8', 'Half-time Growl 1/4t', 'Head Shaker', 'Laser Dive Wub'], style: 'half', name: 'Wobble' },
      reese: { role: 'bass', organism: 'eravos.reese-bass', preset: 'Her Drop (dubstep reese)', name: 'Reese (Raven Drop)', configure: { sub: 0.3, subOct: '0', level: 0.75 } },   // 0.75: at 1.0 drop 2 sat in the master's clipper 0.29 % of the time
      screech: { role: 'lead', organism: 'eravos.wub-osc', preset: ['Slide Lead (+1 oct)', 'Dive Bomb'], octave: 4, name: 'Screech' },
      pad: { role: 'chords', organism: 'eravos.supersaw', preset: 'EDM Pad · Dark Minor Seventh Pad', style: 'sustain', voicing: 'triad', octave: 4, name: 'Pad',
        configure: { unison: 7, detune: 0.25, mix: 0.6, spread: 0.9, cutoff: 2400, res: 0.3, fEnv: 0.2, aA: 0.35, aD: 1, aS: 0.8, aR: 1.4, chordMode: 'off', level: 0.35 } },   // his own pad, from his fix of #5901
      lead: { role: 'lead', organism: 'eravos.supersaw', preset: ['Festival Lead', 'Euphoric Lead'], octave: 4, name: 'Riser' },
    },
    fx: [{ organism: 'eravos.fx-destroyer', preset: ['Fold Growl', 'Bass Grit (parallel)'], on: 'growl' }],
    mods: [{ organism: 'eravos.bass-drop-builder', preset: 'Long build 8/8/1/16',
      configure: { tensionBars: 0, buildBars: 8, pauseBars: 1, dropBars: 16, subDive: 0.9, subFrom: 62, subTo: 29, subLen: 3, spaceTail: 0.75, spaceSize: 6, spaceDuck: 0.6, crossover: 140, spaceWidth: 0.9, swell: 0.7, swellBeats: 2, orbit: 0.5, orbitBars: 2 } }],
    master: { compThresh: -9, compRatio: 3.5, reverbMix: 0.12 },
  };
  SE.addGenre(G);
  const MOVE_SAY = {
    falls: 'In each pause the sub falls two octaves — down to the floor, where it fades out.',
    stairs: 'In each pause the floor goes down in four steps — the sub walks down a 4th, a 7th, an octave, then drops off the last one.',
    freefall: 'In each pause everything falls together: the sub dives, and the Wobble, the Reese and the pad bend down an octave on their Pitch curves, then snap back on the hit.',
    rises: 'In each pause the sub rises back up out of the floor into the hit — the reverse of a drop, and the pad climbs a whole octave in the build.',
  };
  const NOTE = (mv) => ({
    listen: 'Built like Floor Falls Out: eight bars of his dark pad, the sub under it in the verse, a build where the riser climbs and the pad bends up, then the pause. ' + MOVE_SAY[mv],
    drop: 'Drop 1 is Floor Falls Out’s: a half-time Wobble that changes rate on every note and speeds up into each turn, the sub diving an octave at every phrase, the screech sliding in. Drop 2 is Raven Drop’s: the Reese “Her Drop” talks over the sub, its filter opening every four bars (a curve), with a slow pitch ripple on it (“Ripples”).',
    voice: 'Her clips fit the two pauses — her voice alone where the floor falls out, the drop answering it.',
    tools: 'Sub Engine (Octave 0: the real note, dives stop at ~18 Hz) · Wobble Bass → Destroyer · Reese Bass “Her Drop” · Wub Osc screech · his dark Supersaw pad · Supersaw riser · Drop Builder · curves: Pad riser, Wobble depth, Reese opens, Ripples' + (mv === 'freefall' ? ', Freefall' : ''),
  });
  // [id, title, seed, moods]
  const SHELF = [
    ['hf1', 'Floor Falls Again', 7001, ['heavy', 'party']], ['hf2', 'Raven, Falling', 7002, ['heavy', 'her']],
    ['hf3', 'Stairs to the Floor', 7003, ['heavy']], ['hf4', 'Freefall For Her', 7004, ['heavy', 'her']],
    ['hf5', 'Ripples', 7005, ['heavy', 'her']], ['hf6', 'Under the Floor', 7006, ['heavy', 'dark']],
    ['hf7', 'Rise From the Floor', 7007, ['heavy', 'party']], ['hf8', 'Deepest Drop', 7008, ['heavy', 'dark']],
  ];
  const SONGS = SHELF.map(([id, title, seed, mood]) => Object.assign({ id, title, genre: G.id, seed, mood: ['edm'].concat(mood), move: moveOf(seed) }, NOTE(moveOf(seed))));
  if (window.Songbook && window.Songbook.add) SONGS.forEach(window.Songbook.add);
  window.FloorFallsSongbook = { genres: [G.id], songs: SONGS.map(s => s.id), moveOf, MOVES };
})();
