/* ERAVOS "Arp & Motion" songbook (3.62) — data only. James, 2026-10-23: "add songs that use the automation, arp, etc".
 * Melodic EDM at 124–128 in her keys, every song built from what 3.53–3.62 added:
 *   ARP       a lane of held chords plays the Arp (2.0); the Arp plays a pluck (a part of its own, wired: G.wires). The chords repeat
 *             (⟳ Repeat every, clip.loop): one turn of the progression written, the clip plays it for the whole section.
 *   CURVES    the Arp's Octaves climb 1 → 3 through each build (an integer lane: it steps), its Gate opens from staccato to legato,
 *             its Rate goes 1/8 → 1/16 halfway through the build (a choice lane: it switches); the pluck's filter opens across the
 *             build and closes for the break; the pad bends up an octave into the drop (a Pitch lane) and lets go on the hit.
 *   NOTES     the lead glides into its long notes from below, blooms a vibrato on the held ones, and its last build note rises.
 *   SPLIT     every lane is one tool, so ✂ Split on the Pad lane (low / high) gives the chords' top line a tool of its own.
 * Original parts in the style — nothing here copies a record. */
(function () {
  'use strict';
  const SE = window.SongEngine; if (!SE) return;
  const MT = () => window.MusicTheory;
  const S = (name, kind, bars, play, o) => Object.assign({ name, kind, bars, play }, o || {});
  const FOUR = { kick: 'X...X...X...X...', clap: '....X.......X...', hat: '..x...x...x...x.', ohat: '..o...o...o...o.' };
  const FOUR2 = { kick: 'X...X...X...X...', clap: '....X.......X...', hat: 'x.xxx.xxx.xxx.xx', perc: '...o..o....o..o.' };
  const LIGHT = { kick: 'X.......X.......', hat: '..x...x...x...x.' };
  const FORM = [
    S('intro', 'intro', 8, ['arp', 'pad'], { drums: 'light' }),
    S('verse', 'verse', 16, ['drums', 'sub', 'arp', 'pad'], { drums: 'light' }),
    S('build', 'build', 8, ['drums', 'arp', 'pad', 'lead']),
    S('drop', 'drop', 16, ['drums', 'sub', 'arp', 'pad', 'lead']),
    S('break', 'break', 8, ['arp', 'pad'], { drums: 'none' }),
    S('build 2', 'build', 8, ['drums', 'arp', 'pad', 'lead']),
    S('drop 2', 'drop', 16, ['drums', 'sub', 'arp', 'pad', 'lead'], { drums: 'main2' }),
    S('outro', 'outro', 8, ['arp', 'pad'], { drums: 'light' }),
  ];
  // the lead: long notes that glide in and bloom (drop), a climb that rises at the end (build); null = the stock bar
  function bar(cx) {
    const { partKey: p, kind, b, deg, key, sec } = cx, at = (d, o) => MT().degreeToMidi(d, o, key.root, key.scale), n = [], N = (s, l, m, v, extra) => n.push(Object.assign({ s, l, n: m, v: v || 0.9 }, extra || {}));
    const lastBar = b === sec.bars - 1;
    if (p === 'lead' && kind === 'drop') {
      const phrase = b % 4, top = at(deg + 4, 5), mid = at(deg + 2, 5), root = at(deg, 5);
      if (phrase === 0) { N(0, 6, top, 1, { b: { from: -2, to: 0, shape: 'early' } }); N(6, 2, mid, 0.8); N(8, 8, root, 0.95, { b: { from: 0, to: 0, osc: { rate: 5.5, depth: 0.3, shape: 'sine', fade: 0.5 } } }); }
      else if (phrase === 1) { N(0, 4, mid, 0.9); N(4, 4, top, 0.95); N(8, 8, at(deg + 5, 5), 1, { b: { from: -3, to: 0, shape: 'early', osc: { rate: 5.5, depth: 0.25, shape: 'sine', fade: 0.6 } } }); }
      else if (phrase === 2) { N(0, 3, top, 0.9); N(3, 3, mid, 0.85); N(6, 2, root, 0.8); N(8, 8, mid, 0.95, { b: { from: 0, to: 0, osc: { rate: 5, depth: 0.3, shape: 'sine', fade: 0.4 } } }); }
      else N(0, 16, root, 1, { b: { from: -5, to: 0, shape: 'early', osc: { rate: '1/16', rateTo: '1/32', depth: 0.2, shape: 'sine', fade: 0.7 } } });
      return n;
    }
    if (p === 'lead' && kind === 'build') {   // one long note a bar, climbing; the last one rises a fourth and shivers
      const m = at(deg + [0, 0, 1, 2, 2, 3, 4, 4][b % 8], 5);
      N(0, 16, m, 0.55 + 0.45 * b / Math.max(1, sec.bars - 1), lastBar ? { b: { from: 0, to: 5, shape: 'late', at: 0.3, osc: { rate: '1/16', depth: 0.25, shape: 'sine', fade: 0.4 } } } : null);
      return n;
    }
    return null;
  }
  // the curves the song writes: the Arp opens up through every build, the pluck's filter follows, the pad bends into the drop
  function curves(secs) {
    const out = [], add = (part, key, name, pts) => out.push({ part, key, name, points: pts });
    secs.forEach((s) => {
      const a = s.bar, e = s.bar + s.bars, mid = a + s.bars / 2;
      if (s.kind === 'build') {
        add('arp', 'octaves', 'Arp octaves', [[a, 1], [a + s.bars * 0.4, 2], [a + s.bars * 0.75, 3], [e - 0.01, 3]]);
        add('arp', 'gate', 'Arp gate', [[a, 0.25], [e - 0.01, 1.1]]);
        add('arp', 'div', 'Arp rate', [[a, '1/8'], [mid, '1/16'], [e - 0.01, '1/16']]);
        add('keys', 'cutoff', 'Pluck filter', [[a, 900], [e - 0.01, 6000]]);
        add('pad', '@pitch', 'Pad riser', [[a, 0], [e - 0.05, 12], [e, 0]]);
      } else if (s.kind === 'drop') {
        add('arp', 'octaves', 'Arp octaves', [[a, 2]]); add('arp', 'gate', 'Arp gate', [[a, 0.55]]); add('arp', 'div', 'Arp rate', [[a, '1/16']]);
        add('keys', 'cutoff', 'Pluck filter', [[a, 3500], [e - 0.01, 4500]]);
      } else {
        add('arp', 'octaves', 'Arp octaves', [[a, 1]]); add('arp', 'gate', 'Arp gate', [[a, s.kind === 'break' ? 0.9 : 0.45]]); add('arp', 'div', 'Arp rate', [[a, s.kind === 'break' ? '1/8' : '1/16']]);
        add('keys', 'cutoff', 'Pluck filter', [[a, s.kind === 'break' ? 700 : 1400], [e - 0.01, s.kind === 'break' ? 1100 : 1800]]);
      }
    });
    const m = new Map(); out.forEach(c => { const k = c.part + '|' + c.key; if (!m.has(k)) m.set(k, Object.assign({}, c, { points: [] })); m.get(k).points.push(...c.points); });
    return Array.from(m.values());
  }
  const G = {
    id: 'am-arp-motion', label: 'Arp & Motion (melodic)', icon: '🪜', accent: '#00d4ff', family: 'EDM', category: 'motion',
    bpm: [124, 128], roots: [1, 4, 6, 9, 11], scales: ['minor'], progs: [[6, 4, 1, 5], [1, 6, 3, 7], [6, 7, 5, 1], [1, 5, 6, 4]],
    tagline: 'An arp that opens up through every build (octaves climb, the gate goes legato, the rate doubles), a pluck whose filter follows, a pad that bends up into the drop, a lead that glides and blooms',
    drums: { main: FOUR, main2: FOUR2, light: LIGHT, none: {} }, leadRhythm: 'anthem', bar, form: FORM, curves,
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: ['EDM Core', 'Future (Monstercat)'], name: 'Drums' },
      sub: { role: 'bass', organism: 'eravos.sub-engine', preset: ['Deep Sine', 'Club · Deep House Sub'], style: 'offbeat', name: 'Sub' },
      arp: { role: 'chords', organism: 'eravos.arp', style: 'sustain', voicing: 'seventh', octave: 4, repeat: true, name: 'Arp',
        configure: { order: 'up-down', div: '1/16', octaves: 1, gate: 0.45, swing: 0.06, slide: 0.08, velRamp: 0.3, restart: 'notes' } },
      keys: { role: 'keys', organism: 'eravos.supersaw', preset: ['Trance Pluck', 'Monstercat Pluck'], name: 'Pluck (the Arp plays it)' },
      pad: { role: 'chords', organism: 'eravos.pad-forge', preset: ['EDM Pad · Future Bass Bloom', 'EDM Pad · Trance Wash', 'Her Essence', 'EDM Pad · Sunrise Festival'], style: 'sustain', voicing: 'triad', octave: 3, repeat: true, name: 'Pad' },
      lead: { role: 'lead', organism: 'eravos.supersaw', preset: ['Euphoric Lead', 'Festival Lead'], octave: 4, name: 'Lead' },
    },
    wires: [[['arp', 'arp.hook.note_out'], ['keys', 'saw.hook.note_in']]],
    master: { compThresh: -10, compRatio: 3, reverbMix: 0.14 },
  };
  SE.addGenre(G);
  const NOTE = {
    listen: 'The Arp lane holds the chords — one turn of the progression, repeating (⟳ on the clip). The Arp steps through them and plays the pluck. Watch the Arp’s curve lanes in each build: Octaves climb 1 → 3, Gate opens to legato, Rate jumps to 1/16 halfway.',
    drop: 'Into the drop the pad bends up an octave (its Pitch lane) and snaps back on the hit; the pluck’s filter is open; the lead glides into long notes that bloom a vibrato, and the last one in each phrase speeds its shimmer up.',
    voice: 'Her recordings fit the intro and the break, over the arp alone.',
    tools: 'Arp 2.0 → Supersaw pluck (wired) · curve lanes on the Arp (octaves, gate, rate), the pluck (filter) and the pad (Pitch) · repeating clips · Pad Forge · Supersaw lead with glides and vibrato · Sub Engine · Pads',
  };
  const SHELF = [
    ['am1', 'Climb For Her', 6201, ['her', 'warm']], ['am2', 'Octaves Up', 6202, ['party']], ['am3', 'Gate Opens', 6203, ['warm']],
    ['am4', 'Glass Stairs', 6204, ['her']], ['am5', 'Night Arp', 6205, ['dark']], ['am6', 'Raven, Rising', 6206, ['her', 'party']],
  ];
  const SONGS = SHELF.map(([id, title, seed, mood]) => Object.assign({ id, title, genre: G.id, seed, mood: ['edm'].concat(mood) }, NOTE));
  if (window.Songbook && window.Songbook.add) SONGS.forEach(window.Songbook.add);
  window.ArpMotionSongbook = { genres: [G.id], songs: SONGS.map(s => s.id) };
})();
