/* ERAVOS "Bun Dem · Fire" songbook (3.44) — data only. "Skrillex, fire, make it bun dem. Js what I mean." — the reggae
 * sound-system meets brostep: a one-drop at 75 that is really 150 half-time, so when the drop lands it is the same pulse,
 * suddenly HIGHER (a mid-range screech and a talking growl where the reggae bass was) and feeling SLOWER (half-time weight).
 *   intro    one-drop rim and skank, organ bubble, sound-system sub — room for her to toast over it
 *   verse    the riddim proper, horns answering, the skank thrown into the dub echo
 *   build    snare roll climbing, the horns and a screech riser, the siren in the dub station
 *   pause    one bar: the horns blast alone — the "FIRE" moment, her voice on top
 *   drop     half-time brostep: Wub Osc through the "Bun Dem Throat" vowel filter (OO → AE) and the Destroyer, Wub Rate
 *            switching it up, a high Sound-System Screech answering, the skank still riding the offbeat
 *   switch   the dancehall 3-3-2 bounce on the growl
 *   break    back to the yard: skank, bubble, dub echo, her voice
 *   drop 2   lifted, the screech leading
 * Original parts in that style — nothing here copies the record. Her recordings come in through the voice rig (voice: true). */
(function () {
  'use strict';
  const SE = window.SongEngine; if (!SE) return;
  const tear = SE.genres().find(g => g.id === 'tearout'), bar = tear && tear.bar;   // the Bass Pack bar writer
  if (!bar) return;

  // the screech is the HIGH voice: the Bass Pack writes it in the bass octave, it plays an octave up (its preset's own
  // octave −1 is set back to 0 below), so the drop jumps into the mids over the same root
  const barUp = (cx) => { const n = bar(cx); return n && cx.partKey === 'screech' ? n.map(x => Object.assign({}, x, { n: x.n + 12 })) : n; };
  const S = (name, kind, bars, play, o) => Object.assign({ name, kind, bars, play }, o || {});
  const CLIMB = [6, 6, 7, 7, 4, 4, 5, 5];
  // drum grids at 150 half-time (16 steps: X loud · x normal · o ghost)
  const ONEDROP = { kick: '........X.......', rim: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', perc: '..o.......o.....' };
  const ONEDROP_LIGHT = { rim: '........x.......', hat: '..x...x...x...x.' };
  const DROP = { kick: 'X.....x...x.....', snare: '........X.......', clap: '........X.......', hat: 'x.x.x.x.x.x.x.x.', ohat: '..............x.' };
  const DANCEHALL = { kick: 'X.....x...x.....', snare: '........X.......', rim: '...x..x....x..x.', hat: 'x.x.x.x.x.x.x.x.', perc: '..o.......o.....' };

  const FORM = [
    S('intro', 'intro', 8, ['skank', 'bubble', 'drums'], { drums: 'light' }),
    S('verse', 'verse', 16, ['drums', 'sub', 'skank', 'bubble', 'horn'], { drums: 'onedrop', pat: { sub: 'dubsub' } }),
    S('build', 'build', 8, ['skank', 'drums', 'horn', 'screech'], { prog: CLIMB, pat: { screech: 'gunroll' } }),
    S('pause', 'pause', 1, ['horn'], { prog: [5] }),
    S('drop', 'drop', 16, ['drums', 'sub', 'wub', 'skank', 'screech'], { pat: { sub: 'sub', wub: ['yoi', 'wub', 'yoi', 'wubHi'], screech: ['tri', 'bounce', 'tri', 'gunroll'] } }),
    S('switch', 'chorus', 8, ['drums', 'sub', 'wub', 'horn'], { drums: 'dancehall', pat: { sub: 'sub', wub: ['bounce', 'bounceB'] } }),
    S('yard', 'break', 8, ['skank', 'bubble', 'horn'], { drums: 'light' }),
    S('build 2', 'build', 8, ['skank', 'drums', 'horn', 'screech'], { prog: CLIMB, pat: { screech: 'gunroll' } }),
    S('pause 2', 'pause', 1, ['horn'], { prog: [5] }),
    S('drop 2', 'drop', 16, ['drums', 'sub', 'wub', 'screech', 'skank', 'horn'], { lift: 2, pat: { sub: 'sub', wub: ['yoi', 'wubHi', 'yoi', 'tri'], screech: ['wubHi', 'bounce', 'stair', 'gunroll'] } }),
    S('outro', 'outro', 8, ['skank', 'bubble', 'drums'], { drums: 'onedrop', pat: { sub: 'dubsub' } }),
  ];

  const G = {
    id: 'bun-dem-fire', label: 'Bun Dem · Fire (reggae brostep)', icon: '🔥', accent: '#ff3d00', family: 'EDM', category: 'island', voice: true,
    bpm: [148, 152], roots: [7, 2, 9], scales: ['minor', 'dorian'], progs: [[1, 4, 1, 4], [1, 7, 1, 7], [1, 1, 4, 5], [1, 6, 7, 1]],
    tagline: 'One-drop reggae at 75 that is really 150 half-time — then the drop goes HIGH: a talking vowel growl, a sound-system screech, horns, sirens, the skank still riding',
    drums: { main: DROP, light: ONEDROP_LIGHT, onedrop: ONEDROP, dancehall: DANCEHALL }, leadRhythm: 'sparse', bar: barUp, form: FORM,
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Heavy (Dubstep/Trap)', name: 'Drums' },
      sub: { role: 'bass', organism: 'eravos.sub-engine', preset: ['Sound-System Sub (reggae)', 'Dubstep Sub Layer'], style: 'onedrop', name: 'Sub' },
      wub: { role: 'bass', organism: 'eravos.wub-osc', preset: ['Dancehall Growl Stack (FM 1:1)', 'FM Growl 1:1', 'Hollow Yoi'], style: 'half', name: 'Growl' },
      screech: { role: 'bass', organism: 'eravos.wobble-bass', preset: ['Sound-System Screech'], configure: { octave: 0 }, style: 'half', name: 'Screech' },
      skank: { role: 'chords', organism: 'eravos.pad-forge', preset: 'Dub Chord Bed', style: 'skank', voicing: 'triad', octave: 4, name: 'Skank' },
      bubble: { role: 'chords', organism: 'eravos.organ', preset: 'Desert Gospel', style: 'bubble', octave: 4, name: 'Bubble' },
      horn: { role: 'lead', organism: 'eravos.retro-poly', preset: ["Brass Stab '84", '80s · Juno Brass Swell'], configure: { arp: 'off' }, octave: 5, name: 'Horns' },
    },
    fx: [
      { organism: 'eravos.wub-filter', preset: 'Bun Dem Throat (OO → AE)', on: 'wub' },
      { organism: 'eravos.fx-destroyer', preset: ['Fold Growl', 'Bass Grit (parallel)'], on: 'fx0' },
      { organism: 'eravos.dub-station', preset: 'Bun Dem (dancehall)', on: 'skank' },
      { organism: 'eravos.fx-echo', preset: 'Dub Throw', on: 'horn' },
    ],
    mods: [{ organism: 'eravos.wub-rate', preset: ['Dancehall Switch-up', 'Half-time Talk'], to: 'fx0', key: 'wub' }, { organism: 'eravos.wub-sub', preset: ['Warm Phone Sub', 'Clean Sine'] }],
    master: { compThresh: -10, compRatio: 3, reverbMix: 0.14 },
  };
  SE.addGenre(G);

  const NOTE = {
    listen: 'The intro is a one-drop at 75 — the rim on 3, the skank on the offbeat, the organ bubbling. The drop keeps the same pulse but the bass jumps up into the mids: a growl that says OO → AE through the vowel filter, a screech answering it, the skank still riding.',
    drop: 'One bar where only the horns blast — her voice on top — then the half-time drop: crash, kick, the talking growl and the screech together.',
    voice: 'Her recordings toast over the one-drop intro and verse, one line alone with the horns in the pause, chopped on the drop, back in the yard break. Add them once in Songs → 🎤 Her voice.',
    tools: 'Wub Osc → Wub Filter (Bun Dem Throat) → Destroyer, Wub Rate switching it, Wobble Bass (Sound-System Screech), Sub Engine + Wub Sub, Pad Forge skank → Dub Station, Organ bubble, Retro Poly horns → Tape Echo, Pads',
  };
  // [id, title, seed, moods]
  const SHELF = [
    ['bdf1', 'Bun Dem (Fire Edit)', 75, ['island', 'heavy', 'her']], ['bdf2', 'Fire Pon Di Sound System', 7501, ['island', 'heavy', 'party']],
    ['bdf3', 'Yard to Drop', 7502, ['island', 'heavy']], ['bdf4', 'Siren Inna Di Half-Time', 7503, ['island', 'heavy', 'dark']],
    ['bdf5', 'Throat of the Riddim', 7504, ['island', 'heavy', 'her']], ['bdf6', 'One-Drop, Then Screech', 7505, ['island', 'heavy', 'party']],
  ];
  const SONGS = SHELF.map(([id, title, seed, mood]) => Object.assign({ id, title, genre: G.id, seed, mood: ['edm'].concat(mood) }, NOTE));
  if (window.Songbook && window.Songbook.add) SONGS.forEach(window.Songbook.add);
  window.BunDemFireSongbook = { genres: [G.id], songs: SONGS.map(s => s.id) };
})();
