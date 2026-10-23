/* ERAVOS "Heavy Drops" songbook (3.59) — data only. "Can you make songs with a heavy bass drop."
 * Half-time at 140–150, every drop built to hit with the whole of 3.53–3.58:
 *   build    a supersaw climbs while the pad's PITCH lane rises 7 semitones (a Pitch curve the song writes), snare roll doubling
 *   pause    one bar: the sub dives two octaves — the floor falls out (a note bend, deep drop, late)
 *   drop     the sub holds the floor and dives an octave at the end of every phrase; the Wobble Bass wobbles at its own rate per
 *            note (per-note settings: 1/8 · 1/16 · 1/8t) with glides in from above and a wobble that SPEEDS UP into each turn
 *            (note oscillation, 1/8 → 1/32); a screech answers with glide-ins; the wobble DEPTH lane swings (an oscillating curve)
 *   Drop Builder underneath: riser, impact and crash on the drop marker, SPACE on — sub dive, a huge tail above 140 Hz that
 *            ducks every beat, a reverse swell into the hit, the room orbiting your head. It fires again on "drop 2".
 * Original parts in the style — nothing here copies a record. */
(function () {
  'use strict';
  const SE = window.SongEngine; if (!SE) return;
  const MT = () => window.MusicTheory;
  const S = (name, kind, bars, play, o) => Object.assign({ name, kind, bars, play }, o || {});
  const DIVE = (to, at) => ({ from: 0, to, shape: 'late', at: at || 0.2 });
  // half-time grids (16 steps: X loud · x normal · o ghost)
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
    S('drop 2', 'drop', 16, ['drums', 'sub', 'growl', 'screech', 'lead'], { drums: 'main2' }),
    S('outro', 'outro', 8, ['pad', 'drums'], { drums: 'light' }),
  ];

  // the bars that make a drop heavy (null = the stock bar for that part)
  function bar(cx) {
    const { partKey: p, kind, b, deg, key, sec, r } = cx, at = (d, o) => MT().degreeToMidi(d, o, key.root, key.scale), n = [], N = (s, l, m, v, extra) => n.push(Object.assign({ s, l, n: m, v: v || 0.95 }, extra || {}));
    const phraseEnd = b % 4 === 3, lastBar = b === sec.bars - 1;
    if (p === 'sub') {
      if (kind === 'pause') { N(0, 16, at(deg, 1), 1, { b: DIVE(-24, 0.1) }); return n; }   // the floor falls out
      if (kind === 'drop') {
        if (lastBar) { N(0, 16, at(deg, 1), 1, { b: DIVE(-24, 0.35) }); return n; }
        N(0, phraseEnd ? 16 : 10, at(deg, 1), 1, phraseEnd ? { b: DIVE(-12, 0.5) } : null); if (!phraseEnd) N(12, 4, at(deg, 1), 0.85); return n;
      }
      return null;
    }
    if (p === 'growl' && kind === 'drop') {
      const lo = at(deg, 2), hi = at(deg + 4, 2), oct = at(deg, 3), v = b % 4;
      if (v === 0) { N(0, 4, lo, 1, { p: { div: '1/8' } }); N(4, 2, lo, 0.9, { p: { div: '1/16' } }); N(8, 6, hi, 0.95, { p: { div: '1/8t' }, b: { from: 5, to: 0, shape: 'early' } }); }
      else if (v === 1) { N(0, 3, lo, 1, { p: { div: '1/16' } }); N(3, 3, oct, 0.9, { p: { div: '1/16' }, b: { from: 0, to: -12, shape: 'linear' } }); N(8, 8, lo, 0.95, { p: { div: '1/4t' } }); }
      else if (v === 2) { N(0, 6, lo, 1, { p: { div: '1/8t' } }); N(6, 2, hi, 0.85, { p: { div: '1/16' } }); N(8, 4, oct, 0.95, { p: { div: '1/16' }, b: { from: 7, to: 0, shape: 'early' } }); N(12, 4, lo, 0.9, { p: { div: '1/8' } }); }
      else { N(0, 16, lo, 1, { p: { div: '1/8' }, b: { from: 0, to: lastBar ? -12 : -5, shape: 'late', at: 0.4, osc: { rate: '1/8', rateTo: '1/32', depth: 0.4, shape: 'sine' } } }); }   // the wobble speeds up into the turn
      return n;
    }
    if (p === 'screech' && kind === 'drop') {
      const h = at(deg + 2, 4);
      if (b % 2 === 1) { N(4, 2, h, 0.85, { b: { from: -5, to: 0, shape: 'early' } }); N(12, 3, h + 12, 0.9, { b: { from: 0, to: -12, shape: 'late', at: 0.3 } }); }
      else if (r() < 0.5) N(14, 2, h, 0.7, { b: { from: 12, to: 0, shape: 'early' } });
      return n;
    }
    if (p === 'lead' && kind === 'build') {   // a climbing supersaw: one long note a bar, the last one rises an octave and shivers
      const steps = [0, 0, 2, 2, 4, 4, 5, 7]; const m = at(deg + steps[b % 8], 4);
      N(0, 16, m, 0.6 + 0.4 * b / Math.max(1, sec.bars - 1), lastBar ? { b: { from: 0, to: 12, shape: 'early', osc: { rate: '1/16', rateTo: '1/32', depth: 0.3, shape: 'sine', fade: 0.3 } } } : null);
      return n;
    }
    return null;
  }

  // curves the song writes into the timeline: the pad rises into every drop, the wobble depth swings through every drop
  function curves(secs) {
    const out = [];
    secs.forEach((s, i) => {
      if (s.kind === 'build') { const end = s.bar + s.bars; out.push({ part: 'pad', key: '@pitch', name: 'Pitch riser', points: [[s.bar, 0], [end - 0.05, 7], [end, 0]] }); }
      if (s.kind === 'drop') out.push({ part: 'growl', key: 'depth', name: 'Wobble depth', points: [[s.bar, 3], [s.bar + s.bars - 0.05, 6], [s.bar + s.bars, 3]], osc: { rate: '1/2', depth: 1.2, shape: 'triangle' } });
    });
    // one lane per part + key: merge the points of every section into it
    const m = new Map(); out.forEach(c => { const k = c.part + '|' + c.key; if (!m.has(k)) m.set(k, Object.assign({}, c, { points: [] })); m.get(k).points.push(...c.points); });
    return Array.from(m.values());
  }

  const G = {
    id: 'hd-heavy-drops', label: 'Heavy Drops (half-time)', icon: '💥', accent: '#ff2266', family: 'EDM', category: 'heavy',
    bpm: [140, 150], roots: [1, 4, 6, 9, 11], scales: ['minor', 'phrygian'], progs: [[1, 1, 6, 7], [1, 6, 4, 5], [1, 2, 1, 7], [1, 1, 4, 6]],
    tagline: 'Half-time weight: the floor falls out in the pause, the sub dives at every turn, a wobble that talks and speeds up, a riser that bends the pads into the drop — and a drop that orbits your head',
    drums: { main: DROP, main2: DROP2, light: LIGHT, none: {} }, leadRhythm: 'sparse', bar, form: FORM, curves,
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Heavy (Dubstep/Trap)', name: 'Drums' },
      sub: { role: 'bass', organism: 'eravos.sub-engine', preset: ['Earthquake Drop', 'Dubstep Sub Layer', 'Deep Sine'], style: 'half', name: 'Sub' },
      growl: { role: 'bass', organism: 'eravos.wobble-bass', preset: ['Classic Wub 1/8', 'Half-time Growl 1/4t', 'Head Shaker', 'Tearout Screech'], style: 'half', name: 'Wobble' },
      screech: { role: 'lead', organism: 'eravos.wub-osc', preset: ['Slide Lead (+1 oct)', 'Dive Bomb', 'FM Riddim 2:1'], octave: 4, name: 'Screech' },
      pad: { role: 'chords', organism: 'eravos.pad-forge', preset: ['EDM Pad · Melodic Dubstep Halo', 'Dark Choir', 'Frozen Halo (hold)'], style: 'sustain', voicing: 'triad', octave: 4, name: 'Pad' },
      lead: { role: 'lead', organism: 'eravos.supersaw', preset: ['Festival Lead', 'Euphoric Lead'], octave: 4, name: 'Riser' },
    },
    fx: [{ organism: 'eravos.fx-destroyer', preset: ['Fold Growl', 'Bass Grit (parallel)'], on: 'growl' }],
    mods: [{ organism: 'eravos.bass-drop-builder', preset: 'Long build 8/8/1/16',
      configure: { tensionBars: 0, buildBars: 8, pauseBars: 1, dropBars: 16, subDive: 0.9, subFrom: 62, subTo: 29, subLen: 3, spaceTail: 0.75, spaceSize: 6, spaceDuck: 0.6, crossover: 140, spaceWidth: 0.9, swell: 0.7, swellBeats: 2, orbit: 0.5, orbitBars: 2 } }],
    master: { compThresh: -9, compRatio: 3.5, reverbMix: 0.12 },
  };
  SE.addGenre(G);

  const NOTE = {
    listen: 'Eight bars of pad, then the verse puts the sub under it. In the build the supersaw climbs while the pads bend up seven semitones (a Pitch curve — open the Pad track’s lane in the piano roll to see it).',
    drop: 'The pause is one bar of a sub diving two octaves — the floor falls out — then the half-time drop: a wobble that changes speed note by note and speeds up into each turn, the sub diving an octave at every phrase, the screech sliding in from above, and the Drop Builder’s room opening wide and circling you.',
    voice: 'Her recordings sit in the intro and the break; one line alone in the pause, over the sub falling away. Add them once in Songs → 🎤 Her voice.',
    tools: 'Sub Engine (note dives) · Wobble Bass (per-note wobble rate, glides, a speed-up oscillation) → Destroyer · Wub Osc screech · Supersaw riser · Pad Forge with a Pitch riser lane · Drop Builder (SPACE: sub dive, tail, swell, orbit) · Pads',
  };
  // [id, title, seed, moods]
  const SHELF = [
    ['hx1', 'Floor Falls Out', 5901, ['heavy', 'party']], ['hx2', 'Event Horizon', 5902, ['heavy', 'dark']],
    ['hx3', 'Speaker Killer', 5903, ['heavy', 'party']], ['hx4', 'Sub Dive City', 5904, ['heavy']],
    ['hx5', 'The Room Spins', 5905, ['heavy', 'dark']], ['hx6', 'Head Shaker Season', 5906, ['heavy', 'party']],
    ['hx7', 'Deep End', 5907, ['heavy', 'dark']], ['hx8', 'For Her, Heavy', 5908, ['heavy', 'her']],
  ];
  const SONGS = SHELF.map(([id, title, seed, mood]) => Object.assign({ id, title, genre: G.id, seed, mood: ['edm'].concat(mood) }, NOTE));
  if (window.Songbook && window.Songbook.add) SONGS.forEach(window.Songbook.add);
  window.HeavyDropsSongbook = { genres: [G.id], songs: SONGS.map(s => s.id) };
})();
