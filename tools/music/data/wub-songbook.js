/* ERAVOS Wub & Reese songbook (3.40) — data only. Nine Song Engine genres built on the bass tools, and a big shelf of
 * songs in them and in the bass genres that already exist.
 *   wub-rig · dancehall-dubstep · brostep-wub · talker · melodic-wub · reese-roller · halftime-reese · wub-neuro · reese-vs-wub
 * The Wub genres build the modular rig: Wub Osc → Wub Filter → Destroyer, Wub Rate opening the filter (Song Engine mods),
 * Wub Sub following the notes. Bars come from the Bass Pack's writer (sec.pat: wub, yoi, tri, bounce, stair, gunroll, dnbroll…),
 * so this file only needs the Bass Pack loaded first. Every song is a genre + a seed: the same song every time. */
(function () {
  'use strict';
  const SE = window.SongEngine; if (!SE) return;
  const tear = SE.genres().find(g => g.id === 'tearout'), bar = tear && tear.bar;   // the Bass Pack bar writer
  if (!bar) return;

  // ---------------------------------------------------------------- form + part helpers
  const S = (name, kind, bars, play, o) => Object.assign({ name, kind, bars, play }, o || {});
  const CLIMB = [6, 6, 7, 7, 4, 4, 5, 5];
  const PADS = (p) => ({ role: 'drums', organism: 'eravos.pads', preset: p, name: 'Drums' });
  const PAD = (presets, o) => Object.assign({ role: 'chords', organism: 'eravos.pad-forge', preset: presets, style: 'sustain', voicing: 'triad', octave: 4, name: 'Pad' }, o || {});
  const SUB = (presets, o) => Object.assign({ role: 'bass', organism: 'eravos.sub-engine', preset: presets || 'Dubstep Sub Layer', style: 'half', name: 'Sub' }, o || {});

  // ---------------------------------------------------------------- drum grids (16 steps: X loud · x normal · o ghost)
  const HALF = { kick: 'X.....x...x.....', snare: '........X.......', clap: '........X.......', hat: 'x.x.x.x.x.x.x.x.', ohat: '..............x.' };
  const LIGHT = { kick: 'X.......X.......', hat: 'x...x...x...x...' };
  const DOUBLE = { kick: 'X.......X..x....', snare: '....X.......X...', clap: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', ohat: '..x...x...x...x.' };
  const STRIP = { snare: '........X.......', hat: '..x...x...x...x.' };
  const DANCEHALL = { kick: 'X.....x...x.....', snare: '........X.......', rim: '...x..x....x..x.', hat: 'x.x.x.x.x.x.x.x.', perc: '..o.......o.....' };
  const TWOSTEP = { kick: 'X.........X.....', snare: '....X.......X...', hat: 'x.x.x.xox.x.x.xo', shaker: 'oooooooooooooooo' };
  const ROLLER = { kick: 'X.........x.X...', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.', ohat: '..x.......x.....', shaker: 'oooooooooooooooo' };

  // the drop form most of these share: intro → climbing build → a one-bar pause → drop → switch-up → break → build → drop 2
  const DROPFORM = (o) => [
    S('intro', 'intro', 8, o.intro || ['pad', 'drums']),
    S('build', 'build', 8, o.build || ['pad', 'drums', 'lead'], { prog: CLIMB }),
    S('pause', 'pause', 1, ['pad'], { prog: [5] }),
    S('drop', 'drop', 16, o.drop, { pat: o.pat1 }),
    S('switch', 'chorus', 8, o.sw || o.drop, { drums: 'double', pat: o.patSw || o.pat1 }),
    S('break', 'break', 8, o.brk || ['pad', 'lead']),
    S('build 2', 'build', 8, o.build || ['pad', 'drums', 'lead'], { prog: CLIMB }),
    S('pause 2', 'pause', 1, ['pad'], { prog: [5] }),
    S('drop 2', 'drop', 16, o.drop2 || o.drop, { lift: 2, pat: o.pat2 || o.pat1 }),
    S('outro', 'outro', 8, ['pad', 'drums']),
  ];

  // ---------------------------------------------------------------- the Wub rig as Song Engine parts: Wub Osc plays, the rest wire up
  const WUB_OSC = (presets) => ({ role: 'bass', organism: 'eravos.wub-osc', preset: presets, style: 'half', name: 'Wub' });
  const RIG_FX = (filter, grit) => [{ organism: 'eravos.wub-filter', preset: filter, on: 'wub' }, { organism: 'eravos.fx-destroyer', preset: grit, on: 'fx0' }];
  const RIG_MODS = (rate, sub) => [{ organism: 'eravos.wub-rate', preset: rate, to: 'fx0', key: 'wub' }, { organism: 'eravos.wub-sub', preset: sub || ['Clean Sine', 'Warm Phone Sub', '808 Slide'] }];

  const GENRES = [
    // 1 ─ the modular Wub rig, every piece its own tool
    { id: 'wub-rig', label: 'Wub Rig Dubstep (modular)', icon: '🔊', accent: '#ff2266', family: 'EDM', bpm: [140, 150], roots: [5, 9, 2, 7, 4], scales: ['minor', 'phrygian'], progs: [[1, 1, 6, 7], [1, 1, 1, 6], [1, 6, 3, 7]],
      tagline: 'Wub Osc → Wub Filter → Destroyer, Wub Rate opening the mouth, Wub Sub under it — every piece a window you can change',
      drums: { main: HALF, light: LIGHT, double: DOUBLE, strip: STRIP }, leadRhythm: 'sparse', bar,
      form: DROPFORM({ drop: ['drums', 'wub', 'pad', 'lead'], pat1: { wub: ['wub', 'yoi', 'wub', 'tri'] }, sw: ['drums', 'wub'], patSw: { wub: ['bounce', 'bounceB'] }, pat2: { wub: ['yoi', 'wubHi', 'tri', 'gunroll'] } }),
      parts: { drums: PADS('Heavy (Dubstep/Trap)'), wub: WUB_OSC(['Classic Wub Saw', 'Dancehall Growl Stack (FM 1:1)', 'FM Growl 1:1', 'Square Talker', 'Hollow Yoi', 'Dive Bomb']),
        pad: PAD(['Dark Choir', 'Underwater', 'Frozen Halo (hold)']), lead: { role: 'lead', organism: 'eravos.bass-forge', preset: ['Screech', 'Laser Zap'], octave: 4, riser: true, name: 'Screech' } },
      fx: RIG_FX(['Classic LP Wub', 'Yoi Vowel (OO → AH)', 'Talking Yoi (OH → EE)', 'Yoi Yoi (OO → YOI)', 'Bun Dem Throat (OO → AE)'], ['Fold Growl', 'Bass Grit (parallel)', 'Grit']),
      mods: RIG_MODS(['Half-time Talk', 'Brostep Switch-up', 'Classic 1/8', 'Dancehall Switch-up', 'Triplet Roll']),
      master: { compThresh: -9, compRatio: 3, reverbMix: 0.1 } },

    // 2 ─ dancehall over a half-time drop: rim clicks, horns, a talking growl
    { id: 'dancehall-dubstep', label: 'Dancehall Dubstep (sound-system drop)', icon: '🔥', accent: '#ffcc00', family: 'EDM', bpm: [140, 150], roots: [7, 2, 9, 4], scales: ['minor', 'dorian'], progs: [[1, 4, 1, 4], [1, 7, 1, 7], [1, 1, 4, 5]],
      tagline: 'Rim clicks on the 3-3-2, a skank and horns, then a talking growl drop with a sound-system sub',
      drums: { main: DANCEHALL, light: { rim: '...x..x....x..x.', hat: '..x...x...x...x.' }, double: DOUBLE, strip: STRIP }, leadRhythm: 'sparse', bar,
      form: DROPFORM({ intro: ['skank', 'drums'], build: ['skank', 'drums', 'horn'], drop: ['drums', 'sub', 'wub', 'skank', 'horn'], pat1: { sub: 'sub', wub: ['yoi', 'bounce', 'yoi', 'bounceB'] },
        sw: ['drums', 'sub', 'wub'], patSw: { sub: 'sub', wub: ['bounce', 'bounceB'] }, brk: ['skank', 'horn'], pat2: { sub: 'sub', wub: ['yoi', 'wubHi', 'tri', 'yoi'] } }).map(s => (s.play.includes('pad') ? Object.assign({}, s, { play: s.play.map(p => p === 'pad' ? 'skank' : p) }) : s)),
      parts: { drums: PADS('Breaks & World'), sub: SUB(['Dubstep Sub Layer', 'Sound-System Sub (reggae)']),
        wub: { role: 'bass', organism: 'eravos.wobble-bass', preset: ['Dancehall Yoi Stabs', 'Half-time Talk Roll', 'Sound-System Screech'], style: 'half', name: 'Growl' },
        skank: { role: 'chords', organism: 'eravos.pad-forge', preset: 'Dub Chord Bed', style: 'skank', voicing: 'triad', octave: 4, name: 'Skank' },
        horn: { role: 'lead', organism: 'eravos.retro-poly', preset: ["Brass Stab '84", '80s · Juno Brass Swell'], configure: { arp: 'off' }, octave: 5, name: 'Horns' } },
      fx: [{ organism: 'eravos.dub-station', preset: 'Bun Dem (dancehall)', on: 'skank' }, { organism: 'eravos.fx-echo', preset: 'Dub Throw', on: 'horn' }],
      master: { compThresh: -10, compRatio: 3, reverbMix: 0.14 } },

    // 3 ─ brostep: hiccups, stop-starts, a gnarl sequence and a growl answering it
    { id: 'brostep-wub', label: 'Brostep (wobble switch-ups)', icon: '🤘', accent: '#ff5252', family: 'EDM', bpm: [140, 150], roots: [4, 5, 2, 9], scales: ['phrygian', 'minor'], progs: [[1, 1, 1, 2], [1, 1, 6, 7], [1, 7, 6, 5]],
      tagline: 'Hiccups, stop-starts and machine-gun gnarl, with a growl answering every other bar',
      drums: { main: HALF, light: LIGHT, double: DOUBLE, strip: STRIP }, leadRhythm: 'sparse', bar,
      form: DROPFORM({ drop: ['drums', 'sub', 'wub', 'growl', 'pad'], pat1: { sub: 'sub', wub: ['wub', 'tri', 'wubHi', 'gunroll'], growl: ['bounce', 'stair'] },
        sw: ['drums', 'sub', 'growl'], patSw: { sub: 'sub', growl: ['stair', 'stairB'] }, pat2: { sub: 'sub', wub: ['yoi', 'tri', 'gunroll', 'wubHi'], growl: ['bounceB', 'stairB'] } }),
      parts: { drums: PADS('Heavy (Dubstep/Trap)'), sub: SUB(),
        wub: { role: 'bass', organism: 'eravos.wobble-bass', preset: ['Brostep Hiccup', 'Tearout Gnarl Seq', 'Stop-Start Drop', 'Robot Gate 1/16', 'Fold Growl Wub 1/8'], style: 'half', name: 'Wub' },
        growl: { role: 'bass', organism: 'eravos.bass-forge', preset: ['Brostep Growl', 'Yoi Talker', 'Tearout Metal'], style: 'stutter', name: 'Growl' },
        lead: { role: 'lead', organism: 'eravos.supersaw', preset: ['Festival Lead', 'Euphoric Lead'], octave: 5, riser: true, name: 'Lead' },
        pad: PAD(['Dark Choir', 'Underwater']) },
      fx: [{ organism: 'eravos.fx-destroyer', preset: ['Bass Grit (parallel)', 'Grit'], on: 'wub' }],
      master: { compThresh: -9, compRatio: 3.5, reverbMix: 0.1 } },

    // 4 ─ talking bass: the yoi, all the way through
    { id: 'talker', label: 'Talking Bass (yoi)', icon: '🗣', accent: '#ff9100', family: 'EDM', bpm: [140, 140], roots: [5, 9, 2, 7], scales: ['minor', 'dorian'], progs: [[1, 1, 6, 7], [1, 6, 1, 7], [1, 4, 1, 5]],
      tagline: 'Every bar talks: yoi low-high-low, vowel morphs, triplet chews',
      drums: { main: HALF, light: LIGHT, double: DOUBLE, strip: STRIP }, leadRhythm: 'sparse', bar,
      form: DROPFORM({ drop: ['drums', 'sub', 'wub', 'pad'], pat1: { sub: 'sub', wub: ['yoi', 'yoi', 'tri', 'wubHi'] }, sw: ['drums', 'sub', 'wub'], patSw: { sub: 'sub', wub: ['tri', 'yoi'] }, pat2: { sub: 'sub', wub: ['yoi', 'tri', 'yoi', 'gunroll'] } }),
      parts: { drums: PADS('Heavy (Dubstep/Trap)'), sub: SUB(),
        wub: { role: 'bass', organism: 'eravos.wobble-bass', preset: ['Yoi Talker', 'Head Shaker', 'Yoi Drawn Talker', 'Talking Neuro Roll', 'Triplet Chew', 'Vowel Morph (shifted down)', 'Talking Chord Bass 1/8t'], style: 'half', name: 'Talker' },
        lead: { role: 'lead', organism: 'eravos.bass-forge', preset: ['Yoi Talker', 'Laser Zap'], octave: 4, riser: true, name: 'Answer' },
        pad: PAD(['Dark Choir', 'Her Essence', 'Underwater']) },
      master: { compThresh: -10, compRatio: 3, reverbMix: 0.12 } },

    // 5 ─ melodic wubs: the wobble sings the chords
    { id: 'melodic-wub', label: 'Melodic Wubs', icon: '🌌', accent: '#b388ff', family: 'EDM', bpm: [148, 152], roots: [2, 9, 5, 0], scales: ['minor'], progs: [[6, 4, 1, 5], [1, 6, 3, 7], [4, 6, 1, 7]],
      tagline: 'Wide, singing wobbles under a euphoric lead and a halo pad',
      drums: { main: HALF, light: LIGHT, double: DOUBLE, strip: STRIP }, leadRhythm: 'anthem', bar,
      form: DROPFORM({ drop: ['drums', 'sub', 'wub', 'pad', 'lead'], pat1: { sub: 'sub', wub: ['wub', 'wubHi'] }, sw: ['drums', 'sub', 'wub', 'lead'], patSw: { sub: 'sub', wub: ['wubHi', 'tri'] }, pat2: { sub: 'sub', wub: ['wubHi', 'wub', 'yoi', 'wubHi'] } }),
      parts: { drums: PADS('Future (Monstercat)'), sub: SUB(['Dubstep Sub Layer', 'Deep Sine']),
        wub: { role: 'bass', organism: 'eravos.wobble-bass', preset: ['Wide Melodic Wub', 'Monstercat Wub 1/4', 'Laser Dive Wub', 'Wobble Vibrato Lead'], style: 'half', name: 'Wub' },
        lead: { role: 'lead', organism: 'eravos.supersaw', preset: ['Euphoric Lead', 'Festival Lead', 'Monstercat Pluck'], octave: 5, name: 'Lead' },
        pad: PAD(['EDM Pad · Melodic Dubstep Halo', 'Golden Hour Strings', 'Celestial Glass'], { voicing: 'add9' }) },
      fx: [{ organism: 'eravos.fx-echo', preset: 'Dub Throw', on: 'lead' }],
      master: { compThresh: -10, compRatio: 2.5, reverbMix: 0.2 } },

    // 6 ─ Reese rollers: 174, the Reese carries the groove
    { id: 'reese-roller', label: 'Reese Roller (DnB 174)', icon: '🌀', accent: '#00b0ff', family: 'EDM', bpm: [172, 176], roots: [9, 2, 4, 0], scales: ['minor', 'dorian'], progs: [[1, 6, 4, 5], [1, 7, 6, 7], [1, 1, 6, 7]],
      tagline: 'Rolling two-step at 174; the Reese carries the groove, a sub holds the floor',
      drums: { main: ROLLER, light: { hat: 'x.x.x.x.x.x.x.x.', shaker: 'oooooooooooooooo' }, double: TWOSTEP, strip: STRIP }, leadRhythm: 'pluck', bar,
      form: DROPFORM({ drop: ['drums', 'sub', 'reese', 'pad', 'lead'], pat1: { sub: 'sub', reese: ['dnbroll', 'dnbroll', 'pulse8', 'dnbroll'] }, sw: ['drums', 'sub', 'reese'], patSw: { sub: 'sub', reese: ['pulse8', 'dnbroll'] }, pat2: { sub: 'sub', reese: ['dnbroll', 'tri', 'dnbroll', 'gunroll'] } }),
      parts: { drums: PADS('EDM Core'), sub: SUB(['Deep Sine', 'Dubstep Sub Layer']),
        reese: { role: 'bass', organism: 'eravos.reese-bass', preset: ['Classic Reese', 'Wide Rumble', 'Neuro Flange', 'Hoover-ish', 'Colour Bass'], style: 'roll', name: 'Reese' },
        lead: { role: 'lead', organism: 'eravos.supersaw', preset: ['Trance Pluck', 'Monstercat Pluck'], octave: 5, name: 'Pluck' },
        pad: PAD(['EDM Pad · Liquid DnB Pad', 'Celestial Glass', 'Golden Hour Strings'], { voicing: 'seventh' }) },
      fx: [{ organism: 'eravos.fx-destroyer', preset: 'Bass Grit (parallel)', on: 'reese' }],
      master: { compThresh: -10, compRatio: 2.5, reverbMix: 0.16 } },

    // 7 ─ half-time Reese: 170 that feels like 85
    { id: 'halftime-reese', label: 'Half-time Reese (170 → 85)', icon: '🐢', accent: '#26c6da', family: 'EDM', bpm: [168, 174], roots: [9, 4, 2], scales: ['minor', 'phrygian'], progs: [[1, 1, 6, 7], [1, 1, 1, 6], [1, 7, 6, 7]],
      tagline: '170 on the clock, 85 in your body: a slow Reese you feel, then the drums double',
      drums: { main: HALF, light: LIGHT, double: TWOSTEP, strip: STRIP }, leadRhythm: 'sparse', bar,
      form: DROPFORM({ drop: ['drums', 'sub', 'reese', 'pad'], pat1: { sub: 'sub', reese: ['wub', 'drone', 'wub', 'wubHi'] }, sw: ['drums', 'sub', 'reese', 'lead'], patSw: { sub: 'sub', reese: ['dnbroll', 'dnbroll'] }, pat2: { sub: 'sub', reese: ['wubHi', 'yoi', 'wub', 'gunroll'] } }),
      parts: { drums: PADS('Heavy (Dubstep/Trap)'), sub: SUB(['Deep Sine', 'Earthquake Drop']),
        reese: { role: 'bass', organism: 'eravos.reese-bass', preset: ['Her Drop (dubstep reese)', 'Melodic Growl', 'Neuro Flange', 'Wide Rumble'], style: 'half', name: 'Reese' },
        lead: { role: 'lead', organism: 'eravos.coven', preset: ['Ritual Bell', 'Crystal Coven'], octave: 5, name: 'Bell' },
        pad: PAD(['EDM Pad · Neuro Dark Pad', 'Dark Choir', 'Underwater']) },
      master: { compThresh: -10, compRatio: 3, reverbMix: 0.12 } },

    // 8 ─ neuro wubs: FM growl through a comb, triplet rates
    { id: 'wub-neuro', label: 'Neuro Wubs (FM + comb)', icon: '🧠', accent: '#7c4dff', family: 'EDM', bpm: [172, 174], roots: [4, 5, 2], scales: ['phrygian', 'minor'], progs: [[1, 1, 2, 1], [1, 6, 1, 7], [1, 1, 1, 2]],
      tagline: 'Wub Osc FM growl through a comb mouth, Wub Rate rolling triplets, rolling 174 under it',
      drums: { main: TWOSTEP, light: { hat: 'x.x.x.x.x.x.x.x.' }, double: ROLLER, strip: STRIP }, leadRhythm: 'sparse', bar,
      form: DROPFORM({ drop: ['drums', 'wub', 'pad', 'lead'], pat1: { wub: ['dnbroll', 'tri', 'dnbroll', 'gunroll'] }, sw: ['drums', 'wub'], patSw: { wub: ['stair', 'stairB'] }, pat2: { wub: ['tri', 'dnbroll', 'gunroll', 'tri'] } }),
      parts: { drums: PADS('Heavy (Dubstep/Trap)'), wub: WUB_OSC(['FM Clang 3:1', 'FM Riddim 2:1', 'FM Low Grind 0.5:1', 'Reese Roller']),
        pad: PAD(['EDM Pad · Neuro Dark Pad', 'Dark Choir']), lead: { role: 'lead', organism: 'eravos.retro-poly', preset: ['Darksynth Saw', "Brass Stab '84"], configure: { arp: 'off' }, octave: 4, name: 'Stabs' } },
      fx: RIG_FX(['Robot Comb', 'Hollow Comb (−)', 'Riddim Notch', 'Bandpass Yap'], ['Fold Growl', 'Total Destruction', 'Bass Grit (parallel)']),
      mods: RIG_MODS(['Triplet Roll', 'Riddim Stabs', 'Saw Down Chops', 'Brostep Switch-up'], ['Triangle Punch', 'Clean Sine']),
      master: { compThresh: -9, compRatio: 3, reverbMix: 0.08 } },

    // 9 ─ Reese vs Wub: the first drop is the Reese, the second is the wobble, the switch-up trades bars
    { id: 'reese-vs-wub', label: 'Reese vs Wub (two basses)', icon: '⚔', accent: '#ff4081', family: 'EDM', bpm: [148, 152], roots: [5, 9, 2], scales: ['minor', 'phrygian'], progs: [[1, 1, 6, 7], [1, 6, 1, 7]],
      tagline: 'Drop 1 is a rolling Reese, drop 2 is the wobble, and the switch-up trades them bar for bar',
      drums: { main: HALF, light: LIGHT, double: DOUBLE, strip: STRIP }, leadRhythm: 'sparse', bar,
      form: DROPFORM({ drop: ['drums', 'sub', 'reese', 'pad'], pat1: { sub: 'sub', reese: ['wub', 'wubHi', 'dnbroll', 'wub'] }, sw: ['drums', 'sub', 'reese', 'wub'], patSw: { sub: 'sub', reese: ['wub', 'drone'], wub: ['drone', 'yoi'] },
        drop2: ['drums', 'sub', 'wub', 'pad', 'lead'], pat2: { sub: 'sub', wub: ['yoi', 'tri', 'wubHi', 'gunroll'] } }),
      parts: { drums: PADS('Heavy (Dubstep/Trap)'), sub: SUB(),
        reese: { role: 'bass', organism: 'eravos.reese-bass', preset: ['Classic Reese', 'Neuro Flange', 'Melodic Growl'], style: 'half', name: 'Reese' },
        wub: { role: 'bass', organism: 'eravos.wobble-bass', preset: ['Classic Wub 1/8', 'Fold Growl Wub 1/8', 'Head Shaker'], style: 'half', name: 'Wub' },
        lead: { role: 'lead', organism: 'eravos.bass-forge', preset: ['Screech', 'Laser Zap'], octave: 4, riser: true, name: 'Screech' },
        pad: PAD(['Dark Choir', 'Underwater', 'Frozen Halo (hold)']) },
      fx: [{ organism: 'eravos.fx-destroyer', preset: 'Bass Grit (parallel)', on: 'wub' }],
      master: { compThresh: -9, compRatio: 3, reverbMix: 0.1 } },
  ];
  GENRES.forEach(SE.addGenre);

  // ---------------------------------------------------------------- the shelf: what to listen for, per genre
  const NOTES = {
    'wub-rig': { listen: 'Every part of the wobble is its own window: the tone (Wub Osc), the mouth (Wub Filter), the rhythm (Wub Rate), the sub (Wub Sub).', drop: 'Change Wub Rate’s pattern while it plays — the same notes get a new rhythm.', voice: 'Her line in the pause bar, dry, right before the drop.' },
    'dancehall-dubstep': { listen: 'Rim clicks on the 3-3-2, a skank thrown into echo, horns answering.', drop: 'One bar of pause, then the talking growl and the sound-system sub land together.', voice: 'Chat over the skank in the intro; one shouted word in the pause.' },
    'brostep-wub': { listen: 'Hiccups, stop-starts and gnarl; a growl answers every other bar.', drop: 'The switch-up goes double-time with stair-steps, then drop 2 lifts two degrees.', voice: 'One word stuttered into the pause (Drop Builder Stutter ×4).' },
    'talker': { listen: 'The bass talks the whole drop: yoi low-high-low, vowel morphs, triplet chews.', drop: 'Drop 2 ends on a machine-gun roll.', voice: 'Answer the talker: her word in the gaps between yoi bars.' },
    'melodic-wub': { listen: 'The wobble sings the chords under a euphoric lead and a halo pad.', drop: 'Emotional drop: the lead keeps the melody over the wubs; drop 2 lifts.', voice: 'Her line at the top of the break, with a long echo throw.' },
    'reese-roller': { listen: 'Two-step at 174, the Reese rolling the groove, a pluck on top.', drop: 'The switch-up strips to drums, sub and Reese pulses; drop 2 adds triplets and a roll.', voice: 'Chop her phrase into three and play it between the snares.' },
    'halftime-reese': { listen: '170 on the clock, 85 in your body: the Reese moves slowly and heavily.', drop: 'The switch-up doubles the drums under a rolling Reese, then drop 2 goes back to half-time, lifted.', voice: 'Slow, low and close in the break — the bell answers her.' },
    'wub-neuro': { listen: 'An FM growl through a comb mouth; Wub Rate rolls triplets through it.', drop: 'Switch-up stair-steps, then drop 2 rolls triplets into machine-gun bars.', voice: 'One clipped word on the snare, through Destroyer.' },
    'reese-vs-wub': { listen: 'Drop 1 is the Reese; drop 2 is the wobble; the switch-up trades them bar for bar.', drop: 'Listen for the hand-off: Reese drone, then the wub answers.', voice: 'Her line in pause 2, right before the wobble takes over.' },
    dubstep: { listen: 'Half-time pads, a wobble that talks, and the gap before each drop.', drop: 'Everything stops half a beat before the drop, then crash + kick + wobble.', voice: 'Her line at the end of the build so the last word lands in the gap.' },
    riddim: { listen: 'The bass is the rhythm: stutters and gaps, square-wave talk.', drop: 'Gap, crash, then the riddim stutter.', voice: 'One word, stuttered right before the drop.' },
    dnb: { listen: 'Rolling two-step at 174, Reese underneath, pluck on top.', drop: 'Gap, then the Reese rolls in under the full beat.', voice: 'Chop her phrase into pieces between the snares.' },
    neuro: { listen: 'Dark 174: flanged neuro Reese and stabs.', drop: 'The growl answers the Reese bar by bar.', voice: 'Dry and close, on the beat.' },
    melodic: { listen: 'Strings, a euphoric lead, then a growl that still sings the chords.', drop: 'The lead keeps the melody over the growl.', voice: 'Her clip at the end of the break.' },
    tearout: { listen: 'Screech lead, machine-gun roll, a switch-up to double time.', drop: 'The second drop is heavier than the first.', voice: 'One word into the pause bar.' },
    'dubstep-og': { listen: 'Space is the instrument: sub, a skanking chord, echo, a dub break.', drop: 'The wub comes in on drop 1; drop 2 talks.', voice: 'Throw her last word into the dub echo.' },
    'riddim-war': { listen: 'The 3-3-2 bounce, stair-steps, a mute section that is only a snare.', drop: 'Drop 2 stacks stairs and the zap over the bounce.', voice: 'Chop one word to the 3-3-2.' },
    drumstep: { listen: 'Half-time drop with a Reese you can feel, then the drums double.', drop: 'Two drops, two fast rolls.', voice: 'Over the break, then dry into the pause.' },
    trapstep: { listen: '808 slides under a trap wobble; hats roll at the end of each beat.', drop: 'The roll section runs straight 16ths, then back to the drop.', voice: 'Short phrases on the snare.' },
    'bass-house': { listen: 'Four on the floor; the wobble answers between kicks.', drop: 'Off-beat bass after the gap; drop 2 lifts the stabs.', voice: 'One-word hits on the off-beats.' },
    deathstep: { listen: 'No drums for eight bars, then a long climb into held dread.', drop: 'Vowel bass and tearout metal; drop 2 ends on a machine-gun roll.', voice: 'Slow and dry in the pause.' },
  };
  // [id, title, genre, seed, moods]
  const SHELF = [
    // the new genres — six each
    ['wr-patchwork', 'Patchwork Wub', 'wub-rig', 1401, ['heavy']], ['wr-mouthpiece', 'Mouthpiece', 'wub-rig', 1402, ['heavy', 'her']], ['wr-modular', 'Modular Mood', 'wub-rig', 1403, ['heavy', 'dark']],
    ['wr-cables', 'Every Cable Counts', 'wub-rig', 1404, ['heavy', 'party']], ['wr-rate-war', 'Rate War', 'wub-rig', 1405, ['heavy', 'fast']], ['wr-fold', 'Fold Line', 'wub-rig', 1406, ['heavy', 'dark']],
    ['dd-yard-fire', 'Yard Fire', 'dancehall-dubstep', 1501, ['island', 'heavy']], ['dd-pressure-drop', 'Pressure Drop Riddim', 'dancehall-dubstep', 1502, ['island', 'party']], ['dd-big-chune', 'Big Chune Business', 'dancehall-dubstep', 1503, ['island', 'heavy']],
    ['dd-soundclash', 'Soundclash at Midnight', 'dancehall-dubstep', 1504, ['island', 'dark']], ['dd-rim-shot', 'Rim Shot Warning', 'dancehall-dubstep', 1505, ['island', 'party']], ['dd-ghetto-gospel', 'Selector Gospel', 'dancehall-dubstep', 1506, ['island', 'warm']],
    ['bw-hiccup', 'Hiccup Protocol', 'brostep-wub', 1601, ['heavy']], ['bw-scrap', 'Scrap Metal Choir', 'brostep-wub', 1602, ['heavy', 'dark']], ['bw-stopstart', 'Stop Start Stop', 'brostep-wub', 1603, ['heavy', 'party']],
    ['bw-gnarl', 'Gnarl Engine', 'brostep-wub', 1604, ['heavy', 'fast']], ['bw-headbang', 'Neck Brace', 'brostep-wub', 1605, ['heavy', 'party']], ['bw-machine', 'Robot Gate Riot', 'brostep-wub', 1606, ['heavy', 'dark']],
    ['tk-yoi-yoi', 'Yoi Yoi Yoi', 'talker', 1701, ['heavy', 'party']], ['tk-chatterbox', 'Chatterbox', 'talker', 1702, ['heavy']], ['tk-vowel-war', 'Vowel War', 'talker', 1703, ['heavy', 'dark']],
    ['tk-mouthy', 'Mouthy', 'talker', 1704, ['heavy', 'party']], ['tk-chew', 'Triplet Chew Toy', 'talker', 1705, ['heavy']], ['tk-say-it', 'Say It Back', 'talker', 1706, ['heavy', 'her']],
    ['mw-afterglow', 'Afterglow Wub', 'melodic-wub', 1801, ['warm', 'her']], ['mw-lantern', 'Lantern Sky', 'melodic-wub', 1802, ['warm']], ['mw-saltwater', 'Saltwater Halo', 'melodic-wub', 1803, ['warm', 'calm']],
    ['mw-stay', 'Stay a Little Longer', 'melodic-wub', 1804, ['warm', 'her']], ['mw-starfield', 'Starfield Wub', 'melodic-wub', 1805, ['warm']], ['mw-paper', 'Paper Planes at Dawn', 'melodic-wub', 1806, ['warm', 'calm']],
    ['rr-tunnel', 'Tunnel Vision 174', 'reese-roller', 1901, ['fast', 'dark']], ['rr-night-bus', 'Night Bus Roller', 'reese-roller', 1902, ['fast']], ['rr-concrete', 'Concrete Rain', 'reese-roller', 1903, ['fast', 'dark']],
    ['rr-velvet', 'Velvet Reese', 'reese-roller', 1904, ['fast', 'warm']], ['rr-overpass', 'Overpass', 'reese-roller', 1905, ['fast']], ['rr-low-tide', 'Low Tide Roller', 'reese-roller', 1906, ['fast', 'warm']],
    ['hr-slow-burn', 'Slow Burn 85', 'halftime-reese', 2001, ['dark', 'heavy']], ['hr-tar', 'Tar Pit', 'halftime-reese', 2002, ['dark', 'heavy']], ['hr-gravity', 'Gravity Well', 'halftime-reese', 2003, ['dark']],
    ['hr-monolith', 'Monolith', 'halftime-reese', 2004, ['dark', 'heavy']], ['hr-hollow', 'Hollow Bell', 'halftime-reese', 2005, ['dark', 'goth']], ['hr-undertow', 'Undertow', 'halftime-reese', 2006, ['dark', 'heavy']],
    ['wn-circuit', 'Circuit Bent', 'wub-neuro', 2101, ['fast', 'dark']], ['wn-comb', 'Comb Teeth', 'wub-neuro', 2102, ['fast', 'heavy']], ['wn-ferro', 'Ferrofluid', 'wub-neuro', 2103, ['fast', 'dark']],
    ['wn-synapse', 'Synapse Misfire', 'wub-neuro', 2104, ['fast', 'heavy']], ['wn-voltage', 'Voltage Drop', 'wub-neuro', 2105, ['fast', 'dark']], ['wn-cortex', 'Cortex Roll', 'wub-neuro', 2106, ['fast', 'heavy']],
    ['rv-handoff', 'The Hand-off', 'reese-vs-wub', 2201, ['heavy']], ['rv-rivals', 'Rivals', 'reese-vs-wub', 2202, ['heavy', 'dark']], ['rv-tag-team', 'Tag Team', 'reese-vs-wub', 2203, ['heavy', 'party']],
    ['rv-two-mouths', 'Two Mouths', 'reese-vs-wub', 2204, ['heavy']], ['rv-split', 'Split Decision', 'reese-vs-wub', 2205, ['heavy', 'dark']], ['rv-face-off', 'Face Off', 'reese-vs-wub', 2206, ['heavy', 'party']],
    // more songs in the bass genres that were already here
    ['ds-warehouse', 'Warehouse Wobble', 'dubstep', 2301, ['heavy', 'party']], ['ds-cracked', 'Cracked Screen', 'dubstep', 2302, ['heavy']], ['ds-thunder', 'Thunder in the Pipes', 'dubstep', 2303, ['heavy', 'dark']],
    ['ds-lights-out', 'Lights Out at 140', 'dubstep', 2304, ['heavy', 'her']], ['rd-bolts', 'Loose Bolts', 'riddim', 2401, ['heavy']], ['rd-square', 'Square Root', 'riddim', 2402, ['heavy', 'party']],
    ['rd-tin-can', 'Tin Can Army', 'riddim', 2403, ['heavy']], ['dn-glass', 'Glass Tunnel', 'dnb', 2501, ['fast', 'warm']], ['dn-northern', 'Northern Line', 'dnb', 2502, ['fast']],
    ['dn-sunrise', 'Sunrise on the Motorway', 'dnb', 2503, ['fast', 'warm']], ['nr-acid-rain', 'Acid Rain Protocol', 'neuro', 2601, ['fast', 'dark']], ['nr-wiretap', 'Wiretap', 'neuro', 2602, ['fast', 'dark']],
    ['nr-black-box', 'Black Box', 'neuro', 2603, ['fast', 'heavy']], ['ml-tidal', 'Tidal Heart', 'melodic', 2701, ['warm', 'her']], ['ml-ember', 'Ember Skies', 'melodic', 2702, ['warm', 'heavy']],
    ['ml-reunion', 'Reunion', 'melodic', 2703, ['warm', 'her']], ['to-shrapnel', 'Shrapnel Waltz', 'tearout', 2801, ['heavy', 'dark']], ['to-meatgrinder', 'Grinder', 'tearout', 2802, ['heavy']],
    ['to-red-line', 'Red Line', 'tearout', 2803, ['heavy', 'fast']], ['og-croydon', 'Concrete Dub 06', 'dubstep-og', 2901, ['dark', 'warm']], ['og-sub-pressure', 'Sub Pressure Sunday', 'dubstep-og', 2902, ['dark']],
    ['og-dub-plate', 'Dub Plate Special', 'dubstep-og', 2903, ['dark', 'island']], ['rw-boot-camp', 'Boot Camp', 'riddim-war', 3001, ['heavy']], ['rw-stair-master', 'Stair Master', 'riddim-war', 3002, ['heavy', 'party']],
    ['rw-trench', 'Trench Bounce', 'riddim-war', 3003, ['heavy', 'dark']], ['dst-flipside', 'Flipside 172', 'drumstep', 3101, ['heavy', 'fast']], ['dst-double-take', 'Double Take', 'drumstep', 3102, ['heavy', 'fast']],
    ['dst-halfway', 'Halfway House', 'drumstep', 3103, ['heavy', 'fast']], ['ts-slide-rule-2', 'Slide Rule II', 'trapstep', 3201, ['heavy', 'party']], ['ts-velvet-808', 'Velvet 808', 'trapstep', 3202, ['heavy', 'party']],
    ['ts-trunk', 'Trunk Rattle', 'trapstep', 3203, ['heavy', 'party']], ['bh-afterhours', 'After Hours Wobble', 'bass-house', 3301, ['party', 'fast']], ['bh-strobe', 'Strobe Sermon', 'bass-house', 3302, ['party', 'fast']],
    ['bh-floor', 'Floor Polish', 'bass-house', 3303, ['party']], ['dth-catacomb', 'Catacomb', 'deathstep', 3401, ['dark', 'heavy']], ['dth-hollow-king', 'Hollow King', 'deathstep', 3402, ['dark', 'heavy']],
    ['dth-ash', 'Ash Choir', 'deathstep', 3403, ['dark', 'goth']],
  ];
  const SONGS = SHELF.filter(([, , g]) => SE.genres().some(x => x.id === g)).map(([id, title, genre, seed, mood]) => Object.assign({ id, title, genre, seed, mood }, NOTES[genre] || {}));
  if (window.Songbook && window.Songbook.add) SONGS.forEach(window.Songbook.add);
  window.WubSongbook = { genres: GENRES.map(g => g.id), songs: SONGS.map(s => s.id) };
})();
